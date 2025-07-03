import { VideoClip, Job } from '../App';
import DashboardCard from './DashboardCard';
import { BarChart3, TrendingUp, Clock, Users, Download, Share2 } from 'lucide-react';

interface AdvancedMetricsProps {
  currentJob: Job | null;
  clips: VideoClip[];
}

const AdvancedMetrics = ({ currentJob, clips }: AdvancedMetricsProps) => {
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

  const getAverageClipDuration = () => {
    if (clips.length === 0) return 0;
    return clips.reduce((acc, clip) => acc + clip.duration, 0) / clips.length;
  };

  const getClipsWithSubtitles = () => {
    return clips.filter(clip => clip.hasSubtitles).length;
  };

  const aspectRatios = getClipsByAspectRatio();
  const totalDuration = clips.reduce((acc, clip) => acc + clip.duration, 0);

  if (clips.length === 0) {
    return null;
  }

  return (
    <DashboardCard
      title="Advanced Analytics"
      description="Detailed insights about your generated clips"
      icon={<BarChart3 className="w-6 h-6 text-white" />}
      gradient="from-indigo-50 to-purple-100"
      className="card-reveal hover-lift"
    >
      <div className="space-y-6">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <p className="text-lg font-bold text-blue-600">{formatDuration(totalDuration)}</p>
            <p className="text-xs text-gray-600">Total Duration</p>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <p className="text-lg font-bold text-green-600">{formatDuration(getAverageClipDuration())}</p>
            <p className="text-xs text-gray-600">Avg Duration</p>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <Users className="w-5 h-5 text-white" />
            </div>
            <p className="text-lg font-bold text-purple-600">{getClipsWithSubtitles()}</p>
            <p className="text-xs text-gray-600">With Subtitles</p>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <p className="text-lg font-bold text-orange-600">{Object.keys(aspectRatios).length}</p>
            <p className="text-xs text-gray-600">Aspect Ratios</p>
          </div>
        </div>

        {/* Aspect Ratio Distribution */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Aspect Ratio Distribution</h4>
          <div className="space-y-2">
            {Object.entries(aspectRatios).map(([ratio, count]) => {
              const percentage = (count / clips.length) * 100;
              const getColorByRatio = (ratio: string) => {
                switch (ratio) {
                  case '16:9': return 'from-blue-400 to-blue-600';
                  case '9:16': return 'from-green-400 to-green-600';
                  case '1:1': return 'from-purple-400 to-purple-600';
                  default: return 'from-gray-400 to-gray-600';
                }
              };

              return (
                <div key={ratio} className="flex items-center space-x-3">
                  <div className="w-16 text-sm font-medium text-gray-600">{ratio}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`bg-gradient-to-r ${getColorByRatio(ratio)} h-2 rounded-full transition-all duration-1000 ease-out`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-12 text-sm font-semibold text-gray-700 text-right">
                    {count}
                  </div>
                  <div className="w-12 text-xs text-gray-500 text-right">
                    {percentage.toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Performance Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl">
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                <Download className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Ready for Download</p>
                <p className="text-xs text-gray-600">{clips.length} clips processed</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Share2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Optimized for Social</p>
                <p className="text-xs text-gray-600">Multiple aspect ratios</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex flex-wrap gap-2">
            <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors">
              Export Analytics
            </button>
            <button className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors">
              Download Report
            </button>
            <button className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200 transition-colors">
              Share Insights
            </button>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
};

export default AdvancedMetrics;
