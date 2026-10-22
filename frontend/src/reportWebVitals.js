// Core Web Vitals performance observer (LCP, INP, CLS, TTFB)
export const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    if ('PerformanceObserver' in window) {
      // TTFB (Time to First Byte)
      try {
        const navEntry = performance.getEntriesByType('navigation')[0];
        if (navEntry) {
          onPerfEntry({ name: 'TTFB', value: navEntry.responseStart });
        }
      } catch (_err) {
        // PerformanceObserver or navigation timing not supported in this environment
      }

      // LCP (Largest Contentful Paint)
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          onPerfEntry({ name: 'LCP', value: lastEntry.startTime });
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (_err) {
        // PerformanceObserver for LCP not supported
      }

      // CLS (Cumulative Layout Shift)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          onPerfEntry({ name: 'CLS', value: clsValue });
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch (_err) {
        // PerformanceObserver for CLS not supported
      }

      // INP (Interaction to Next Paint)
      try {
        const inpObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            onPerfEntry({ name: 'INP', value: entry.duration });
          }
        });
        inpObserver.observe({ type: 'event', buffered: true, durationThreshold: 16 });
      } catch (_err) {
        // PerformanceObserver for INP not supported
      }
    }
  }
};
