/**
 * Navigation detection for SPA and traditional page navigations.
 * Uses popstate event + URL polling (500ms interval) to detect URL changes.
 */

const POLL_INTERVAL_MS = 500;

export interface NavigationHandler {
  (url: string, title: string): void;
}

export interface NavigationDetector {
  start(handler: NavigationHandler): void;
  stop(): void;
}

/**
 * Create a navigation detector that monitors URL changes via:
 * 1. popstate event (browser back/forward)
 * 2. URL polling at 500ms interval (SPA pushState/replaceState)
 *
 * Filters duplicate consecutive navigations to the same URL.
 */
export function createNavigationDetector(): NavigationDetector {
  let lastUrl = '';
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let handler: NavigationHandler | null = null;
  let popstateListener: (() => void) | null = null;

  function checkNavigation(): void {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      handler?.(currentUrl, document.title);
    }
  }

  return {
    start(navHandler: NavigationHandler): void {
      handler = navHandler;
      lastUrl = location.href;

      // Listen for popstate (back/forward navigation)
      popstateListener = () => checkNavigation();
      window.addEventListener('popstate', popstateListener);

      // Poll for SPA navigation (pushState/replaceState don't fire events)
      pollTimer = setInterval(checkNavigation, POLL_INTERVAL_MS);
    },

    stop(): void {
      if (popstateListener) {
        window.removeEventListener('popstate', popstateListener);
        popstateListener = null;
      }
      if (pollTimer !== null) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
      handler = null;
    },
  };
}
