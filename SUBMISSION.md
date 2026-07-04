# SharpEdge Submission

## Track

Trading Tools and Agents.

## One-Line Pitch

SharpEdge is a paper-only odds-shock audit agent that detects large TxODDS line movement without a matching live match event, explains the rule decision, and exports a redacted incident record.

## Project Summary

SharpEdge is built for trading operations and market-monitoring teams that need to answer one question quickly: did the line move because the match changed, or did the line move before the event feed explained it?

The demo focuses on a synthetic replay incident:

1. The match-winner quote moves from `2.05 -> 2.55`.
2. The move is a `2439 bps shock`, `2.03x` the rule threshold.
3. The 75-second TxODDS event window has no matching goal, red card, score correction, or match-status change.
4. `EventMismatchRule` fires.
5. The agent records `flag for review` as a paper-only audit action.

SharpEdge does not place bets, execute trades, suggest wagers, manage funds, or claim expected returns.

## What Judges Should Click

1. Open the live app URL.
2. Confirm the first screen shows `SharpEdge`, the TxLINE evidence strip, `Replay guaranteed`, and `Paper-only / no execution`.
3. Click `Replay incident`.
4. Inspect `EventMismatchRule` in the Rule Inspector.
5. Select `MomentumShockRule` to see why it rejected the same incident.
6. Click `Copy JSON` or `Download JSON` to review the redacted synthetic incident payload.

## Why TxODDS Matters

SharpEdge depends on the relationship between TxODDS odds, scores, and live match data. The product is useful only when those feeds can be compared in time:

- odds quotes provide the line movement,
- score and event feeds explain whether the match state changed,
- streaming feeds make the incident observable as it happens,
- validation/proof endpoints can attach audit context when available.

The core product story is not "predict the winner." It is "audit whether a major line move has a corresponding live match event."

## TxLINE Endpoints

The current public demo uses synthetic replay fixtures shaped around these TxLINE endpoint targets:

| Shared method | TxLINE endpoint target | SharpEdge use |
| --- | --- | --- |
| `getMatches` | `GET /api/fixtures/snapshot` | Choose monitored fixtures. |
| `getMatch` | `GET /api/fixtures/snapshot` filtered by fixture | Hydrate active incident match. |
| `getMatchEvents` | `GET /api/scores/snapshot/{fixtureId}` or score history | Find nearby goals/cards/status changes. |
| `getOdds` | `GET /api/odds/snapshot/{fixtureId}` | Evaluate latest quote movement. |
| `streamMatch` | `GET /api/scores/stream` and `GET /api/odds/stream` | Feed live agent incidents. |
| `getProofReceipt` | `GET /api/odds/validation` and `GET /api/scores/stat-validation` | Attach proof context to incidents when available. |

Live TxLINE networking is not implemented in this submission package. Replay mode is the default judging path.

## Mock / Replay Fallback

Replay mode works without secrets, paid access, login, wallet, or external services. Synthetic fixtures live in:

- `fixtures/replay/matches.json`
- `fixtures/replay/events.jsonl`
- `fixtures/replay/odds.jsonl`
- `fixtures/replay/proofs.json`

The app should remain evaluable even if TxLINE credentials are unavailable. Replay mode is clearly labeled in the UI.

## Deterministic Agent Rules

- `SharpMovementRule`: flags odds movement above a configured basis-point threshold.
- `EventMismatchRule`: flags an odds shift without a matching goal, card, score correction, or match-status event inside the alert window.
- `MomentumShockRule`: flags a goal or red card followed by a large market move.
- `StaleLineRule`: flags quotes older than the configured threshold.

Every rule produces a reason, threshold, rule strength, paper-only action, and false-positive risk note.

## Paper-Only Compliance

SharpEdge is a hackathon demo using TxODDS-style World Cup replay data. It does not offer real-money betting, custody, financial advice, gambling services, trade execution, automated betting, position sizing, wallet flows, or expected-profit claims. Any agent flow is simulation/replay unless explicitly marked otherwise. The project is not affiliated with FIFA or any tournament organizer.

## Known Limits

- Live TxLINE networking is not implemented yet.
- Replay fixtures are synthetic and intentionally small for public-repo safety.
- The redacted export is a local browser action, not a hosted API.
- Demo video URL must be filled in before final submission.
- The deterministic rule engine is explainable audit logic, not an AI prediction model.
