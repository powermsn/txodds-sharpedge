# SharpEdge Technical Notes

## Architecture

SharpEdge is a Vite, React, and TypeScript web app. The first screen is an operational incident console rather than a betting dashboard.

Core modules:

- `src/domain/types.ts`: local copy of the shared TxLINE contract types plus SharpEdge agent types.
- `src/domain/replayFixtures.ts`: synthetic fixture data used by the app.
- `src/domain/replayClient.ts`: replay-first `TxlineClient` implementation.
- `src/domain/signalRules.ts`: deterministic signal rules.
- `src/domain/replayAgent.ts`: builds the signature incident, rule inspections, redacted export payload, transcript, risk notes, and paper action log.
- `src/App.tsx`: Odds Shock Radar, Rule Inspector, replay controls, and redacted export actions.

## Data Flow

1. The app starts in replay mode.
2. `buildAgentIncidentReplay()` selects the synthetic `match-edge-001` fixture and the `quote-edge-shock` odds movement.
3. The rule engine evaluates four deterministic rules against quotes and events.
4. `EventMismatchRule` becomes the primary signal because the odds shock has no matching impact event inside the 75-second alert window.
5. The app displays the Odds Shock Radar, rule inspector, agent state, transcript, paper-only action log, and false-positive panel.

## Replay Fallback

Replay is not a degraded mode. It is the default evaluation path. If live credentials are absent, the app still demonstrates the complete core flow with local synthetic fixtures.

The replay fixture set includes:

- normal match: `match-normal-002`
- late goal scenario: `evt-normal-late-goal`
- odds shock: `quote-edge-shock`
- suspended/corrected scenario: `match-suspended-003` and `evt-edge-resolution`

## Signal Rules

### SharpMovementRule

Input: one `TxlineOddsQuote`.

Fires when `abs(movementBps)` is greater than or equal to the configured threshold.

### EventMismatchRule

Input: one `TxlineOddsQuote` plus recent `TxlineMatchEvent` records.

Fires when a large odds movement has no nearby goal, card, score correction, or match status change.

### MomentumShockRule

Input: one `TxlineOddsQuote` plus recent `TxlineMatchEvent` records.

Fires when a goal or red card is followed by a large movement inside the configured window.

### StaleLineRule

Input: one `TxlineOddsQuote` plus a replay/live clock timestamp.

Fires when quote age exceeds the configured stale threshold.

## Rule Inspection

`getRuleInspection()` returns a focused explanation object for each rule. The contest-grade path uses it to show:

- `EventMismatchRule` fired: 2439 bps movement crossed a 1200 bps threshold and no goal, red card, score correction, or status change appeared inside 75 seconds.
- `MomentumShockRule` rejected: the quote moved sharply, but the checked event window did not include a goal or red card before the odds shock.

## Redacted Export

`buildRedactedIncidentExport()` produces `sharpedge.redactedIncident.v1`. It contains only synthetic replay identifiers, endpoint names, the primary signal, `paperOnly: true`, the paper action, and risk notes.

The export intentionally excludes real funds, wallet details, API secrets, private sponsor data, and execution instruction fields.

## TxLINE Endpoint Mapping

The replay implementation is shaped to match these live endpoints:

- `getMatches()` -> `GET https://txline.txodds.com/api/fixtures/snapshot`
- `getMatch(matchId)` -> `GET https://txline.txodds.com/api/fixtures/snapshot` filtered by fixture ID
- `getMatchEvents({ matchId })` -> `GET https://txline.txodds.com/api/scores/snapshot/{fixtureId}` or score history
- `getOdds({ matchId })` -> `GET https://txline.txodds.com/api/odds/snapshot/{fixtureId}`
- `streamMatch({ matchId })` -> `GET https://txline.txodds.com/api/scores/stream` plus `GET https://txline.txodds.com/api/odds/stream`
- `getProofReceipt(...)` -> `GET https://txline.txodds.com/api/odds/validation` or `GET https://txline.txodds.com/api/scores/stat-validation`

Live mode should fail closed on schema mismatch, retry once for network/rate-limit errors, and fall back to replay for missing token or unavailable live access.

## Public Repo Safety

- No TxLINE tokens, private keys, seed phrases, or paid/private data dumps are committed.
- Fixtures are synthetic and small.
- The UI and README avoid betting advice, auto-betting, position sizing, expected-profit language, and real-money flows.

## Known Limits

- Live TxLINE networking remains a later integration task.
- The replay client uses deterministic fixture order and short UI timers rather than a full replay-clock abstraction.
- Live deployment, public repo, and demo video links are recorded in the root README and submission notes.
