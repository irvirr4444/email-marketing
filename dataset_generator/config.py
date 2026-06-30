"""Constants, enums, combo rules, and prompt templates for synthetic email generation."""

from __future__ import annotations

OPENAI_MODEL = "gpt-4.1"
DEFAULT_CONCURRENCY = 8
MAX_RETRIES = 2
PREVIEW_COUNT = 12
MIN_EXAMPLES_PER_COMBO = 3
MAX_PROMPT_REVISIONS = 2

SEGMENTS = [
    "cold_prospect",
    "warm_lead",
    "trial_active",
    "trial_expiring",
    "first_time_buyer",
    "repeat",
    "vip",
    "churned",
    "win_back",
    "referral_source",
    "partner_affiliate",
    "investor_advisor",
]

SEGMENT_WEIGHTS = {
    "cold_prospect": 0.22,
    "warm_lead": 0.18,
    "repeat": 0.15,
    "trial_active": 0.08,
    "trial_expiring": 0.06,
    "first_time_buyer": 0.06,
    "vip": 0.05,
    "churned": 0.05,
    "win_back": 0.04,
    "referral_source": 0.04,
    "partner_affiliate": 0.04,
    "investor_advisor": 0.03,
}

CAMPAIGN_TYPES = [
    "cold_outreach",
    "newsletter",
    "lifecycle",
    "promotional",
    "transactional",
    "nurture_drip",
    "website_triggered",
    "list_building",
]

INTENTS = [
    "book_meeting",
    "drive_purchase",
    "get_reply",
    "click_to_page",
    "activate",
    "upsell",
    "renew",
    "re_engage",
    "collect_info",
    "referral",
    "pure_value",
]

SUBJECT_TYPES = ["question", "statement", "curiosity_gap", "list", "announcement"]
FRAMEWORKS = ["aida", "pas", "bab", "fab", "none"]
PERSUASION_TAGS = [
    "reciprocity",
    "social_proof",
    "authority",
    "scarcity",
    "liking",
    "commitment",
]
EMOTION_TAGS = [
    "fear",
    "aspiration",
    "curiosity",
    "humor",
    "fomo",
    "status",
    "pain_relief",
]
SOCIAL_PROOF_TYPES = [
    "testimonial",
    "case_study",
    "hard_stat",
    "logos",
    "user_count",
    "none",
]
CTA_TYPES = ["reply", "book", "buy", "read", "download"]
OFFER_TYPES = [
    "percent_off",
    "dollar_off",
    "free_ship",
    "bogo",
    "trial",
    "bonus",
    "bundle",
]
BODY_LENGTHS = ["short", "medium", "long"]

INDUSTRIES = [
    "saas",
    "ecommerce",
    "agency",
    "healthcare",
    "finance",
    "real_estate",
    "education",
    "manufacturing",
    "hospitality",
    "nonprofit",
    "other",
]

COMPANY_SIZES = ["1_10", "11_50", "51_200", "201_1000", "1000_plus"]
SENIORITIES = ["entry", "mid", "senior", "director", "vp", "c_level"]
DEPARTMENTS = [
    "engineering",
    "marketing",
    "sales",
    "finance",
    "operations",
    "hr",
    "product",
    "other",
]

ROLES_BY_DEPT = {
    "engineering": ["Software Engineer", "DevOps Lead", "CTO", "Engineering Manager"],
    "marketing": ["Marketing Manager", "Content Strategist", "CMO", "Growth Lead"],
    "sales": ["Account Executive", "SDR", "Sales Director", "VP Sales"],
    "finance": ["CFO", "Financial Analyst", "Controller", "FP&A Manager"],
    "operations": ["COO", "Operations Manager", "Supply Chain Lead"],
    "hr": ["HR Director", "People Ops Manager", "Talent Lead"],
    "product": ["Product Manager", "Product Designer", "Head of Product"],
    "other": ["Founder", "Consultant", "General Manager", "Director"],
}

LEAD_SOURCES = [
    "organic_search",
    "paid_search",
    "social",
    "referral",
    "partner",
    "event",
    "webinar",
    "cold_import",
    "content_download",
    "product_signup",
]

LAST_ENGAGEMENT_TYPES = ["open", "click", "reply", "purchase", "bounce", "none"]

COUNTRIES_TZ = [
    ("US", "America/New_York", "en"),
    ("US", "America/Los_Angeles", "en"),
    ("US", "America/Chicago", "en"),
    ("GB", "Europe/London", "en"),
    ("DE", "Europe/Berlin", "de"),
    ("FR", "Europe/Paris", "fr"),
    ("CA", "America/Toronto", "en"),
    ("AU", "Australia/Sydney", "en"),
    ("IN", "Asia/Kolkata", "en"),
    ("BR", "America/Sao_Paulo", "pt"),
    ("NL", "Europe/Amsterdam", "nl"),
    ("SG", "Asia/Singapore", "en"),
]

