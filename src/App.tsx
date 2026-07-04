import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildAgentIncidentReplay,
  buildRedactedIncidentExport,
  getRuleInspection
} from "./domain/replayAgent";
import type { AgentState, RuleEvaluation, TranscriptEntry } from "./domain/types";
import "./styles.css";

const replaySpeeds = [1, 5, 20] as const;
const replayStages = [
  "Watching",
  "Quote shock",
  "No matching event",
  "Rule fired",
  "Paper action logged",
  "Resolved"
] as const;

function App() {
  const replay = useMemo(() => buildAgentIncidentReplay(), []);
  const exportPayload = useMemo(() => buildRedactedIncidentExport(replay), [replay]);
  const [visibleTranscript, setVisibleTranscript] = useState<TranscriptEntry[]>([]);
  const [agentState, setAgentState] = useState<AgentState>("idle");
  const [activeStageIndex, setActiveStageIndex] = useState(-1);
  const [replaySpeed, setReplaySpeed] = useState<(typeof replaySpeeds)[number]>(5);
  const [runCount, setRunCount] = useState(0);
  const [selectedRuleId, setSelectedRuleId] =
    useState<RuleEvaluation["ruleId"]>("EventMismatchRule");
  const [exportStatus, setExportStatus] = useState("Redacted synthetic JSON ready");
  const timerRef = useRef<number[]>([]);

  const selectedInspection = getRuleInspection(replay, selectedRuleId);
  const activeTranscript =
    visibleTranscript.length > 0 ? visibleTranscript : replay.transcript.slice(0, 2);
  const activeTranscriptId = visibleTranscript[visibleTranscript.length - 1]?.id;
  const bpsWidth = `${Math.min(100, (Math.abs(replay.currentQuote.movementBps ?? 0) / 2500) * 100)}%`;
  const thresholdMarker = `${Math.min(96, (1200 / 2500) * 100)}%`;
  const exportJson = JSON.stringify(exportPayload, null, 2);
  const liveStatus = "not configured";
  const replayStatus = activeStageIndex >= 0 && activeStageIndex < 5 ? "active" : "ready";

  useEffect(() => {
    return () => {
      timerRef.current.forEach((timer) => window.clearTimeout(timer));
      timerRef.current = [];
    };
  }, []);

  function startReplay() {
    timerRef.current.forEach((timer) => window.clearTimeout(timer));
    timerRef.current = [];
    setRunCount((count) => count + 1);
    setVisibleTranscript([]);
    setAgentState("watching");
    setActiveStageIndex(0);
    setExportStatus("Redacted synthetic JSON ready");

    replayStages.forEach((_, index) => {
      const timer = window.setTimeout(() => {
        setActiveStageIndex(index);
        setAgentState(stageToAgentState(index));
        setVisibleTranscript((current) => {
          const entry = replay.transcript[index];
          if (!entry || current.some((candidate) => candidate.id === entry.id)) {
            return current;
          }

          return [...current, entry];
        });
      }, (index * 850) / replaySpeed);
      timerRef.current.push(timer);
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
      <section className="evidence-strip" aria-label="TxLINE evidence and mode">
        <span>
          <strong>SharpEdge</strong>
          Trading Tools and Agents
        </span>
        <span>
          <strong>Live TxLINE</strong>
          {liveStatus}
        </span>
        <span>
          <strong>Replay incident</strong>
          {replayStatus}
        </span>
        <span>
          <strong>Event window</strong>
          75s
        </span>
        <span>
          <strong>Action mode</strong>
          paper only
        </span>
        <span>
          <strong>Export</strong>
          redacted synthetic JSON
        </span>
      </section>

      <header className="hero">
        <div className="hero-copy">
          <div className="pill-row" aria-label="Mode and compliance">
            <span className="mode-pill">Replay guaranteed</span>
            <span className="compliance-pill">Paper-only / no execution</span>
          </div>
          <p className="eyebrow">Trading Tools and Agents</p>
          <h1>SharpEdge</h1>
          <p className="subhead">
            Paper-only odds-shock audit agent for checking suspicious line movement against TxLINE
            match-event evidence.
          </p>
        </div>
        <div className="hero-status" aria-label="Current replay state">
          <span>Current state</span>
          <strong>{activeStageIndex >= 0 ? replayStages[activeStageIndex] : "Ready"}</strong>
          <small>Run #{runCount || 1} | {agentState}</small>
        </div>
      </header>

      <section className="shock-board" aria-label="Hero shock board">
        <div className="match-card">
          <p className="eyebrow">Fixture</p>
          <h2>
            {replay.match.homeTeam} <span>vs</span> {replay.match.awayTeam}
          </h2>
          <div className="scoreline">
            <strong>
              {replay.match.homeScore}-{replay.match.awayScore}
            </strong>
            <span>{replay.match.minute}' live replay</span>
          </div>
          <p>
            The agent audits whether the quote shock is explained by nearby TxLINE score or match
            event evidence.
          </p>
        </div>

        <div className="shock-card">
          <div className="board-heading">
            <div>
              <p className="eyebrow">Hero incident</p>
              <h2>Odds shock with no matching event in 75s</h2>
            </div>
            <span className="shock-badge">2439 bps</span>
          </div>

          <div className="odds-row" aria-label="Quote movement">
            <span>2.05</span>
            <div className="odds-track">
              <i className="threshold-marker" style={{ left: thresholdMarker }} />
              <i className="odds-fill" style={{ width: bpsWidth }} />
            </div>
            <span>2.55</span>
          </div>
          <div className="track-labels">
            <span>Quote before</span>
            <span>1200 bps threshold</span>
            <span>Quote shock</span>
          </div>

          <div className="split-timeline" aria-label="Split evidence timeline">
            <div className="evidence-rail quote-rail">
              <span className="rail-label">Odds rail</span>
              <strong>18:07:30 quote shock</strong>
              <small>Atlas City moves 2.05 to 2.55</small>
            </div>
            <div className="evidence-rail event-rail">
              <span className="rail-label">TxLINE event rail</span>
              <strong>No goal/card/correction</strong>
              <small>Only period_start before the quote update</small>
            </div>
          </div>
        </div>

        <div className="verdict-card">
          <p className="eyebrow">Rule verdict</p>
          <h2>{replay.primarySignal.ruleId}</h2>
          <strong className="verdict-strength">
            {replay.primarySignal.strength.toFixed(2)}x threshold
          </strong>
          <p>{replay.primarySignal.reason}</p>
          <div className="paper-action">
            <span>Paper review action</span>
            <strong>{replay.paperActions[0].action}</strong>
          </div>
        </div>
      </section>

      <section className="replay-console" aria-label="Replay incident controls">
        <button className="primary-cta" type="button" onClick={startReplay}>
          Replay incident
        </button>
        <div className="speed-segment" aria-label="Replay speed">
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
        <div className="stage-strip" aria-label="Replay stage progression">
          {replayStages.map((stage, index) => (
            <span
              className={[
                "stage-chip",
                index === activeStageIndex ? "active" : "",
                index < activeStageIndex ? "complete" : ""
              ]
                .filter(Boolean)
                .join(" ")}
              key={stage}
            >
              {index < activeStageIndex ? "ok" : index === activeStageIndex ? "now" : "wait"}{" "}
              {stage}
            </span>
          ))}
        </div>
      </section>

      <section className="analyst-workbench">
        <section className="panel rule-inspector" aria-label="Rule Inspector">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Rule Inspector</p>
              <h2>{selectedInspection.ruleId}</h2>
            </div>
            <span className={selectedInspection.state === "fired" ? "state-fired" : "state-rejected"}>
              {selectedInspection.state === "fired" ? "! fired" : "x rejected"}
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
                <small>{rule.fired ? "! fired" : "x rejected"}</small>
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

        <aside className="transcript-rail" aria-label="Agent replay transcript">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Streaming transcript</p>
              <h2>Decision trace</h2>
            </div>
            <span>
              {activeTranscript.length}/{replay.transcript.length}
            </span>
          </div>
          {activeTranscript.map((entry) => (
            <article
              className={`timeline-entry ${entry.kind} ${
                entry.id === activeTranscriptId ? "active" : ""
              }`}
              key={entry.id}
            >
              <time>{new Date(entry.timestampUtc).toLocaleTimeString("en-US", { hour12: false })}</time>
              <div>
                <strong>{entry.title}</strong>
                <p>{entry.message}</p>
              </div>
            </article>
          ))}
        </aside>

        <section className="panel risk-panel" aria-label="Risk and false positives">
          <p className="eyebrow">Risk panel</p>
          <h2>Why this may be wrong</h2>
          {replay.riskNotes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </section>

        <section className="panel action-log" aria-label="Paper-only action log">
          <p className="eyebrow">Audit package</p>
          <h2>Paper-only action and export</h2>
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

function stageToAgentState(stageIndex: number): AgentState {
  if (stageIndex <= 0) {
    return "watching";
  }
  if (stageIndex <= 3) {
    return "signal detected";
  }
  if (stageIndex === 4) {
    return "paper action logged";
  }
  return "resolved";
}

export default App;
