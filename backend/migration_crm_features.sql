-- CRM Features Migration
-- Run this file once against your PostgreSQL database
-- Safe to run: uses IF NOT EXISTS and ON CONFLICT DO NOTHING

-- FEATURE 1: REMINDERS
CREATE TABLE IF NOT EXISTS reminders (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- FEATURE 2: CRM PIPELINE
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(20),
  position INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO pipeline_stages (name, color, position) VALUES
  ('New', 'grey', 1),
  ('Qualified', 'blue', 2),
  ('Proposal', 'orange', 3),
  ('Won', 'green', 4)
ON CONFLICT DO NOTHING;

ALTER TABLE contacts 
  ADD COLUMN IF NOT EXISTS stage_id INTEGER 
    REFERENCES pipeline_stages(id),
  ADD COLUMN IF NOT EXISTS pipeline_status 
    VARCHAR(20) DEFAULT 'open';

-- FEATURE 3: CONVERSATIONS
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER REFERENCES contacts(id),
  status VARCHAR(20) DEFAULT 'open',
  assigned_agent_id INTEGER,
  channel VARCHAR(50) DEFAULT 'whatsapp',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id),
  sender_type VARCHAR(20),
  content TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW(),
  is_read BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS internal_notes (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id),
  agent_id INTEGER,
  note TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);
CREATE INDEX IF NOT EXISTS idx_reminders_due_date ON reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_contacts_stage_id ON contacts(stage_id);
CREATE INDEX IF NOT EXISTS idx_contacts_pipeline_status ON contacts(pipeline_status);
CREATE INDEX IF NOT EXISTS idx_conversations_contact_id ON conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_internal_notes_conversation_id ON internal_notes(conversation_id);