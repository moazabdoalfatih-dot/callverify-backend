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

  // تطبيع الرقم: إزالة المسافات والشرطات | Normalize: remove spaces and dashes
  const normalized = normalizePhone(callerPhone);

  // البحث عن جلسة نشطة لهذا الرقم | Search for an active session for this number
  const session = await pool.query(
    `SELECT id, phone FROM verification_sessions
     WHERE phone = $1
       AND verified = FALSE
       AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [normalized]
  );

  let matched = false;
  let sessionId: string | null = null;

  if ((session.rowCount ?? 0) > 0) {
    // وجدنا جلسة! نُعلّمها كـ "تم التحقق" | Found a session! Mark it as verified
    sessionId = session.rows[0].id as string;
    await pool.query(
      "UPDATE verification_sessions SET verified = TRUE WHERE id = $1",
      [sessionId]
    );
    matched = true;
  }

  // نُسجّل الاتصال في سجل الاتصالات | Log the call
  await pool.query(
    "INSERT INTO incoming_calls (caller_phone, matched, session_id) VALUES ($1, $2, $3)",
    [normalized, matched, sessionId]
  );

  res.json({ matched, phone: normalized });
});

function normalizePhone(phone: string): string {
  // إزالة كل شيء إلا الأرقام و + | Remove everything except digits and +
  return phone.replace(/[^\d+]/g, "");
}

export default router;
