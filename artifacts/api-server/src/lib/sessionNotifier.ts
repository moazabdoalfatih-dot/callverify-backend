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

// نظام الإشعار الفوري في الذاكرة | In-memory instant notification system
// عندما يُطابق incomingCall جلسةً، يُنبّه مباشرةً الـ long-poll المنتظر دون انتظار دورة الفحص
// When incomingCall matches a session it instantly signals the waiting long-poll — no polling lag

// Map: sessionId → قائمة دوال الإيقاظ | sessionId → list of wakeup functions
const pendingPolls = new Map<string, Array<() => void>>();

/**
 * يُنبّه جميع المنتظرين على جلسة معيّنة فور المطابقة — استدعِه بعد UPDATE مباشرةً
 * Notifies all pollers waiting on a session immediately after match — call right after UPDATE
 */
export function notifySession(sessionId: string): void {
  const resolvers = pendingPolls.get(sessionId);
  if (resolvers && resolvers.length > 0) {
    pendingPolls.delete(sessionId);
    for (const r of resolvers) r();
  }
}

/**
 * ينتظر إشعاراً من notifySession أو يعود تلقائياً بعد timeoutMs
 * Waits for a notifySession signal or returns after timeoutMs automatically
 */
export function waitForNotification(sessionId: string, timeoutMs: number): Promise<void> {
  return new Promise<void>((resolve) => {
    const wakeup = () => {
      clearTimeout(timer);
      resolve();
    };

    const timer = setTimeout(() => {
      const list = pendingPolls.get(sessionId);
      if (list) {
        const idx = list.indexOf(wakeup);
        if (idx >= 0) list.splice(idx, 1);
        if (list.length === 0) pendingPolls.delete(sessionId);
      }
      resolve();
    }, timeoutMs);

    const existing = pendingPolls.get(sessionId) ?? [];
    existing.push(wakeup);
    pendingPolls.set(sessionId, existing);
  });
}

/**
 * يُزيل جميع المنتظرين عند قطع اتصال العميل | Removes all pending pollers on client disconnect
 */
export function removePendingPolls(sessionId: string): void {
  const resolvers = pendingPolls.get(sessionId);
  if (resolvers) {
    pendingPolls.delete(sessionId);
    for (const r of resolvers) r();
  }
}
