import { useEffect, useRef } from 'react';

interface UsePageScrollableOptions {
  enableDefense?: boolean;
  defenseInterval?: number;
  debug?: boolean;
}

/**
 * Custom hook: Enable page-level scrolling
 * Handles timing, style application, and defensive checks
 */
export function usePageScrollable(options: UsePageScrollableOptions = {}) {
  const {
    enableDefense = true,
    defenseInterval = 1000,
    debug = false,
  } = options;

  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const log = debug ? console.log : () => {};

    const html = document.documentElement;
    const body = document.body;

    // Save original styles
    const originalStyles = {
      htmlHeight: html.style.height,
      bodyHeight: body.style.height,
      bodyOverflow: body.style.overflow,
      bodyMaxHeight: body.style.maxHeight,
    };

    // Immediately add class
    body.classList.add('page-scrollable');
    log('[usePageScrollable] Added page-scrollable class');

    // Style application with retry mechanism
    const applyStyles = (retryCount = 0): (() => void) | null => {
      const nextDiv = document.getElementById('__next');

      if (!nextDiv && retryCount < 5) {
        log(`[usePageScrollable] __next not found, retry ${retryCount + 1}`);
        setTimeout(() => applyStyles(retryCount + 1), 50 * (retryCount + 1));
        return null;
      }

      const originalNextStyles = {
        height: nextDiv?.style.height || '',
        maxHeight: nextDiv?.style.maxHeight || '',
      };

      // Apply critical styles (using !important)
      html.style.setProperty('height', 'auto', 'important');
      body.style.setProperty('height', 'auto', 'important');
      body.style.setProperty('overflow-y', 'auto', 'important');
      body.style.setProperty('overflow-x', 'hidden', 'important');
      body.style.setProperty('max-height', 'none', 'important');

      if (nextDiv) {
        nextDiv.style.setProperty('height', 'auto', 'important');
        nextDiv.style.setProperty('min-height', '100vh', 'important');
        nextDiv.style.setProperty('max-height', 'none', 'important');
      }

      log('[usePageScrollable] Applied scrollable styles');

      // Defense mechanism: periodically check and restore styles
      let defenseTimer: NodeJS.Timeout | null = null;

      if (enableDefense) {
        defenseTimer = setInterval(() => {
          const currentBody = document.body;
          const currentNext = document.getElementById('__next');
          let restored = false;

          if (!currentBody.classList.contains('page-scrollable')) {
            log('[usePageScrollable] Restoring page-scrollable class');
            currentBody.classList.add('page-scrollable');
            restored = true;
          }

          if (currentBody.style.height !== 'auto') {
            log('[usePageScrollable] Restoring body.height');
            currentBody.style.setProperty('height', 'auto', 'important');
            restored = true;
          }

          if (currentBody.style.overflowY !== 'auto') {
            log('[usePageScrollable] Restoring body.overflowY');
            currentBody.style.setProperty('overflow-y', 'auto', 'important');
            restored = true;
          }

          if (currentNext && currentNext.style.height !== 'auto') {
            log('[usePageScrollable] Restoring __next.height');
            currentNext.style.setProperty('height', 'auto', 'important');
            restored = true;
          }
        }, defenseInterval);
      }

      // Cleanup function
      return () => {
        if (defenseTimer) {
          clearInterval(defenseTimer);
        }

        body.classList.remove('page-scrollable');

        // Restore original styles
        html.style.height = originalStyles.htmlHeight;
        body.style.height = originalStyles.bodyHeight;
        body.style.overflow = originalStyles.bodyOverflow;
        body.style.maxHeight = originalStyles.bodyMaxHeight;

        if (nextDiv) {
          nextDiv.style.height = originalNextStyles.height;
          nextDiv.style.maxHeight = originalNextStyles.maxHeight;
        }

        log('[usePageScrollable] Cleaned up scrollable styles');
      };
    };

    // Apply styles in the next frame (ensures DOM is rendered)
    requestAnimationFrame(() => {
      const cleanup = applyStyles();
      if (cleanup) {
        cleanupRef.current = cleanup;
      }
    });

    // Cleanup on component unmount
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [enableDefense, defenseInterval, debug]);
}
