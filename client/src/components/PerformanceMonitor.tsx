import React, { useState, useEffect } from 'react';
import { usePerformance } from '../utils/performance';
import { Activity, Clock, Zap, Database, Wifi, TrendingUp } from 'lucide-react';

interface PerformanceMonitorProps {
  className?: string;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [webVitals, setWebVitals] = useState<any>(null);
  const { getMetrics, getCoreWebVitals } = usePerformance();

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(getMetrics());
    };

    const loadWebVitals = async () => {
      const vitals = await getCoreWebVitals();
      setWebVitals(vitals);
    };

    updateMetrics();
    loadWebVitals();

    const interval = setInterval(updateMetrics, 2000);
    return () => clearInterval(interval);
  }, [getMetrics, getCoreWebVitals]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPerformanceScore = () => {
    if (!webVitals) return 0;
    
    let score = 100;
    
    // First Contentful Paint (good: <1.8s, poor: >3s)
    if (webVitals.fcp > 3000) score -= 20;
    else if (webVitals.fcp > 1800) score -= 10;
    
    // Largest Contentful Paint (good: <2.5s, poor: >4s)
    if (webVitals.lcp > 4000) score -= 25;
    else if (webVitals.lcp > 2500) score -= 15;
    
    // First Input Delay (good: <100ms, poor: >300ms)
    if (webVitals.fid > 300) score -= 20;
    else if (webVitals.fid > 100) score -= 10;
    
    // Cumulative Layout Shift (good: <0.1, poor: >0.25)
    if (webVitals.cls > 0.25) score -= 25;
    else if (webVitals.cls > 0.1) score -= 15;
    
    return Math.max(0, score);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed top-4 left-4 bg-blue-500 text-white px-3 py-2 rounded-full text-sm hover:bg-blue-600 transition-colors z-40"
      >
        ⚡ Performance
      </button>
    );
  }

  const performanceScore = getPerformanceScore();

  return (
    <div className={`fixed top-4 left-4 bg-white rounded-2xl shadow-2xl p-4 max-w-sm z-50 border ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 flex items-center space-x-2">
          <Activity className="w-5 h-5 text-blue-500" />
          <span>Performance Monitor</span>
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      {/* Performance Score */}
      <div className="mb-4 text-center">
        <div className={`text-3xl font-bold ${getScoreColor(performanceScore)}`}>
          {performanceScore}
        </div>
        <div className="text-sm text-gray-500">Performance Score</div>
      </div>

      {/* Core Web Vitals */}
      {webVitals && (
        <div className="space-y-3 mb-4">
          <h4 className="font-semibold text-gray-800 text-sm">Core Web Vitals</h4>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-50 p-2 rounded">
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-blue-500" />
                <span className="font-medium">FCP</span>
              </div>
              <div className="text-gray-600">{(webVitals.fcp / 1000).toFixed(2)}s</div>
            </div>
            
            <div className="bg-gray-50 p-2 rounded">
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span className="font-medium">LCP</span>
              </div>
              <div className="text-gray-600">{(webVitals.lcp / 1000).toFixed(2)}s</div>
            </div>
            
            <div className="bg-gray-50 p-2 rounded">
              <div className="flex items-center space-x-1">
                <Zap className="w-3 h-3 text-yellow-500" />
                <span className="font-medium">FID</span>
              </div>
              <div className="text-gray-600">{webVitals.fid.toFixed(1)}ms</div>
            </div>
            
            <div className="bg-gray-50 p-2 rounded">
              <div className="flex items-center space-x-1">
                <Activity className="w-3 h-3 text-purple-500" />
                <span className="font-medium">CLS</span>
              </div>
              <div className="text-gray-600">{webVitals.cls.toFixed(3)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Runtime Metrics */}
      {metrics && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-800 text-sm">Runtime Metrics</h4>
          
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Database className="w-3 h-3 text-blue-500" />
                <span>Memory</span>
              </div>
              <span className="text-gray-600">{formatBytes(metrics.memoryUsage)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Wifi className="w-3 h-3 text-green-500" />
                <span>Requests</span>
              </div>
              <span className="text-gray-600">{metrics.networkRequests}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-purple-500" />
                <span>Render Time</span>
              </div>
              <span className="text-gray-600">{(metrics.renderTime / 1000).toFixed(2)}s</span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500 text-center">
        Real-time performance monitoring
      </div>
    </div>
  );
};

export default PerformanceMonitor;
