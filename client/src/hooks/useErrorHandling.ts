import { useCallback, useEffect, useState } from 'react';
import { useErrorHandler } from '../utils/errorHandler';

interface ApiError {
  message: string;
  details?: any;
  status?: number;
  code?: string;
}

interface UseApiOptions {
  onError?: (error: ApiError) => void;
  onSuccess?: (data: any) => void;
  retryCount?: number;
  retryDelay?: number;
}

/**
 * Hook pour gérer les appels API avec gestion d'erreurs intégrée
 */
export const useApi = <T = any>(options: UseApiOptions = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [data, setData] = useState<T | null>(null);
  const { captureError } = useErrorHandler();

  const { onError, onSuccess, retryCount = 0, retryDelay = 1000 } = options;

  const execute = useCallback(async (
    apiCall: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    let lastError: ApiError | null = null;
    
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const result = await apiCall();
        setData(result);
        setLoading(false);
        
        if (onSuccess) {
          onSuccess(result);
        }
        
        return result;
      } catch (err: any) {
        const apiError: ApiError = {
          message: err.message || 'Une erreur est survenue',
          details: err.details || err.response?.data,
          status: err.status || err.response?.status,
          code: err.code
        };

        lastError = apiError;

        // Capturer l'erreur pour le monitoring
        captureError({
          type: 'network',
          severity: apiError.status && apiError.status >= 500 ? 'high' : 'medium',
          message: apiError.message,
          context: {
            ...context,
            attempt: attempt + 1,
            maxAttempts: retryCount + 1,
            status: apiError.status,
            apiError: apiError.details
          }
        });

        // Si c'est le dernier essai ou une erreur non-retryable
        if (attempt === retryCount || !isRetryableError(apiError)) {
          break;
        }

        // Attendre avant le prochain essai
        if (attempt < retryCount) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        }
      }
    }

    setError(lastError);
    setLoading(false);

    if (onError && lastError) {
      onError(lastError);
    }

    return null;
  }, [onError, onSuccess, retryCount, retryDelay, captureError]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    reset
  };
};

/**
 * Hook spécialisé pour les uploads de fichiers avec gestion d'erreurs
 */
export const useFileUpload = (options: UseApiOptions = {}) => {
  const [progress, setProgress] = useState(0);
  const { captureUploadError } = useErrorHandler();
  const api = useApi(options);

  const upload = useCallback(async (
    file: File,
    uploadUrl: string,
    additionalData?: Record<string, any>
  ) => {
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
      });
    }

    try {
      const result = await api.execute(async () => {
        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        return await response.json();
      }, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadUrl
      });

      if (result) {
        setProgress(100);
      }

      return result;
    } catch (error: any) {
      captureUploadError(error.message, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadUrl
      });
      throw error;
    }
  }, [api, captureUploadError]);

  return {
    ...api,
    progress,
    upload
  };
};

/**
 * Hook pour la gestion d'erreurs dans les formulaires
 */
export const useFormErrors = () => {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { captureValidationError } = useErrorHandler();

  const setFieldError = useCallback((field: string, message: string) => {
    setFieldErrors(prev => ({ ...prev, [field]: message }));
    
    captureValidationError(`Validation error for field: ${field}`, {
      field,
      message
    });
  }, [captureValidationError]);

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  const hasErrors = Object.keys(fieldErrors).length > 0;

  return {
    fieldErrors,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    hasErrors
  };
};

/**
 * Hook pour surveiller les erreurs JavaScript globales
 */
export const useGlobalErrorMonitoring = () => {
  const { captureError } = useErrorHandler();

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      captureError({
        type: 'javascript',
        severity: 'high',
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        context: {
          line: event.lineno,
          column: event.colno,
          globalError: true
        }
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      captureError({
        type: 'javascript',
        severity: 'high',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        context: {
          reason: event.reason,
          promiseRejection: true
        }
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [captureError]);
};

// Fonctions utilitaires
const isRetryableError = (error: ApiError): boolean => {
  // Erreurs temporaires qui peuvent être retryées
  const retryableStatuses = [408, 429, 500, 502, 503, 504];
  return !error.status || retryableStatuses.includes(error.status);
};

// Export des hooks principaux
export { useErrorHandler } from '../utils/errorHandler';
