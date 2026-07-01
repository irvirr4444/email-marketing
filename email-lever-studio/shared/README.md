# Shared

TypeScript types and definitions used by both `server/` and `scripts/`.

## Files

| File | Role |
|------|------|
| `schema.ts` | `ColdContext`, `LeverSuggestion`, `SocialProofAssets`, research config types, defaults, JSON schemas for Claude tool-use |
| `lever-definitions.ts` | Writing instructions per lever value + `buildLeverInstructions()` for generate-draft prompts |

## Key types

- **ColdContext** — recipient info, campaign notes, optional `socialProofAssets`
- **LeverSuggestion** — full lever card set (intent, subject, body, copy strategy, social proof, CTA, offer)
- **SocialProofResearchConfig** — `{ layers, tone, depth }` for `/api/research-social-proof`

## Lever definitions

`LEVER_DEFINITIONS` maps each lever value (e.g. `PAS`, `curiosity`, `result`) to a precise writing instruction. `buildLeverInstructions(levers, context)` injects only the instructions for the **selected** values into the generate-draft prompt.

Human-readable source spec: repo root [`levers_scenarios.MD`](../../levers_scenarios.MD).
