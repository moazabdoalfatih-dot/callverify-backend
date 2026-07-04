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
// GET  /api/sessions/:sessionId — الاستعلام عن الحالة | Query status

import { Router } from "express";
import { randomUUID } from "crypto";
import { pool } from "@workspace/db";
import { requireApiKey } from "../middleware/auth.js";

const router = Router();

// يُقرأ رقم الاستقبال من قاعدة البيانات | Receiving number read from DB
async function getReceivingPhoneNumber(): Promise<string> {
  const result = await pool.query(
    "SELECT value FROM system_settings WHERE key = 'receiving_phone_number'"
  );
  return (result.rows[0]?.value as string | undefined)
    ?? process.env.RECEIVING_PHONE_NUMBER
    ?? "+249000000000";
}

// Rate limiting بسيط بدون مكتبة خارجية | Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, max = 3, windowMs = 60_000): boolean {
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
router.post("/sessions", requireApiKey, async (req, res) => {
  const { phone } = req.body as { phone?: string };
  const clientId = (req as Request & { clientId: number }).clientId;

  if (!phone) {
    res.status(400).json({ error: "phone مطلوب | phone is required" });
    return;
  }

  const normalized = phone.replace(/[^\d+]/g, "");

  // Rate limit per phone number
  if (!checkRateLimit(normalized)) {
    res
      .status(429)
      .json({ error: "انتظر قبل طلب تحقق جديد | Wait before requesting a new verification" });
    return;
  }

  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 دقائق | 5 minutes

  // إلغاء أي جلسات سابقة لنفس الرقم | Cancel previous sessions for same number
  await pool.query(
    "UPDATE verification_sessions SET expires_at = NOW() WHERE phone = $1 AND verified = FALSE",
    [normalized]
  );

  // إنشاء الجلسة الجديدة | Create new session
  await pool.query(
    "INSERT INTO verification_sessions (id, phone, client_id, expires_at) VALUES ($1, $2, $3, $4)",
    [sessionId, normalized, clientId, expiresAt]
  );

  const callNumber = await getReceivingPhoneNumber();

  res.json({
    sessionId,
    callNumber,
    expiresIn: 300, // ثواني | seconds
  });
});

// ===== المسار 2: الاستعلام عن حالة الجلسة | Query session status =====
router.get("/sessions/:sessionId", requireApiKey, async (req, res) => {
  const { sessionId } = req.params;

  const result = await pool.query(
    "SELECT phone, verified, expires_at FROM verification_sessions WHERE id = $1",
    [sessionId]
  );

  if (result.rowCount === 0) {
    res.status(404).json({ error: "جلسة غير موجودة | Session not found" });
    return;
  }

  const session = result.rows[0] as {
    phone: string;
    verified: boolean;
    expires_at: Date;
  };
  const expired = new Date(session.expires_at) < new Date();
  const remainingSeconds = Math.max(
    0,
    Math.floor((new Date(session.expires_at).getTime() - Date.now()) / 1000)
  );

  res.json({
    verified: session.verified,
    expired: expired && !session.verified,
    phone: session.verified ? session.phone : null,
    remainingSeconds,
  });
});

export default router;
