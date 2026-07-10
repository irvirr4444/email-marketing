-- Current database schema (snapshot).
-- Apply migrations in db/migrations/ in order to bring a database up to date.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- writing_style — normalized catalog of copywriting styles
-- (canonical prompt text lives in email-lever-studio/shared/writing-styles.ts)
-- ---------------------------------------------------------------------------
create table writing_style (
  id            uuid primary key default gen_random_uuid(),
  key           text not null unique,
  author_label  text not null,
  description   text,
  prompt        text,
  sort_order    integer not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- app_user — one row per Supabase auth user (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table app_user (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  name        text,
  avatar_url  text,
  settings    jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- company — workspace / brand
-- ---------------------------------------------------------------------------
create table company (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text,
  created_by  uuid references app_user(id) on delete set null,
  extras      jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index company_name_lower_idx on company (lower(name));

-- ---------------------------------------------------------------------------
-- company_member — membership + role (users <-> companies)
-- ---------------------------------------------------------------------------
create table company_member (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references company(id) on delete cascade,
  user_id     uuid not null references app_user(id) on delete cascade,
  role        text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at  timestamptz not null default now(),
  unique (company_id, user_id)
);

create index company_member_user_idx on company_member (user_id);
create index company_member_company_idx on company_member (company_id);

-- ---------------------------------------------------------------------------
-- campaign — belongs to a company; optional default writing style
-- ---------------------------------------------------------------------------
create table campaign (
  id                       uuid primary key default gen_random_uuid(),
  company_id               uuid not null references company(id) on delete cascade,
  name                     text not null,
  status                   text not null default 'active' check (status in ('active', 'paused', 'completed')),
  default_writing_style_id uuid references writing_style(id) on delete set null,
  product_description      text,
  product_url              text,
  goal                     text check (goal in ('book_meeting', 'drive_purchase', 'get_reply', 'click_to_page', 'collect_info', 'referral')),
  social_proof_assets      jsonb not null default '{}',
  social_proof_status      text not null default 'not_started' check (social_proof_status in ('not_started', 'researched', 'approved')),
  created_by               uuid references app_user(id) on delete set null,
  extras                   jsonb not null default '{}',
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index campaign_company_idx on campaign (company_id);
create unique index campaign_company_name_lower_idx on campaign (company_id, lower(name));

-- ---------------------------------------------------------------------------
-- contact — recipient (Plane 2.1 identity + lifecycle anchors)
-- ---------------------------------------------------------------------------
create table contact (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid references company(id) on delete set null,
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

create index contact_company_idx on contact (company_id);

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
  company_id      uuid references company(id) on delete set null,
  campaign_id     uuid references campaign(id) on delete set null,

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
create index email_message_company_idx on email_message (company_id);
create index email_message_campaign_idx on email_message (campaign_id);

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

  company_id      uuid references company(id) on delete set null,
  campaign_id     uuid references campaign(id) on delete set null,

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
create index generation_batch_company_idx2 on generation_batch (company_id);
create index generation_batch_campaign_idx on generation_batch (campaign_id);

-- ---------------------------------------------------------------------------
-- generated_email — AI-generated email template with full lever tracking
-- ---------------------------------------------------------------------------
create table generated_email (
  id              uuid primary key default gen_random_uuid(),
  batch_id        uuid not null references generation_batch(id) on delete cascade,

  campaign_id     uuid references campaign(id) on delete set null,
  writing_style_id uuid references writing_style(id) on delete set null,

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
  writing_style   text,                    -- kennedy, ogilvy, kern, chaperon, none (legacy text; see writing_style_id)

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
create index generated_email_campaign_idx on generated_email (campaign_id);
create index generated_email_style_id_idx on generated_email (writing_style_id);

-- ---------------------------------------------------------------------------
-- generated_email_send — links a generated_email template to a real send
-- ---------------------------------------------------------------------------
create table generated_email_send (
  id                 uuid primary key default gen_random_uuid(),
  generated_email_id uuid not null references generated_email(id) on delete cascade,
  message_id         uuid not null references email_message(id) on delete cascade,
  created_at         timestamptz not null default now()
);

create index generated_email_send_generated_email_idx on generated_email_send (generated_email_id);
create index generated_email_send_message_idx on generated_email_send (message_id);

-- ---------------------------------------------------------------------------
-- Auth bootstrap + workspace helper functions
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.app_user (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', new.email)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

create or replace function public.is_company_member(p_company_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.company_member cm
    where cm.company_id = p_company_id and cm.user_id = auth.uid()
  );
$$;

create or replace function public.is_company_admin(p_company_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.company_member cm
    where cm.company_id = p_company_id and cm.user_id = auth.uid() and cm.role in ('owner', 'admin')
  );
$$;

create or replace function public.create_company(p_name text)
returns public.company language plpgsql security definer set search_path = public as $$
declare v_company public.company;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into public.company (name, created_by) values (btrim(p_name), auth.uid()) returning * into v_company;
  insert into public.company_member (company_id, user_id, role) values (v_company.id, auth.uid(), 'owner');
  return v_company;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security — company-scoped access (postgres/service role bypasses)
-- ---------------------------------------------------------------------------
alter table app_user             enable row level security;
alter table company              enable row level security;
alter table company_member       enable row level security;
alter table campaign             enable row level security;
alter table writing_style        enable row level security;
alter table contact              enable row level security;
alter table contact_profile      enable row level security;
alter table email_message        enable row level security;
alter table email_context        enable row level security;
alter table email_metrics        enable row level security;
alter table email_analysis       enable row level security;
alter table generation_batch     enable row level security;
alter table generated_email      enable row level security;
alter table generated_email_send enable row level security;

create policy app_user_self_select on app_user for select using (id = auth.uid());
create policy app_user_self_insert on app_user for insert with check (id = auth.uid());
create policy app_user_self_update on app_user for update using (id = auth.uid()) with check (id = auth.uid());

create policy writing_style_read on writing_style for select using (true);

create policy company_member_select on company for select using (public.is_company_member(id));
create policy company_creator_insert on company for insert with check (created_by = auth.uid());
create policy company_admin_update on company for update using (public.is_company_admin(id)) with check (public.is_company_admin(id));
create policy company_admin_delete on company for delete using (public.is_company_admin(id));

create policy company_member_read on company_member for select
  using (user_id = auth.uid() or public.is_company_admin(company_id));
create policy company_member_admin_insert on company_member for insert with check (public.is_company_admin(company_id));
create policy company_member_admin_update on company_member for update using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));
create policy company_member_admin_delete on company_member for delete using (public.is_company_admin(company_id));

create policy campaign_member_all on campaign for all
  using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));

create policy contact_member_all on contact for all
  using (company_id is not null and public.is_company_member(company_id))
  with check (company_id is not null and public.is_company_member(company_id));

create policy contact_profile_member_all on contact_profile for all
  using (exists (select 1 from contact c where c.id = contact_profile.contact_id and public.is_company_member(c.company_id)))
  with check (exists (select 1 from contact c where c.id = contact_profile.contact_id and public.is_company_member(c.company_id)));

create policy email_message_member_all on email_message for all
  using (company_id is not null and public.is_company_member(company_id))
  with check (company_id is not null and public.is_company_member(company_id));

create policy email_context_member_all on email_context for all
  using (exists (select 1 from email_message m where m.id = email_context.message_id and public.is_company_member(m.company_id)))
  with check (exists (select 1 from email_message m where m.id = email_context.message_id and public.is_company_member(m.company_id)));

create policy email_metrics_member_all on email_metrics for all
  using (exists (select 1 from email_message m where m.id = email_metrics.message_id and public.is_company_member(m.company_id)))
  with check (exists (select 1 from email_message m where m.id = email_metrics.message_id and public.is_company_member(m.company_id)));

create policy email_analysis_member_all on email_analysis for all
  using (exists (select 1 from email_message m where m.id = email_analysis.message_id and public.is_company_member(m.company_id)))
  with check (exists (select 1 from email_message m where m.id = email_analysis.message_id and public.is_company_member(m.company_id)));

create policy generation_batch_member_all on generation_batch for all
  using (company_id is not null and public.is_company_member(company_id))
  with check (company_id is not null and public.is_company_member(company_id));

create policy generated_email_member_all on generated_email for all
  using (exists (select 1 from campaign c where c.id = generated_email.campaign_id and public.is_company_member(c.company_id)))
  with check (exists (select 1 from campaign c where c.id = generated_email.campaign_id and public.is_company_member(c.company_id)));

create policy generated_email_send_member_all on generated_email_send for all
  using (exists (
    select 1 from generated_email ge join campaign c on c.id = ge.campaign_id
    where ge.id = generated_email_send.generated_email_id and public.is_company_member(c.company_id)
  ))
  with check (exists (
    select 1 from generated_email ge join campaign c on c.id = ge.campaign_id
    where ge.id = generated_email_send.generated_email_id and public.is_company_member(c.company_id)
  ));
