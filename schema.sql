-- ============================================================
-- ⚠️ تحذير | WARNING
-- ------------------------------------------------------------
-- 🇸🇦 لا تقم بتشفير رابط قاعدة البيانات أو إنشاء قاعدة بيانات جديدة.
--    المالك (ناير) يتحمل كامل المسؤولية عن هذا الاختيار.
--    رابط قاعدة البيانات المستخدم:
--    postgresql://neondb_owner:npg_Q5leq9pMHFuA@ep-bitter-hall-atpxgb78-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
--
-- 🇬🇧 Do NOT encrypt the database URL or create a new database.
--    The owner (Nayer) takes full responsibility for this decision.
--    Database URL in use:
--    postgresql://neondb_owner:npg_Q5leq9pMHFuA@ep-bitter-hall-atpxgb78-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
-- ============================================================

-- ===== جداول قاعدة البيانات | Database Tables =====

-- 1. المواقع المسموح لها باستخدام النظام | Sites allowed to use the system
CREATE TABLE IF NOT EXISTS api_clients (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,              -- اسم الموقع | Site name
  api_key     TEXT NOT NULL UNIQUE,       -- UUID عشوائي | Random UUID
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جلسات التحقق | Verification sessions
CREATE TABLE IF NOT EXISTS verification_sessions (
  id            TEXT PRIMARY KEY,         -- UUID عشوائي | Random UUID
  phone         TEXT NOT NULL,            -- رقم المستخدم | User phone number
  client_id     INTEGER REFERENCES api_clients(id),
  verified      BOOLEAN DEFAULT FALSE,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 3. سجل الاتصالات الواردة | Incoming calls log
CREATE TABLE IF NOT EXISTS incoming_calls (
  id            SERIAL PRIMARY KEY,
  caller_phone  TEXT NOT NULL,
  matched       BOOLEAN DEFAULT FALSE,    -- هل طابق جلسة نشطة؟ | Matched active session?
  session_id    TEXT REFERENCES verification_sessions(id),
  received_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes للأداء | Performance indexes
CREATE INDEX IF NOT EXISTS idx_sessions_phone   ON verification_sessions(phone);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON verification_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_calls_received   ON incoming_calls(received_at);
