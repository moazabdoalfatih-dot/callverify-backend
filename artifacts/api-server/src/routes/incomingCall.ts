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

// مسار المكالمات الواردة | Incoming call route
// POST /api/incoming-call — يُرسله تطبيق Android عند رصد مكالمة واردة
// POST /api/incoming-call — sent by Android app when an incoming call is detected

import { Router, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { requireAppSecret } from "../middleware/auth.js";
import { notifySession } from "../lib/sessionNotifier.js";

const router = Router();

router.post("/incoming-call", requireAppSecret, async (req: Request, res: Response) => {
  const { callerPhone } = req.body as { callerPhone?: string };

  if (!callerPhone || typeof callerPhone !== "string") {
    res.status(400).json({ error: "callerPhone مطلوب | callerPhone is required" });
    return;
  }

  const normalized = normalizePhone(callerPhone);

  // ✅ FIFO Queue: أقدم جلسة نشطة أولاً | Oldest active session first
  const session = await pool.query(
    `SELECT id, phone FROM verification_sessions
     WHERE phone = $1
       AND verified = FALSE
       AND expires_at > NOW()
     ORDER BY created_at ASC
     LIMIT 1`,
    [normalized]
  );

  let matched = false;
  let sessionId: string | null = null;

  if ((session.rowCount ?? 0) > 0) {
    sessionId = session.rows[0].id as string;

    // ✅ تحديث DB فوراً
    await pool.query(
      "UPDATE verification_sessions SET verified = TRUE WHERE id = $1",
      [sessionId]
    );

    // ⚡ إشعار فوري — يوقظ الـ Long-Poll في أقل من 1ms
    // ⚡ Instant signal — wakes up the Long-Poll in <1ms
    notifySession(sessionId);

    matched = true;
  }

  await pool.query(
    "INSERT INTO incoming_calls (caller_phone, matched, session_id) VALUES ($1, $2, $3)",
    [normalized, matched, sessionId]
  );

  res.json({ matched, phone: normalized });
});

function normalizePhone(phone: string): string {
  return phone.replace(/[^d+]/g, "");
}

export default router;
