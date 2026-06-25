import { replayEvents, replayMatches, replayOdds, replayProofs } from "./replayFixtures";
import type {
  MatchStatus,
  TxlineClient,
  TxlineClientError,
  TxlineMatch,
  TxlineMatchEvent,
  TxlineOddsQuote,
  TxlineProofReceipt
} from "./types";

export class ReplayTxlineClient implements TxlineClient {
  mode = "replay" as const;

  async getMatches(params: {
    competitionId?: string;
    status?: MatchStatus;
    fromUtc?: string;
    toUtc?: string;
  }): Promise<TxlineMatch[]> {
    return replayMatches.filter((match) => {
      const competitionMatches =
        params.competitionId === undefined || match.competitionId === params.competitionId;
      const statusMatches = params.status === undefined || match.status === params.status;
      const afterFrom = params.fromUtc === undefined || match.kickoffUtc >= params.fromUtc;
      const beforeTo = params.toUtc === undefined || match.kickoffUtc <= params.toUtc;

      return competitionMatches && statusMatches && afterFrom && beforeTo;
    });
  }

  async getMatch(matchId: string): Promise<TxlineMatch> {
    const match = replayMatches.find((candidate) => candidate.matchId === matchId);
    if (!match) {
      throw replayError(`Replay fixture match not found: ${matchId}`);
    }

    return match;
  }

  async getMatchEvents(params: {
    matchId: string;
    sinceEventId?: string;
    limit?: number;
  }): Promise<TxlineMatchEvent[]> {
    const matchEvents = replayEvents.filter((event) => event.matchId === params.matchId);
    const startIndex =
      params.sinceEventId === undefined
        ? 0
        : matchEvents.findIndex((event) => event.eventId === params.sinceEventId) + 1;

    return matchEvents.slice(Math.max(0, startIndex), params.limit);
  }

  async getOdds(params: {
    matchId: string;
    marketType?: TxlineOddsQuote["marketType"];
  }): Promise<TxlineOddsQuote[]> {
    return replayOdds.filter(
      (quote) =>
        quote.matchId === params.matchId &&
        (params.marketType === undefined || quote.marketType === params.marketType)
    );
  }

  async streamMatch(params: {
    matchId: string;
    replaySpeed?: 1 | 5 | 20;
    onEvent: (event: TxlineMatchEvent) => void;
    onOdds: (quote: TxlineOddsQuote) => void;
    onError: (error: TxlineClientError) => void;
  }): Promise<{ close(): Promise<void> }> {
    const replaySpeed = params.replaySpeed ?? 1;
    const orderedItems = [
      ...replayEvents
        .filter((event) => event.matchId === params.matchId)
        .map((event) => ({ type: "event" as const, timestampUtc: event.receivedAtUtc, event })),
      ...replayOdds
        .filter((quote) => quote.matchId === params.matchId)
        .map((quote) => ({ type: "quote" as const, timestampUtc: quote.updatedAtUtc, quote }))
    ].sort((first, second) => first.timestampUtc.localeCompare(second.timestampUtc));

    if (orderedItems.length === 0) {
      params.onError(replayError(`Replay stream missing for match: ${params.matchId}`));
    }

    const timers = orderedItems.map((item, index) =>
      window.setTimeout(() => {
        if (item.type === "event") {
          params.onEvent(item.event);
        } else {
          params.onOdds(item.quote);
        }
      }, (index * 900) / replaySpeed)
    );

    return {
      async close() {
        timers.forEach((timer) => window.clearTimeout(timer));
      }
    };
  }

  async getProofReceipt(params: {
    matchId: string;
    statKey: string;
    expectedValue?: string;
  }): Promise<TxlineProofReceipt> {
    const receipt = replayProofs.find(
      (proof) => proof.matchId === params.matchId && proof.statKey === params.statKey
    );
    if (!receipt) {
      throw replayError(`Replay proof not found: ${params.matchId}/${params.statKey}`);
    }

    return receipt;
  }
}

function replayError(message: string): TxlineClientError {
  const error = new Error(message) as TxlineClientError;
  error.code = "TXLINE_REPLAY_FIXTURE_MISSING";
  error.recoverable = true;
  error.fallbackMode = "replay";
  return error;
}
