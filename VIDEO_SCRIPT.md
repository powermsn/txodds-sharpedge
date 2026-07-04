# SharpEdge Demo Video Script

Target length: 3-5 minutes.

## 0:00-0:25 - Product Setup

Show the first screen.

Say:

"SharpEdge is a paper-only odds-shock audit agent for the Trading Tools and Agents track. It uses odds movement and match-event timing to explain whether a major line move has a corresponding live match event. It does not execute trades or provide betting advice."

Point to:

- `SharpEdge`
- `Paper-only / no execution`
- `Replay guaranteed`
- the top evidence strip

## 0:25-1:15 - Hero Shock Board

Zoom into the hero shock board.

Say:

"The incident is designed to be understandable in under 10 seconds. The odds move from 2.05 to 2.55. That is a 2439 bps shock, 2.03 times the EventMismatchRule threshold. Inside the 75-second event window there is no matching goal, red card, score correction, or match-status event."

Point to:

- `Odds shock with no matching event in 75s`
- `Odds 2.05 -> 2.55`
- `2439 bps`
- `2.03x`
- `Paper review action`
- the bps threshold bar and split evidence timeline

## 1:15-2:00 - Replay Agent Incident

Click `Replay incident`.

Say:

"The agent replays the event stream and quote stream. When the odds shock arrives without a matching impact event, the agent moves from watching to signal detected and records a paper-only audit action."

Show:

- replay stage chips advancing from Watching to Resolved
- active transcript item highlighting
- paper-only action log

## 2:00-3:05 - Rule Inspector

Select `EventMismatchRule`.

Say:

"The Rule Inspector shows the exact quote, event window, threshold, checked events, and why the rule fired. This is deterministic and inspectable."

Select `MomentumShockRule`.

Say:

"The same incident rejects MomentumShockRule because that rule requires a goal or red card before the odds shock. The quote moved sharply, but the required match event is absent."

## 3:05-3:40 - Redacted Incident JSON

Click `Copy JSON`. If the browser blocks clipboard access, click `Download JSON`.

Say:

"SharpEdge can export a redacted synthetic incident record for audit review. It includes the endpoint list, primary signal, paperOnly equals true, the paper action, and the risk note. It does not include secrets, raw private data, wallet details, funds, or execution fields."

## 3:40-4:20 - TxODDS Fit and Limits

Show the endpoint list.

Say:

"The TxODDS value is the timing relationship between odds, scores, and live match data. SharpEdge audits whether a line move has a live event explanation. This submission currently uses synthetic replay fixtures, so judges can run it without credentials. Live TxLINE networking is the next integration step, but the product flow is already shaped around the TxLINE fixtures, scores, odds, stream, and validation endpoints."

## 4:20-4:40 - Compliance Close

Say:

"SharpEdge is paper-only. It does not place bets, execute trades, manage funds, require a wallet, or claim profit. The output is an audit flag for review."
