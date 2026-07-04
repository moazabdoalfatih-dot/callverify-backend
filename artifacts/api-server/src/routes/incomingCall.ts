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

// هذا المسار يُستدعى فقط من تطبيق Android | This route is called only from the Android app
// POST /api/incoming-call

import { Router } from "express";
import { pool } from "@workspace/db";
import { requireAppSecret } from "../middleware/auth.js";

const router = Router();

router.post("/incoming-call", requireAppSecret, async (req, res) => {
  const { callerPhone } = req.body as { callerPhone?: string };

  if (!callerPhone || typeof callerPhone !== "string") {
    res.status(400).json({ error: "callerPhone مطلوب | callerPhone is required" });
    return;
  }

  const normalized = normalizePhone(callerPhone);

  // ✅ FIFO Queue: نعالج أقدم جلسة نشطة أولاً (ASC بدل DESC)
  // ✅ FIFO Queue: process the oldest active session first (ASC instead of DESC)
  // هذا يضمن أن الجلسات تُعالج بترتيب وصولها — لا تضارب
  // This guarantees sessions are handled in arrival order — no conflicts
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
    // ✅ تحديث فوري — يُنهي حلقة Long-Polling في الطرف الآخر على الفور
    // ✅ Instant update — terminates the Long-Polling loop on the other end immediately
    await pool.query(
      "UPDATE verification_sessions SET verified = TRUE WHERE id = $1",
      [sessionId]
    );
    matched = true;
  }

  await pool.query(
    "INSERT INTO incoming_calls (caller_phone, matched, session_id) VALUES ($1, $2, $3)",
    [normalized, matched, sessionId]
  );

  // رد سريع للتطبيق | Fast response to the Android app
  res.json({ matched, phone: normalized });
});

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

export default router;
