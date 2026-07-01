# Server

Express API on `http://127.0.0.1:3001`. All routes use Claude via `anthropic.ts` (structured JSON tool-use).

## Endpoints

| Method | Path | Body | Returns |
|--------|------|------|---------|
| GET | `/api/health` | — | `{ ok: true }` |
| POST | `/api/research-social-proof` | `{ productDescription, config }` | `SocialProofAssets` |
| POST | `/api/suggest-levers` | `{ context, levers? }` | `LeverSuggestion` |
| POST | `/api/generate-draft` | `{ context, levers, style? }` | `{ subject, preheader?, body }` |

## Files

| File | Role |
|------|------|
| `index.ts` | Express app, route registration |
| `anthropic.ts` | Claude API client (`completeStructuredJson`) |
| `prompts.ts` | System prompts for research, suggest, generate |
| `levers.ts` | `formatContextForPrompt`, `validateColdContext` |
| `routes/research-social-proof.ts` | Social proof research |
| `routes/suggest-levers.ts` | Lever recommendations |
| `routes/generate-draft.ts` | Email draft writing |

## Environment

Loaded from repo root `.env` or `email-lever-studio/.env`:

- `CLAUDE_API_KEY` (required)
- `CLAUDE_MODEL` (optional, default `claude-sonnet-5`)

## Generate-draft prompt structure

1. System: `GENERATE_DRAFT_SYSTEM_PROMPT` + optional `style` string from CLI
2. User: context block + **Lever Instructions** from `shared/lever-definitions.ts` (only selected values injected)
