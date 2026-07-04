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
 * api-service.ts
 *
 * طبقة خدمة API المركزية — جميع الطلبات للـ backend في مكان واحد.
 *
 * الاستخدام:
 *   import { ApiService } from '@/lib/api-service';
 *
 *   const session = await ApiService.verification.createSession('+249912345678');
 *   const status  = await ApiService.verification.getSessionStatus(session.sessionId);
 */

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────

/**
 * رابط الـ API الأساسي.
 * في WebView (Median)، الموقع يعمل على نفس الدومين، لذلك /api تعمل تلقائياً.
 * لتغيير الدومين لاحقاً: غيّر هذا المتغير فقط.
 */
const API_BASE_URL = (
  typeof import.meta !== 'undefined'
    ? (import.meta.env?.VITE_API_BASE_URL ?? '')
    : ''
) + '/api';

const ADMIN_PASSWORD = 'admin123'; // يُقرأ من env في الإنتاج

// ─────────────────────────────────────────────
// HTTP Client
// ─────────────────────────────────────────────

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  apiKey?: string;
  appSecret?: string;
  adminPassword?: string;
}

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data: unknown,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, headers = {}, apiKey, appSecret, adminPassword } = options;

  const allHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (apiKey) allHeaders['Authorization'] = `Bearer ${apiKey}`;
  if (appSecret) allHeaders['X-App-Secret'] = appSecret;
  if (adminPassword) allHeaders['X-Admin-Password'] = adminPassword;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: allHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      res.status,
      res.statusText,
      data,
      (data as any)?.error ?? `HTTP ${res.status} ${res.statusText}`,
    );
  }

  return data as T;
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface VerificationSession {
  sessionId: string;
  callNumber: string;
  expiresIn: number;
}

export interface SessionStatus {
  verified: boolean;
  expired: boolean;
  phone: string | null;
  remainingSeconds: number;
}

export interface IncomingCallResult {
  matched: boolean;
  phone: string;
}

export interface ApiClient {
  id: number;
  name: string;
  apiKey?: string;
  isActive: boolean;
  createdAt: string;
}

export interface SystemSettings {
  receivingPhoneNumber: string;
}

export interface PushRegistration {
  token: string;
  deviceId: string;
  platform: 'android' | 'ios';
}

// ─────────────────────────────────────────────
// Services
// ─────────────────────────────────────────────

/**
 * خدمة التحقق من الهوية عبر المكالمات
 */
const verification = {
  /**
   * إنشاء جلسة تحقق جديدة
   * @param phone رقم هاتف المستخدم المراد التحقق منه (+249XXXXXXXXX)
   * @param apiKey مفتاح API الخاص بعميلك
   */
  createSession(phone: string, apiKey: string): Promise<VerificationSession> {
    return request('/sessions', {
      method: 'POST',
      body: { phone },
      apiKey,
    });
  },

  /**
   * الاستعلام عن حالة جلسة التحقق
   * @param sessionId معرّف الجلسة من createSession
   * @param apiKey مفتاح API الخاص بعميلك
   */
  getSessionStatus(sessionId: string, apiKey: string): Promise<SessionStatus> {
    return request(`/sessions/${sessionId}`, { apiKey });
  },

  /**
   * Polling helper — استعلم بشكل دوري حتى التحقق أو الانتهاء
   * @param sessionId معرّف الجلسة
   * @param apiKey مفتاح API
   * @param onStatus callback عند كل تحديث
   * @param intervalMs الفاصل بين الاستعلامات (ms) — افتراضي 2 ثانية
   * @returns دالة لإيقاف الـ polling
   */
  startPolling(
    sessionId: string,
    apiKey: string,
    onStatus: (status: SessionStatus) => void,
    intervalMs = 2000,
  ): () => void {
    let active = true;

    const poll = async () => {
      while (active) {
        try {
          const status = await verification.getSessionStatus(sessionId, apiKey);
          onStatus(status);
          if (status.verified || status.expired) break;
        } catch {
          // استمر بالمحاولة
        }
        await new Promise(r => setTimeout(r, intervalMs));
      }
    };

    poll();
    return () => { active = false; };
  },
};

/**
 * خدمة المكالمات الواردة (تُستخدم من تطبيق Android)
 */
const calls = {
  /**
   * إبلاغ النظام بمكالمة واردة
   * @param callerPhone رقم المتصل (+249XXXXXXXXX)
   * @param appSecret سر التطبيق الخاص بتطبيق Android
   */
  reportIncomingCall(callerPhone: string, appSecret: string): Promise<IncomingCallResult> {
    return request('/incoming-call', {
      method: 'POST',
      body: { callerPhone },
      appSecret,
    });
  },
};

/**
 * خدمة الإشعارات Push
 */
const push = {
  /**
   * تسجيل Push Token للجهاز
   * @param data بيانات الجهاز والتوكن
   */
  registerToken(data: PushRegistration): Promise<{ success: boolean }> {
    return request('/push/register', {
      method: 'POST',
      body: data,
    });
  },
};

/**
 * خدمة إدارة عملاء API (Admin فقط)
 */
const admin = {
  /**
   * قائمة جميع العملاء
   */
  listClients(): Promise<ApiClient[]> {
    return request('/admin/clients', { adminPassword: ADMIN_PASSWORD });
  },

  /**
   * إنشاء عميل جديد
   * @param name اسم العميل
   */
  createClient(name: string): Promise<ApiClient> {
    return request('/admin/clients', {
      method: 'POST',
      body: { name },
      adminPassword: ADMIN_PASSWORD,
    });
  },

  /**
   * تعطيل عميل
   * @param id معرّف العميل
   */
  disableClient(id: number): Promise<{ success: boolean }> {
    return request(`/admin/clients/${id}/disable`, {
      method: 'PATCH',
      adminPassword: ADMIN_PASSWORD,
    });
  },

  /**
   * قراءة إعدادات النظام
   */
  getSettings(): Promise<SystemSettings> {
    return request('/admin/settings', { adminPassword: ADMIN_PASSWORD });
  },

  /**
   * تحديث إعدادات النظام
   * @param settings الإعدادات الجديدة
   */
  updateSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    return request('/admin/settings', {
      method: 'PUT',
      body: settings,
      adminPassword: ADMIN_PASSWORD,
    });
  },

  /**
   * سجل المكالمات الواردة
   */
  listCalls() {
    return request('/admin/calls', { adminPassword: ADMIN_PASSWORD });
  },

  /**
   * سجل جلسات التحقق
   */
  listSessions() {
    return request('/admin/sessions', { adminPassword: ADMIN_PASSWORD });
  },
};

/**
 * فحص صحة الخادم
 */
const health = {
  check(): Promise<{ status: string }> {
    return request('/healthz');
  },
};

// ─────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────

export const ApiService = {
  verification,
  calls,
  push,
  admin,
  health,
  /** رابط الـ API الحالي — للقراءة فقط */
  get baseUrl() {
    return API_BASE_URL;
  },
};

export { ApiError };
