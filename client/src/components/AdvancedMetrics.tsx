import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, Video, Users, Download, Eye, BarChart3, PieChart as PieChartIcon } from 'lucide-react';

interface MetricsData {
  totalVideos: number;
  totalClips: number;
  totalViews: number;
  totalDownloads: number;
  avgProcessingTime: number;
  successRate: number;
  popularFormats: { name: string; value: number; color: string }[];
  dailyActivity: { day: string; uploads: number; clips: number }[];
  processingTimes: { timeRange: string; count: number }[];
}

const AdvancedMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricsData>({
    totalVideos: 0,
    totalClips: 0,
    totalViews: 0,
    totalDownloads: 0,
    avgProcessingTime: 0,
    successRate: 0,
    popularFormats: [],
    dailyActivity: [],
    processingTimes: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchMetrics();
  }, [timeRange]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      // Simuler des données pour l'instant
      // TODO: Remplacer par un appel API réel vers /api/analytics/metrics
      const mockData: MetricsData = {
        totalVideos: 156,
        totalClips: 623,
        totalViews: 12450,
        totalDownloads: 3280,
        avgProcessingTime: 45,
        successRate: 96.8,
        popularFormats: [
          { name: 'MP4', value: 65, color: '#3b82f6' },
          { name: 'MOV', value: 20, color: '#10b981' },
          { name: 'AVI', value: 10, color: '#f59e0b' },
          { name: 'MKV', value: 5, color: '#ef4444' }
        ],
        dailyActivity: [
          { day: 'Lun', uploads: 12, clips: 48 },
          { day: 'Mar', uploads: 19, clips: 76 },
          { day: 'Mer', uploads: 15, clips: 60 },
          { day: 'Jeu', uploads: 22, clips: 88 },
          { day: 'Ven', uploads: 18, clips: 72 },
          { day: 'Sam', uploads: 8, clips: 32 },
          { day: 'Dim', uploads: 6, clips: 24 }
        ],
        processingTimes: [
          { timeRange: '0-30s', count: 45 },
          { timeRange: '30s-1m', count: 32 },
          { timeRange: '1-2m', count: 18 },
          { timeRange: '2-5m', count: 12 },
          { timeRange: '5m+', count: 5 }
        ]
      };
      
      setTimeout(() => {
        setMetrics(mockData);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Erreur lors du chargement des métriques:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = 
    ({ title, value, icon, color }) => (
      <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderLeftColor: color }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
          <div className="p-3 rounded-full" style={{ backgroundColor: `${color}20` }}>
            {icon}
          </div>
        </div>
      </div>
    );

  const SimpleBarChart: React.FC<{ data: { day: string; uploads: number; clips: number }[] }> = ({ data }) => {
    const maxValue = Math.max(...data.map(d => Math.max(d.uploads, d.clips)));
    
    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-8 text-sm font-medium text-gray-600">{item.day}</div>
            <div className="flex-1 flex space-x-2">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <div 
                    className="h-3 bg-blue-500 rounded"
                    style={{ width: `${(item.uploads / maxValue) * 100}%` }}
                  ></div>
                  <span className="text-xs text-gray-500">{item.uploads}</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <div 
                    className="h-3 bg-green-500 rounded"
                    style={{ width: `${(item.clips / maxValue) * 100}%` }}
                  ></div>
                  <span className="text-xs text-gray-500">{item.clips}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div className="flex justify-center space-x-6 text-xs text-gray-500 mt-2">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Uploads</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Clips</span>
          </div>
        </div>
      </div>
    );
  };

  const SimplePieChart: React.FC<{ data: { name: string; value: number; color: string }[] }> = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-sm font-medium text-gray-700">{item.name}</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-gray-900">{item.value}%</div>
              <div className="text-xs text-gray-500">({Math.round((item.value / 100) * total)} vidéos)</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Métriques Avancées</h2>
        <select 
          value={timeRange} 
          onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="7d">7 derniers jours</option>
          <option value="30d">30 derniers jours</option>
          <option value="90d">90 derniers jours</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Vidéos Uploadées"
          value={metrics.totalVideos}
          icon={<Video className="w-6 h-6 text-blue-600" />}
          color="#3b82f6"
        />
        <StatCard
          title="Clips Générés"
          value={metrics.totalClips}
          icon={<TrendingUp className="w-6 h-6 text-green-600" />}
          color="#10b981"
        />
        <StatCard
          title="Vues Totales"
          value={metrics.totalViews.toLocaleString()}
          icon={<Eye className="w-6 h-6 text-purple-600" />}
          color="#8b5cf6"
        />
        <StatCard
          title="Téléchargements"
          value={metrics.totalDownloads.toLocaleString()}
          icon={<Download className="w-6 h-6 text-orange-600" />}
          color="#f59e0b"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Activité Quotidienne</h3>
          </div>
          <SimpleBarChart data={metrics.dailyActivity} />
        </div>

        {/* Popular Formats */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <PieChartIcon className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Formats Populaires</h3>
          </div>
          <SimplePieChart data={metrics.popularFormats} />
        </div>
      </div>

      {/* Processing Times */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Temps de Traitement</h3>
        </div>
        <div className="space-y-3">
          {metrics.processingTimes.map((item, index) => {
            const maxCount = Math.max(...metrics.processingTimes.map(p => p.count));
            return (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-16 text-sm font-medium text-gray-600">{item.timeRange}</div>
                <div className="flex-1 flex items-center space-x-2">
                  <div 
                    className="h-4 bg-purple-500 rounded"
                    style={{ width: `${(item.count / maxCount) * 100}%` }}
                  ></div>
                  <span className="text-sm text-gray-700">{item.count} vidéos</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Résumé des Performances</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600">{metrics.successRate}%</div>
            <div className="text-sm text-gray-600">Taux de Réussite</div>
            <div className="text-xs text-gray-500 mt-1">Traitement des vidéos</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">{metrics.avgProcessingTime}s</div>
            <div className="text-sm text-gray-600">Temps Moyen</div>
            <div className="text-xs text-gray-500 mt-1">Par vidéo traitée</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-3xl font-bold text-purple-600">
              {metrics.totalVideos > 0 ? (metrics.totalClips / metrics.totalVideos).toFixed(1) : '0'}
            </div>
            <div className="text-sm text-gray-600">Clips par Vidéo</div>
            <div className="text-xs text-gray-500 mt-1">Ratio de génération</div>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">📊 Intégration API</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>• <strong>TODO:</strong> Connecter à l'API pour récupérer les vraies métriques</p>
          <p>• <strong>Endpoint suggéré:</strong> <code className="bg-blue-100 px-2 py-1 rounded">GET /api/analytics/metrics?timeRange={timeRange}</code></p>
          <p>• <strong>Données en temps réel:</strong> WebSocket pour les mises à jour live</p>
        </div>
      </div>
    </div>
  );
};

export default AdvancedMetrics;
