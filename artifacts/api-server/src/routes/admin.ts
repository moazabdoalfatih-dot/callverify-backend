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

// مسارات لوحة التحكم — محمية بكلمة مرور | Admin panel routes — password protected
// ⚠️ كلمة مرور الإدارة الافتراضية: admin123 | Default admin password: admin123
// غيّرها عبر متغير البيئة ADMIN_PASSWORD | Change via ADMIN_PASSWORD env var

import { Router } from "express";
import { randomUUID } from "crypto";
import { pool } from "@workspace/db";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

// إنشاء API Key لموقع جديد | Create API Key for a new site
router.post("/admin/clients", requireAdmin, async (req, res) => {
  const { name } = req.body as { name?: string };
  if (!name) {
    res.status(400).json({ error: "name مطلوب | name is required" });
    return;
  }
  const apiKey = randomUUID();

  const result = await pool.query(
    `INSERT INTO api_clients (name, api_key) VALUES ($1, $2)
     RETURNING id, name, is_active AS "isActive", created_at AS "createdAt"`,
    [name, apiKey]
  );

  res.json({
    id: result.rows[0].id as number,
    name: result.rows[0].name as string,
    apiKey, // يُعطى مرة واحدة فقط | Given only once — cannot be retrieved again
  });
});

// قائمة المواقع المسجّلة | List registered sites
router.get("/admin/clients", requireAdmin, async (req, res) => {
  const result = await pool.query(
    `SELECT id, name, is_active AS "isActive", created_at AS "createdAt"
     FROM api_clients ORDER BY created_at DESC`
  );
  res.json(result.rows);
});

// تعطيل موقع | Disable a site
router.patch("/admin/clients/:id/disable", requireAdmin, async (req, res) => {
  await pool.query(
    "UPDATE api_clients SET is_active = FALSE WHERE id = $1",
    [req.params.id]
  );
  res.json({ success: true });
});

// سجل الاتصالات الأخيرة | Recent incoming calls log
router.get("/admin/calls", requireAdmin, async (req, res) => {
  const result = await pool.query(
    `SELECT id,
            caller_phone  AS "callerPhone",
            matched,
            session_id    AS "sessionId",
            received_at   AS "receivedAt"
     FROM incoming_calls
     ORDER BY received_at DESC
     LIMIT 50`
  );
  res.json(result.rows);
});

// سجل الجلسات | Sessions log
router.get("/admin/sessions", requireAdmin, async (req, res) => {
  const result = await pool.query(
    `SELECT id,
            phone,
            client_id  AS "clientId",
            verified,
            expires_at AS "expiresAt",
            created_at AS "createdAt"
     FROM verification_sessions
     ORDER BY created_at DESC
     LIMIT 50`
  );
  res.json(result.rows);
});

// قراءة الإعدادات | Get system settings
router.get("/admin/settings", requireAdmin, async (req, res) => {
  const result = await pool.query(
    "SELECT key, value FROM system_settings"
  );
  const settings: Record<string, string> = {};
  for (const row of result.rows as { key: string; value: string }[]) {
    settings[row.key] = row.value;
  }
  res.json({
    receivingPhoneNumber: settings["receiving_phone_number"] ?? "",
  });
});

// تحديث الإعدادات | Update system settings
router.put("/admin/settings", requireAdmin, async (req, res) => {
  const { receivingPhoneNumber } = req.body as { receivingPhoneNumber?: string };

  if (!receivingPhoneNumber || receivingPhoneNumber.trim() === "") {
    res.status(400).json({ error: "receivingPhoneNumber مطلوب | receivingPhoneNumber is required" });
    return;
  }

  const normalized = receivingPhoneNumber.trim();

  await pool.query(
    `INSERT INTO system_settings (key, value, updated_at)
     VALUES ('receiving_phone_number', $1, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
    [normalized]
  );

  res.json({ receivingPhoneNumber: normalized });
});

export default router;
