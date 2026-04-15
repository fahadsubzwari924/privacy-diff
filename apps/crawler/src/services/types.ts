import type { SessionResult } from '../crawler/types.js';

export const ZERO_SESSION: SessionResult = {
  finalUrl: '',
  pageTitle: '',
  botDetected: false,
  metrics: { requestCount: 0, totalBytes: 0, loadTimeMs: 0 },
  blockedList: [],
};
