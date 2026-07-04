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

  // كل جلسة مستقلة — المكالمة تتطابق مع أي جلسة نشطة للرقم دون ترتيب مُفضَّل
  // Each session is independent — the call matches any active session for this number
  // لو في أكثر من جلسة للرقم الواحد (نادر)، يُختار أي واحدة ومنع التكرار بـ WHERE verified=FALSE
  // If multiple sessions exist for the same number (rare), any is picked — double-processing
  // prevented by WHERE verified=FALSE
  const session = await pool.query(
    `SELECT id, phone FROM verification_sessions
     WHERE phone = $1
       AND verified = FALSE
       AND expires_at > NOW()
     LIMIT 1`,
    [normalized]
  );

  let matched = false;
  let sessionId: string | null = null;

  if ((session.rowCount ?? 0) > 0) {
    sessionId = session.rows[0].id as string;

    await pool.query(
      "UPDATE verification_sessions SET verified = TRUE WHERE id = $1",
      [sessionId]
    );

    // ⚡ إشعار فوري — يوقظ الـ Long-Poll في أقل من 1ms
    notifySession(sessionId);

    matched = true;
  }

  await pool.query(
    "INSERT INTO incoming_calls (caller_phone, matched, session_id) VALUES ($1, $2, $3)",
    [normalized, matched, sessionId]
  );

  res.json({ matched, phone: normalized });
});

// إصلاح: \d بدل d لضمان حذف جميع الرموز | Fix: \d not d to strip all non-digit chars
function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

export default router;
