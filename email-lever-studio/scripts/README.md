# Scripts

CLI tools for Email Lever Studio. Generation requires the API server (`npm run dev`).

## Entrypoints

| Script | npm command | Purpose |
|--------|-------------|---------|
| `generate-email.ts` | `npm run generate` | One email: suggest levers → generate draft |
| `batch-generate.ts` | `npm run batch` | Many emails from scenarios; optional `.docx` export |
| `import-batch.ts` | `npm run import-batch` | Build `import-postgres.sql` for Supabase from a batch folder |

## Shared modules

| File | Role |
|------|------|
| `lib.ts` | API helpers, context builder, social proof CLI |
| `scenarios.ts` | Curated, matrix, and diverse50 scenario definitions |
| `writing-styles.ts` | Author style prompts (Kennedy, Ogilvy, Kern, Chaperon, Halbert, Schwartz, Albuquerque, Makepeace, Brunson, Bencivenga, Carlton, Settle) |
| `export-docx.ts` | Word export with paragraph spacing |

## import-batch.ts

Reads `manifest.json` + `.txt` files from a batch folder and writes `import-postgres.sql` next to them. Paste that file into Supabase SQL Editor after running `db/migrations/003_generated_emails.sql` once.

```bash
npm run import-batch -- output/your-batch-folder
```
