import { describe, expect, it } from "vitest";
import {
  evaluateEventMismatchRule,
  evaluateMomentumShockRule,
  evaluateSharpMovementRule,
  evaluateStaleLineRule
} from "./signalRules";
import type { TxlineMatchEvent, TxlineOddsQuote } from "./types";

const baseQuote: TxlineOddsQuote = {
  quoteId: "q-100",
  matchId: "match-edge-001",
  marketType: "match_winner",
  selection: "Atlas City",
  decimalOdds: 2.55,
  impliedProbability: 0.3922,
  previousDecimalOdds: 2.05,
  movementBps: 2439,
  updatedAtUtc: "2026-06-25T18:07:30.000Z"
};

const goalEvent: TxlineMatchEvent = {
  eventId: "evt-goal-1",
  matchId: "match-edge-001",
  eventType: "goal",
  teamSide: "home",
  playerName: "Synthetic Striker",
  minute: 64,
  payload: { homeScore: 1, awayScore: 0 },
  occurredAtUtc: "2026-06-25T18:06:50.000Z",
  receivedAtUtc: "2026-06-25T18:06:53.000Z"
};

describe("deterministic signal rules", () => {
  it("flags sharp movement above the configured basis-point threshold", () => {
    const result = evaluateSharpMovementRule(baseQuote, { movementBpsThreshold: 1200 });

    expect(result.fired).toBe(true);
    expect(result.ruleId).toBe("SharpMovementRule");
    expect(result.strength).toBeGreaterThan(1);
    expect(result.reason).toContain("2439 bps");
  });

  it("fires EventMismatchRule when a large odds shift lacks a matching match event", () => {
    const result = evaluateEventMismatchRule(baseQuote, [], {
      movementBpsThreshold: 1200,
      eventWindowSeconds: 75
    });

    expect(result.fired).toBe(true);
    expect(result.ruleId).toBe("EventMismatchRule");
    expect(result.action).toBe("flag for review");
    expect(result.reason).toContain("no goal/card/status event");
  });

  it("rejects EventMismatchRule when a matching goal is inside the event window", () => {
    const result = evaluateEventMismatchRule(baseQuote, [goalEvent], {
      movementBpsThreshold: 1200,
      eventWindowSeconds: 75
    });

    expect(result.fired).toBe(false);
    expect(result.reason).toContain("matching match event");
  });

  it("fires MomentumShockRule for a goal followed by a large implied probability change", () => {
    const result = evaluateMomentumShockRule(baseQuote, [goalEvent], {
      movementBpsThreshold: 1000,
      eventWindowSeconds: 75
    });

    expect(result.fired).toBe(true);
    expect(result.ruleId).toBe("MomentumShockRule");
    expect(result.action).toBe("monitor scenario");
  });

  it("fires StaleLineRule when the quote is older than the configured replay threshold", () => {
    const result = evaluateStaleLineRule(baseQuote, {
      nowUtc: "2026-06-25T18:10:31.000Z",
      staleAfterSeconds: 180
    });

    expect(result.fired).toBe(true);
    expect(result.ruleId).toBe("StaleLineRule");
    expect(result.action).toBe("pause scenario");
  });
}
);
