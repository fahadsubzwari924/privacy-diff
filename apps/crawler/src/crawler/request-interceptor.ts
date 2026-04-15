import type { Route } from 'playwright';
import { lookupTracker } from '@privacy-diff/shared';
import type { InterceptOptions } from './types.js';

export function createInterceptHandler(options: InterceptOptions) {
  return (route: Route): void => {
    const url = route.request().url();
    let hostname: string;
    try {
      hostname = new URL(url).hostname;
    } catch {
      void route.continue();
      return;
    }

    if (options.block) {
      const tracker = lookupTracker(hostname, options.trackerMap);
      if (tracker) {
        const parsed = new URL(url);
        options.onBlocked({
          url: `${parsed.hostname}${parsed.pathname}`,
          hostname,
          tracker,
        });
        void route.abort();
        return;
      }
    }

    void route.continue();
  };
}