COUNTRIES_TZ_ENGLISH = [entry for entry in COUNTRIES_TZ if entry[2] == "en"]

DAYS_OF_WEEK = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
]

# Base open-rate ceilings per segment (craft moves toward/away from ceiling)
SEGMENT_OPEN_CEILING = {
    "cold_prospect": 0.35,
    "warm_lead": 0.48,
    "trial_active": 0.52,
    "trial_expiring": 0.45,
    "first_time_buyer": 0.50,
    "repeat": 0.55,
    "vip": 0.65,
    "churned": 0.28,
    "win_back": 0.32,
    "referral_source": 0.42,
    "partner_affiliate": 0.40,
    "investor_advisor": 0.38,
}

OUTCOME_TIERS = ["success", "failure", "mixed"]

# (segment, campaign_type, intent) — realistic combinations only
VALID_TRIPLES: list[tuple[str, str, str]] = [
    # cold_prospect
    ("cold_prospect", "cold_outreach", "book_meeting"),
    ("cold_prospect", "cold_outreach", "get_reply"),
    ("cold_prospect", "cold_outreach", "click_to_page"),
    ("cold_prospect", "cold_outreach", "collect_info"),
    ("cold_prospect", "cold_outreach", "pure_value"),
    ("cold_prospect", "nurture_drip", "book_meeting"),
    ("cold_prospect", "nurture_drip", "get_reply"),
    ("cold_prospect", "list_building", "collect_info"),
    ("cold_prospect", "list_building", "pure_value"),
    # warm_lead
    ("warm_lead", "cold_outreach", "book_meeting"),
    ("warm_lead", "nurture_drip", "drive_purchase"),
    ("warm_lead", "nurture_drip", "get_reply"),
    ("warm_lead", "nurture_drip", "click_to_page"),
    ("warm_lead", "lifecycle", "activate"),
    ("warm_lead", "lifecycle", "book_meeting"),
    ("warm_lead", "promotional", "drive_purchase"),
    # trial_active
    ("trial_active", "lifecycle", "activate"),
    ("trial_active", "lifecycle", "click_to_page"),
    ("trial_active", "nurture_drip", "activate"),
    ("trial_active", "transactional", "activate"),
    ("trial_active", "promotional", "drive_purchase"),
    # trial_expiring
    ("trial_expiring", "lifecycle", "drive_purchase"),
    ("trial_expiring", "promotional", "drive_purchase"),
    ("trial_expiring", "promotional", "renew"),
    ("trial_expiring", "nurture_drip", "activate"),
    # first_time_buyer
    ("first_time_buyer", "transactional", "drive_purchase"),
    ("first_time_buyer", "lifecycle", "upsell"),
    ("first_time_buyer", "promotional", "referral"),
    ("first_time_buyer", "lifecycle", "pure_value"),
    # repeat
    ("repeat", "promotional", "upsell"),
    ("repeat", "promotional", "drive_purchase"),
    ("repeat", "newsletter", "pure_value"),
    ("repeat", "newsletter", "click_to_page"),
    ("repeat", "lifecycle", "renew"),
    ("repeat", "lifecycle", "referral"),
    # vip
    ("vip", "promotional", "upsell"),
    ("vip", "lifecycle", "renew"),
    ("vip", "newsletter", "pure_value"),
    ("vip", "lifecycle", "referral"),
    ("vip", "lifecycle", "book_meeting"),
    # churned
    ("churned", "nurture_drip", "re_engage"),
    ("churned", "promotional", "re_engage"),
    ("churned", "lifecycle", "drive_purchase"),
    ("churned", "cold_outreach", "get_reply"),
    # win_back
    ("win_back", "promotional", "re_engage"),
    ("win_back", "promotional", "drive_purchase"),
    ("win_back", "nurture_drip", "renew"),
    ("win_back", "lifecycle", "re_engage"),
    # referral_source
    ("referral_source", "lifecycle", "referral"),
    ("referral_source", "nurture_drip", "pure_value"),
    ("referral_source", "lifecycle", "collect_info"),
    # partner_affiliate
    ("partner_affiliate", "lifecycle", "referral"),
    ("partner_affiliate", "newsletter", "pure_value"),
    ("partner_affiliate", "lifecycle", "collect_info"),
    ("partner_affiliate", "cold_outreach", "book_meeting"),
    # investor_advisor
    ("investor_advisor", "cold_outreach", "book_meeting"),
    ("investor_advisor", "lifecycle", "pure_value"),
    ("investor_advisor", "newsletter", "collect_info"),
    ("investor_advisor", "nurture_drip", "get_reply"),
    # website_triggered (cross-segment)
    ("warm_lead", "website_triggered", "drive_purchase"),
    ("trial_active", "website_triggered", "activate"),
    ("repeat", "website_triggered", "upsell"),
    ("first_time_buyer", "website_triggered", "drive_purchase"),
    # transactional cross-segment
    ("repeat", "transactional", "renew"),
    ("vip", "transactional", "pure_value"),
    ("trial_expiring", "transactional", "drive_purchase"),
]

