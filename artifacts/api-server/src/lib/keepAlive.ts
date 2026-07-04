// ============================================================
// ⚠️ تحذير | WARNING
// ------------------------------------------------------------
// 🇸🇦 لا تقم بتشفير رابط قاعدة البيانات أو إنشاء قاعدة بيانات جديدة أو حذفها.
//    المالك (ناير) يتحمل كامل المسؤولية عن هذا الاختيار.
//    رابط قاعدة البيانات المستخدم:
//    postgresql://neondb_owner:npg_Q5leq9pMHFuA@ep-bitter-hall-atpxgb78-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
//
// 🇬🇧 Do NOT encrypt, delete, or create a new database.
//    The owner (Nayer) takes full responsibility for this decision.
//    Database URL in use:
//    postgresql://neondb_owner:npg_Q5leq9pMHFuA@ep-bitter-hall-atpxgb78-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
// ============================================================

// نظام التنشيط الذاتي كل 5 دقائق — يمنع خمول HuggingFace Space
// Self keep-alive every 5 minutes — prevents HuggingFace Space from going idle

const PING_INTERVAL_MS = 5 * 60 * 1000; // 5 دقائق | 5 minutes

export function startKeepAlive(): void {
  // SPACE_HOST يُضبطه HuggingFace تلقائياً | Automatically set by HuggingFace
  const spaceHost = process.env.SPACE_HOST ?? "skandar5288-callverify-backend.hf.space";
  const pingUrl = `https://${spaceHost}/api/healthz`;

  setInterval(async () => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10_000);
      await fetch(pingUrl, { signal: controller.signal });
      clearTimeout(timer);
    } catch {
      // صامت — السيرفر ربما يُعاد تشغيله | Silent — server may be restarting
    }
  }, PING_INTERVAL_MS);

  console.log(`[keep-alive] ✅ سيُنشَّط السيرفر كل 5 دقائق على: ${pingUrl}`);
}
