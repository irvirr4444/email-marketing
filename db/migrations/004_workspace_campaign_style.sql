-- 004: Workspace model — app_user, company, company_member, campaign, writing_style.
-- Connects existing email data (contact, email_message, generation_batch,
-- generated_email, generated_email_send) to companies, campaigns, and styles.
-- Additive + backfill: legacy text columns (brand, company, campaign, writing_style)
-- are kept so current imports keep working. RLS is enabled with company-scoped
-- policies. Postgres/service role bypasses RLS, so SQL-editor imports are unaffected.

create extension if not exists pgcrypto;

-- ===========================================================================
-- writing_style — normalized catalog of copywriting styles
-- ===========================================================================
create table if not exists writing_style (
  id            uuid primary key default gen_random_uuid(),
  key           text not null unique,          -- e.g. 'kennedy' (matches generated_email.writing_style)
  author_label  text not null,                 -- e.g. 'Dan Kennedy'
  description   text,
  prompt        text,                          -- optional; canonical prompt lives in shared/writing-styles.ts
  sort_order    integer not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

insert into writing_style (key, author_label, description, sort_order) values
  ('kennedy', 'Dan Kennedy', 'Dan Kennedy — Direct-response marketing strategist known for his "No B.S." book series and blunt, no-nonsense teaching style. He built his reputation coaching entrepreneurs, financial advisors, and info-marketers on selling through sequenced follow-up rather than one-off pitches. He is a foundational influence on the modern info-marketing and coaching industry.', 1),
  ('ogilvy', 'David Ogilvy', 'David Ogilvy — Often called "The Father of Advertising," he founded Ogilvy & Mather and wrote the classic Confessions of an Advertising Man. He championed research-driven, benefit-focused copy long before "data-driven marketing" was a buzzword. His famous line "the consumer isn''t a moron, she''s your wife" still gets quoted today.', 2),
  ('kern', 'Frank Kern', 'Internet marketer who helped popularize the "product launch" email sequence in the online business world. He is known for blending direct-response principles with a casual, conversational tone in his emails. His "Mass Control" course influenced a generation of online course creators.', 3),
  ('chaperon', 'Andre Chaperon', 'Andre Chaperon — Email marketer best known for pioneering narrative-driven "soap opera sequences" — autoresponder emails structured like serialized story episodes. He built a cult following through his "Tiny Little Businesses" philosophy of small, sustainable online ventures. His work shifted email marketing away from hard pitches toward story-based engagement.', 4),
  ('halbert', 'Gary Halbert', 'Gary Halbert — Legendary direct-mail copywriter famous for writing some of the highest-converting sales letters in advertising history. His letters to his son, later published as The Boron Letters, remain a cult classic copywriting text. He was known for a gritty, street-smart persuasion style built on deep customer psychology.', 5),
  ('schwartz', 'Eugene Schwartz', 'Eugene Schwartz — Copywriter and author of Breakthrough Advertising, considered one of the most important copywriting books ever written. He developed the concept of "market sophistication" and stages of customer awareness, which still underpins modern funnel and email strategy. He wrote copy for major mail-order businesses and mentored many copywriters who came after him.', 6),
  ('albuquerque', 'Evaldo Albuquerque', 'Evaldo Albuquerque — Email copywriter best known for his work at Agora Financial, where he became one of the highest-paid copywriters in the financial newsletter space. He is known for combining storytelling with financial promotions to drive massive subscription sales. He later taught his methods through courses aimed at aspiring email copywriters.', 7),
  ('makepeace', 'Clayton Makepeace', 'Clayton Makepeace — One of the highest-earning direct-response copywriters in history, specializing in health and financial newsletter promotions. He was known for emotionally charged, benefit-driven copy that generated huge mailing list revenues for publishers like Agora and Boardroom. He also mentored copywriters through his training programs before his passing in 2016.', 8),
  ('brunson', 'Russell Brunson', 'Russell Brunson — Entrepreneur and co-founder of ClickFunnels, a software platform that popularized "sales funnels" for online businesses. He is the author of bestsellers like DotCom Secrets and Expert Secrets, which teach funnel-building and offer creation. He built a large following by combining product launches with community-driven marketing events.', 9),
  ('bencivenga', 'Gary Bencivenga', 'Gary Bencivenga — Widely regarded by peers as one of the greatest copywriters alive before his retirement, earning the nickname "the copywriter''s copywriter." He wrote long-running control ads for financial and health publishers with unusually high response rates. His retirement seminar, later compiled as the "Bencivenga 100," is still studied by copywriters today.', 10),
  ('carlton', 'John Carlton', 'John Carlton — Direct-response copywriter known for his gritty, punchy, no-fluff writing style and decades of work in fitness, business opportunity, and marketing niches. He is often cited alongside Halbert as a master of "street" copywriting that speaks plainly to real people. He later taught copywriting through his "Marketing Rebel" training programs.', 11),
  ('settle', 'Ben Settle', 'Ben Settle — Email marketing specialist known for popularizing daily, personality-driven emails as a standalone sales channel rather than just a supporting tool. He publishes the long-running Email Players newsletter, teaching copywriters and business owners to sell via short, opinionated daily emails. He is credited with helping shift small-business email marketing away from "newsletter" style toward direct, frequent selling.', 12)
on conflict (key) do update set
  author_label = excluded.author_label,
  description  = excluded.description,
  sort_order   = excluded.sort_order,
  updated_at   = now();

-- ===========================================================================
-- app_user — one row per Supabase auth user (1:1 with auth.users)
-- ===========================================================================
create table if not exists app_user (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  name        text,
  avatar_url  text,
  settings    jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ===========================================================================
-- company — workspace / brand
-- ===========================================================================
create table if not exists company (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text,
  created_by  uuid references app_user(id) on delete set null,
  extras      jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index if not exists company_name_lower_idx on company (lower(name));

-- ===========================================================================
-- company_member — membership + role (many users <-> many companies)
-- ===========================================================================
create table if not exists company_member (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references company(id) on delete cascade,
  user_id     uuid not null references app_user(id) on delete cascade,
  role        text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at  timestamptz not null default now(),
  unique (company_id, user_id)
);

create index if not exists company_member_user_idx on company_member (user_id);
create index if not exists company_member_company_idx on company_member (company_id);

-- ===========================================================================
-- campaign — belongs to a company; optional default writing style
-- ===========================================================================
create table if not exists campaign (
  id                       uuid primary key default gen_random_uuid(),
  company_id               uuid not null references company(id) on delete cascade,
  name                     text not null,
  status                   text not null default 'active' check (status in ('active', 'paused', 'completed')),
  default_writing_style_id uuid references writing_style(id) on delete set null,
  created_by               uuid references app_user(id) on delete set null,
  extras                   jsonb not null default '{}',
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists campaign_company_idx on campaign (company_id);
create unique index if not exists campaign_company_name_lower_idx on campaign (company_id, lower(name));

-- ===========================================================================
-- Relationship columns on existing tables (nullable, additive)
-- ===========================================================================
alter table contact          add column if not exists company_id       uuid references company(id) on delete set null;
alter table email_message    add column if not exists company_id       uuid references company(id) on delete set null;
alter table email_message    add column if not exists campaign_id      uuid references campaign(id) on delete set null;
alter table generation_batch add column if not exists company_id       uuid references company(id) on delete set null;
alter table generation_batch add column if not exists campaign_id      uuid references campaign(id) on delete set null;
alter table generated_email  add column if not exists campaign_id      uuid references campaign(id) on delete set null;
alter table generated_email  add column if not exists writing_style_id uuid references writing_style(id) on delete set null;

-- ===========================================================================
-- Backfill from legacy text columns
-- ===========================================================================

-- 1) Companies from contact.brand and generation_batch.company
insert into company (name)
select distinct t.name
from (
  select brand   as name from contact          where brand   is not null and btrim(brand)   <> ''
  union
  select company as name from generation_batch where company is not null and btrim(company) <> ''
) t
where not exists (select 1 from company c where lower(c.name) = lower(t.name));

-- 2) contact.company_id
update contact
set company_id = c.id
from company c
where contact.company_id is null
  and contact.brand is not null
  and lower(c.name) = lower(contact.brand);

-- 3) generation_batch.company_id
update generation_batch gb
set company_id = c.id
from company c
where gb.company_id is null
  and gb.company is not null
  and lower(c.name) = lower(gb.company);

-- 4) Campaigns from generation_batch (campaign text is often null -> use product / batch_id)
insert into campaign (company_id, name)
select distinct gb.company_id,
       coalesce(nullif(btrim(gb.campaign), ''), nullif(btrim(gb.product), ''), gb.batch_id) as name
