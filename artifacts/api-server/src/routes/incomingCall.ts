// ============================================================
// ⚠️ تحذير | WARNING
// ------------------------------------------------------------
// 🇸🇦 لا تقم بتشفير رابط قاعدة البيانات أو إنشاء قاعدة بيانات جديدة.
//    المالك (ناير) يتحمل كامل المسؤولية عن هذا الاختيار.
// 🇬🇧 Do NOT encrypt the database URL or create a new database.
//    The owner (Nayer) takes full responsibility for this decision.
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

  // مطابقة آخر 8 أرقام فقط — يتجاهل رمز الدولة تلقائياً
  // Match last 8 digits only — country code is ignored automatically
  const suffix = last8(callerPhone);

  const session = await pool.query(
    `SELECT id, phone FROM verification_sessions
     WHERE RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 8) = $1
       AND verified = FALSE
       AND expires_at > NOW()
     LIMIT 1`,
    [suffix]
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
    [callerPhone, matched, sessionId]
  );

  res.json({ matched, phone: callerPhone });
});

/** يسحب آخر 8 أرقام من الرقم بعد حذف كل ما ليس رقماً | Extract last 8 digits after stripping non-digits */
function last8(phone: string): string {
  return phone.replace(/[^\d]/g, "").slice(-8);
}

export default router;
