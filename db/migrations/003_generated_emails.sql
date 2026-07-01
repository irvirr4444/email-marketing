-- Generated email templates (Supabase / Postgres)
-- Run once in Supabase SQL Editor before importing batch data.

create extension if not exists pgcrypto;

create table if not exists generation_batch (
  id uuid primary key default gen_random_uuid(),
  batch_id text not null unique,
  company text not null,
  product text not null,
  campaign text,
  social_proof_assets jsonb not null default '{}',
  total_generated integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists generated_email (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references generation_batch(id) on delete cascade,
  scenario_id text not null,
  scenario_label text,
  index_in_batch integer not null,
  subject text not null,
  preheader text,
  body text not null,
  intent text not null,
  subject_type text,
  subject_length text,
  subject_casing text,
  preheader_present boolean not null default false,
  preheader_length text,
  preheader_relationship text,
  body_length text,
  body_links text,
  body_scannable boolean,
  framework text,
  emotion text,
  persuasion text,
  specificity text,
  personalization_depth text,
  writing_style text,
  social_proof_type text,
  social_proof_placement text,
  social_proof_specificity text,
  cta_type text,
  cta_style text,
  cta_placement text,
  cta_copy text,
  has_offer boolean not null default false,
  offer_type text,
  offer_magnitude text,
  extras jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (batch_id, scenario_id)
);

create index if not exists generated_email_batch_idx on generated_email (batch_id);
create index if not exists generated_email_intent_idx on generated_email (intent);
