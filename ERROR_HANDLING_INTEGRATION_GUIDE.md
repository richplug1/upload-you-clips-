# Guide d'Intégration du Système de Gestion d'Erreurs

## Vue d'ensemble

Le système de gestion d'erreurs centralisé pour Upload You Clips fournit une infrastructure complète pour capturer, traiter, monitorer et répondre aux erreurs à travers l'application (frontend et backend).

## Architecture

### Backend (Node.js/Express)

#### 1. Service de Gestion d'Erreurs (`server/services/errorHandler.js`)
- **Types d'erreurs** : VALIDATION, AUTHENTICATION, AUTHORIZATION, FILE_SYSTEM, DATABASE, API, VIDEO_PROCESSING, CLOUD_STORAGE, EMAIL, INTERNAL
- **Niveaux de sévérité** : LOW, MEDIUM, HIGH, CRITICAL
- **Fonctionnalités** :
  - Création d'erreurs typées avec contexte
  - Messages utilisateur localisés
  - Logging automatique
  - Notifications configurables

#### 2. Middleware d'Erreurs (`server/middleware/errorMiddleware.js`)
- Gestionnaires spécialisés pour :
  - Erreurs de validation
  - Erreurs JWT
  - Erreurs Multer (upload)
  - Erreurs de rate limiting
  - Erreurs de base de données
  - Erreurs 404
  - Gestionnaire global
- Wrapper async pour les routes
- Configuration centralisée

#### 3. Base de Données (`server/models/database.js`)
- Tables : `error_logs`, `error_statistics`
- Méthodes :
  - `logError()` : Enregistrer une erreur
  - `getErrorLogs()` : Récupérer les logs avec filtrage
  - `getErrorStats()` : Statistiques d'erreurs
  - `cleanupErrorLogs()` : Nettoyage automatique

#### 4. Routes de Monitoring (`server/routes/errorMonitoring.js`)
- `GET /api/admin/errors/stats` : Statistiques d'erreurs
- `GET /api/admin/errors/logs` : Liste des logs
- `GET /api/admin/errors/log/:id` : Détail d'une erreur
- `POST /api/admin/errors/test` : Générer une erreur de test
- `DELETE /api/admin/errors/cleanup` : Nettoyer les anciens logs
- `GET /api/admin/errors/export` : Exporter les logs
- `GET /api/admin/errors/health` : État de santé du système

#### 5. Routes de Santé Système (`server/routes/systemHealth.js`)
- `GET /api/system/health` : Vérification complète du système
- `POST /api/system/test-error` : Test du système d'erreurs
- `DELETE /api/system/cleanup-errors` : Nettoyage manuel
- `GET /api/system/error-report` : Rapport détaillé d'erreurs

### Frontend (React/TypeScript)

#### 1. Gestionnaire d'Erreurs (`client/src/utils/errorHandler.ts`)
- **Interface `ErrorReport`** : Structure standardisée des erreurs
- **Classe `ErrorHandler`** : 
  - Capture automatique des erreurs JavaScript
  - Interception des erreurs réseau
  - Reporting vers le backend
  - Callbacks pour les composants
- **Hook `useErrorHandler`** : Interface React pour le gestionnaire

#### 2. Hooks Spécialisés (`client/src/hooks/useErrorHandling.ts`)
- `useApi()` : Gestion d'erreurs pour les appels API avec retry
- `useFileUpload()` : Gestion spécialisée pour les uploads
- `useFormErrors()` : Erreurs de validation de formulaires
- `useGlobalErrorMonitoring()` : Surveillance globale des erreurs

#### 3. Système de Notifications (`client/src/components/ErrorNotificationSystem.tsx`)
- Affichage des notifications d'erreurs
- Types : error, warning, info, success
- Actions contextuelles (retry, login, contact support)
- Fermeture automatique configurable

#### 4. Dashboard Admin (`client/src/components/ErrorMonitoringDashboard.tsx`)
- Statistiques en temps réel
- Liste des erreurs récentes
- Filtrage par type/sévérité
- Génération d'erreurs de test
- Export de données

#### 5. Configuration (`client/src/config/errorConfig.ts`)
- Messages d'erreur localisés en français
- Actions recommandées par type d'erreur
- Configuration de sévérité
- Mappage des codes d'erreur

## Utilisation

### Backend

#### Créer et gérer une erreur
```javascript
const errorHandler = require('./services/errorHandler');

// Créer une erreur
const error = errorHandler.createError(
  errorHandler.errorTypes.VALIDATION,
  'Email address is required',
  {
    severity: errorHandler.severityLevels.LOW,
    context: { field: 'email' },
    userMessage: 'Veuillez saisir une adresse email.'
  }
);

// Traiter l'erreur
const result = await errorHandler.handleError(error, req, { userId: user.id });
```

#### Intégrer dans une route
```javascript
const { asyncErrorHandler } = require('./middleware/errorMiddleware');

router.post('/upload', asyncErrorHandler(async (req, res) => {
  // Le middleware capture automatiquement les erreurs
  const result = await processUpload(req.file);
  res.json(result);
}));
```

