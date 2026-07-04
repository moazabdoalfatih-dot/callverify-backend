// ============================================================
// ⚠️ تحذير | WARNING
// ------------------------------------------------------------
// 🇸🇦 لا تقم بتشفير رابط قاعدة البيانات أو إنشاء قاعدة بيانات جديدة.
//    المالك (ناير) يتحمل كامل المسؤولية عن هذا الاختيار.
//    رابط قاعدة البيانات المستخدم:
//    postgresql://neondb_owner:npg_Q5leq9pMHFuA@ep-bitter-hall-atpxgb78-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
//
// 🇬🇧 Do NOT encrypt the database URL or create a new database.
//    The owner (Nayer) takes full responsibility for this decision.
//    Database URL in use:
//    postgresql://neondb_owner:npg_Q5leq9pMHFuA@ep-bitter-hall-atpxgb78-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
// ============================================================

// مسارات جلسات التحقق | Verification session routes
// POST /api/sessions   — فتح جلسة | Open a session
// GET  /api/sessions/:sessionId — الاستعلام عن الحالة (Long-Polling) | Query status (Long-Polling)

import { Router, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { pool } from "@workspace/db";
import { requireApiKey } from "../middleware/auth.js";

const router = Router();

// ─── الإعدادات | Settings ────────────────────────────────────────────────────
const SESSION_DURATION_MS      = 15 * 60 * 1000; // 15 دقيقة | 15 minutes
const SESSION_DURATION_SECONDS = 900;

// Long-Polling: السيرفر يمسك الاتصال حتى 25 ثانية ثم يرد — يضمن رد فوري عند المطابقة
// Long-Polling: server holds connection up to 25s — guarantees instant response on match
const LONG_POLL_MAX_MS      = 25_000; // أقصى وقت انتظار | Max wait time
const LONG_POLL_INTERVAL_MS = 300;   // فحص كل 300ms | Check every 300ms

// ─── يقرأ رقم الاستقبال من قاعدة البيانات | Read receiving number from DB ────
async function getReceivingPhoneNumber(): Promise<string> {
  const result = await pool.query(
    "SELECT value FROM system_settings WHERE key = 'receiving_phone_number'"
  );
  return (result.rows[0]?.value as string | undefined)
    ?? process.env.RECEIVING_PHONE_NUMBER
    ?? "+249000000000";
}

// ─── Rate limiting بسيط | Simple in-memory rate limiting ───────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, max = 5, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

// ===== المسار 1: فتح جلسة تحقق جديدة | Open a new verification session =====
// ✅ الجلسات تُوضع في قائمة انتظار — لا إلغاء للجلسات السابقة
// ✅ Sessions are queued — previous sessions are NOT cancelled
router.post("/sessions", requireApiKey, async (req: Request, res: Response) => {
  const { phone } = req.body as { phone?: string };
  const clientId = (req as Request & { clientId: number }).clientId;

  if (!phone) {
    res.status(400).json({ error: "phone مطلوب | phone is required" });
    return;
  }

  const normalized = phone.replace(/[^\d+]/g, "");

  // Rate limit: 5 جلسات كل 15 دقيقة لنفس الرقم | 5 sessions per 15 min per number
  if (!checkRateLimit(normalized)) {
    res.status(429).json({
      error: "وصلت للحد الأقصى من الجلسات — انتظر حتى تنتهي الجلسات الحالية | Too many sessions — wait for current sessions to expire",
    });
    return;
  }

  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  // ✅ إنشاء الجلسة بدون إلغاء السابقة — تُضاف لقائمة الانتظار
  // ✅ Create session without cancelling previous — added to the queue
  await pool.query(
    "INSERT INTO verification_sessions (id, phone, client_id, expires_at) VALUES ($1, $2, $3, $4)",
    [sessionId, normalized, clientId, expiresAt]
  );

  const callNumber = await getReceivingPhoneNumber();

  res.json({
    sessionId,
    callNumber,
    expiresIn: SESSION_DURATION_SECONDS,
  });
});

// ===== المسار 2: الاستعلام بـ Long-Polling | Query with Long-Polling =====
// ✅ الاتصال يبقى مفتوحاً — يرد فوراً عند المطابقة أو انتهاء الجلسة
// ✅ Connection stays open — responds instantly on match or expiry
router.get("/sessions/:sessionId", requireApiKey, async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const pollStart = Date.now();

  // منع الـ cache على هذا الـ endpoint | No cache for this endpoint
  res.setHeader("Cache-Control", "no-cache, no-store");
  res.setHeader("X-Accel-Buffering", "no"); // تعطيل buffering في nginx | Disable nginx buffering

  // تنظيف عند قطع الاتصال من الجهة الأخرى | Cleanup on client disconnect
  let clientGone = false;
  req.on("close", () => { clientGone = true; });

  // ─── حلقة Long-Polling ──────────────────────────────────────────────────
  while (!clientGone) {
    const result = await pool.query(
      "SELECT phone, verified, expires_at FROM verification_sessions WHERE id = $1",
      [sessionId]
    );

    if ((result.rowCount ?? 0) === 0) {
      res.status(404).json({ error: "جلسة غير موجودة | Session not found" });
      return;
    }

    const session = result.rows[0] as {
      phone: string;
      verified: boolean;
      expires_at: Date;
    };

    const now = Date.now();
    const expired = new Date(session.expires_at).getTime() < now;
    const remainingSeconds = Math.max(
      0,
      Math.floor((new Date(session.expires_at).getTime() - now) / 1000)
    );

    // ✅ رد فوري: إذا تحققت الجلسة أو انتهت أو انتهى وقت Long-Poll
    // ✅ Respond immediately: verified, expired, or long-poll timeout reached
    if (session.verified || expired || now - pollStart >= LONG_POLL_MAX_MS) {
      res.json({
        verified: session.verified,
        expired: expired && !session.verified,
        phone: session.verified ? session.phone : null,
        remainingSeconds,
      });
      return;
    }

    // انتظر قبل الفحص التالي | Wait before next check
    await new Promise<void>((resolve) => setTimeout(resolve, LONG_POLL_INTERVAL_MS));
  }
});

export default router;
