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

import { Request, Response, NextFunction } from "express";
import { pool } from "@workspace/db";

// ⚠️ قيم افتراضية — يمكن تغييرها بمتغيرات البيئة | Default values — override via env vars
const APP_SECRET_KEY = process.env.APP_SECRET_KEY ?? "callverify-app-secret-2024";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123";

// يتحقق أن الطلب قادم من موقع مسجّل | Verifies the request is from a registered site
export async function requireApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "API key مطلوب | API key required" });
    return;
  }

  const apiKey = authHeader.slice(7);
  const result = await pool.query(
    "SELECT id FROM api_clients WHERE api_key = $1 AND is_active = TRUE",
    [apiKey]
  );

  if (result.rowCount === 0) {
    res.status(403).json({ error: "API key غير صالح | Invalid API key" });
    return;
  }

  (req as Request & { clientId: number }).clientId = result.rows[0].id;
  next();
}

// يتحقق أن الطلب قادم من تطبيق Android | Verifies the request is from the Android app
export function requireAppSecret(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const secret = req.headers["x-app-secret"];
  if (secret !== APP_SECRET_KEY) {
    res.status(403).json({ error: "غير مصرح | Unauthorized" });
    return;
  }
  next();
}

// يتحقق من كلمة مرور المدير | Verifies admin password
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const pass = req.headers["x-admin-password"];
  if (pass !== ADMIN_PASSWORD) {
    res.status(403).json({ error: "غير مصرح | Unauthorized" });
    return;
  }
  next();
}
