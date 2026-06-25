import type { TxlineMatch, TxlineMatchEvent, TxlineOddsQuote, TxlineProofReceipt } from "./types";

export const replayMatches: TxlineMatch[] = [
  {
    matchId: "match-edge-001",
    competitionId: "wc26-synthetic",
    competitionName: "Synthetic World Cup Replay",
    kickoffUtc: "2026-06-25T17:00:00.000Z",
    status: "live",
    homeTeam: "Atlas City",
    awayTeam: "Harbor United",
    homeScore: 0,
    awayScore: 0,
    minute: 64,
    updatedAtUtc: "2026-06-25T18:07:30.000Z",
    sourceMode: "replay"
  },
  {
    matchId: "match-normal-002",
    competitionId: "wc26-synthetic",
    competitionName: "Synthetic World Cup Replay",
    kickoffUtc: "2026-06-25T19:00:00.000Z",
    status: "finished",
    homeTeam: "Northbridge",
    awayTeam: "Canal Rovers",
    homeScore: 2,
    awayScore: 1,
    minute: 90,
    updatedAtUtc: "2026-06-25T20:55:00.000Z",
    sourceMode: "replay"
  },
  {
    matchId: "match-suspended-003",
    competitionId: "wc26-synthetic",
    competitionName: "Synthetic World Cup Replay",
    kickoffUtc: "2026-06-25T21:00:00.000Z",
    status: "suspended",
    homeTeam: "Metro FC",
    awayTeam: "Valley Town",
    homeScore: 1,
    awayScore: 1,
    minute: 71,
    updatedAtUtc: "2026-06-25T22:20:00.000Z",
    sourceMode: "replay"
  }
];

export const replayEvents: TxlineMatchEvent[] = [
  {
    eventId: "evt-edge-kickoff",
    matchId: "match-edge-001",
    eventType: "period_start",
    minute: 46,
    payload: { period: 2 },
    occurredAtUtc: "2026-06-25T18:00:00.000Z",
    receivedAtUtc: "2026-06-25T18:00:01.000Z"
  },
  {
    eventId: "evt-edge-resolution",
    matchId: "match-edge-001",
    eventType: "score_correction",
    teamSide: "away",
    minute: 66,
    payload: {
      note: "Synthetic correction explains prior line movement after replay delay."
    },
    occurredAtUtc: "2026-06-25T18:08:50.000Z",
    receivedAtUtc: "2026-06-25T18:08:58.000Z"
  },
  {
    eventId: "evt-normal-late-goal",
    matchId: "match-normal-002",
    eventType: "goal",
    teamSide: "home",
    playerName: "Demo Finisher",
    minute: 88,
    payload: { homeScore: 2, awayScore: 1 },
    occurredAtUtc: "2026-06-25T20:47:00.000Z",
    receivedAtUtc: "2026-06-25T20:47:03.000Z"
  },
  {
    eventId: "evt-suspended-status",
    matchId: "match-suspended-003",
    eventType: "match_status_change",
    minute: 71,
    payload: { status: "suspended", reason: "synthetic weather delay" },
    occurredAtUtc: "2026-06-25T22:18:00.000Z",
    receivedAtUtc: "2026-06-25T22:18:05.000Z"
  }
];

export const replayOdds: TxlineOddsQuote[] = [
  {
    quoteId: "quote-edge-before",
    matchId: "match-edge-001",
    marketType: "match_winner",
    selection: "Atlas City",
    decimalOdds: 2.05,
    impliedProbability: 0.4878,
    updatedAtUtc: "2026-06-25T18:06:20.000Z"
  },
  {
    quoteId: "quote-edge-shock",
    matchId: "match-edge-001",
    marketType: "match_winner",
    selection: "Atlas City",
    decimalOdds: 2.55,
    impliedProbability: 0.3922,
    previousDecimalOdds: 2.05,
    movementBps: 2439,
    updatedAtUtc: "2026-06-25T18:07:30.000Z"
  },
  {
    quoteId: "quote-normal-late-goal",
    matchId: "match-normal-002",
    marketType: "match_winner",
    selection: "Northbridge",
    decimalOdds: 1.21,
    impliedProbability: 0.8264,
    previousDecimalOdds: 1.82,
    movementBps: 3352,
    updatedAtUtc: "2026-06-25T20:47:45.000Z"
  },
  {
    quoteId: "quote-suspended-stale",
    matchId: "match-suspended-003",
    marketType: "total_goals",
    selection: "Over 2.5",
    decimalOdds: 1.93,
    impliedProbability: 0.5181,
    previousDecimalOdds: 1.91,
    movementBps: 105,
    updatedAtUtc: "2026-06-25T22:15:00.000Z"
  }
];

export const replayProofs: TxlineProofReceipt[] = [
  {
    receiptId: "proof-edge-001",
    matchId: "match-edge-001",
    statKey: "score_correction",
    statValue: "away correction at 66",
    merkleRoot: "replay-root-sharpedge-001",
    merkleProof: ["synthetic-proof-a", "synthetic-proof-b"],
    verified: true,
    verifiedAtUtc: "2026-06-25T18:09:02.000Z",
    verificationMode: "replay_fixture"
  }
];
