-- Synthetic outcome generator (industry-anchored placeholder data).
--
-- WHY THIS EXISTS
-- The 50 rows in public.generated_email are lever/recipe designs only. They carry no
-- feedback (email_message / email_context / email_metrics were empty), so there is
-- nothing for a contextual bandit to learn from yet. This script fabricates realistic
-- send + outcome logs so the ENTIRE training pipeline (db.py -> run.py --mode real) can be
-- exercised and validated today. When real Klaviyo / Shopify outcomes land you stop
-- running this script; the training path that reads these tables does not change.
--
-- WHAT IT WRITES (all joined off the existing generated_email designs)
--   contact               synthetic recipient pool
--   email_message         one row per simulated send  (source = 'synthetic_v1')
--   generated_email_send  links generated_email design -> message
--   email_context         the context snapshot at send (segment / industry / seniority)
--   email_metrics         the outcome (delivered / opened / clicked / replied / ordered / ...)
--
-- OUTCOME MODEL
--   Base rates are typical email-marketing benchmarks (see the CTEs below). On top of the
--   base rates a per-design quality multiplier `q` tilts engagement using a KNOWN planted
--   truth (aida/pas frameworks help, hard_numbers + specific social proof help, buy/read
--   CTAs help, and the scarcity persuasion lever is a deliberate TRAP that hurts). That
--   planted tilt is what lets the recovery check prove the pipeline actually learns. It is
--   a placeholder for real behaviour and is confined to THIS file.
--
-- Re-running: everything synthetic is tagged email_message.source = 'synthetic_v1'.
-- To reset, run the cleanup block at the bottom first.

-- ============================================================================
-- 0. (optional) reset previously generated synthetic data
-- ============================================================================
-- delete from email_metrics       where message_id in (select id from email_message where source = 'synthetic_v1');
-- delete from email_context       where message_id in (select id from email_message where source = 'synthetic_v1');
-- delete from generated_email_send where message_id in (select id from email_message where source = 'synthetic_v1');
-- delete from email_message        where source = 'synthetic_v1';
-- delete from contact              where email like 'synthetic+%@example.com';

-- ============================================================================
-- 1. synthetic recipient pool
-- ============================================================================
insert into contact (email, brand, name, customer_segment)
select 'synthetic+' || gs || '@example.com', 'sigil', 'Synthetic ' || gs, 'unknown'
from generate_series(1, 200) gs;

-- ============================================================================
-- 2. one simulated send per (design x SENDS_PER_DESIGN). 100 -> 5,000 sends.
--    The design id + context snapshot are stashed in raw so later steps read them.
-- ============================================================================
insert into email_message (contact_id, source, message_id, from_name, from_email, subject, preheader, body_text, sent_at, raw)
select
    (select id from contact where email like 'synthetic+%' offset floor(random() * 200)::int limit 1),
    'synthetic_v1',
    gen_random_uuid()::text,
    'Sigil',
    'hello@sigil.example',
    g.subject,
    g.preheader,
    g.body,
    now() - (random() * interval '90 days'),
    jsonb_build_object(
        'generated_email_id', g.id::text,
        'segment', (array['cold_prospect','warm_lead','trial_active','trial_expiring','first_time_buyer','repeat','vip','churned','win_back','referral_source','partner_affiliate','investor_advisor'])[1 + floor(random() * 12)::int],
        'industry', (array['ecommerce','saas','healthcare','finance','education','agency','other'])[1 + floor(random() * 7)::int],
        'seniority', (array['ic','manager','director','exec'])[1 + floor(random() * 4)::int]
    )
from generated_email g
cross join generate_series(1, 100) s;

-- ============================================================================
-- 3. design -> message link
-- ============================================================================
insert into generated_email_send (generated_email_id, message_id)
select (m.raw->>'generated_email_id')::uuid, m.id
from email_message m
where m.source = 'synthetic_v1';

-- ============================================================================
-- 4. context snapshot at send
-- ============================================================================
insert into email_context (message_id, segment_at_send, industry, seniority, sent_at, day_of_week, hour_local, hour_utc, engagement_snapshot_known, profile_snapshot_known)
select
    m.id,
    m.raw->>'segment',
    m.raw->>'industry',
    m.raw->>'seniority',
    m.sent_at,
    trim(to_char(m.sent_at, 'Day')),
    extract(hour from m.sent_at)::int,
    extract(hour from m.sent_at)::int,
    false,
    false
