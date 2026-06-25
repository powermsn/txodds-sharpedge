import {
  evaluateEventMismatchRule,
  evaluateMomentumShockRule,
  evaluateSharpMovementRule,
  evaluateStaleLineRule
} from "./signalRules";
import { replayEvents, replayMatches, replayOdds } from "./replayFixtures";
import type {
  AgentIncidentReplay,
  PaperActionLogEntry,
  RedactedIncidentExport,
  RuleEvaluation,
  RuleInspection,
  TranscriptEntry
} from "./types";

const demoMatchId = "match-edge-001";
const demoQuoteId = "quote-edge-shock";

export function buildAgentIncidentReplay(): AgentIncidentReplay {
  const match = required(
    replayMatches.find((candidate) => candidate.matchId === demoMatchId),
    "demo replay match"
  );
  const quote = required(
    replayOdds.find((candidate) => candidate.quoteId === demoQuoteId),
    "demo replay quote"
  );
  const eventsBeforeShock = replayEvents.filter(
    (event) => event.matchId === demoMatchId && event.receivedAtUtc < quote.updatedAtUtc
  );
  const resolutionEvent = required(
    replayEvents.find((event) => event.eventId === "evt-edge-resolution"),
    "demo resolution event"
  );

  const ruleEvaluations = [
    evaluateSharpMovementRule(quote, { movementBpsThreshold: 1200 }),
    evaluateEventMismatchRule(quote, eventsBeforeShock, {
      movementBpsThreshold: 1200,
      eventWindowSeconds: 75
    }),
    evaluateMomentumShockRule(quote, eventsBeforeShock, {
      movementBpsThreshold: 1000,
      eventWindowSeconds: 75
    }),
    evaluateStaleLineRule(quote, {
      nowUtc: "2026-06-25T18:08:20.000Z",
      staleAfterSeconds: 180
    })
  ];
  const primarySignal = required(
    ruleEvaluations.find((result) => result.ruleId === "EventMismatchRule"),
    "EventMismatchRule result"
  );
  const paperAction = buildPaperAction(primarySignal, quote.quoteId, match.matchId);

  return {
    mode: "replay",
    agentState: "resolved",
    match,
    currentQuote: quote,
    latestEvent: resolutionEvent,
    primarySignal,
    ruleEvaluations,
    paperActions: [paperAction],
    transcript: buildTranscript(primarySignal, paperAction),
    riskNotes: [
      "Latency: official events may arrive after a market maker already moved the line.",
      "Correction: score corrections can explain a mismatch after the first alert.",
      "Suspension: suspended markets may look stale even when the fixture is valid.",
      "Jurisdiction: this console produces paper-only analytics, not betting advice."
    ],
    txlineEndpoints: [
      "GET /api/fixtures/snapshot",
      "GET /api/scores/stream",
      "GET /api/odds/stream",
      "GET /api/scores/stat-validation",
      "GET /api/odds/validation"
    ]
  };
}

export function getRuleInspection(
  replay: AgentIncidentReplay,
  ruleId: RuleEvaluation["ruleId"]
): RuleInspection {
  const result = required(
    replay.ruleEvaluations.find((candidate) => candidate.ruleId === ruleId),
    `${ruleId} evaluation`
  );
  const checkedEvents = replayEvents.filter(
    (event) =>
      event.matchId === replay.match.matchId &&
      event.receivedAtUtc < replay.currentQuote.updatedAtUtc
  );

  if (ruleId === "EventMismatchRule") {
    return {
      ruleId,
      state: result.fired ? "fired" : "rejected",
      inputQuote: compactQuote(replay),
      eventWindowSeconds: 75,
      thresholdBps: 1200,
      checkedEvents,
      matchedEvents: [],
      unmatchedEventTypes: ["goal", "red_card", "score_correction", "match_status_change"],
      explanation:
        "EventMismatchRule fired because the quote crossed 1200 bps and there was no matching live event inside 75s.",
      riskNote: result.riskNote
    };
  }

  if (ruleId === "MomentumShockRule") {
    return {
      ruleId,
      state: result.fired ? "fired" : "rejected",
      inputQuote: compactQuote(replay),
      eventWindowSeconds: 75,
      thresholdBps: 1000,
      checkedEvents,
      matchedEvents: [],
      unmatchedEventTypes: ["goal", "red_card"],
      explanation:
        "MomentumShockRule rejected because it requires a goal or red card before the odds shock, and the checked window only has period_start.",
      riskNote: result.riskNote
    };
  }

  return {
    ruleId,
    state: result.fired ? "fired" : "rejected",
    inputQuote: compactQuote(replay),
    eventWindowSeconds: 0,
    thresholdBps: Number.parseInt(result.threshold, 10) || 0,
    checkedEvents,
    matchedEvents: [],
    unmatchedEventTypes: [],
    explanation: result.reason,
    riskNote: result.riskNote
  };
}

