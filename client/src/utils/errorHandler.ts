// Error Handler & Reporter System
export interface ErrorReport {
  id: string;
  timestamp: Date;
  type: 'javascript' | 'network' | 'validation' | 'upload' | 'processing' | 'user';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stack?: string;
  url?: string;
  userAgent: string;
  userId?: string;
  context?: Record<string, any>;
  component?: string;
  action?: string;
  resolved?: boolean;
}

export interface ErrorHandlerConfig {
  enableReporting: boolean;
  enableLogging: boolean;
  maxErrors: number;
  reportEndpoint?: string;
  enableUserNotification: boolean;
  enableRetry: boolean;
}

class ErrorHandler {
  private config: ErrorHandlerConfig;
  private errors: ErrorReport[] = [];
  private errorCallbacks: ((error: ErrorReport) => void)[] = [];

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      enableReporting: true,
      enableLogging: true,
      maxErrors: 100,
      enableUserNotification: true,
      enableRetry: true,
      ...config
    };

    this.setupGlobalErrorHandlers();
  }

  private setupGlobalErrorHandlers() {
    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      this.captureError({
        type: 'javascript',
        severity: 'high',
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        context: {
          line: event.lineno,
          column: event.colno
        }
      });
    });

    // Handle promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        type: 'javascript',
        severity: 'high',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        context: {
          reason: event.reason
        }
      });
    });

    // Handle network errors
    this.setupNetworkErrorHandling();
  }

  private setupNetworkErrorHandling() {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (!response.ok) {
          this.captureError({
            type: 'network',
            severity: response.status >= 500 ? 'high' : 'medium',
            message: `Network Error: ${response.status} ${response.statusText}`,
            url: typeof args[0] === 'string' ? args[0] : (args[0] as Request).url,
            context: {
              status: response.status,
              statusText: response.statusText,
              method: typeof args[1] === 'object' ? args[1]?.method : 'GET'
            }
          });
        }
        return response;
      } catch (error) {
        this.captureError({
          type: 'network',
          severity: 'high',
          message: `Fetch Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          url: typeof args[0] === 'string' ? args[0] : (args[0] as Request).url,
          stack: error instanceof Error ? error.stack : undefined,
          context: {
            method: typeof args[1] === 'object' ? args[1]?.method : 'GET'
          }
        });
        throw error;
      }
    };
  }

  public captureError(errorData: Partial<ErrorReport>) {
    const error: ErrorReport = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      resolved: false,
      ...errorData
    } as ErrorReport;

    this.errors.push(error);

    // Maintain max errors limit
    if (this.errors.length > this.config.maxErrors) {
      this.errors = this.errors.slice(-this.config.maxErrors);
    }

    if (this.config.enableLogging) {
      this.logError(error);
    }

    if (this.config.enableReporting) {
      this.reportError(error);
    }

    // Notify listeners
    this.errorCallbacks.forEach(callback => callback(error));

    return error;
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logError(error: ErrorReport) {
    const logMethod = error.severity === 'critical' || error.severity === 'high' ? 'error' : 'warn';
    console[logMethod](`[ERROR ${error.id}]`, {
      type: error.type,
      severity: error.severity,
      message: error.message,
      component: error.component,
      action: error.action,
      timestamp: error.timestamp.toISOString(),
      context: error.context
    });

    if (error.stack) {
      console[logMethod](`[ERROR ${error.id} STACK]`, error.stack);
    }
  }

  private async reportError(error: ErrorReport) {
    if (!this.config.reportEndpoint) return;

    try {
      await fetch(this.config.reportEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(error)
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  public onError(callback: (error: ErrorReport) => void) {
    this.errorCallbacks.push(callback);
    return () => {
      this.errorCallbacks = this.errorCallbacks.filter(cb => cb !== callback);
    };
  }

  public getErrors(filters?: {
    type?: ErrorReport['type'];
    severity?: ErrorReport['severity'];
    resolved?: boolean;
    component?: string;
  }): ErrorReport[] {
    if (!filters) return [...this.errors];

    return this.errors.filter(error => {
      if (filters.type && error.type !== filters.type) return false;
      if (filters.severity && error.severity !== filters.severity) return false;
      if (filters.resolved !== undefined && error.resolved !== filters.resolved) return false;
      if (filters.component && error.component !== filters.component) return false;
      return true;
    });
  }

  public markAsResolved(errorId: string) {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
    }
  }

  public clearErrors() {
    this.errors = [];
  }

  public getErrorStats() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return {
      total: this.errors.length,
      unresolved: this.errors.filter(e => !e.resolved).length,
      lastHour: this.errors.filter(e => e.timestamp >= oneHourAgo).length,
      lastDay: this.errors.filter(e => e.timestamp >= oneDayAgo).length,
      bySeverity: {
        low: this.errors.filter(e => e.severity === 'low').length,
        medium: this.errors.filter(e => e.severity === 'medium').length,
        high: this.errors.filter(e => e.severity === 'high').length,
        critical: this.errors.filter(e => e.severity === 'critical').length
      },
      byType: {
        javascript: this.errors.filter(e => e.type === 'javascript').length,
        network: this.errors.filter(e => e.type === 'network').length,
        validation: this.errors.filter(e => e.type === 'validation').length,
        upload: this.errors.filter(e => e.type === 'upload').length,
        processing: this.errors.filter(e => e.type === 'processing').length,
        user: this.errors.filter(e => e.type === 'user').length
      }
    };
  }

  // Utility methods for specific error types
  public captureUploadError(message: string, context?: any) {
    return this.captureError({
      type: 'upload',
      severity: 'medium',
      message,
      component: 'UploadSection',
      context
    });
  }

  public captureProcessingError(message: string, context?: any) {
    return this.captureError({
      type: 'processing',
      severity: 'high',
      message,
      component: 'ClipGeneration',
      context
    });
  }

  public captureValidationError(message: string, context?: any) {
    return this.captureError({
      type: 'validation',
      severity: 'low',
      message,
      component: 'Form',
      context
    });
  }

  public captureUserError(message: string, action?: string, context?: any) {
    return this.captureError({
      type: 'user',
      severity: 'low',
      message,
      action,
      context
    });
  }
}

// Singleton instance
export const errorHandler = new ErrorHandler({
  enableReporting: true, // Activé pour envoyer les erreurs au backend
  reportEndpoint: '/api/errors',
  enableLogging: true,
  enableUserNotification: false,
  enableRetry: true
});

// React Hook for error handling
export const useErrorHandler = () => {
  return {
    captureError: errorHandler.captureError.bind(errorHandler),
    captureUploadError: errorHandler.captureUploadError.bind(errorHandler),
    captureProcessingError: errorHandler.captureProcessingError.bind(errorHandler),
    captureValidationError: errorHandler.captureValidationError.bind(errorHandler),
    captureUserError: errorHandler.captureUserError.bind(errorHandler),
    getErrors: errorHandler.getErrors.bind(errorHandler),
    getErrorStats: errorHandler.getErrorStats.bind(errorHandler),
    markAsResolved: errorHandler.markAsResolved.bind(errorHandler),
    clearErrors: errorHandler.clearErrors.bind(errorHandler),
    onError: errorHandler.onError.bind(errorHandler)
  };
};