### Frontend

#### Utiliser les hooks d'erreur
```typescript
import { useApi, useFileUpload } from '../hooks/useErrorHandling';

function MyComponent() {
  const api = useApi({
    retryCount: 3,
    onError: (error) => console.error('API Error:', error)
  });

  const handleSubmit = async () => {
    await api.execute(async () => {
      return fetch('/api/data').then(res => res.json());
    });
  };
}
```

#### Afficher des notifications
```typescript
import { useNotifications } from '../components/ErrorNotificationSystem';

function MyComponent() {
  const { showError, showSuccess } = useNotifications();

  const handleAction = async () => {
    try {
      await performAction();
      showSuccess('Action réalisée avec succès !');
    } catch (error) {
      showError('Échec de l\'action');
    }
  };
}
```

#### Capturer des erreurs manuellement
```typescript
import { useErrorHandler } from '../utils/errorHandler';

function MyComponent() {
  const { captureUploadError, captureProcessingError } = useErrorHandler();

  const handleUpload = async (file: File) => {
    try {
      await uploadFile(file);
    } catch (error) {
      captureUploadError('Upload failed', { fileName: file.name });
    }
  };
}
```

## Configuration

### Variables d'environnement
```env
# Configuration des erreurs
ERROR_NOTIFICATION_EMAIL=admin@example.com
ERROR_NOTIFICATION_SLACK_WEBHOOK=https://hooks.slack.com/...
ERROR_LOG_RETENTION_DAYS=30
ERROR_LOG_MAX_SIZE=1000

# Niveaux de log
LOG_LEVEL=info
ENABLE_ERROR_REPORTING=true
```

### Configuration frontend
```typescript
// Configuration du gestionnaire d'erreurs
export const errorHandler = new ErrorHandler({
  enableReporting: true,
  reportEndpoint: '/api/errors',
  enableLogging: true,
  enableUserNotification: true,
  enableRetry: true,
  maxErrors: 100
});
```

## Monitoring et Maintenance

### Endpoints de monitoring
- `/api/system/health` : État général du système
- `/api/admin/errors/stats` : Statistiques d'erreurs
- `/api/admin/errors/logs` : Logs récents

### Nettoyage automatique
- Les logs d'erreurs sont automatiquement nettoyés après 30 jours
- Limite de 1000 erreurs par utilisateur
- Rotation des logs système

### Alertes
- Erreurs critiques → notification immédiate
- Taux d'erreur élevé → alerte quotidienne
- Erreurs récurrentes → rapport hebdomadaire

## Bonnes Pratiques

### Backend
1. **Toujours utiliser le gestionnaire d'erreurs** centralisé
2. **Fournir des messages utilisateur** clairs et localisés
3. **Inclure du contexte** pour le debugging
4. **Choisir la bonne sévérité** pour chaque erreur
5. **Utiliser les middlewares** pour la gestion automatique

### Frontend
1. **Initialiser le monitoring global** dans App.tsx
2. **Utiliser les hooks spécialisés** pour les appels API
3. **Fournir des actions de récupération** dans les notifications
4. **Tester les chemins d'erreur** régulièrement
5. **Monitorer les performances** du système d'erreurs

## Tests

### Tests backend
```javascript
// Test du gestionnaire d'erreurs
describe('ErrorHandler', () => {
  it('should create error with correct structure', () => {
    const error = errorHandler.createError(
      errorHandler.errorTypes.VALIDATION,
      'Test error'
    );
    expect(error.isAppError).toBe(true);
  });
});
```

### Tests frontend
```typescript
// Test des hooks d'erreur
describe('useApi', () => {
  it('should retry on network error', async () => {
    const { result } = renderHook(() => useApi({ retryCount: 2 }));
    // Test logic
  });
});
```

## Déploiement

### Checklist de déploiement
- [ ] Configurer les variables d'environnement
- [ ] Vérifier les endpoints de monitoring
- [ ] Tester le système de notifications
- [ ] Configurer les alertes
- [ ] Valider les permissions admin
- [ ] Vérifier le nettoyage automatique

### Surveillance post-déploiement
- Monitorer le taux d'erreur pendant 24h
- Vérifier les notifications d'erreurs critiques
- Contrôler les performances du système
- Valider l'intégration frontend/backend

## Support et Maintenance

### Logs à surveiller
- `/server/logs/error.log` : Erreurs backend
- Console navigateur : Erreurs frontend
- Base de données : `error_logs` table

### Dépannage courant
1. **Erreurs non capturées** → Vérifier les middlewares
2. **Notifications non reçues** → Contrôler la configuration
3. **Performance dégradée** → Optimiser les logs
4. **Données manquantes** → Vérifier la base de données

### Contact
- Équipe technique : tech@uploadyouclips.com
- Documentation : /docs/error-handling
- Issues : GitHub repository
