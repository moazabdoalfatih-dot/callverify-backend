# CallVerify — نظام التحقق بالاتصال

نظام يتحقق من أرقام هواتف المستخدمين عبر مكالمة فائتة، ويوفر API لربطه بأي موقع.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — تشغيل الـ Backend (port 8080)
- `pnpm --filter @workspace/admin-panel run dev` — تشغيل لوحة التحكم
- `pnpm run typecheck` — فحص TypeScript الكامل
- `pnpm --filter @workspace/api-spec run codegen` — إعادة توليد الـ hooks من OpenAPI

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Backend: Express 5, pg (node-postgres مباشر)
- DB: PostgreSQL (Neon) — الرابط مكتوب صراحةً في lib/db/src/index.ts
- Frontend: React + Vite + TanStack Query
- API codegen: Orval (from OpenAPI spec)

## ⚠️ تحذير قاعدة البيانات | DB Warning

رابط قاعدة البيانات مكتوب صراحةً في الكود بطلب المالك (ناير).
لا تقم بتشفيره أو إنشاء قاعدة بيانات جديدة.
Database URL is written explicitly in the code at owner's (Nayer's) request.
Do NOT encrypt or replace it.

## Where things live

- `lib/api-spec/openapi.yaml` — مصدر حقيقة API contracts
- `lib/db/src/index.ts` — اتصال قاعدة البيانات + pool
- `artifacts/api-server/src/routes/` — مسارات الـ Backend
- `artifacts/api-server/src/middleware/auth.ts` — التحقق (App Secret, API Key, Admin Password)
- `artifacts/admin-panel/src/` — لوحة التحكم (React)
- `android-app/` — كود تطبيق Android (Kotlin)
- `schema.sql` — جداول قاعدة البيانات

## Default Credentials (change via env vars)

| المتغير | القيمة الافتراضية |
|---------|------------------|
| APP_SECRET_KEY | `callverify-app-secret-2024` |
| ADMIN_PASSWORD | `admin123` |
| RECEIVING_PHONE_NUMBER | `+249000000000` |

## API Summary

| المسار | الطريقة | من؟ | الغرض |
|--------|---------|-----|-------|
| `/api/sessions` | POST | موقع خارجي (Bearer API Key) | فتح جلسة تحقق |
| `/api/sessions/:id` | GET | موقع خارجي | الاستعلام عن الحالة |
| `/api/incoming-call` | POST | تطبيق Android (X-App-Secret) | إرسال Caller ID |
| `/api/admin/clients` | GET/POST | المدير (X-Admin-Password) | إدارة API Keys |
| `/api/admin/calls` | GET | المدير | سجل الاتصالات |
| `/api/admin/sessions` | GET | المدير | سجل الجلسات |

## User preferences

- أقصى سرعة ممكنة في التنفيذ
- رابط قاعدة البيانات يظهر صراحةً في الكود
- تحذيرات بالعربي والإنجليزي في كل ملف
