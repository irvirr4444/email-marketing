-- 006: Campaign brief + social proof curation.
--
-- Adds first-class brief fields to `campaign` so a campaign carries the product
-- description, optional product URL, and campaign goal, plus the curated social
-- proof the user approves before email generation is unlocked.

alter table campaign
  add column if not exists product_description text,
  add column if not exists product_url         text,
  add column if not exists goal                text,
  add column if not exists social_proof_assets jsonb not null default '{}',
  add column if not exists social_proof_status text not null default 'not_started';

-- Goal mirrors the shared IntentValue taxonomy.
alter table campaign drop constraint if exists campaign_goal_check;
alter table campaign
  add constraint campaign_goal_check
  check (goal is null or goal in (
    'book_meeting', 'drive_purchase', 'get_reply', 'click_to_page', 'collect_info', 'referral'
  ));

-- Social proof workflow state: not_started -> researched -> approved.
alter table campaign drop constraint if exists campaign_social_proof_status_check;
alter table campaign
  add constraint campaign_social_proof_status_check
  check (social_proof_status in ('not_started', 'researched', 'approved'));
