-- Everything after 001: contact enrichment, contact_profile, email_context,
-- email_analysis updates, email_metrics. End state matches db/schema.sql.

-- ---------------------------------------------------------------------------
-- contact — Plane 2.1 identity + lifecycle anchors
-- ---------------------------------------------------------------------------
alter table contact
  add column customer_segment  text,
  add column lead_source       text,
  add column signup_at         timestamptz,
  add column last_purchase_at  timestamptz,
  add column external_id       text,
  add column extras            jsonb not null default '{}';

alter table contact
  alter column created_at set default now(),
  alter column created_at set not null;

create unique index contact_brand_email_idx
  on contact (brand, lower(email))
  where email is not null;

create index contact_external_id_idx
  on contact (brand, external_id)
  where external_id is not null;

-- ---------------------------------------------------------------------------
-- contact_profile — Plane 2.2–2.4 (optional 0..1 per contact)
-- ---------------------------------------------------------------------------
create table contact_profile (
  id              uuid primary key default gen_random_uuid(),
  contact_id      uuid not null references contact(id) on delete cascade,

  industry        text,
  industry_other  text,
  company_name    text,
  company_size    text,
  role            text,
  seniority       text,
  department      text,
  country         text,
  timezone        text,
  language        text,
  extras          jsonb not null default '{}',

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (contact_id)
);

-- ---------------------------------------------------------------------------
-- email_message — constraints and indexes
-- ---------------------------------------------------------------------------
alter table email_message
  alter column raw set default '{}',
  alter column raw set not null,
  alter column created_at set default now(),
  alter column created_at set not null;

create unique index email_message_source_message_id_idx
  on email_message (source, message_id)
  where message_id is not null;

create index email_message_contact_sent_idx on email_message (contact_id, sent_at);
create index email_message_to_email_idx on email_message (lower(to_email));

-- ---------------------------------------------------------------------------
-- email_context — Plane 2 snapshot per send (1:1 with email_message)
-- ---------------------------------------------------------------------------
create table email_context (
  id                          uuid primary key default gen_random_uuid(),
  message_id                  uuid not null references email_message(id) on delete cascade,

  segment_at_send             text not null default 'cold_prospect',

  industry                    text,
  industry_other              text,
  company_name                text,
  company_size                text,
  role                        text,
  seniority                   text,
  department                  text,
  country                     text,
  timezone                    text,
  language                    text,

  lead_source_at_send         text,
  prior_opens                 integer,
  prior_clicks                integer,
  prior_replies               integer,
  prior_bounces               integer,
  lifetime_emails_received    integer,
  days_since_last_engagement  integer,
  last_engagement_at          timestamptz,
  last_engagement_type        text,

  sent_at                     timestamptz not null,
  day_of_week                 text,
  hour_local                  integer,
  hour_utc                    integer,
  days_since_signup           integer,
  days_since_last_purchase    integer,
  days_since_previous_send    integer,

  sequence_number             integer,
  is_first_touch              boolean,

  engagement_snapshot_known   boolean not null default false,
  profile_snapshot_known      boolean not null default false,

  extras                      jsonb not null default '{}',
  created_at                  timestamptz not null default now(),

  unique (message_id)
);

create index email_context_segment_idx on email_context (segment_at_send);
create index email_context_industry_idx on email_context (industry);
create index email_context_sequence_idx on email_context (sequence_number);
create index email_context_sent_at_idx on email_context (sent_at);

-- ---------------------------------------------------------------------------
-- email_analysis — Plane 1 feature tags
-- ---------------------------------------------------------------------------
alter table email_analysis
  drop column if exists model_version,
  alter column extras set default '{}',
  alter column extras set not null,
  alter column created_at set default now(),
  alter column created_at set not null,
  add column updated_at timestamptz not null default now();

create unique index email_analysis_message_unique_idx on email_analysis (message_id);

-- ---------------------------------------------------------------------------
-- email_metrics — Plane 4 outcomes per send (1:1 with email_message)
-- ---------------------------------------------------------------------------
create table email_metrics (
  id                      uuid primary key default gen_random_uuid(),
  message_id              uuid not null references email_message(id) on delete cascade,

  delivered               boolean,
  bounce_type             text,
  placement               text,

  opened                  boolean,
  opened_at               timestamptz,
  time_to_open_seconds    integer,
  clicked                 boolean,
  clicked_at              timestamptz,
  clicked_link            text,
  replied                 boolean,
  replied_at              timestamptz,
  reply_sentiment         text,
  forwarded               boolean,
  forwarded_at            timestamptz,

  goal_completed          boolean,
  converted_at            timestamptz,
  revenue                 numeric(12, 2),
  order_value             numeric(12, 2),
  time_to_convert_seconds integer,

  unsubscribed            boolean,
  unsubscribed_at         timestamptz,
  spam_complaint          boolean,
  spam_complaint_at       timestamptz,
  hard_block              boolean,
  negative_reply          boolean,

  metrics_known           boolean not null default false,

  extras                  jsonb not null default '{}',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  unique (message_id)
);

create index email_metrics_opened_idx on email_metrics (opened) where opened is true;
create index email_metrics_clicked_idx on email_metrics (clicked) where clicked is true;
create index email_metrics_converted_idx on email_metrics (goal_completed) where goal_completed is true;