from generation_batch gb
where gb.company_id is not null
  and not exists (
    select 1 from campaign c
    where c.company_id = gb.company_id
      and lower(c.name) = lower(coalesce(nullif(btrim(gb.campaign), ''), nullif(btrim(gb.product), ''), gb.batch_id))
  );

-- 5) generation_batch.campaign_id
update generation_batch gb
set campaign_id = c.id
from campaign c
where gb.campaign_id is null
  and c.company_id = gb.company_id
  and lower(c.name) = lower(coalesce(nullif(btrim(gb.campaign), ''), nullif(btrim(gb.product), ''), gb.batch_id));

-- 6) generated_email.campaign_id (inherit from its batch)
update generated_email ge
set campaign_id = gb.campaign_id
from generation_batch gb
where ge.campaign_id is null
  and ge.batch_id = gb.id
  and gb.campaign_id is not null;

-- 7) generated_email.writing_style_id
update generated_email ge
set writing_style_id = ws.id
from writing_style ws
where ge.writing_style_id is null
  and ge.writing_style is not null
  and ws.key = ge.writing_style;

-- 8) email_message.company_id (via contact)
update email_message m
set company_id = c.company_id
from contact c
where m.company_id is null
  and m.contact_id = c.id
  and c.company_id is not null;

-- 9) email_message.campaign_id (via generated_email_send -> generated_email)
update email_message m
set campaign_id = ge.campaign_id
from generated_email_send s
join generated_email ge on ge.id = s.generated_email_id
where m.campaign_id is null
  and s.message_id = m.id
  and ge.campaign_id is not null;