export function buildRedactedIncidentExport(
  replay: AgentIncidentReplay
): RedactedIncidentExport {
  const action = required(replay.paperActions[0], "paper action");

  return {
    schema: "sharpedge.redactedIncident.v1",
    sourceMode: replay.mode,
    generatedAtUtc: "2026-06-25T18:09:05.000Z",
    paperOnly: true,
    match: {
      matchId: replay.match.matchId,
      competitionId: replay.match.competitionId,
      status: replay.match.status,
      minute: replay.match.minute
    },
    txlineEndpoints: replay.txlineEndpoints,
    primarySignal: {
      ruleId: replay.primarySignal.ruleId,
      fired: replay.primarySignal.fired,
      strength: replay.primarySignal.strength,
      threshold: replay.primarySignal.threshold,
      reason: replay.primarySignal.reason,
      riskNote: replay.primarySignal.riskNote
    },
    paperAction: {
      id: action.id,
      timestampUtc: action.timestampUtc,
      action: action.action,
      paperOnly: action.paperOnly,
      ruleId: action.ruleId,
      quoteId: action.quoteId,
      matchId: action.matchId
    },
    riskNote: replay.primarySignal.riskNote
  };
}

function buildPaperAction(
  primarySignal: RuleEvaluation,
  quoteId: string,
  matchId: string
): PaperActionLogEntry {
  return {
    id: "paper-action-edge-001",
    timestampUtc: "2026-06-25T18:07:31.000Z",
    action: primarySignal.action,
    paperOnly: true,
    ruleId: primarySignal.ruleId,
    quoteId,
    matchId,
    ruleStrength: primarySignal.strength,
    summary: "Flag Atlas City match-winner quote for analyst review; no execution path exists.",
    riskNote: primarySignal.riskNote
  };
}

function buildTranscript(
  primarySignal: RuleEvaluation,
  paperAction: PaperActionLogEntry
): TranscriptEntry[] {
  return [
    {
      id: "transcript-001",
      timestampUtc: "2026-06-25T18:00:01.000Z",
      kind: "event",
      title: "Input event",
      message: "Second half started; no goal, card, status change, or correction in the alert window."
    },
    {
      id: "transcript-002",
      timestampUtc: "2026-06-25T18:07:30.000Z",
      kind: "quote",
      title: "Input quote",
      message: "Atlas City match-winner moved from 2.05 to 2.55, a 2439 bps decimal odds shock."
    },
    {
      id: "transcript-003",
      timestampUtc: "2026-06-25T18:07:30.500Z",
      kind: "rule",
      title: primarySignal.ruleId,
      message: `${primarySignal.threshold}. Result: ${primarySignal.reason}`
    },
    {
      id: "transcript-004",
      timestampUtc: paperAction.timestampUtc,
      kind: "action",
      title: "Paper action logged",
      message: `Paper-only ${paperAction.action}; ${paperAction.summary}`
    },
    {
      id: "transcript-005",
      timestampUtc: "2026-06-25T18:07:35.000Z",
      kind: "risk",
      title: "False-positive risk",
      message: primarySignal.riskNote
    },
    {
      id: "transcript-006",
      timestampUtc: "2026-06-25T18:08:58.000Z",
      kind: "resolution",
      title: "Later resolution",
      message: "Replay receives a score_correction event; incident remains useful as a latency audit."
    }
  ];
}

function compactQuote(replay: AgentIncidentReplay): RuleInspection["inputQuote"] {
  return {
    quoteId: replay.currentQuote.quoteId,
    matchId: replay.currentQuote.matchId,
    marketType: replay.currentQuote.marketType,
    selection: replay.currentQuote.selection,
    previousDecimalOdds: replay.currentQuote.previousDecimalOdds,
    decimalOdds: replay.currentQuote.decimalOdds,
    movementBps: replay.currentQuote.movementBps,
    updatedAtUtc: replay.currentQuote.updatedAtUtc
  };
}

function required<T>(value: T | undefined, label: string): T {
  if (value === undefined) {
    throw new Error(`Missing ${label}`);
  }

  return value;
}
