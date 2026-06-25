# SharpEdge

SharpEdge is a Trading Tools and Agents submission for the TxODDS World Cup Hackathon.

One-line pitch: SharpEdge is an odds-shock audit agent that detects large line movement without a matching live event and records a paper-only review action.

## Status

- Track: Trading Tools and Agents
- Live app URL: pending deployment
- Demo video URL: pending recording
- Public repo URL: pending publication
- Default mode: replay demo mode
- Secrets required for judging: none

## Final Submission Replacement Checklist

Before submitting on Superteam, replace these placeholders:

- Live app URL: `pending deployment`
- Demo video URL: `pending recording`
- Public repo URL: `pending publication`

Do not replace them with private, login-gated, wallet-gated, or paid-access links.

## Why It Is Distinct

SharpEdge is an autonomous monitoring workbench. It is not a settlement engine and it is not a fan social product. The core flow detects suspicious data/market incidents, explains deterministic rule decisions, and records paper-only operational actions.

## Quick Start

```bash
npm install
npm run dev
```

Open the local Vite URL, usually `http://127.0.0.1:5173/`.

Submission packaging docs:

- `SUBMISSION.md`: project description for Superteam.
- `VIDEO_SCRIPT.md`: 3-5 minute demo recording script.
- `DEPLOYMENT.md`: Vercel, Netlify, and GitHub Pages deployment notes.

## Replay Mode

Replay mode is the primary judge path and works without a TxLINE token. The app uses synthetic local fixtures from:

- `fixtures/replay/matches.json`
- `fixtures/replay/events.jsonl`
- `fixtures/replay/odds.jsonl`
- `fixtures/replay/proofs.json`

The first screen leads with `SharpEdge odds-shock audit agent`, an Odds Shock Radar, and the primary CTA `Replay agent incident`. The radar makes the core incident visible in under 10 seconds:

1. `Odds 2.05 -> 2.55`
2. `2439 bps shock`
3. `2.03x threshold`
4. `No goal/card event in 75s`
5. `Paper flag only`

The replay then shows `EventMismatchRule` firing, a `flag for review` paper action, and a later synthetic score correction that resolves the incident as a latency audit.

## Signal Rules

- `SharpMovementRule`: flags odds movement above a configured basis-point threshold.
- `EventMismatchRule`: flags an odds shift without a matching goal, card, score correction, or status event inside the alert window.
- `MomentumShockRule`: flags a goal or red card followed by a large implied market move.
- `StaleLineRule`: flags quotes older than the configured replay/live threshold.

Every rule produces a reason, threshold, rule strength, action, and false-positive risk note.

## Rule Inspector

The Rule Inspector lets judges select a rule and inspect:

- input quote
- event window
- threshold
- checked and matched event state
- why the rule fired or rejected

The demo explicitly explains `EventMismatchRule` fired and `MomentumShockRule` rejected.

## Redacted Incident Export

The app can copy or download a synthetic redacted incident JSON payload. The payload includes:

- endpoint list
- primary signal
- `paperOnly: true`
- paper action
- risk note

It excludes real funds, wallet details, API secrets, private sponsor data, and any execution instruction fields.

## Paper-Only Actions

SharpEdge never executes trades or wagers. Actions are limited to:

- `flag for review`
- `monitor scenario`
- `pause scenario`

There is no exchange integration, wallet requirement, custody, position sizing, or expected-profit claim.

## TxLINE Endpoints

The live client is planned against the shared `TxlineClient` interface. The replay app currently documents and models these TxLINE World Cup endpoints:

| Shared method | Live endpoint target | SharpEdge use |
| --- | --- | --- |
| `getMatches` | `GET /api/fixtures/snapshot` | Choose monitored fixtures. |
| `getMatch` | `GET /api/fixtures/snapshot` filtered by fixture | Hydrate active incident match. |
| `getMatchEvents` | `GET /api/scores/snapshot/{fixtureId}` or score history | Find nearby goals/cards/status changes. |
| `getOdds` | `GET /api/odds/snapshot/{fixtureId}` | Evaluate latest quote movement. |
| `streamMatch` | `GET /api/scores/stream` and `GET /api/odds/stream` | Feed live agent incidents. |
| `getProofReceipt` | `GET /api/odds/validation` and `GET /api/scores/stat-validation` | Attach proof context to incidents when available. |

If `TXLINE_API_TOKEN` is missing or live access is unavailable, SharpEdge stays in replay demo mode.

## Compliance

This is a hackathon demo using TxLINE World Cup data. It does not offer real-money betting, custody, financial advice, or gambling services. Any prediction, market, or agent flow is simulation/devnet/replay unless explicitly marked otherwise. The project is not affiliated with FIFA or any tournament organizer.

## Verification

```bash
npm test
npm run build
npm audit --audit-level=moderate
```

## Known Limitations

- Live TxLINE networking is not implemented in this initial scope.
- Replay fixtures are synthetic and intentionally small for public-repo safety.
- The rule engine is deterministic and explainable; it is not an AI prediction model.
- Demo URLs are placeholders until deployment and video recording are complete.
