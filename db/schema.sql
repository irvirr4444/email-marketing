-- Current database schema (snapshot).
-- Apply migrations in db/migrations/ in order to bring a database up to date.

create extension if not exists pgcrypto;

-- the person an email was sent to
create table contact (
  id          uuid primary key default gen_random_uuid(),
  brand       text,
  email       text,
  name        text,
  created_at  timestamptz default now()
);

-- RAW: the email exactly as it came in. Never edited after insert.
create table email_message (
  id          uuid primary key default gen_random_uuid(),
  contact_id  uuid references contact(id),   -- recipient, optional

  source      text,          -- 'klaviyo' | 'gmail' | 'pasted' | ...
  message_id  text,          -- provider's id if there is one
  from_name   text,
  from_email  text,
  reply_to    text,
  to_email    text,
  subject     text,
  preheader   text,
  body_html   text,
  body_text   text,
  sent_at     timestamptz,
  raw         jsonb default '{}',   -- full original payload

  created_at  timestamptz default now()
);

-- ANALYSIS: what the AI derived from one email_message. Points back via FK.
create table email_analysis (
  id            uuid primary key default gen_random_uuid(),
  message_id    uuid not null references email_message(id) on delete cascade,

  campaign_type text,
  intent        text,
  subject_type  text,
  has_urgency   boolean,
  has_emoji     boolean,
  has_personalization boolean,
  body_length   text,
  framework     text,
  persuasion    text[],
  emotion       text[],
  social_proof  text,
  cta_type      text,
  cta_count     integer,
  has_offer     boolean,
  offer_type    text,
  extras        jsonb default '{}',

  model_version text,          -- which AI version produced this
  created_at    timestamptz default now()
);

create index email_analysis_message_idx on email_analysis (message_id);
