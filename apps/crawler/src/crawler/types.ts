import type { BlockedRequest, SessionMetrics, TrackerEntry } from '@privacy-diff/shared';

export type SessionResult = {
  finalUrl: string;
  pageTitle: string;
  botDetected: boolean;
  metrics: SessionMetrics;
  blockedList: BlockedRequest[];
};

export interface InterceptOptions {
  block: boolean;
  trackerMap: Record<string, TrackerEntry>;
  onBlocked: (req: BlockedRequest) => void;
};
