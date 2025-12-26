/**
 * Performance monitoring utilities for KROG Chess
 */

interface PerformanceMetrics {
  pageLoadTime: number;
  domContentLoaded: number;
  firstPaint: number | null;
  firstContentfulPaint: number | null;
  largestContentfulPaint: number | null;
}

/**
 * Get performance metrics after page load
 */
export function getPerformanceMetrics(): PerformanceMetrics | null {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }

  const timing = performance.timing;
  const paintEntries = performance.getEntriesByType('paint');

  const firstPaint = paintEntries.find(e => e.name === 'first-paint');
  const fcp = paintEntries.find(e => e.name === 'first-contentful-paint');

  return {
    pageLoadTime: timing.loadEventEnd - timing.navigationStart,
    domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
    firstPaint: firstPaint ? firstPaint.startTime : null,
    firstContentfulPaint: fcp ? fcp.startTime : null,
    largestContentfulPaint: null, // Set by observer
  };
}

/**
 * Log performance metrics in development
 */
export function logPerformanceMetrics(): void {
  if (import.meta.env.PROD) return;

  window.addEventListener('load', () => {
    // Wait for metrics to be available
    setTimeout(() => {
      const metrics = getPerformanceMetrics();
      if (!metrics) return;

      console.log('%c Performance Metrics', 'color: #81b64c; font-weight: bold; font-size: 14px;');
      console.log(`  Page Load: ${metrics.pageLoadTime}ms`);
      console.log(`  DOM Content Loaded: ${metrics.domContentLoaded}ms`);

      if (metrics.firstPaint) {
        console.log(`  First Paint: ${metrics.firstPaint.toFixed(2)}ms`);
      }
      if (metrics.firstContentfulPaint) {
        console.log(`  First Contentful Paint: ${metrics.firstContentfulPaint.toFixed(2)}ms`);
      }

      // Observe LCP
      if ('PerformanceObserver' in window) {
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            console.log(`  Largest Contentful Paint: ${lastEntry.startTime.toFixed(2)}ms`);
          });
          lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        } catch {
          // LCP not supported
        }
      }
    }, 0);
  });
}

/**
 * Measure component render time
 */
export function measureRender(componentName: string): () => void {
  if (import.meta.env.PROD) return () => {};

  const start = performance.now();
  return () => {
    const duration = performance.now() - start;
    if (duration > 16) { // Longer than one frame
      console.warn(`Slow render: ${componentName} took ${duration.toFixed(2)}ms`);
    }
  };
}

/**
 * Report Web Vitals (can be sent to analytics)
 */
export function reportWebVitals(onReport: (metric: { name: string; value: number }) => void): void {
  if ('PerformanceObserver' in window) {
    // FCP
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            onReport({ name: 'FCP', value: entry.startTime });
          }
        });
      });
      fcpObserver.observe({ type: 'paint', buffered: true });
    } catch {
      // Not supported
    }

    // LCP
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        onReport({ name: 'LCP', value: lastEntry.startTime });
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      // Not supported
    }

    // CLS
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceEntry[];
        entries.forEach((entry) => {
          if (!(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput) {
            clsValue += (entry as PerformanceEntry & { value?: number }).value || 0;
          }
        });
        onReport({ name: 'CLS', value: clsValue });
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch {
      // Not supported
    }
  }
}
