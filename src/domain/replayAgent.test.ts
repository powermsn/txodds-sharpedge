import { describe, expect, it } from "vitest";
import {
  buildAgentIncidentReplay,
  buildRedactedIncidentExport,
  getRuleInspection
} from "./replayAgent";

describe("agent incident replay", () => {
  it("builds a chronological EventMismatchRule demo with paper-only action and resolution", () => {
    const replay = buildAgentIncidentReplay();

    expect(replay.mode).toBe("replay");
    expect(replay.agentState).toBe("resolved");
    expect(replay.primarySignal.ruleId).toBe("EventMismatchRule");
    expect(replay.paperActions[0]).toMatchObject({
      action: "flag for review",
      paperOnly: true,
      ruleId: "EventMismatchRule"
    });
    expect(replay.transcript.map((entry) => entry.kind)).toEqual([
      "event",
      "quote",
      "rule",
      "action",
      "risk",
      "resolution"
    ]);
    expect(replay.transcript[3].message).toContain("Paper-only");
    expect(replay.riskNotes.length).toBeGreaterThanOrEqual(4);
  });

  it("explains fired and rejected rules with quote, event window, threshold, and matched-event state", () => {
    const replay = buildAgentIncidentReplay();

    const eventMismatch = getRuleInspection(replay, "EventMismatchRule");
    const momentumShock = getRuleInspection(replay, "MomentumShockRule");

    expect(eventMismatch).toMatchObject({
      ruleId: "EventMismatchRule",
      state: "fired",
      eventWindowSeconds: 75,
      thresholdBps: 1200,
      matchedEvents: [],
      unmatchedEventTypes: ["goal", "red_card", "score_correction", "match_status_change"]
    });
    expect(eventMismatch.inputQuote).toMatchObject({
      previousDecimalOdds: 2.05,
      decimalOdds: 2.55,
      movementBps: 2439
    });
    expect(eventMismatch.explanation).toContain("no matching live event");

    expect(momentumShock).toMatchObject({
      ruleId: "MomentumShockRule",
      state: "rejected",
      eventWindowSeconds: 75,
      thresholdBps: 1000,
      matchedEvents: []
    });
    expect(momentumShock.explanation).toContain("requires a goal or red card");
  });

  it("exports redacted synthetic incident JSON without execution, funding, token, or wallet fields", () => {
    const replay = buildAgentIncidentReplay();
    const exported = buildRedactedIncidentExport(replay);

    expect(exported).toMatchObject({
      schema: "sharpedge.redactedIncident.v1",
      sourceMode: "replay",
      paperOnly: true,
      primarySignal: {
        ruleId: "EventMismatchRule",
        fired: true,
        riskNote: expect.stringContaining("false positives")
      },
      txlineEndpoints: expect.arrayContaining(["GET /api/odds/stream"])
    });
    expect(exported.paperAction).toMatchObject({
      action: "flag for review",
      paperOnly: true
    });

    const json = JSON.stringify(exported).toLowerCase();
    expect(json).not.toContain("execute");
    expect(json).not.toContain("stake");
    expect(json).not.toContain("position");
    expect(json).not.toContain("profit");
    expect(json).not.toContain("wallet");
    expect(json).not.toContain("token");
    expect(json).not.toContain("private");
  });
});
