-- Current database schema (snapshot).
-- Apply migrations in db/migrations/ in order to bring a database up to date.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- contact — recipient (Plane 2.1 identity + lifecycle anchors)
-- ---------------------------------------------------------------------------
create table contact (
  id                uuid primary key default gen_random_uuid(),
  brand             text,
  email             text,
  name              text,
  customer_segment  text,
  lead_source       text,
  signup_at         timestamptz,
  last_purchase_at  timestamptz,
  external_id       text,
  extras            jsonb not null default '{}',
  created_at        timestamptz not null default now()
);

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
-- email_message — RAW: immutable after insert
-- ---------------------------------------------------------------------------
create table email_message (
  id              uuid primary key default gen_random_uuid(),
  contact_id      uuid references contact(id),

  source          text,
  message_id      text,
  from_name       text,
  from_email      text,
  reply_to        text,
  to_email        text,
  subject         text,
  preheader       text,
  body_html       text,
  body_text       text,
  sent_at         timestamptz,
  raw             jsonb not null default '{}',

  created_at      timestamptz not null default now()
);

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

  -- 2.1 segment at send
  segment_at_send             text not null default 'cold_prospect',

  -- 2.2–2.4 profile snapshot at send
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

  -- 2.5 engagement history before this send
  lead_source_at_send         text,
  prior_opens                 integer,
  prior_clicks                integer,
  prior_replies               integer,
  prior_bounces               integer,
  lifetime_emails_received    integer,
  days_since_last_engagement  integer,
  last_engagement_at          timestamptz,
  last_engagement_type        text,

  -- 2.6 send timing
  sent_at                     timestamptz not null,
  day_of_week                 text,
  hour_local                  integer,
  hour_utc                    integer,
  days_since_signup           integer,
  days_since_last_purchase    integer,
  days_since_previous_send    integer,

  -- sequence / cadence
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
-- email_analysis — Plane 1 feature tags (past + present; partial; expanded later)
-- ---------------------------------------------------------------------------
create table email_analysis (
  id                    uuid primary key default gen_random_uuid(),
  message_id            uuid not null references email_message(id) on delete cascade,

  campaign_type         text,
  intent                text,
  subject_type          text,
  has_urgency           boolean,
  has_emoji             boolean,
  has_personalization   boolean,
  body_length           text,
  framework             text,
  persuasion            text[],
  emotion               text[],
  social_proof          text,
  cta_type              text,
  cta_count             integer,
  has_offer             boolean,
  offer_type            text,
  extras                jsonb not null default '{}',

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  unique (message_id)
);

create index email_analysis_message_idx on email_analysis (message_id);

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

-- ---------------------------------------------------------------------------
-- generation_batch — metadata for a batch of generated email variations
-- ---------------------------------------------------------------------------
create table generation_batch (
  id              uuid primary key default gen_random_uuid(),
  batch_id        text not null unique,  -- e.g. 'provence-50-2026-07-01T14-26-07-634Z'
  
  company         text not null,
  product         text not null,
  campaign        text,
  
  -- social proof assets used across the batch
  social_proof_assets jsonb not null default '{}',
  
  total_generated integer not null default 0,
  
  created_at      timestamptz not null default now()
);

create index generation_batch_company_idx on generation_batch (company);
create index generation_batch_created_idx on generation_batch (created_at);

-- ---------------------------------------------------------------------------
-- generated_email — AI-generated email template with full lever tracking
-- ---------------------------------------------------------------------------
create table generated_email (
  id              uuid primary key default gen_random_uuid(),
  batch_id        uuid not null references generation_batch(id) on delete cascade,
  
  -- scenario identification
  scenario_id     text not null,           -- e.g. 'pb-01-pas-curiosity-kennedy'
  scenario_label  text,                    -- e.g. '#1 PAS + curiosity + none + kennedy'
  index_in_batch  integer not null,
  
  -- email content
  subject         text not null,
  preheader       text,
  body            text not null,
  
  -- =========================================================================
  -- PLANE 1 FEATURES — full lever tracking (no more stuffing in extras)
  -- =========================================================================
  
  -- 1.2 Intent
  intent          text not null,           -- get_reply, drive_purchase, click_to_page, etc.
  
  -- 1.3 Subject line
  subject_type    text,                    -- question, statement, curiosity_gap, list, announcement
  subject_length  text,                    -- short, medium, long
  subject_casing  text,                    -- sentence, title, lowercase
  
  -- 1.4 Preheader
  preheader_present   boolean not null default false,
  preheader_length    text,                -- short, medium, long
  preheader_relationship text,             -- complements, repeats
  
  -- 1.6 Body
  body_length     text,                    -- short, medium, long
  body_links      text,                    -- zero, one, two_plus
  body_scannable  boolean,
  
  -- 1.7 Copy strategy
  framework       text,                    -- PAS, AIDA, BAB, FAB, none
  emotion         text,                    -- curiosity, fear, aspiration, humor, fomo, status, pain_relief
  persuasion      text,                    -- reciprocity, authority, scarcity, liking, commitment, none
  specificity     text,                    -- hard_numbers, vague
  personalization_depth text,              -- generic, merge_field, segment_tailored, one_to_one_researched
  writing_style   text,                    -- kennedy, ogilvy, kern, chaperon, none
  
  -- 1.7 Social proof
  social_proof_type       text,            -- none, result, volume, peer, consensus, recency, quote, name_drop
  social_proof_placement  text,            -- opener, body, pre_cta, ps
  social_proof_specificity text,           -- vague, specific
  
  -- 1.8 CTA
  cta_type        text,                    -- reply, buy, read, download, book
  cta_style       text,                    -- plain_reply_ask, link, button
  cta_placement   text,                    -- end, inline, both
  cta_copy        text,
  
  -- 1.9 Offer
  has_offer       boolean not null default false,
  offer_type      text,                    -- percent_off, dollar_off, free_ship, trial, none
  offer_magnitude text,                    -- e.g. '15% off first order'
  
  -- overflow for future levers
  extras          jsonb not null default '{}',
  
  created_at      timestamptz not null default now(),
  
  unique (batch_id, scenario_id)
);

create index generated_email_batch_idx on generated_email (batch_id);
create index generated_email_intent_idx on generated_email (intent);
create index generated_email_framework_idx on generated_email (framework);
create index generated_email_style_idx on generated_email (writing_style);
