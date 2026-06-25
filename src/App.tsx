import { useMemo, useState } from "react";
import {
  buildAgentIncidentReplay,
  buildRedactedIncidentExport,
  getRuleInspection
} from "./domain/replayAgent";
import type { AgentState, RuleEvaluation, TranscriptEntry } from "./domain/types";
import "./styles.css";

const replaySpeeds = [1, 5, 20] as const;

function App() {
  const replay = useMemo(() => buildAgentIncidentReplay(), []);
  const exportPayload = useMemo(() => buildRedactedIncidentExport(replay), [replay]);
  const [visibleTranscript, setVisibleTranscript] = useState<TranscriptEntry[]>([]);
  const [agentState, setAgentState] = useState<AgentState>("idle");
  const [replaySpeed, setReplaySpeed] = useState<(typeof replaySpeeds)[number]>(5);
  const [runCount, setRunCount] = useState(0);
  const [selectedRuleId, setSelectedRuleId] =
    useState<RuleEvaluation["ruleId"]>("EventMismatchRule");
  const [exportStatus, setExportStatus] = useState("Synthetic JSON ready");

  const selectedInspection = getRuleInspection(replay, selectedRuleId);
  const activeTranscript =
    visibleTranscript.length > 0 ? visibleTranscript : replay.transcript.slice(0, 2);
  const bpsWidth = `${Math.min(100, (Math.abs(replay.currentQuote.movementBps ?? 0) / 2500) * 100)}%`;
  const thresholdMarker = `${Math.min(96, (1200 / 2500) * 100)}%`;
  const exportJson = JSON.stringify(exportPayload, null, 2);

  function startReplay() {
    setRunCount((count) => count + 1);
    setVisibleTranscript([]);
    setAgentState("watching");

    replay.transcript.forEach((entry, index) => {
      window.setTimeout(() => {
        setVisibleTranscript((current) => [...current, entry]);

        if (entry.kind === "rule") {
          setAgentState("signal detected");
        } else if (entry.kind === "action") {
          setAgentState("paper action logged");
        } else if (entry.kind === "resolution") {
          setAgentState("resolved");
        }
      }, (index * 850) / replaySpeed);
    });
  }

  async function copyIncidentJson() {
    try {
      await navigator.clipboard.writeText(exportJson);
      setExportStatus("Copied redacted synthetic incident JSON");
    } catch {
      setExportStatus("Copy unavailable; use Download JSON");
    }
  }

  function downloadIncidentJson() {
    const blob = new Blob([exportJson], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = "sharpedge-redacted-incident.json";
    anchor.click();
    URL.revokeObjectURL(href);
    setExportStatus("Downloaded redacted synthetic incident JSON");
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div className="hero-copy">
          <div className="pill-row" aria-label="Mode and compliance">
            <span className="mode-pill">Replay demo mode</span>
            <span className="compliance-pill">Paper-only. No execution path.</span>
          </div>
          <p className="eyebrow">Trading Tools and Agents</p>
          <h1>SharpEdge odds-shock audit agent</h1>
          <p className="subhead">
            Detect line movement without a matching live event, explain the rule decision, and log
            a paper-only review action.
          </p>
        </div>
      </header>

      <section className="shock-radar" aria-label="Odds Shock Radar">
        <div className="radar-header">
          <div>
            <p className="eyebrow">Odds Shock Radar</p>
            <h2>No goal/card event in 75s</h2>
          </div>
          <span className="audit-chip">Paper flag only</span>
        </div>

        <div className="radar-grid">
          <div className="radar-metric odds">
            <span>Odds</span>
            <strong>{"2.05 -> 2.55"}</strong>
            <small>{replay.currentQuote.selection} match winner</small>
          </div>
          <div className="radar-metric shock">
            <span>Shock</span>
            <strong>2439 bps</strong>
            <small>decimal odds movement</small>
          </div>
          <div className="radar-metric threshold">
            <span>Threshold</span>
            <strong>{replay.primarySignal.strength.toFixed(2)}x</strong>
            <small>EventMismatchRule threshold</small>
          </div>
          <div className="radar-metric event-gap">
            <span>TxLINE event window</span>
            <strong>No match</strong>
            <small>goal / red card / correction / status</small>
          </div>
        </div>

        <div className="bps-visual" aria-label="Bps shock bar">
          <div className="bps-labels">
            <span>0 bps</span>
            <span>1200 bps rule threshold</span>
            <span>2500 bps</span>
          </div>
          <div className="bps-track">
            <span className="threshold-marker" style={{ left: thresholdMarker }} />
            <span className="bps-fill" style={{ width: bpsWidth }} />
          </div>
        </div>

        <div className="event-timeline" aria-label="Event and odds timeline">
          <div className="timeline-node quiet">
            <span>18:00:01</span>
            <strong>period_start</strong>
            <small>not an impact event</small>
          </div>
          <div className="timeline-node shock-node">
            <span>18:07:30</span>
            <strong>odds shock</strong>
            <small>EventMismatchRule fires</small>
          </div>
          <div className="timeline-node resolution">
            <span>18:08:58</span>
            <strong>score_correction</strong>
            <small>later latency audit</small>
          </div>
        </div>
      </section>

      <section className="control-strip" aria-label="Replay controls and agent status">
        <button className="primary-cta" type="button" onClick={startReplay}>
          Replay agent incident
        </button>
        <div className="speed-row" aria-label="Replay speed">
          {replaySpeeds.map((speed) => (
            <button
              className={speed === replaySpeed ? "speed-button active" : "speed-button"}
              key={speed}
              type="button"
              onClick={() => setReplaySpeed(speed)}
            >
              {speed}x
            </button>
          ))}
        </div>
        <div className="status-card">
          <span>Agent state</span>
          <strong>{agentState}</strong>
          <small>Replay run #{runCount || 1}</small>
        </div>
        <div className="status-card">
          <span>Match</span>
          <strong>
            {replay.match.homeTeam} vs {replay.match.awayTeam}
          </strong>
          <small>
            {replay.match.minute}' | {replay.match.homeScore}-{replay.match.awayScore}
          </small>
        </div>
      </section>

      <section className="workbench">
        <section className="panel rule-inspector" aria-label="Rule Inspector">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Rule Inspector</p>
              <h2>{selectedInspection.ruleId}</h2>
            </div>
            <span className={selectedInspection.state === "fired" ? "state-fired" : "state-rejected"}>
              {selectedInspection.state}
            </span>
          </div>

          <div className="rule-tabs" aria-label="Select rule to inspect">
            {replay.ruleEvaluations.map((rule) => (
              <button
                className={rule.ruleId === selectedRuleId ? "rule-tab active" : "rule-tab"}
                key={rule.ruleId}
                type="button"
                onClick={() => setSelectedRuleId(rule.ruleId)}
              >
                <span>{rule.ruleId}</span>
                <small>{rule.fired ? "fired" : "rejected"}</small>
              </button>
            ))}
          </div>

          <div className="inspector-grid">
            <div>
              <span className="label">Input quote</span>
              <strong>
                {selectedInspection.inputQuote.previousDecimalOdds} to{" "}
                {selectedInspection.inputQuote.decimalOdds}
              </strong>
              <p>
                {selectedInspection.inputQuote.movementBps} bps on{" "}
                {selectedInspection.inputQuote.marketType}
              </p>
            </div>
            <div>
              <span className="label">Event window</span>
              <strong>{selectedInspection.eventWindowSeconds || "n/a"}s</strong>
              <p>
                Checked {selectedInspection.checkedEvents.length} event
                {selectedInspection.checkedEvents.length === 1 ? "" : "s"} before quote update.
              </p>
            </div>
            <div>
              <span className="label">Threshold</span>
              <strong>{selectedInspection.thresholdBps || "n/a"} bps</strong>
              <p>{selectedInspection.matchedEvents.length} matching impact events found.</p>
            </div>
          </div>

          <div className="event-match-box">
            <span className="label">Matched / unmatched events</span>
            <p>
              Missing: {selectedInspection.unmatchedEventTypes.join(", ") || "no event filter"}.
            </p>
            <p>{selectedInspection.explanation}</p>
          </div>
        </section>

        <section className="panel risk-panel" aria-label="Risk and false positives">
          <p className="eyebrow">Risk panel</p>
          <h2>Why this may be wrong</h2>
          {replay.riskNotes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </section>

        <section className="panel action-log" aria-label="Paper-only action log">
          <p className="eyebrow">Audit log</p>
          <h2>Paper-only action</h2>
          {replay.paperActions.map((action) => (
            <article key={action.id}>
              <strong>{action.action}</strong>
              <p>{action.summary}</p>
              <small>
                {action.ruleId} | quote {action.quoteId} | paperOnly={String(action.paperOnly)}
              </small>
            </article>
          ))}
          <div className="export-actions">
            <button type="button" onClick={copyIncidentJson}>
              Copy JSON
            </button>
            <button type="button" onClick={downloadIncidentJson}>
              Download JSON
            </button>
          </div>
          <small>{exportStatus}</small>
        </section>
      </section>

      <section className="lower-grid">
        <section className="panel transcript-panel" aria-label="Agent replay transcript">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Agent replay transcript</p>
              <h2>Inspectable decision trace</h2>
            </div>
            <span>
              {activeTranscript.length}/{replay.transcript.length}
            </span>
          </div>
          {activeTranscript.map((entry) => (
            <article className={`timeline-entry ${entry.kind}`} key={entry.id}>
              <time>{new Date(entry.timestampUtc).toLocaleTimeString("en-US", { hour12: false })}</time>
              <div>
                <strong>{entry.title}</strong>
                <p>{entry.message}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="panel endpoint-list" aria-label="TxLINE endpoints">
          <p className="eyebrow">TxLINE endpoints</p>
          <h2>Replay-mode integration surface</h2>
          {replay.txlineEndpoints.map((endpoint) => (
            <code key={endpoint}>{endpoint}</code>
          ))}
        </section>
      </section>
    </main>
  );
}

export default App;
