# Scripts

CLI tools for Email Lever Studio. All require the API server (`npm run dev`).

## Entrypoints

| Script | npm command | Purpose |
|--------|-------------|---------|
| `generate-email.ts` | `npm run generate` | One email: suggest levers → override intent → generate draft |
| `batch-generate.ts` | `npm run batch` | Many emails from predefined scenarios; optional `.docx` export |

## Shared modules

| File | Role |
|------|------|
| `lib.ts` | API helpers (`postJson`, `checkServer`), context builder, social proof research CLI parsing |
| `scenarios.ts` | Curated (12), matrix (80), and diverse50 (50) scenario definitions |
| `writing-styles.ts` | Kennedy, Ogilvy, Kern, Chaperon prompt blocks |
| `export-docx.ts` | Word export with paragraph spacing preserved |

## generate-email.ts

Minimal 4-input flow plus optional research and author style.

```bash
npm run generate -- --company "..." --product "..." --campaign "..." --intent get_reply
```

Calls `suggest-levers` then `generate-draft`. Writes `output/draft-{timestamp}.txt` unless `--no-file`.

## batch-generate.ts

Sets levers explicitly per scenario (does **not** call `suggest-levers`). Faster for comparing lever combinations.

Flags: `--matrix`, `--diverse50`, `--docx`, `--research`, `--reexport-docx`, `--limit`, `--delay`, `--list`.

## scenarios.ts

- **CURATED_SCENARIOS** — 12 hand-picked cold-outreach pairings
- **buildMatrixScenarios()** — 4×4×5 grid
- **buildDiverse50Scenarios()** — 50 combos rotating intent, framework, emotion, persuasion, style, subject type, body length, social proof, CTA, preheader, offer

## export-docx.ts

Used by `batch-generate --docx`. Splits email bodies on `\n\n` so Word shows proper paragraph spacing. Each email section includes a lever table.
