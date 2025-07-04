import React, { useState, useEffect } from 'react';
import { useErrorHandler } from '../utils/errorHandler';
import { AlertTriangle, X, AlertCircle, Info, CheckCircle } from 'lucide-react';

interface ErrorNotification {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  autoClose?: boolean;
  duration?: number;
}

interface ErrorNotificationSystemProps {
  maxNotifications?: number;
}

export const ErrorNotificationSystem: React.FC<ErrorNotificationSystemProps> = ({
  maxNotifications = 5
}) => {
  const [notifications, setNotifications] = useState<ErrorNotification[]>([]);
  const { onError } = useErrorHandler();

  useEffect(() => {
    const unsubscribe = onError((error) => {
      // Créer une notification basée sur l'erreur
      const notification: ErrorNotification = {
        id: error.id,
        type: error.severity === 'critical' || error.severity === 'high' ? 'error' : 'warning',
        title: getErrorTitle(error.type),
        message: getErrorMessage(error),
        autoClose: error.severity === 'low',
        duration: 5000
      };

      // Ajouter une action de retry si applicable
      if (error.type === 'network' || error.type === 'upload') {
        notification.action = {
          label: 'Réessayer',
          onClick: () => {
            // Logic pour retry l'action
            removeNotification(notification.id);
          }
        };
      }

      addNotification(notification);
    });

    return unsubscribe;
  }, []);

  const addNotification = (notification: ErrorNotification) => {
    setNotifications(prev => {
      const updated = [notification, ...prev];
      return updated.slice(0, maxNotifications);
    });

    if (notification.autoClose) {
      setTimeout(() => {
        removeNotification(notification.id);
      }, notification.duration || 5000);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getErrorTitle = (type: string): string => {
    const titles: Record<string, string> = {
      javascript: 'Erreur JavaScript',
      network: 'Erreur Réseau',
      validation: 'Erreur de Validation',
      upload: 'Erreur de Téléchargement',
      processing: 'Erreur de Traitement',
      user: 'Action Utilisateur'
    };
    return titles[type] || 'Erreur';
  };

  const getErrorMessage = (error: any): string => {
    // Prioriser le message utilisateur s'il existe
    if (error.context?.userMessage) {
      return error.context.userMessage;
    }
    
    // Messages par défaut basés sur le type d'erreur
    const defaultMessages: Record<string, string> = {
      network: 'Problème de connexion réseau. Vérifiez votre connexion Internet.',
      upload: 'Échec du téléchargement du fichier. Veuillez réessayer.',
      processing: 'Erreur lors du traitement de votre demande.',
      validation: 'Données saisies invalides. Veuillez corriger et réessayer.',
      javascript: 'Une erreur inattendue s\'est produite.',
      user: error.message || 'Action non autorisée.'
    };
    
    return defaultMessages[error.type] || error.message || 'Une erreur inattendue s\'est produite.';
  };

  const getIcon = (type: ErrorNotification['type']) => {
    const icons = {
      error: <AlertTriangle className="w-5 h-5 text-red-500" />,
      warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
      info: <Info className="w-5 h-5 text-blue-500" />,
      success: <CheckCircle className="w-5 h-5 text-green-500" />
    };
    return icons[type];
  };

  const getBackgroundColor = (type: ErrorNotification['type']) => {
    const colors = {
      error: 'bg-red-50 border-red-200',
      warning: 'bg-yellow-50 border-yellow-200',
      info: 'bg-blue-50 border-blue-200',
      success: 'bg-green-50 border-green-200'
    };
    return colors[type];
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg border shadow-lg ${getBackgroundColor(notification.type)} 
                     animate-in slide-in-from-right duration-300`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIcon(notification.type)}
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-gray-900">
                {notification.title}
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                {notification.message}
              </p>
              {notification.action && (
                <div className="mt-3">
                  <button
                    onClick={notification.action.onClick}
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    {notification.action.label}
                  </button>
                </div>
              )}
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => removeNotification(notification.id)}
                className="inline-flex text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Hook pour afficher des notifications personnalisées
export const useNotifications = () => {
  const addNotification = (notification: Omit<ErrorNotification, 'id'>) => {
    // Utilisation du système de notification global
    const notificationWithId = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    // Déclencher l'affichage de la notification
    window.dispatchEvent(new CustomEvent('addNotification', { 
      detail: notificationWithId 
    }));
  };

  const showSuccess = (message: string, title: string = 'Succès') => {
    addNotification({
      type: 'success',
      title,
      message,
      autoClose: true,
      duration: 3000
    });
  };

  const showError = (message: string, title: string = 'Erreur') => {
    addNotification({
      type: 'error',
      title,
      message,
      autoClose: false
    });
  };

  const showWarning = (message: string, title: string = 'Attention') => {
    addNotification({
      type: 'warning',
      title,
      message,
      autoClose: true,
      duration: 4000
    });
  };

  const showInfo = (message: string, title: string = 'Information') => {
    addNotification({
      type: 'info',
      title,
      message,
      autoClose: true,
      duration: 4000
    });
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

export default ErrorNotificationSystem;
