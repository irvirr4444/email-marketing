# Database

PostgreSQL / Supabase schema for marketing emails.

## Generated email templates

For AI-generated cold email batches (not sent-mail tracking):

| Table | Purpose |
|-------|---------|
| `generation_batch` | Company, product, campaign, social proof assets |
| `generated_email` | Subject, body, and full lever columns per variation |

**Setup (once):** run [`migrations/003_generated_emails.sql`](migrations/003_generated_emails.sql) in Supabase SQL Editor.

**Import a batch:** from `email-lever-studio`, run `npm run import-batch -- output/<batch-folder>`, then run the generated `import-postgres.sql` in Supabase SQL Editor.

## Sent / received emails (optional, later)

| Table | Purpose |
|-------|---------|
| `contact`, `email_message`, `email_context`, `email_analysis`, `email_metrics` | Plane model for real sends and outcomes |

Apply [`migrations/001_initial_schema.sql`](migrations/001_initial_schema.sql) and [`002_add_context.sql`](migrations/002_add_context.sql) when you need that layer.

Full snapshot: [`schema.sql`](schema.sql).