from email_message m
where m.source = 'synthetic_v1';

-- ============================================================================
-- 5. outcomes. Base benchmark rates x planted quality multiplier q.
--
--    Each event uses an INDEPENDENT per-row uniform derived from md5(message_id || salt).
--    This is deliberate: a plain random() inside a LATERAL subquery gets hoisted by the
--    planner and evaluated once per group, which collapses every send of a design to the
--    SAME outcome. Hashing the row id cannot be hoisted, varies per send, and is also
--    reproducible. u in [0,1]; different salts give independent draws per event.
-- ============================================================================
insert into email_metrics (
    message_id, delivered, opened, opened_at, clicked, clicked_at, replied, replied_at,
    goal_completed, converted_at, revenue, unsubscribed, spam_complaint, metrics_known, created_at, updated_at
)
select
    b.id,
    b.delivered,
    b.opened,  case when b.opened  then b.sent_at + (b.uo * interval '2 days') end,
    b.clicked, case when b.clicked then b.sent_at + (b.uc * interval '3 days') end,
    b.replied, case when b.replied then b.sent_at + (b.ur * interval '2 days') end,
    b.ordered, case when b.ordered then b.sent_at + (b.uv * interval '5 days') end,
    case when b.ordered then round((30 + b.uv * 150)::numeric, 2) else 0 end,
    b.unsub,
    b.spam,
    true,
    now(),
    now()
from (
    select
        m.id,
        m.sent_at,
        qq.q, uni.uo, uni.uc, uni.ur, uni.uv,
        (uni.ud < 0.97)                                                                                   as delivered,
        (uni.ud < 0.97 and uni.uo < least(0.95, 0.30 * qq.q))                                             as opened,
        (uni.ud < 0.97 and uni.uo < least(0.95, 0.30 * qq.q) and uni.uc < least(0.90, 0.10 * qq.q))       as clicked,
        (uni.ud < 0.97 and uni.ur < least(0.90, 0.05 * qq.q))                                             as replied,
        (uni.ud < 0.97 and uni.uo < least(0.95, 0.30 * qq.q) and uni.uc < least(0.90, 0.10 * qq.q)
                       and uni.uv < least(0.90, 0.08 * qq.q))                                             as ordered,
        (uni.ud < 0.97 and uni.uu2 < 0.0020)                                                              as unsub,
        (uni.ud < 0.97 and uni.us  < 0.0005)                                                              as spam
    from email_message m
    join generated_email g on g.id::text = m.raw->>'generated_email_id'
    cross join lateral (
        select (
              case when g.framework in ('AIDA','PAS') then 1.25 when g.framework is null then 0.90 else 1.0 end
            * case when g.specificity = 'hard_numbers' then 1.20 else 0.95 end
            * case when g.social_proof_specificity = 'specific' then 1.15 else 1.0 end
            * case when g.social_proof_type in ('result','quote','consensus') then 1.15 else 1.0 end
            * case when g.cta_type in ('buy','read') then 1.10 else 1.0 end
            * case when g.persuasion = 'scarcity' then 0.70 else 1.0 end   -- TRAP
        ) as q
    ) qq
    cross join lateral (
        select
            (('x' || substr(md5(m.id::text || 'deliver'), 1, 7))::bit(28)::int)::float8 / 268435455.0 as ud,
            (('x' || substr(md5(m.id::text || 'open'),    1, 7))::bit(28)::int)::float8 / 268435455.0 as uo,
            (('x' || substr(md5(m.id::text || 'click'),   1, 7))::bit(28)::int)::float8 / 268435455.0 as uc,
            (('x' || substr(md5(m.id::text || 'reply'),   1, 7))::bit(28)::int)::float8 / 268435455.0 as ur,
            (('x' || substr(md5(m.id::text || 'order'),   1, 7))::bit(28)::int)::float8 / 268435455.0 as uv,
            (('x' || substr(md5(m.id::text || 'unsub'),   1, 7))::bit(28)::int)::float8 / 268435455.0 as uu2,
            (('x' || substr(md5(m.id::text || 'spam'),    1, 7))::bit(28)::int)::float8 / 268435455.0 as us
    ) uni
    where m.source = 'synthetic_v1'
) b;
