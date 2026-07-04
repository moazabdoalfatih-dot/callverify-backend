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

import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { pool } from "@workspace/db";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  })
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

const publicDir = path.resolve(__dirname, "public");
app.use(express.static(publicDir));
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// تنظيف الجلسات المنتهية كل ساعة | Cleanup expired sessions every hour
setInterval(async () => {
  try {
    const result = await pool.query(
      "DELETE FROM verification_sessions WHERE expires_at < NOW() - INTERVAL '1 hour'"
    );
    logger.info({ deleted: result.rowCount }, "Cleaned up expired sessions");
  } catch (err) {
    logger.error({ err }, "Failed to cleanup expired sessions");
  }
}, 60 * 60 * 1000);

export default app;
