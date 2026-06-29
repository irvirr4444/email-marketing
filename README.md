# Email Marketing

Store raw marketing emails and AI-derived analysis for competitive research.

## Database

PostgreSQL. Schema lives in `db/schema.sql`; migrations run in order from `db/migrations/`.

Apply the initial migration:

```bash
psql "$DATABASE_URL" -f db/migrations/001_initial_schema.sql
```

Or bootstrap from the full schema snapshot:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

### Tables

| Table | Purpose |
|-------|---------|
| `contact` | Recipient the email was sent to |
| `email_message` | Raw email as received (immutable after insert) |
| `email_analysis` | AI-derived attributes for one message |
