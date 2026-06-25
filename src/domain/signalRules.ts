import type { RuleEvaluation, TxlineMatchEvent, TxlineOddsQuote } from "./types";

export interface MovementRuleConfig {
  movementBpsThreshold: number;
}

export interface EventWindowRuleConfig extends MovementRuleConfig {
  eventWindowSeconds: number;
}

export interface StaleLineRuleConfig {
  nowUtc: string;
  staleAfterSeconds: number;
}

const impactfulEventTypes = new Set<TxlineMatchEvent["eventType"]>([
  "goal",
  "red_card",
  "yellow_card",
  "score_correction",
  "match_status_change"
]);

export function evaluateSharpMovementRule(
  quote: TxlineOddsQuote,
  config: MovementRuleConfig
): RuleEvaluation {
  const movementBps = Math.abs(quote.movementBps ?? 0);
  const fired = movementBps >= config.movementBpsThreshold;

  return {
    ruleId: "SharpMovementRule",
    fired,
    strength: ratioStrength(movementBps, config.movementBpsThreshold),
    threshold: `${config.movementBpsThreshold} bps move`,
    reason: fired
      ? `${movementBps} bps move exceeds ${config.movementBpsThreshold} bps threshold.`
      : `${movementBps} bps move is below ${config.movementBpsThreshold} bps threshold.`,
    action: "monitor scenario",
    riskNote: "Large odds movement may reflect routine liquidity or delayed book refresh."
  };
}

export function evaluateEventMismatchRule(
  quote: TxlineOddsQuote,
  events: TxlineMatchEvent[],
  config: EventWindowRuleConfig
): RuleEvaluation {
  const movementBps = Math.abs(quote.movementBps ?? 0);
  const matchingEvent = findImpactfulEventNearQuote(quote, events, config.eventWindowSeconds);
  const fired = movementBps >= config.movementBpsThreshold && matchingEvent === undefined;

  return {
    ruleId: "EventMismatchRule",
    fired,
    strength: ratioStrength(movementBps, config.movementBpsThreshold),
    threshold: `${config.movementBpsThreshold} bps move without goal/card/status event inside ${config.eventWindowSeconds}s`,
    reason: fired
      ? `${movementBps} bps move has no goal/card/status event inside ${config.eventWindowSeconds}s.`
      : matchingEvent
        ? `Rejected because matching match event ${matchingEvent.eventType} was received inside ${config.eventWindowSeconds}s.`
        : `${movementBps} bps move is below EventMismatchRule threshold.`,
    action: "flag for review",
    riskNote:
      "Mismatch signals can be false positives when official events arrive late or corrections are replayed out of order."
  };
}

export function evaluateMomentumShockRule(
  quote: TxlineOddsQuote,
  events: TxlineMatchEvent[],
  config: EventWindowRuleConfig
): RuleEvaluation {
  const movementBps = Math.abs(quote.movementBps ?? 0);
  const shockEvent = findEventTypeNearQuote(quote, events, config.eventWindowSeconds, [
    "goal",
    "red_card"
  ]);
  const fired = movementBps >= config.movementBpsThreshold && shockEvent !== undefined;

  return {
    ruleId: "MomentumShockRule",
    fired,
    strength: ratioStrength(movementBps, config.movementBpsThreshold),
    threshold: `${config.movementBpsThreshold} bps move after goal/red card inside ${config.eventWindowSeconds}s`,
    reason: fired
      ? `${shockEvent?.eventType} event was followed by ${movementBps} bps implied market shock.`
      : `No goal/red-card shock above ${config.movementBpsThreshold} bps inside ${config.eventWindowSeconds}s.`,
    action: "monitor scenario",
    riskNote: "Momentum shocks are descriptive only; they do not imply an actionable edge."
  };
}

export function evaluateStaleLineRule(
  quote: TxlineOddsQuote,
  config: StaleLineRuleConfig
): RuleEvaluation {
  const quoteAgeSeconds = Math.max(
    0,
    (Date.parse(config.nowUtc) - Date.parse(quote.updatedAtUtc)) / 1000
  );
  const fired = quoteAgeSeconds > config.staleAfterSeconds;

  return {
    ruleId: "StaleLineRule",
    fired,
    strength: ratioStrength(quoteAgeSeconds, config.staleAfterSeconds),
    threshold: `${config.staleAfterSeconds}s maximum quote age`,
    reason: fired
      ? `Quote is ${Math.round(quoteAgeSeconds)}s old, above ${config.staleAfterSeconds}s threshold.`
      : `Quote age ${Math.round(quoteAgeSeconds)}s is within ${config.staleAfterSeconds}s threshold.`,
    action: "pause scenario",
    riskNote: "Stale quotes can reflect suspended markets, local replay gaps, or network delay."
  };
}

function findImpactfulEventNearQuote(
  quote: TxlineOddsQuote,
  events: TxlineMatchEvent[],
  eventWindowSeconds: number
): TxlineMatchEvent | undefined {
  return events.find(
    (event) =>
      impactfulEventTypes.has(event.eventType) &&
      secondsBetween(event.receivedAtUtc, quote.updatedAtUtc) <= eventWindowSeconds
  );
}

function findEventTypeNearQuote(
  quote: TxlineOddsQuote,
  events: TxlineMatchEvent[],
  eventWindowSeconds: number,
  eventTypes: TxlineMatchEvent["eventType"][]
): TxlineMatchEvent | undefined {
  const acceptedTypes = new Set(eventTypes);
  return events.find(
    (event) =>
      acceptedTypes.has(event.eventType) &&
      secondsBetween(event.receivedAtUtc, quote.updatedAtUtc) <= eventWindowSeconds
  );
}

function secondsBetween(firstUtc: string, secondUtc: string): number {
  return Math.abs((Date.parse(secondUtc) - Date.parse(firstUtc)) / 1000);
}

function ratioStrength(value: number, threshold: number): number {
  if (threshold <= 0) {
    return 0;
  }

  return Number((value / threshold).toFixed(2));
}
