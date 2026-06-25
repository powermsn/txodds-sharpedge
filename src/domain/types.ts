export type TxlineMode = "live" | "replay";

export type TrackId = "proofmarket" | "sharpedge" | "fanpulse";

export type MatchStatus =
  | "scheduled"
  | "live"
  | "halftime"
  | "finished"
  | "suspended"
  | "abandoned"
  | "cancelled";

export type TeamSide = "home" | "away";

export interface TxlineMatch {
  matchId: string;
  competitionId: string;
  competitionName: string;
  kickoffUtc: string;
  status: MatchStatus;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute?: number;
  updatedAtUtc: string;
  sourceMode: TxlineMode;
}

export interface TxlineMatchEvent {
  eventId: string;
  matchId: string;
  eventType:
    | "goal"
    | "yellow_card"
    | "red_card"
    | "substitution"
    | "period_start"
    | "period_end"
    | "odds_shift"
    | "score_correction"
    | "match_status_change";
  teamSide?: TeamSide;
  playerName?: string;
  minute?: number;
  payload: Record<string, unknown>;
  occurredAtUtc: string;
  receivedAtUtc: string;
}

export interface TxlineOddsQuote {
  quoteId: string;
  matchId: string;
  marketType:
    | "match_winner"
    | "draw_no_bet"
    | "total_goals"
    | "handicap"
    | "both_teams_to_score"
    | "custom";
  selection: string;
  decimalOdds: number;
  impliedProbability: number;
  previousDecimalOdds?: number;
  movementBps?: number;
  updatedAtUtc: string;
}

export interface TxlineProofReceipt {
  receiptId: string;
  matchId: string;
  statKey: string;
  statValue: string;
  merkleRoot?: string;
  merkleProof?: string[];
  txSignature?: string;
  slot?: number;
  verified: boolean;
  verifiedAtUtc?: string;
  verificationMode: "txline_proof" | "devnet_mock" | "replay_fixture";
}

export type TxlineErrorCode =
  | "TXLINE_TOKEN_MISSING"
  | "TXLINE_NETWORK_ERROR"
  | "TXLINE_RATE_LIMITED"
  | "TXLINE_SCHEMA_MISMATCH"
  | "TXLINE_REPLAY_FIXTURE_MISSING"
  | "SOLANA_RPC_UNAVAILABLE"
  | "PROOF_UNAVAILABLE"
  | "UNSUPPORTED_LIVE_ENDPOINT";

export interface TxlineClientError extends Error {
  code: TxlineErrorCode;
  recoverable: boolean;
  fallbackMode?: TxlineMode;
}

export interface TxlineClient {
  mode: TxlineMode;
  getMatches(params: {
    competitionId?: string;
    status?: MatchStatus;
    fromUtc?: string;
    toUtc?: string;
  }): Promise<TxlineMatch[]>;
  getMatch(matchId: string): Promise<TxlineMatch>;
  getMatchEvents(params: {
    matchId: string;
    sinceEventId?: string;
    limit?: number;
  }): Promise<TxlineMatchEvent[]>;
  getOdds(params: {
    matchId: string;
    marketType?: TxlineOddsQuote["marketType"];
  }): Promise<TxlineOddsQuote[]>;
  streamMatch(params: {
    matchId: string;
    replaySpeed?: 1 | 5 | 20;
    onEvent: (event: TxlineMatchEvent) => void;
    onOdds: (quote: TxlineOddsQuote) => void;
    onError: (error: TxlineClientError) => void;
  }): Promise<{ close(): Promise<void> }>;
  getProofReceipt(params: {
    matchId: string;
    statKey: string;
    expectedValue?: string;
  }): Promise<TxlineProofReceipt>;
}

export type PaperAction = "flag for review" | "monitor scenario" | "pause scenario";

export type AgentState =
  | "idle"
  | "watching"
  | "signal detected"
  | "paper action logged"
  | "resolved";

export interface RuleEvaluation {
  ruleId:
    | "SharpMovementRule"
    | "EventMismatchRule"
    | "MomentumShockRule"
    | "StaleLineRule";
  fired: boolean;
  strength: number;
  reason: string;
  threshold: string;
  action: PaperAction;
  riskNote: string;
}

export interface PaperActionLogEntry {
  id: string;
  timestampUtc: string;
  action: PaperAction;
  paperOnly: true;
  ruleId: RuleEvaluation["ruleId"];
  quoteId: string;
  matchId: string;
  ruleStrength: number;
  summary: string;
  riskNote: string;
}

export interface TranscriptEntry {
  id: string;
  timestampUtc: string;
  kind: "event" | "quote" | "rule" | "action" | "risk" | "resolution";
  title: string;
  message: string;
}

export interface AgentIncidentReplay {
  mode: TxlineMode;
  agentState: AgentState;
  match: TxlineMatch;
  currentQuote: TxlineOddsQuote;
  latestEvent?: TxlineMatchEvent;
  primarySignal: RuleEvaluation;
  ruleEvaluations: RuleEvaluation[];
  paperActions: PaperActionLogEntry[];
  transcript: TranscriptEntry[];
  riskNotes: string[];
  txlineEndpoints: string[];
}

export interface RuleInspection {
  ruleId: RuleEvaluation["ruleId"];
  state: "fired" | "rejected";
  inputQuote: Pick<
    TxlineOddsQuote,
    | "quoteId"
    | "matchId"
    | "marketType"
    | "selection"
    | "previousDecimalOdds"
    | "decimalOdds"
    | "movementBps"
    | "updatedAtUtc"
  >;
  eventWindowSeconds: number;
  thresholdBps: number;
  checkedEvents: TxlineMatchEvent[];
  matchedEvents: TxlineMatchEvent[];
  unmatchedEventTypes: TxlineMatchEvent["eventType"][];
  explanation: string;
  riskNote: string;
}

export interface RedactedIncidentExport {
  schema: "sharpedge.redactedIncident.v1";
  sourceMode: TxlineMode;
  generatedAtUtc: string;
  paperOnly: true;
  match: Pick<TxlineMatch, "matchId" | "competitionId" | "status" | "minute">;
  txlineEndpoints: string[];
  primarySignal: Pick<
    RuleEvaluation,
    "ruleId" | "fired" | "strength" | "threshold" | "reason" | "riskNote"
  >;
  paperAction: Pick<
    PaperActionLogEntry,
    "id" | "timestampUtc" | "action" | "paperOnly" | "ruleId" | "quoteId" | "matchId"
  >;
  riskNote: string;
}
