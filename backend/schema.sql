-- ============================================================
-- CRM Production Schema
-- Run: psql -U crmuser -d crm_db -h 127.0.0.1 -f schema.sql
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users (agents / admins) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'agent' CHECK (role IN ('admin','agent')),
  is_active     BOOLEAN      NOT NULL DEFAULT true,
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── Contacts ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             VARCHAR(255) NOT NULL,
  phone            VARCHAR(30)  UNIQUE NOT NULL,
  email            VARCHAR(255),
  tags             TEXT[]       NOT NULL DEFAULT '{}',
  is_online        BOOLEAN      NOT NULL DEFAULT false,
  last_seen        TIMESTAMP,
  stage_id         INTEGER,
  pipeline_status  VARCHAR(50),
  created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── Conversations ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id       UUID         NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  assigned_agent   UUID         REFERENCES users(id) ON DELETE SET NULL,
  status           VARCHAR(20)  NOT NULL DEFAULT 'open'
                     CHECK (status IN ('open','pending','resolved','closed')),
  channel          VARCHAR(20)  NOT NULL DEFAULT 'whatsapp',
  pushed_to_admin  BOOLEAN      NOT NULL DEFAULT false,
  created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── Messages ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id   UUID         NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  content           TEXT         NOT NULL,
  type              VARCHAR(20)  NOT NULL DEFAULT 'text'
                      CHECK (type IN ('text','image','document','audio','video','location','template')),
  sender            VARCHAR(20)  NOT NULL CHECK (sender IN ('agent','contact')),
  status            VARCHAR(20)  NOT NULL DEFAULT 'sent'
                      CHECK (status IN ('sent','delivered','read','received','failed')),
  meta_message_id   VARCHAR(255),
  created_at        TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── Internal Notes ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id  UUID         NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  agent_id         UUID         REFERENCES users(id) ON DELETE SET NULL,
  note             TEXT         NOT NULL,
  created_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── Pipeline Stages ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id        SERIAL       PRIMARY KEY,
  name      VARCHAR(100) NOT NULL,
  color     VARCHAR(50)  NOT NULL DEFAULT 'grey',
  position  INTEGER      NOT NULL
);

-- ── Campaigns ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           VARCHAR(255) NOT NULL,
  template_name  VARCHAR(255),
  status         VARCHAR(20)  NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft','scheduled','running','sent','failed')),
  contact_count  INTEGER      NOT NULL DEFAULT 0,
  sent_count     INTEGER      NOT NULL DEFAULT 0,
  scheduled_at   TIMESTAMP,
  created_by     UUID         REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── Reminders ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reminders (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  due_date    TIMESTAMP,
  status      VARCHAR(20)  NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','completed','overdue')),
  priority    VARCHAR(10)  NOT NULL DEFAULT 'medium'
                CHECK (priority IN ('low','medium','high')),
  contact_id  UUID         REFERENCES contacts(id) ON DELETE SET NULL,
  agent_id    UUID         REFERENCES users(id)    ON DELETE SET NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_messages_conversation  ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_meta_id       ON messages(meta_message_id);
CREATE INDEX IF NOT EXISTS idx_conversations_contact  ON conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status   ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_contacts_phone         ON contacts(phone);
CREATE INDEX IF NOT EXISTS idx_reminders_status       ON reminders(status);
CREATE INDEX IF NOT EXISTS idx_reminders_due          ON reminders(due_date);

-- ── Seed pipeline stages ──────────────────────────────────────
INSERT INTO pipeline_stages (name, color, position) VALUES
  ('New Lead',    'blue',   1),
  ('Qualified',   'yellow', 2),
  ('Proposal',    'orange', 3),
  ('Negotiation', 'purple', 4),
  ('Closed Won',  'green',  5)
ON CONFLICT DO NOTHING;

-- ── Seed default admin user (password: Admin@1234) ────────────
-- bcrypt hash of "Admin@1234" with 10 rounds
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Admin', 'admin@crm.com', '$2a$10$y70zuWSwg4qbNgVxaZtineRlw7CboCuaRLqQDZFWkZEXdmsl/EY2O', 'admin')
ON CONFLICT (email) DO NOTHING;
