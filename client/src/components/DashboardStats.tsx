import { VideoClip, Job } from '../types';
import DashboardCard from './DashboardCard';
import { TrendingUp, Clock, Zap, BarChart3 } from 'lucide-react';

interface DashboardStatsProps {
  currentJob: Job | null;
  clips: VideoClip[];
}

const DashboardStats = ({ currentJob, clips }: DashboardStatsProps) => {
  const getTotalDuration = () => {
    return clips.reduce((acc, clip) => acc + clip.duration, 0);
  };

  const getAverageClipDuration = () => {
    if (clips.length === 0) return 0;
    return getTotalDuration() / clips.length;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getClipsByAspectRatio = () => {
    const ratios = clips.reduce((acc, clip) => {
      acc[clip.aspectRatio] = (acc[clip.aspectRatio] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return ratios;
  };

  const aspectRatios = getClipsByAspectRatio();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {/* Processing Status */}
      <DashboardCard
        title="Status"
        icon={<TrendingUp className="w-6 h-6 text-white" />}
        gradient="from-emerald-50 to-teal-100"
        className="hover-lift"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Video Uploaded</span>
            <div className={`w-3 h-3 rounded-full ${currentJob ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Clips Generated</span>
            <div className={`w-3 h-3 rounded-full ${clips.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          </div>
          <div className="pt-2 border-t border-gray-100">
            <p className="text-2xl font-bold text-gray-900">
              {currentJob ? 'Ready' : 'Waiting'}
            </p>
            <p className="text-sm text-gray-500">
              {currentJob ? 'System ready for processing' : 'Upload a video to start'}
            </p>
          </div>
        </div>
      </DashboardCard>

      {/* Clips Count */}
      <DashboardCard
        title="Generated Clips"
        icon={<BarChart3 className="w-6 h-6 text-white" />}
        gradient="from-blue-50 to-indigo-100"
        className="hover-lift"
      >
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-4xl font-bold text-blue-600 mb-1">{clips.length}</p>
            <p className="text-sm text-gray-500">Total clips created</p>
          </div>
          {clips.length > 0 && (
            <div className="space-y-2">
              {Object.entries(aspectRatios).map(([ratio, count]) => (
                <div key={ratio} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{ratio}</span>
                  <span className="font-medium text-gray-900">{count as number}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardCard>

      {/* Duration Stats */}
      <DashboardCard
        title="Duration"
        icon={<Clock className="w-6 h-6 text-white" />}
        gradient="from-purple-50 to-pink-100"
        className="hover-lift"
      >
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600 mb-1">
              {formatDuration(getTotalDuration())}
            </p>
            <p className="text-sm text-gray-500">Total content duration</p>
          </div>
          {clips.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Average per clip</span>
                <span className="font-medium text-gray-900">
                  {formatDuration(getAverageClipDuration())}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Longest clip</span>
                <span className="font-medium text-gray-900">
                  {clips.length > 0 ? formatDuration(Math.max(...clips.map(c => c.duration))) : '0:00'}
                </span>
              </div>
            </div>
          )}
        </div>
      </DashboardCard>

      {/* Performance */}
      <DashboardCard
        title="Performance"
        icon={<Zap className="w-6 h-6 text-white" />}
        gradient="from-orange-50 to-red-100"
        className="hover-lift"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-orange-600">Fast</p>
              <p className="text-xs text-gray-500">Processing</p>
            </div>
            <div>
              <p className="text-lg font-bold text-red-600">HD</p>
              <p className="text-xs text-gray-500">Quality</p>
            </div>
          </div>
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Est. processing time</span>
              <span className="font-medium text-gray-900">~2-5min</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full" style={{ width: '85%' }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">System efficiency: 85%</p>
          </div>
        </div>
      </DashboardCard>
    </div>
  );
};

export default DashboardStats;
