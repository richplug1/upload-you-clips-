import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Bug, Wifi, AlertCircle, Zap, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useErrorHandler, ErrorReport } from '../utils/errorHandler';

interface ErrorReporterProps {
  className?: string;
}

const ErrorReporter: React.FC<ErrorReporterProps> = ({ className = '' }) => {
  const [errors, setErrors] = useState<ErrorReport[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [expandedError, setExpandedError] = useState<string | null>(null);
  const { getErrors, getErrorStats, markAsResolved, clearErrors, onError } = useErrorHandler();

  useEffect(() => {
    // Initial load
    setErrors(getErrors({ resolved: false }));

    // Listen for new errors
    const unsubscribe = onError((error) => {
      setErrors(prev => [error, ...prev]);
      if (error.severity === 'high' || error.severity === 'critical') {
        setIsVisible(true);
      }
    });

    return unsubscribe;
  }, [getErrors, onError]);

  const stats = getErrorStats();
  const unresolved = errors.filter(e => !e.resolved);

  const getErrorIcon = (type: ErrorReport['type']) => {
    switch (type) {
      case 'javascript':
        return <Bug className="w-4 h-4" />;
      case 'network':
        return <Wifi className="w-4 h-4" />;
      case 'validation':
        return <AlertCircle className="w-4 h-4" />;
      case 'upload':
        return <Zap className="w-4 h-4" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: ErrorReport['severity']) => {
    switch (severity) {
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleResolve = (errorId: string) => {
    markAsResolved(errorId);
    setErrors(prev => prev.map(e => e.id === errorId ? { ...e, resolved: true } : e));
  };

  const handleClearAll = () => {
    clearErrors();
    setErrors([]);
    setIsVisible(false);
  };

  if (unresolved.length === 0) {
    return null;
  }

  return (
    <>
      {/* Error Counter Badge */}
      <div className={`fixed top-4 right-4 z-40 ${className}`}>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="relative flex items-center space-x-2 bg-red-500 text-white px-3 py-2 rounded-full shadow-lg hover:bg-red-600 transition-all duration-200"
        >
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">{unresolved.length}</span>
          {stats.bySeverity.critical > 0 && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
          )}
        </button>
      </div>

      {/* Error Panel */}
      {isVisible && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-end p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Error Reporter</h3>
                    <p className="text-sm text-gray-600">{unresolved.length} unresolved issues</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsVisible(false)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Stats */}
              <div className="mt-3 grid grid-cols-4 gap-2">
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">{stats.bySeverity.critical}</div>
                  <div className="text-xs text-gray-600">Critical</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">{stats.bySeverity.high}</div>
                  <div className="text-xs text-gray-600">High</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-600">{stats.bySeverity.medium}</div>
                  <div className="text-xs text-gray-600">Medium</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{stats.bySeverity.low}</div>
                  <div className="text-xs text-gray-600">Low</div>
                </div>
              </div>
            </div>

            {/* Error List */}
            <div className="overflow-y-auto max-h-96">
              {unresolved.map((error) => (
                <div key={error.id} className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getErrorIcon(error.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(error.severity)}`}>
                          {error.severity}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          {error.type}
                        </span>
                        {error.component && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                            {error.component}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-900 mb-2 line-clamp-2">
                        {error.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {error.timestamp.toLocaleTimeString()}
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setExpandedError(expandedError === error.id ? null : error.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 transition-colors flex items-center space-x-1"
                          >
                            {expandedError === error.id ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{expandedError === error.id ? 'Hide' : 'Details'}</span>
                          </button>
                          <button
                            onClick={() => handleResolve(error.id)}
                            className="text-xs text-green-600 hover:text-green-800 transition-colors"
                          >
                            Resolve
                          </button>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedError === error.id && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="space-y-2 text-xs">
                            <div>
                              <span className="font-medium text-gray-700">ID:</span>
                              <span className="ml-2 text-gray-600 font-mono">{error.id}</span>
                            </div>
                            {error.url && (
                              <div>
                                <span className="font-medium text-gray-700">URL:</span>
                                <span className="ml-2 text-gray-600 break-all">{error.url}</span>
                              </div>
                            )}
                            {error.action && (
                              <div>
                                <span className="font-medium text-gray-700">Action:</span>
                                <span className="ml-2 text-gray-600">{error.action}</span>
                              </div>
                            )}
                            {error.context && Object.keys(error.context).length > 0 && (
                              <div>
                                <span className="font-medium text-gray-700">Context:</span>
                                <pre className="ml-2 text-gray-600 text-xs bg-white p-2 rounded border overflow-x-auto">
                                  {JSON.stringify(error.context, null, 2)}
                                </pre>
                              </div>
                            )}
                            {error.stack && (
                              <div>
                                <span className="font-medium text-gray-700">Stack Trace:</span>
                                <pre className="ml-2 text-gray-600 text-xs bg-white p-2 rounded border overflow-x-auto max-h-32">
                                  {error.stack}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-600">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
                <button
                  onClick={handleClearAll}
                  className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ErrorReporter;
