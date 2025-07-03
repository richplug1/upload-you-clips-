// Performance monitoring and optimization utilities
export interface PerformanceMetrics {
  renderTime: number;
  loadTime: number;
  bundleSize: number;
  memoryUsage: number;
  networkRequests: number;
  cacheHitRate: number;
}

export interface PerformanceConfig {
  enableMonitoring: boolean;
  enableLazyLoading: boolean;
  enableVirtualization: boolean;
  cacheTimeout: number;
  debounceDelay: number;
  throttleDelay: number;
}

class PerformanceManager {
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics;
  private observers: PerformanceObserver[] = [];

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enableMonitoring: true,
      enableLazyLoading: true,
      enableVirtualization: true,
      cacheTimeout: 300000, // 5 minutes
      debounceDelay: 300,
      throttleDelay: 100,
      ...config
    };

    this.metrics = {
      renderTime: 0,
      loadTime: 0,
      bundleSize: 0,
      memoryUsage: 0,
      networkRequests: 0,
      cacheHitRate: 0
    };

    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    if (!this.config.enableMonitoring) return;

    // Monitor paint metrics
    if ('PerformanceObserver' in window) {
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.renderTime = entry.startTime;
          }
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);
    }

    // Monitor memory usage
    this.monitorMemoryUsage();

    // Monitor network requests
    this.monitorNetworkRequests();
  }

  private monitorMemoryUsage() {
    if ('memory' in performance) {
      const updateMemory = () => {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = memory.usedJSHeapSize;
      };
      
      updateMemory();
      setInterval(updateMemory, 5000); // Update every 5 seconds
    }
  }

  private monitorNetworkRequests() {
    const originalFetch = window.fetch;
    let requestCount = 0;

    window.fetch = async (...args) => {
      requestCount++;
      this.metrics.networkRequests = requestCount;
      const startTime = performance.now();
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        
        // Log slow requests
        if (endTime - startTime > 1000) {
          console.warn(`Slow request detected: ${args[0]} took ${endTime - startTime}ms`);
        }
        
        return response;
      } catch (error) {
        throw error;
      }
    };
  }

  // Debounce utility
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number = this.config.debounceDelay
  ): (...args: Parameters<T>) => void {
    let timeoutId: number;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => func.apply(this, args), delay);
    };
  }

  // Throttle utility
  throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number = this.config.throttleDelay
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func.apply(this, args);
      }
    };
  }

  // Memoization utility
  memoize<T extends (...args: any[]) => any>(func: T): T {
    const cache = new Map();
    return ((...args: Parameters<T>) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = func.apply(this, args);
      cache.set(key, result);
      return result;
    }) as T;
  }

  // Lazy loading utility
  createIntersectionObserver(
    callback: IntersectionObserverCallback,
    options: IntersectionObserverInit = {}
  ): IntersectionObserver {
    const defaultOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    };

    return new IntersectionObserver(callback, defaultOptions);
  }

  // Image optimization
  optimizeImage(url: string, width?: number, height?: number, quality: number = 85): string {
    if (!url) return '';
    
    // Add optimization parameters for supported services
    const urlObj = new URL(url, window.location.origin);
    
    if (width) urlObj.searchParams.set('w', width.toString());
    if (height) urlObj.searchParams.set('h', height.toString());
    urlObj.searchParams.set('q', quality.toString());
    urlObj.searchParams.set('auto', 'format');
    
    return urlObj.toString();
  }

  // Bundle splitting utility
  async loadModule<T>(importFunc: () => Promise<{ default: T }>): Promise<T> {
    try {
      const module = await importFunc();
      return module.default;
    } catch (error) {
      console.error('Failed to load module:', error);
      throw error;
    }
  }

  // Performance metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Get Core Web Vitals
  getCoreWebVitals(): Promise<{
    fcp: number;
    lcp: number;
    fid: number;
    cls: number;
  }> {
    return new Promise((resolve) => {
      let fcp = 0, lcp = 0, fid = 0, cls = 0;

      // First Contentful Paint
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            fcp = entry.startTime;
          }
        }
      }).observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        lcp = entries[entries.length - 1].startTime;
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const firstInputEntry = entry as any;
          if (firstInputEntry.processingStart) {
            fid = firstInputEntry.processingStart - firstInputEntry.startTime;
          }
        }
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            cls += (entry as any).value;
          }
        }
      }).observe({ entryTypes: ['layout-shift'] });

      // Return metrics after a delay
      setTimeout(() => {
        resolve({ fcp, lcp, fid, cls });
      }, 3000);
    });
  }

  // Cleanup
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Singleton instance
export const performanceManager = new PerformanceManager();

// React hooks for performance optimization
export const usePerformance = () => {
  return {
    debounce: performanceManager.debounce.bind(performanceManager),
    throttle: performanceManager.throttle.bind(performanceManager),
    memoize: performanceManager.memoize.bind(performanceManager),
    optimizeImage: performanceManager.optimizeImage.bind(performanceManager),
    getMetrics: performanceManager.getMetrics.bind(performanceManager),
    getCoreWebVitals: performanceManager.getCoreWebVitals.bind(performanceManager)
  };
};

// Virtual scrolling utility
export class VirtualScroller {
  private container: HTMLElement;
  private itemHeight: number;
  private items: any[];
  private visibleRange: { start: number; end: number } = { start: 0, end: 0 };

  constructor(container: HTMLElement, itemHeight: number, items: any[]) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.items = items;
    this.updateVisibleRange();
  }

  private updateVisibleRange() {
    const scrollTop = this.container.scrollTop;
    const containerHeight = this.container.clientHeight;
    
    const start = Math.floor(scrollTop / this.itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / this.itemHeight) + 1,
      this.items.length
    );

    this.visibleRange = { start, end };
  }

  getVisibleItems() {
    return this.items.slice(this.visibleRange.start, this.visibleRange.end);
  }

  getVisibleRange() {
    return this.visibleRange;
  }

  onScroll() {
    this.updateVisibleRange();
  }
}

// Image preloader
export const preloadImages = (urls: string[]): Promise<void[]> => {
  return Promise.all(
    urls.map(url => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
      });
    })
  );
};

// Service Worker registration for caching
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully');
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
};
