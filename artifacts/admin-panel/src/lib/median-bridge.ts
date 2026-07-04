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

/**
 * median-bridge.ts
 *
 * جسر TypeScript للتواصل بين الويب وتطبيق Android عبر Median.co
 *
 * Median يُضيف كائن `window.median` في WebView تلقائياً.
 * هذا الملف يوفر typing آمن وwrapper لكل native calls.
 *
 * الاستخدام:
 *   import { median, isMedianApp, requestPushPermission } from '@/lib/median-bridge';
 */

// ─────────────────────────────────────────────
// Types — ما يوفره Median في window
// ─────────────────────────────────────────────

export interface MedianDeviceInfo {
  platform: 'android' | 'ios';
  appVersion: string;
  osVersion: string;
  deviceId: string;
  manufacturer?: string;
  model?: string;
}

export interface MedianPushData {
  token: string;
  deviceId: string;
  platform: 'android' | 'ios';
}

export interface MedianCallbackResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/** الكائن الذي يضعه Median في window */
export interface MedianWindow {
  deviceInfo: (callback: (info: MedianDeviceInfo) => void) => void;
  push: {
    getToken: (callback: (data: MedianPushData | null) => void) => void;
    requestPermission: (callback: (granted: boolean) => void) => void;
  };
  statusbar: {
    setColor: (color: string, style?: 'light' | 'dark') => void;
  };
  share: {
    sharePage: () => void;
    shareText: (text: string) => void;
  };
  clipboard: {
    set: (text: string) => void;
    get: (callback: (text: string) => void) => void;
  };
  /** لاحقاً: جسر المكالمات النيتيف */
  callListener?: {
    start: () => void;
    stop: () => void;
    onIncomingCall?: (callerPhone: string) => void;
  };
}

declare global {
  interface Window {
    median?: MedianWindow;
    /** سيُستخدم لاحقاً من Kotlin عبر JavascriptInterface */
    CallVerifyBridge?: {
      onIncomingCall: (callerPhone: string) => void;
      onPushToken: (token: string) => void;
    };
  }
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** هل الموقع يعمل داخل تطبيق Median؟ */
export function isMedianApp(): boolean {
  return typeof window !== 'undefined' && !!window.median;
}

/** هل الموقع يعمل على Android؟ */
export function isAndroid(): boolean {
  return typeof window !== 'undefined' &&
    /android/i.test(navigator.userAgent);
}

/** الوصول الآمن لكائن Median */
export function getMedian(): MedianWindow | null {
  if (typeof window === 'undefined') return null;
  return window.median ?? null;
}

// ─────────────────────────────────────────────
// Device Info
// ─────────────────────────────────────────────

/** احصل على معلومات الجهاز */
export function getDeviceInfo(): Promise<MedianDeviceInfo | null> {
  return new Promise((resolve) => {
    const m = getMedian();
    if (!m) return resolve(null);
    m.deviceInfo((info) => resolve(info));
    setTimeout(() => resolve(null), 3000); // timeout احتياطي
  });
}

// ─────────────────────────────────────────────
// Push Notifications
// ─────────────────────────────────────────────

/** طلب إذن الإشعارات واسترجاع التوكن */
export async function requestPushPermission(): Promise<MedianPushData | null> {
  const m = getMedian();
  if (!m?.push) return null;

  return new Promise((resolve) => {
    m.push.requestPermission((granted) => {
      if (!granted) return resolve(null);
      m.push.getToken((data) => resolve(data));
    });
  });
}

/** استرجاع Push Token الحالي بدون طلب إذن */
export async function getPushToken(): Promise<MedianPushData | null> {
  const m = getMedian();
  if (!m?.push) return null;

  return new Promise((resolve) => {
    m.push.getToken((data) => resolve(data));
    setTimeout(() => resolve(null), 3000);
  });
}

// ─────────────────────────────────────────────
// Status Bar
// ─────────────────────────────────────────────

/** تغيير لون شريط الحالة */
export function setStatusBarColor(
  color: string,
  style: 'light' | 'dark' = 'light'
): void {
  getMedian()?.statusbar?.setColor(color, style);
}

// ─────────────────────────────────────────────
// Share
// ─────────────────────────────────────────────

/** مشاركة الصفحة الحالية */
export function sharePage(): void {
  getMedian()?.share?.sharePage();
}

/** مشاركة نص */
export function shareText(text: string): void {
  getMedian()?.share?.shareText(text);
}

// ─────────────────────────────────────────────
// Clipboard
// ─────────────────────────────────────────────

/** نسخ نص للحافظة (عبر Median أو Web API) */
export async function copyToClipboard(text: string): Promise<void> {
  const m = getMedian();
  if (m?.clipboard) {
    m.clipboard.set(text);
    return;
  }
  // fallback للمتصفح
  await navigator.clipboard?.writeText(text);
}

// ─────────────────────────────────────────────
// Call Listener (مُعطّل — سيُفعَّل لاحقاً)
// ─────────────────────────────────────────────

/**
 * تسجيل callback يُستدعى عند ورود مكالمة هاتفية.
 *
 * @future سيتطلب:
 *   1. تفعيل `phoneCallListener` في median.json
 *   2. إضافة JavascriptInterface في الكود Kotlin
 *   3. صلاحيات READ_PHONE_STATE + READ_CALL_LOG
 *
 * @param callback - دالة تستقبل رقم المتصل
 * @returns دالة لإلغاء الاشتراك
 */
export function onIncomingCall(
  callback: (callerPhone: string) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  // Median native bridge (مستقبلاً)
  const m = getMedian();
  if (m?.callListener) {
    m.callListener.onIncomingCall = callback;
    m.callListener.start();
    return () => m.callListener?.stop();
  }

  // JavascriptInterface من Kotlin (مستقبلاً)
  window.CallVerifyBridge = {
    ...(window.CallVerifyBridge ?? {}),
    onIncomingCall: callback,
    onPushToken: window.CallVerifyBridge?.onPushToken ?? (() => {}),
  };

  return () => {
    if (window.CallVerifyBridge) {
      window.CallVerifyBridge.onIncomingCall = () => {};
    }
  };
}

// ─────────────────────────────────────────────
// Init — استدعِه مرة واحدة في App.tsx
// ─────────────────────────────────────────────

/**
 * تهيئة جسر Median.
 * استدعِه في بداية التطبيق لضبط الثيم والإشعارات.
 */
export async function initMedianBridge(): Promise<void> {
  if (!isMedianApp()) return;

  // ضبط لون شريط الحالة ليتوافق مع ثيم التطبيق
  setStatusBarColor('#1a1a2e', 'light');

  // تسجيل Push Token تلقائياً عند بدء التشغيل
  try {
    const pushData = await getPushToken();
    if (pushData?.token) {
      await ApiService.push.registerToken(pushData);
    }
  } catch {
    // لا نوقف التطبيق إذا فشل تسجيل الإشعارات
  }
}

// ─────────────────────────────────────────────
// Re-export ApiService لسهولة الاستخدام
// ─────────────────────────────────────────────
export { ApiService } from '@/lib/api-service';
