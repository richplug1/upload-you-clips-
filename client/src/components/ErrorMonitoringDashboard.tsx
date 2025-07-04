import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  X, 
  RefreshCw, 
  Clock, 
  User, 
  Globe, 
  Code, 
  Database,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Shield,
  FileText,
  Download,
  TestTube,
  Search,
  Filter,
  Calendar,
  BarChart3,
  PieChart,
  Settings
} from 'lucide-react';

interface ErrorLog {
  id: string;
  type: string;
  severity: string;
  message: string;
  created_at: string;
  user_email?: string;
  url?: string;
  method?: string;
  ip_address?: string;
  recoverable: boolean;
  retryable: boolean;
}

interface ErrorStats {
  totalErrors: number;
  byType: Record<string, Record<string, number>>;
  recentErrors: ErrorLog[];
  lastUpdated: string;
}

const ErrorMonitoringDashboard: React.FC = () => {
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [errorStats, setErrorStats] = useState<ErrorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [filters, setFilters] = useState({
    severity: '',
    type: '',
    days: '7'
  });

  // Charger les statistiques d'erreurs
  const loadErrorStats = async () => {
    try {
      const response = await fetch(`/api/admin/errors/stats?days=${filters.days}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setErrorStats(data.data.inMemory);
      }
    } catch (error) {
      console.error('Failed to load error stats:', error);
    }
  };

  // Charger les logs d'erreurs
  const loadErrorLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '50',
        ...(filters.severity && { severity: filters.severity }),
        ...(filters.type && { type: filters.type })
      });

      const response = await fetch(`/api/admin/errors/logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setErrorLogs(data.data.logs);
      }
    } catch (error) {
      console.error('Failed to load error logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Générer une erreur de test
  const generateTestError = async () => {
    try {
      await fetch('/api/admin/errors/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'internal',
          severity: 'low',
          message: 'Test error from monitoring dashboard'
        })
      });
      
      // Recharger les données
      await Promise.all([loadErrorStats(), loadErrorLogs()]);
    } catch (error) {
      console.error('Failed to generate test error:', error);
    }
  };

  useEffect(() => {
    loadErrorStats();
    loadErrorLogs();
    
    // Rafraîchir automatiquement toutes les 30 secondes
    const interval = setInterval(() => {
      loadErrorStats();
      loadErrorLogs();
    }, 30000);

    return () => clearInterval(interval);
  }, [filters]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'database': return <Database className="w-4 h-4" />;
      case 'network': return <Globe className="w-4 h-4" />;
      case 'authentication': return <User className="w-4 h-4" />;
      case 'api': return <Code className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Monitoring des Erreurs</h1>
        <p className="text-gray-600">Surveillance et analyse des erreurs système en temps réel</p>
      </div>

      {/* Statistiques générales */}
      {errorStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Erreurs</h3>
            <p className="text-2xl font-bold text-gray-900">{errorStats.totalErrors}</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Erreurs Récentes</h3>
            <p className="text-2xl font-bold text-gray-900">{errorStats.recentErrors.length}</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Types d'Erreurs</h3>
            <p className="text-2xl font-bold text-gray-900">{Object.keys(errorStats.byType).length}</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Dernière MAJ</h3>
            <p className="text-sm text-gray-600">{new Date(errorStats.lastUpdated).toLocaleTimeString()}</p>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sévérité</label>
            <select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">Toutes</option>
              <option value="critical">Critique</option>
              <option value="high">Élevée</option>
              <option value="medium">Moyenne</option>
              <option value="low">Faible</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">Tous</option>
              <option value="database">Base de données</option>
              <option value="network">Réseau</option>
              <option value="authentication">Authentification</option>
              <option value="validation">Validation</option>
              <option value="api">API</option>
              <option value="internal">Interne</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Période</label>
            <select
              value={filters.days}
              onChange={(e) => setFilters({ ...filters, days: e.target.value })}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="1">24h</option>
              <option value="7">7 jours</option>
              <option value="30">30 jours</option>
            </select>
          </div>
          
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => Promise.all([loadErrorStats(), loadErrorLogs()])}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
            
            <button
              onClick={generateTestError}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
            >
              <AlertTriangle className="w-4 h-4" />
              Test
            </button>
          </div>
        </div>
      </div>

      {/* Liste des erreurs */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Logs d'Erreurs</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">Chargement des erreurs...</p>
          </div>
        ) : errorLogs.length === 0 ? (
          <div className="p-8 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">Aucune erreur trouvée</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {errorLogs.map((error) => (
              <div
                key={error.id}
                className="p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedError(error)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-1 rounded ${getSeverityColor(error.severity)}`}>
                      {getTypeIcon(error.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(error.severity)}`}>
                          {error.severity}
                        </span>
                        <span className="text-xs text-gray-500">{error.type}</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(error.created_at).toLocaleString()}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-900 mb-1 truncate">{error.message}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {error.user_email && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {error.user_email}
                          </span>
                        )}
                        {error.url && (
                          <span className="truncate max-w-xs">{error.method} {error.url}</span>
                        )}
                        {error.ip_address && (
                          <span>{error.ip_address}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 ml-4">
                    {error.recoverable && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        Récupérable
                      </span>
                    )}
                    {error.retryable && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        Retry
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de détail d'erreur */}
      {selectedError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium">Détails de l'Erreur</h3>
              <button
                onClick={() => setSelectedError(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                  <p className="text-sm font-mono bg-gray-100 p-2 rounded">{selectedError.id}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <p className="text-sm">{new Date(selectedError.created_at).toLocaleString()}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <p className="text-sm">{selectedError.type}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sévérité</label>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(selectedError.severity)}`}>
                    {selectedError.severity}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <p className="text-sm bg-gray-100 p-3 rounded">{selectedError.message}</p>
              </div>
              
              {selectedError.url && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                  <p className="text-sm font-mono bg-gray-100 p-2 rounded">{selectedError.method} {selectedError.url}</p>
                </div>
              )}
              
              <div className="flex gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Récupérable</label>
                  <span className={`px-2 py-1 rounded text-xs ${selectedError.recoverable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {selectedError.recoverable ? 'Oui' : 'Non'}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Retry possible</label>
                  <span className={`px-2 py-1 rounded text-xs ${selectedError.retryable ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                    {selectedError.retryable ? 'Oui' : 'Non'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorMonitoringDashboard;
