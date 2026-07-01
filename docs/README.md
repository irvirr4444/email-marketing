# Documentation — Email Plane Architecture

Cold email systems are modeled as six **planes**. Each plane has a dedicated doc.

| Doc | Plane | What it covers |
|-----|-------|----------------|
| [PLANE_GUIDE.md](PLANE_GUIDE.md) | Overview | How the planes connect |
| [PLANE_1_FEATURES.md](PLANE_1_FEATURES.md) | Features | Levers the sender controls (subject, body, CTA, social proof, …) |
| [PLANE_2_CONTEXT.md](PLANE_2_CONTEXT.md) | Context | Observed recipient/situation data at send time |
| [PLANE_3_DELIVERABILITY.md](PLANE_3_DELIVERABILITY.md) | Deliverability | Inbox placement, domain reputation |
| [PLANE_4_METRICS.md](PLANE_4_METRICS.md) | Outcomes | Opens, clicks, replies, conversions |
| [PLANE_5_EXPERIMENTATION.md](PLANE_5_EXPERIMENTATION.md) | Experimentation | A/B tests, bandit policies |
| [PLANE_6_GUARDRAILS.md](PLANE_6_GUARDRAILS.md) | Guardrails | Compliance, frequency caps |

## Related code

- **email-lever-studio** implements Plane 1 (levers) + Plane 2 (context) for generation
- **cold_email_bandit** simulates Planes 1–4 with a learning bandit
- **db/** stores raw emails, context snapshots, feature tags, and metrics
