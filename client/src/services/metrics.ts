export interface UserMetrics {
  totalUploads: number;
  totalProcessingTime: number;
  totalClipsGenerated: number;
  averageClipDuration: number;
  popularAspectRatios: { [key: string]: number };
  uploadFrequency: { [key: string]: number };
  storageUsed: number;
  storageLimit: number;
}

export interface SystemMetrics {
  totalUsers: number;
  totalVideosProcessed: number;
  totalClipsGenerated: number;
  averageProcessingTime: number;
  systemUptime: number;
  queueLength: number;
}

export interface PerformanceMetrics {
  pageLoadTime: number;
  uploadSpeed: number;
  processingSpeed: number;
  apiResponseTime: number;
  errorRate: number;
}

class MetricsService {
  private metrics: { [key: string]: any } = {};
  private startTime = Date.now();

  /**
   * Track a custom event
   */
  trackEvent(eventName: string, properties?: { [key: string]: any }) {
    const event = {
      name: eventName,
      timestamp: Date.now(),
      properties: properties || {},
      sessionId: this.getSessionId()
    };

    // Store locally
    this.storeEvent(event);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Metrics Event:', event);
    }

    // In production, you would send this to your analytics service
    // this.sendToAnalytics(event);
  }

  /**
   * Track page views
   */
  trackPageView(page: string) {
    this.trackEvent('page_view', { page });
  }

  /**
   * Track user interactions
   */
  trackUserAction(action: string, properties?: { [key: string]: any }) {
    this.trackEvent('user_action', { action, ...properties });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metric: string, value: number, unit: string = 'ms') {
    this.trackEvent('performance', { metric, value, unit });
  }

  /**
   * Track errors
   */
  trackError(error: Error, context?: { [key: string]: any }) {
    this.trackEvent('error', {
      message: error.message,
      stack: error.stack,
      context
    });
  }

  /**
   * Get user metrics (mock implementation)
   */
  async getUserMetrics(): Promise<UserMetrics> {
    // In a real implementation, this would fetch from your backend
    return {
      totalUploads: this.getMetric('totalUploads', 0),
      totalProcessingTime: this.getMetric('totalProcessingTime', 0),
      totalClipsGenerated: this.getMetric('totalClipsGenerated', 0),
      averageClipDuration: this.getMetric('averageClipDuration', 45),
      popularAspectRatios: this.getMetric('popularAspectRatios', { '16:9': 60, '9:16': 30, '1:1': 10 }),
      uploadFrequency: this.getMetric('uploadFrequency', {}),
      storageUsed: this.getMetric('storageUsed', 256), // MB
      storageLimit: this.getMetric('storageLimit', 5000) // MB
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return {
      pageLoadTime: this.getMetric('pageLoadTime', performance.now()),
      uploadSpeed: this.getMetric('uploadSpeed', 0),
      processingSpeed: this.getMetric('processingSpeed', 0),
      apiResponseTime: this.getMetric('apiResponseTime', 0),
      errorRate: this.getMetric('errorRate', 0)
    };
  }

  /**
   * Start timing an operation
   */
  startTimer(operation: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.trackPerformance(operation, duration);
      return duration;
    };
  }

  /**
   * Increment a counter metric
   */
  incrementMetric(metric: string, value: number = 1) {
    const current = this.getMetric(metric, 0);
    this.setMetric(metric, current + value);
  }

  /**
   * Set a metric value
   */
  setMetric(metric: string, value: any) {
    this.metrics[metric] = value;
    
    // Persist to localStorage
    try {
      localStorage.setItem(`metrics_${metric}`, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to persist metric to localStorage:', error);
    }
  }

  /**
   * Get a metric value
   */
  getMetric(metric: string, defaultValue?: any): any {
    if (metric in this.metrics) {
      return this.metrics[metric];
    }

    // Try to load from localStorage
    try {
      const stored = localStorage.getItem(`metrics_${metric}`);
      if (stored) {
        const value = JSON.parse(stored);
        this.metrics[metric] = value;
        return value;
      }
    } catch (error) {
      console.warn('Failed to load metric from localStorage:', error);
    }

    return defaultValue;
  }

  /**
   * Get session ID
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  /**
   * Store event locally
   */
  private storeEvent(event: any) {
    try {
      const events = JSON.parse(localStorage.getItem('metrics_events') || '[]');
      events.push(event);
      
      // Keep only last 100 events to prevent localStorage bloat
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }
      
      localStorage.setItem('metrics_events', JSON.stringify(events));
    } catch (error) {
      console.warn('Failed to store event:', error);
    }
  }

  /**
   * Get stored events
   */
  getStoredEvents(): any[] {
    try {
      return JSON.parse(localStorage.getItem('metrics_events') || '[]');
    } catch (error) {
      console.warn('Failed to load stored events:', error);
      return [];
    }
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics = {};
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('metrics_'));
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear metrics from localStorage:', error);
    }
  }
}

export const metricsService = new MetricsService();