-- ===========================================================================
-- Indexes for new foreign keys
-- ===========================================================================
create index if not exists contact_company_idx           on contact (company_id);
create index if not exists email_message_company_idx      on email_message (company_id);
create index if not exists email_message_campaign_idx     on email_message (campaign_id);
create index if not exists generation_batch_company_idx2  on generation_batch (company_id);
create index if not exists generation_batch_campaign_idx  on generation_batch (campaign_id);
create index if not exists generated_email_campaign_idx   on generated_email (campaign_id);
create index if not exists generated_email_style_id_idx   on generated_email (writing_style_id);

-- ===========================================================================
-- Auth bootstrap: auto-provision app_user when an auth user is created
-- ===========================================================================
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
    coalesce(
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'full_name',
      new.email
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ===========================================================================
-- RLS helper functions (SECURITY DEFINER -> bypass RLS internally, no recursion)
-- ===========================================================================
create or replace function public.is_company_member(p_company_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.company_member cm
    where cm.company_id = p_company_id
      and cm.user_id = auth.uid()
  );
$$;

create or replace function public.is_company_admin(p_company_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.company_member cm
    where cm.company_id = p_company_id
      and cm.user_id = auth.uid()
      and cm.role in ('owner', 'admin')
  );
$$;

-- Create a company and add the caller as its owner (safe bootstrap path)
create or replace function public.create_company(p_name text)
returns public.company
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company public.company;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into public.company (name, created_by)
  values (btrim(p_name), auth.uid())
  returning * into v_company;

  insert into public.company_member (company_id, user_id, role)
  values (v_company.id, auth.uid(), 'owner');

  return v_company;
end;
$$;

-- ===========================================================================
-- Row Level Security
-- ===========================================================================
alter table app_user           enable row level security;
alter table company            enable row level security;
alter table company_member     enable row level security;
alter table campaign           enable row level security;
alter table writing_style      enable row level security;
alter table contact            enable row level security;
alter table contact_profile    enable row level security;
alter table email_message      enable row level security;
alter table email_context      enable row level security;
alter table email_metrics      enable row level security;
alter table email_analysis     enable row level security;
alter table generation_batch   enable row level security;
alter table generated_email    enable row level security;
alter table generated_email_send enable row level security;

-- app_user: self only
drop policy if exists app_user_self_select on app_user;
create policy app_user_self_select on app_user for select using (id = auth.uid());
drop policy if exists app_user_self_insert on app_user;
create policy app_user_self_insert on app_user for insert with check (id = auth.uid());
drop policy if exists app_user_self_update on app_user;
create policy app_user_self_update on app_user for update using (id = auth.uid()) with check (id = auth.uid());

-- writing_style: readable by all app users (catalog); writes are service-role only
drop policy if exists writing_style_read on writing_style;
create policy writing_style_read on writing_style for select using (true);

-- company: members read; creator inserts; admins manage
drop policy if exists company_member_select on company;
create policy company_member_select on company for select using (public.is_company_member(id));
drop policy if exists company_creator_insert on company;
create policy company_creator_insert on company for insert with check (created_by = auth.uid());
drop policy if exists company_admin_update on company;
create policy company_admin_update on company for update using (public.is_company_admin(id)) with check (public.is_company_admin(id));
drop policy if exists company_admin_delete on company;
create policy company_admin_delete on company for delete using (public.is_company_admin(id));

-- company_member: see own memberships or any if admin of that company; admins manage
drop policy if exists company_member_read on company_member;
create policy company_member_read on company_member for select
  using (user_id = auth.uid() or public.is_company_admin(company_id));
drop policy if exists company_member_admin_insert on company_member;
create policy company_member_admin_insert on company_member for insert
  with check (public.is_company_admin(company_id));
drop policy if exists company_member_admin_update on company_member;
create policy company_member_admin_update on company_member for update
  using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));
