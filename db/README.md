# Database

PostgreSQL schema for storing marketing emails and analysis.

## Apply schema

```bash
# Migrations (recommended)
psql "$DATABASE_URL" -f db/migrations/001_initial_schema.sql
psql "$DATABASE_URL" -f db/migrations/002_add_context.sql

# Or full snapshot
psql "$DATABASE_URL" -f db/schema.sql
```

## Tables

| Table | Purpose |
|-------|---------|
| `contact` | Recipient + segment, lifecycle anchors |
| `contact_profile` | Industry, firmographics, geo |
| `email_message` | Raw email as received (immutable) |
| `email_context` | Plane 2 snapshot at send |
| `email_analysis` | Plane 1 feature tags (AI or rules) |
| `email_metrics` | Plane 4 outcomes (opens, clicks, conversion) |

See [docs/PLANE_GUIDE.md](../docs/PLANE_GUIDE.md) for how these map to the plane model.