COMPANY_PREFIXES = [
    "Northwind",
    "Brightline",
    "Clearpath",
    "Summit",
    "Harbor",
    "Vertex",
    "Pioneer",
    "Crestview",
    "Ironwood",
    "Bluepeak",
    "Silvergate",
    "Greenfield",
    "Redstone",
    "Oakridge",
    "Stonebridge",
]

COMPANY_SUFFIXES = [
    "Analytics",
    "Systems",
    "Labs",
    "Solutions",
    "Group",
    "Dynamics",
    "Works",
    "Digital",
    "Partners",
    "Co",
    "Technologies",
    "Studio",
    "Collective",
]

FIRST_NAMES = [
    "Alex",
    "Jordan",
    "Taylor",
    "Morgan",
    "Casey",
    "Riley",
    "Quinn",
    "Avery",
    "Blake",
    "Drew",
    "Sam",
    "Jamie",
    "Robin",
    "Cameron",
    "Logan",
    "Parker",
    "Reese",
    "Hayden",
    "Sage",
    "Elliot",
]

LAST_NAMES = [
    "Chen",
    "Patel",
    "Nguyen",
    "Brooks",
    "Foster",
    "Hayes",
    "Kim",
    "Rivera",
    "Walsh",
    "Santos",
    "Reed",
    "Morgan",
    "Diaz",
    "Shaw",
    "Price",
    "Cole",
    "Grant",
    "Lane",
    "Porter",
    "Vega",
]

PRODUCT_NAMES = [
    "FlowDesk",
    "MetricPulse",
    "SyncBridge",
    "TaskForge",
    "DataNest",
    "CloudLedger",
    "TeamGrid",
    "InsightHub",
    "AutoPilot CRM",
    "PipelineIQ",
]

BODY_WORD_LIMITS = {
    "short": (40, 74),
    "medium": (75, 199),
    "long": (200, 400),
}

DIVERSITY_OPENING_SIMILARITY_THRESHOLD = 0.55
DIVERSITY_MEDIAN_SIMILARITY_THRESHOLD = 0.45
DIVERSITY_DOMINANT_OPENING_FRACTION = 0.50

VARIATION_DIRECTIVES = [
    "",
    (
        "CRITICAL: Vary sentence structure aggressively. No two emails should share the same "
        "opening pattern. Mix question hooks, stats, direct asks, and story openers. "
        "Avoid starting with 'Hi {{first_name}}' or 'Hope this finds you well'."
    ),
    (
        "MAXIMUM VARIATION REQUIRED: Each email must use a distinctly different voice and structure. "
        "Rotate between: one-liner cold open, bullet-led body, narrative paragraph, "
        "PS-line closer, stat-first hook, challenge question. "
        "Never reuse the same greeting formula twice in a batch."
    ),
]

SYSTEM_PROMPT = """You are an expert B2B and B2C email marketing copywriter generating one realistic synthetic email.

Return ONLY valid JSON with exactly these keys:
- subject (string)
- preheader (string)
- body (string, plain text with line breaks between paragraphs)
- decision_rationale (string, 1-3 sentences)

Rules:
- Use fictional company and product names only. No real brands or real people.
- decision_rationale explains WHY this email approach was chosen given context — never describe opens, clicks, or outcomes.
- When has_personalization is true, include {{first_name}} or {{company_name}} in the subject (use double curly braces exactly: {{first_name}}, not {first_name}).
- Mark each CTA in the body as [CTA_n: button or link text] where n starts at 1. The count must match cta_count exactly.
- Match body_length with strict word counts in the body only: short = 40-74 words, medium = 75-199 words, long = 200-350 words. Count carefully.
- If has_emoji is true, include at least one emoji in subject or preheader.
- If has_urgency is true, include explicit urgency words (deadline, limited time, expires, ends, last chance, running out, soon, hurry, final, only X days/hours).
- Reflect framework, persuasion tags, emotion tags, social_proof, cta_type, and offer details from analysis.
- Write copy that sounds human and distinct — not a template with swapped names.{language_rule}"""

USER_PROMPT_TEMPLATE = """Generate email copy for this frozen context and analysis. Do not change any fields — only write copy.

variation_seed: {variation_seed}
{variation_directive}

CONTEXT:
{context_json}

ANALYSIS:
{analysis_json}

Respond with JSON: subject, preheader, body, decision_rationale."""
