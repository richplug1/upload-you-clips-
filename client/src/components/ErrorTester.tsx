import React, { useState } from 'react';
import { useErrorHandler } from '../utils/errorHandler';
import { Bug, Wifi, AlertCircle, Zap, RefreshCw, User } from 'lucide-react';

const ErrorTester: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { 
    captureError, 
    captureUploadError, 
    captureProcessingError, 
    captureValidationError, 
    captureUserError 
  } = useErrorHandler();

  const triggerJavaScriptError = () => {
    throw new Error('Test JavaScript Error - This is intentional for testing');
  };

  const triggerNetworkError = async () => {
    try {
      await fetch('/api/nonexistent-endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' })
      });
    } catch (error) {
      // This will be caught by our network error handler
    }
  };

  const triggerUploadError = () => {
    captureUploadError('Test upload error - File too large', {
      fileName: 'test_video.mp4',
      fileSize: 600 * 1024 * 1024, // 600MB
      maxSize: 500 * 1024 * 1024   // 500MB limit
    });
  };

  const triggerProcessingError = () => {
    captureProcessingError('Test processing error - AI service unavailable', {
      jobId: 'test-job-123',
      stage: 'clip_generation',
      retryCount: 3
    });
  };

  const triggerValidationError = () => {
    captureValidationError('Test validation error - Invalid video format', {
      expectedFormat: ['mp4', 'mov', 'avi'],
      actualFormat: 'txt'
    });
  };

  const triggerUserError = () => {
    captureUserError('Test user error - Clicked delete by mistake', 'accidental_delete', {
      clipId: 'clip-test-456',
      timestamp: new Date().toISOString()
    });
  };

  const triggerCriticalError = () => {
    captureError({
      type: 'javascript',
      severity: 'critical',
      message: 'Critical system error - Memory leak detected',
      component: 'ErrorTester',
      context: {
        memoryUsage: '95%',
        availableMemory: '128MB',
        errorType: 'memory_leak'
      }
    });
  };

  const triggerPromiseRejection = () => {
    Promise.reject(new Error('Unhandled Promise Rejection Test'));
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 bg-orange-500 text-white px-4 py-2 rounded-full text-sm hover:bg-orange-600 transition-colors"
      >
        🐛 Error Tester
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 bg-white rounded-2xl shadow-2xl p-6 max-w-sm z-50 border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 flex items-center space-x-2">
          <Bug className="w-5 h-5 text-orange-500" />
          <span>Error Tester</span>
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      <div className="space-y-2">
        <button
          onClick={triggerJavaScriptError}
          className="w-full flex items-center space-x-2 bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm hover:bg-red-200 transition-colors"
        >
          <Bug className="w-4 h-4" />
          <span>JavaScript Error</span>
        </button>

        <button
          onClick={triggerNetworkError}
          className="w-full flex items-center space-x-2 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm hover:bg-blue-200 transition-colors"
        >
          <Wifi className="w-4 h-4" />
          <span>Network Error</span>
        </button>

        <button
          onClick={triggerUploadError}
          className="w-full flex items-center space-x-2 bg-yellow-100 text-yellow-700 px-3 py-2 rounded-lg text-sm hover:bg-yellow-200 transition-colors"
        >
          <Zap className="w-4 h-4" />
          <span>Upload Error</span>
        </button>

        <button
          onClick={triggerProcessingError}
          className="w-full flex items-center space-x-2 bg-purple-100 text-purple-700 px-3 py-2 rounded-lg text-sm hover:bg-purple-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Processing Error</span>
        </button>

        <button
          onClick={triggerValidationError}
          className="w-full flex items-center space-x-2 bg-orange-100 text-orange-700 px-3 py-2 rounded-lg text-sm hover:bg-orange-200 transition-colors"
        >
          <AlertCircle className="w-4 h-4" />
          <span>Validation Error</span>
        </button>

        <button
          onClick={triggerUserError}
          className="w-full flex items-center space-x-2 bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm hover:bg-green-200 transition-colors"
        >
          <User className="w-4 h-4" />
          <span>User Error</span>
        </button>

        <button
          onClick={triggerCriticalError}
          className="w-full flex items-center space-x-2 bg-red-200 text-red-800 px-3 py-2 rounded-lg text-sm hover:bg-red-300 transition-colors font-bold"
        >
          <Bug className="w-4 h-4" />
          <span>CRITICAL Error</span>
        </button>

        <button
          onClick={triggerPromiseRejection}
          className="w-full flex items-center space-x-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors"
        >
          <AlertCircle className="w-4 h-4" />
          <span>Promise Rejection</span>
        </button>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        Use these buttons to test the error reporting system
      </div>
    </div>
  );
};

export default ErrorTester;
