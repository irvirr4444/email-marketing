# Email Marketing

Store raw marketing emails and AI-derived analysis for competitive research.

## Database

PostgreSQL. Schema lives in `db/schema.sql`; migrations run in order from `db/migrations/`.

Apply all migrations:

```bash
psql "$DATABASE_URL" -f db/migrations/001_initial_schema.sql
psql "$DATABASE_URL" -f db/migrations/002_add_context.sql
```

Or bootstrap from the full schema snapshot:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

### Tables

| Table | Purpose |
|-------|---------|
| `contact` | Recipient + segment, lifecycle anchors |
| `contact_profile` | Industry, firmographics, geo (optional) |
| `email_message` | Raw email as received (immutable after insert) |
| `email_context` | Plane 2 snapshot at send (segment, engagement, timing) |
| `email_analysis` | Plane 1 feature tags (AI, rules, or import — past + present) |
| `email_metrics` | Plane 4 outcomes (opens, clicks, conversion, negatives) |

See [docs/PLANE_GUIDE.md](docs/PLANE_GUIDE.md) for architecture and per-plane docs.