drop policy if exists company_member_admin_delete on company_member;
create policy company_member_admin_delete on company_member for delete
  using (public.is_company_admin(company_id));

-- campaign: company members
drop policy if exists campaign_member_all on campaign;
create policy campaign_member_all on campaign for all
  using (public.is_company_member(company_id))
  with check (public.is_company_member(company_id));

-- contact: company members
drop policy if exists contact_member_all on contact;
create policy contact_member_all on contact for all
  using (company_id is not null and public.is_company_member(company_id))
  with check (company_id is not null and public.is_company_member(company_id));

-- contact_profile: via contact
drop policy if exists contact_profile_member_all on contact_profile;
create policy contact_profile_member_all on contact_profile for all
  using (exists (select 1 from contact c where c.id = contact_profile.contact_id and public.is_company_member(c.company_id)))
  with check (exists (select 1 from contact c where c.id = contact_profile.contact_id and public.is_company_member(c.company_id)));

-- email_message: company members
drop policy if exists email_message_member_all on email_message;
create policy email_message_member_all on email_message for all
  using (company_id is not null and public.is_company_member(company_id))
  with check (company_id is not null and public.is_company_member(company_id));

-- email_context: via email_message
drop policy if exists email_context_member_all on email_context;
create policy email_context_member_all on email_context for all
  using (exists (select 1 from email_message m where m.id = email_context.message_id and public.is_company_member(m.company_id)))
  with check (exists (select 1 from email_message m where m.id = email_context.message_id and public.is_company_member(m.company_id)));

-- email_metrics: via email_message
drop policy if exists email_metrics_member_all on email_metrics;
create policy email_metrics_member_all on email_metrics for all
  using (exists (select 1 from email_message m where m.id = email_metrics.message_id and public.is_company_member(m.company_id)))
  with check (exists (select 1 from email_message m where m.id = email_metrics.message_id and public.is_company_member(m.company_id)));

-- email_analysis: via email_message
drop policy if exists email_analysis_member_all on email_analysis;
create policy email_analysis_member_all on email_analysis for all
  using (exists (select 1 from email_message m where m.id = email_analysis.message_id and public.is_company_member(m.company_id)))
  with check (exists (select 1 from email_message m where m.id = email_analysis.message_id and public.is_company_member(m.company_id)));

-- generation_batch: company members
drop policy if exists generation_batch_member_all on generation_batch;
create policy generation_batch_member_all on generation_batch for all
  using (company_id is not null and public.is_company_member(company_id))
  with check (company_id is not null and public.is_company_member(company_id));

-- generated_email: via campaign -> company
drop policy if exists generated_email_member_all on generated_email;
create policy generated_email_member_all on generated_email for all
  using (exists (select 1 from campaign c where c.id = generated_email.campaign_id and public.is_company_member(c.company_id)))
  with check (exists (select 1 from campaign c where c.id = generated_email.campaign_id and public.is_company_member(c.company_id)));

-- generated_email_send: via generated_email -> campaign -> company
drop policy if exists generated_email_send_member_all on generated_email_send;
create policy generated_email_send_member_all on generated_email_send for all
  using (exists (
    select 1 from generated_email ge
    join campaign c on c.id = ge.campaign_id
    where ge.id = generated_email_send.generated_email_id
      and public.is_company_member(c.company_id)
  ))
  with check (exists (
    select 1 from generated_email ge
    join campaign c on c.id = ge.campaign_id
    where ge.id = generated_email_send.generated_email_id
      and public.is_company_member(c.company_id)
  ));
