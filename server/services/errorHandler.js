const logger = require('./logger');
const database = require('../models/database');

/**
 * Service centralisé de gestion des erreurs
 * Intègre logging, tracking, notifications et récupération
 */
class ErrorHandlerService {
  constructor() {
    this.errorTypes = {
      VALIDATION: 'validation',
      AUTHENTICATION: 'authentication',
      AUTHORIZATION: 'authorization',
      DATABASE: 'database',
      NETWORK: 'network',
      FILE_SYSTEM: 'file_system',
      CLOUD_STORAGE: 'cloud_storage',
      EMAIL: 'email',
      PAYMENT: 'payment',
      API: 'api',
      INTERNAL: 'internal',
      CREDIT_SYSTEM: 'credit_system',
      VIDEO_PROCESSING: 'video_processing'
    };

    this.severityLevels = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };

    this.errorCount = new Map();
    this.lastErrors = [];
    this.maxLastErrors = 100;
  }

  /**
   * Crée une erreur standardisée avec contexte
   */
  createError(type, message, options = {}) {
    const {
      code = null,
      statusCode = 500,
      severity = this.severityLevels.MEDIUM,
      context = {},
      cause = null,
      recoverable = true,
      userMessage = null,
      retryable = false
    } = options;

    const error = new Error(message);
    error.type = type;
    error.code = code;
    error.statusCode = statusCode;
    error.severity = severity;
    error.context = context;
    error.cause = cause;
    error.recoverable = recoverable;
    error.userMessage = userMessage || this.getUserFriendlyMessage(type, message);
    error.retryable = retryable;
    error.timestamp = new Date().toISOString();
    error.id = this.generateErrorId();

    return error;
  }

  /**
   * Gère une erreur de manière centralisée
   */
  async handleError(error, req = null, additionalContext = {}) {
    try {
      // Enrichir l'erreur si ce n'est pas déjà fait
      if (!error.type) {
        error = this.enrichError(error, req, additionalContext);
      }

      // Logger l'erreur
      await this.logError(error, req);

      // Sauvegarder en base de données
      await this.saveErrorToDatabase(error, req);

      // Notifier si nécessaire
      await this.notifyIfCritical(error);

      // Mettre à jour les statistiques
      this.updateErrorStats(error);

      // Ajouter à l'historique récent
      this.addToRecentErrors(error);

      return {
        id: error.id,
        type: error.type,
        message: error.userMessage,
        code: error.code,
        statusCode: error.statusCode,
        recoverable: error.recoverable,
        retryable: error.retryable,
        timestamp: error.timestamp
      };
    } catch (handlingError) {
      // Erreur lors de la gestion d'erreur - fallback basic
      logger.error('Error in error handler', {
        originalError: error.message,
        handlingError: handlingError.message
      });
      
      return {
        id: 'error-handler-failure',
        type: this.errorTypes.INTERNAL,
        message: 'An unexpected error occurred',
        statusCode: 500,
        recoverable: false
      };
    }
  }

  /**
   * Enrichit une erreur basique avec plus d'informations
   */
  enrichError(error, req = null, additionalContext = {}) {
    const enrichedError = error;
    
    // Déterminer le type d'erreur
    enrichedError.type = this.detectErrorType(error);
    
    // Déterminer la sévérité
    enrichedError.severity = this.detectSeverity(error);
    
    // Ajouter un ID unique
    enrichedError.id = this.generateErrorId();
    
    // Timestamp
    enrichedError.timestamp = new Date().toISOString();
    
    // Context depuis la requête
    if (req) {
      enrichedError.context = {
        ...enrichedError.context,
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: req.user?.id,
        sessionId: req.sessionID,
        ...additionalContext
      };
    }
    
    // Message utilisateur
    enrichedError.userMessage = this.getUserFriendlyMessage(enrichedError.type, error.message);
    
    // Déterminer si récupérable
    enrichedError.recoverable = this.isRecoverable(enrichedError.type, error);
    
    // Déterminer si on peut réessayer
    enrichedError.retryable = this.isRetryable(enrichedError.type, error);

    return enrichedError;
  }

  /**
   * Détecte le type d'erreur automatiquement
   */
  detectErrorType(error) {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    // Erreurs de validation
    if (message.includes('validation') || message.includes('invalid') || error.name === 'ValidationError') {
      return this.errorTypes.VALIDATION;
    }

    // Erreurs d'authentification
    if (message.includes('unauthorized') || message.includes('authentication') || error.statusCode === 401) {
      return this.errorTypes.AUTHENTICATION;
    }

    // Erreurs d'autorisation
    if (message.includes('forbidden') || message.includes('permission') || error.statusCode === 403) {
      return this.errorTypes.AUTHORIZATION;
    }

    // Erreurs de base de données
    if (message.includes('sqlite') || message.includes('database') || stack.includes('database.js')) {
      return this.errorTypes.DATABASE;
    }

    // Erreurs de réseau
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return this.errorTypes.NETWORK;
    }

    // Erreurs de fichiers
    if (message.includes('enoent') || message.includes('file') || message.includes('directory')) {
      return this.errorTypes.FILE_SYSTEM;
    }

    // Erreurs de stockage cloud
    if (message.includes('s3') || message.includes('aws') || stack.includes('cloudstorage')) {
      return this.errorTypes.CLOUD_STORAGE;
    }

    // Erreurs d'email
    if (message.includes('smtp') || message.includes('email') || stack.includes('emailservice')) {
      return this.errorTypes.EMAIL;
    }

    // Erreurs de crédits
    if (message.includes('credit') || message.includes('subscription') || stack.includes('subscription')) {
      return this.errorTypes.CREDIT_SYSTEM;
    }

    // Erreurs de traitement vidéo
    if (message.includes('video') || message.includes('ffmpeg') || stack.includes('videoprocessor')) {
      return this.errorTypes.VIDEO_PROCESSING;
    }

    return this.errorTypes.INTERNAL;
  }

  /**
   * Détecte la sévérité automatiquement
   */
  detectSeverity(error) {
    // Erreurs critiques
    if (error.statusCode >= 500 || 
        error.message.includes('database') ||
        error.message.includes('critical') ||
        error.type === this.errorTypes.DATABASE) {
      return this.severityLevels.CRITICAL;
    }

    // Erreurs importantes
    if (error.statusCode >= 400 || 
        error.type === this.errorTypes.AUTHENTICATION ||
        error.type === this.errorTypes.AUTHORIZATION ||
        error.type === this.errorTypes.PAYMENT) {
      return this.severityLevels.HIGH;
    }

    // Erreurs moyennes
    if (error.type === this.errorTypes.VALIDATION ||
        error.type === this.errorTypes.FILE_SYSTEM ||
        error.type === this.errorTypes.CLOUD_STORAGE) {
      return this.severityLevels.MEDIUM;
    }

    return this.severityLevels.LOW;
  }

  /**
   * Détermine si une erreur est récupérable
   */
  isRecoverable(type, error) {
    const nonRecoverableTypes = [
      this.errorTypes.AUTHENTICATION,
      this.errorTypes.AUTHORIZATION
    ];

    const criticalDatabaseErrors = error.message.includes('corrupted') || 
                                   error.message.includes('locked');

    return !nonRecoverableTypes.includes(type) && !criticalDatabaseErrors;
  }

  /**
   * Détermine si on peut réessayer l'opération
   */
  isRetryable(type, error) {
    const retryableTypes = [
      this.errorTypes.NETWORK,
      this.errorTypes.CLOUD_STORAGE,
      this.errorTypes.EMAIL,
      this.errorTypes.API
    ];

    const temporaryErrors = error.message.includes('timeout') ||
                           error.message.includes('temporary') ||
                           error.message.includes('rate limit');

    return retryableTypes.includes(type) || temporaryErrors;
  }

  /**
   * Génère un message convivial pour l'utilisateur
   */
  getUserFriendlyMessage(type, originalMessage) {
    const messages = {
      [this.errorTypes.VALIDATION]: 'Les données fournies ne sont pas valides. Veuillez vérifier et réessayer.',
      [this.errorTypes.AUTHENTICATION]: 'Veuillez vous connecter pour continuer.',
      [this.errorTypes.AUTHORIZATION]: 'Vous n\'avez pas les permissions nécessaires pour cette action.',
      [this.errorTypes.DATABASE]: 'Un problème technique est survenu. Notre équipe a été notifiée.',
      [this.errorTypes.NETWORK]: 'Problème de connexion. Veuillez vérifier votre connexion internet.',
      [this.errorTypes.FILE_SYSTEM]: 'Erreur lors du traitement du fichier. Veuillez réessayer.',
      [this.errorTypes.CLOUD_STORAGE]: 'Problème de stockage temporaire. Veuillez réessayer dans quelques minutes.',
      [this.errorTypes.EMAIL]: 'Impossible d\'envoyer l\'email. Veuillez réessayer plus tard.',
      [this.errorTypes.PAYMENT]: 'Erreur de paiement. Veuillez vérifier vos informations de paiement.',
      [this.errorTypes.CREDIT_SYSTEM]: 'Problème avec votre système de crédits. Contactez le support.',
      [this.errorTypes.VIDEO_PROCESSING]: 'Erreur lors du traitement de la vidéo. Veuillez réessayer.',
      [this.errorTypes.API]: 'Erreur de communication. Veuillez réessayer dans quelques instants.',
      [this.errorTypes.INTERNAL]: 'Une erreur inattendue s\'est produite. Notre équipe a été notifiée.'
    };

    // Cas spéciaux pour des messages plus spécifiques
    if (originalMessage.includes('insufficient credits')) {
      return 'Crédits insuffisants pour cette opération. Veuillez recharger votre compte.';
    }

    if (originalMessage.includes('file too large')) {
      return 'Le fichier est trop volumineux. Taille maximale autorisée dépassée.';
    }

    if (originalMessage.includes('invalid format')) {
      return 'Format de fichier non supporté. Veuillez utiliser un format valide.';
    }

    return messages[type] || messages[this.errorTypes.INTERNAL];
  }

  /**
   * Log l'erreur avec le bon niveau
   */
  async logError(error, req = null) {
    const logData = {
      id: error.id,
      type: error.type,
      severity: error.severity,
      message: error.message,
      stack: error.stack,
      context: error.context,
      userMessage: error.userMessage,
      recoverable: error.recoverable,
      retryable: error.retryable
    };

    if (req) {
      logData.request = {
        url: req.url,
        method: req.method,
        headers: this.sanitizeHeaders(req.headers),
        body: this.sanitizeBody(req.body)
      };
    }

    switch (error.severity) {
      case this.severityLevels.CRITICAL:
        logger.error('CRITICAL ERROR', logData);
        break;
      case this.severityLevels.HIGH:
        logger.error('HIGH SEVERITY ERROR', logData);
        break;
      case this.severityLevels.MEDIUM:
        logger.warn('MEDIUM SEVERITY ERROR', logData);
        break;
      default:
        logger.info('LOW SEVERITY ERROR', logData);
    }
  }

  /**
   * Sauvegarde l'erreur en base de données
   */
  async saveErrorToDatabase(error, req = null) {
    try {
      await database.logError({
        id: error.id,
        type: error.type,
        severity: error.severity,
        message: error.message,
        stack: error.stack,
        context: JSON.stringify(error.context || {}),
        user_id: req?.user?.id || null,
        session_id: req?.sessionID || null,
        ip_address: req?.ip || null,
        user_agent: req?.get('User-Agent') || null,
        url: req?.url || null,
        method: req?.method || null,
        recoverable: error.recoverable ? 1 : 0,
        retryable: error.retryable ? 1 : 0,
        created_at: error.timestamp
      });
    } catch (dbError) {
      logger.error('Failed to save error to database', {
        originalError: error.id,
        dbError: dbError.message
      });
    }
  }

  /**
   * Notifie les administrateurs pour les erreurs critiques
   */
  async notifyIfCritical(error) {
    if (error.severity === this.severityLevels.CRITICAL) {
      try {
        // Ici on pourrait intégrer des notifications (email, Slack, etc.)
        logger.error('CRITICAL ERROR NOTIFICATION', {
          id: error.id,
          type: error.type,
          message: error.message,
          timestamp: error.timestamp
        });

        // TODO: Intégrer notification email si configuré
        // TODO: Intégrer webhook Slack/Discord si configuré
        // TODO: Intégrer SMS si configuré pour les erreurs très critiques
      } catch (notificationError) {
        logger.error('Failed to send critical error notification', {
          originalError: error.id,
          notificationError: notificationError.message
        });
      }
    }
  }

  /**
   * Met à jour les statistiques d'erreurs
   */
  updateErrorStats(error) {
    const key = `${error.type}_${error.severity}`;
    const count = this.errorCount.get(key) || 0;
    this.errorCount.set(key, count + 1);

    // Nettoyer les anciennes statistiques (garder seulement les 1000 dernières)
    if (this.errorCount.size > 1000) {
      const entries = Array.from(this.errorCount.entries());
      entries.splice(0, entries.length - 1000);
      this.errorCount = new Map(entries);
    }
  }

  /**
   * Ajoute à l'historique des erreurs récentes
   */
  addToRecentErrors(error) {
    this.lastErrors.unshift({
      id: error.id,
      type: error.type,
      severity: error.severity,
      message: error.message,
      timestamp: error.timestamp,
      recoverable: error.recoverable
    });

    // Garder seulement les N dernières erreurs
    if (this.lastErrors.length > this.maxLastErrors) {
      this.lastErrors = this.lastErrors.slice(0, this.maxLastErrors);
    }
  }

  /**
   * Nettoie les headers sensibles
   */
  sanitizeHeaders(headers) {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    const sanitized = { ...headers };
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * Nettoie le body des données sensibles
   */
  sanitizeBody(body) {
    if (!body || typeof body !== 'object') return body;
    
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'credit_card'];
    const sanitized = { ...body };
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * Génère un ID unique pour l'erreur
   */
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Récupère les statistiques d'erreurs
   */
  getErrorStats() {
    const stats = {};
    
    for (const [key, count] of this.errorCount.entries()) {
      const [type, severity] = key.split('_');
      if (!stats[type]) stats[type] = {};
      stats[type][severity] = count;
    }
    
    return {
      totalErrors: Array.from(this.errorCount.values()).reduce((a, b) => a + b, 0),
      byType: stats,
      recentErrors: this.lastErrors.slice(0, 10),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Middleware Express pour la gestion d'erreurs
   */
  expressMiddleware() {
    return async (error, req, res, next) => {
      const handledError = await this.handleError(error, req);
      
      res.status(handledError.statusCode || 500).json({
        success: false,
        error: {
          id: handledError.id,
          type: handledError.type,
          message: handledError.message,
          recoverable: handledError.recoverable,
          retryable: handledError.retryable
        },
        timestamp: handledError.timestamp
      });
    };
  }

  /**
   * Wrapper pour les fonctions async
   */
  asyncWrapper(fn) {
    return async (req, res, next) => {
      try {
        await fn(req, res, next);
      } catch (error) {
        await this.handleError(error, req);
        next(error);
      }
    };
  }
}

// Export singleton instance
const errorHandler = new ErrorHandlerService();
module.exports = errorHandler;
