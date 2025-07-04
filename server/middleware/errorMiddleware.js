const errorHandler = require('../services/errorHandler');
const logger = require('../services/logger');

/**
 * Middleware de gestion d'erreurs centralisé pour Express
 */

/**
 * Middleware pour capturer les erreurs 404
 */
const notFoundHandler = (req, res, next) => {
  const error = errorHandler.createError(
    errorHandler.errorTypes.API,
    `Route not found: ${req.method} ${req.url}`,
    {
      statusCode: 404,
      severity: errorHandler.severityLevels.LOW,
      context: {
        method: req.method,
        url: req.url,
        headers: req.headers
      },
      userMessage: 'La page ou ressource demandée n\'existe pas.',
      recoverable: true,
      retryable: false
    }
  );

  next(error);
};

/**
 * Middleware principal de gestion d'erreurs
 */
const errorMiddleware = async (error, req, res, next) => {
  try {
    // Gestion centralisée de l'erreur
    const handledError = await errorHandler.handleError(error, req);

    // Réponse JSON standardisée
    const response = {
      success: false,
      error: {
        id: handledError.id,
        type: handledError.type,
        message: handledError.message,
        code: handledError.code,
        recoverable: handledError.recoverable,
        retryable: handledError.retryable
      },
      timestamp: handledError.timestamp
    };

    // Ajouter des détails supplémentaires en mode développement
    if (process.env.NODE_ENV === 'development') {
      response.debug = {
        originalMessage: error.message,
        stack: error.stack,
        context: handledError.context
      };
    }

    // Envoyer la réponse
    res.status(handledError.statusCode || 500).json(response);

  } catch (handlingError) {
    // Fallback si la gestion d'erreur échoue
    logger.error('Error in error middleware', {
      originalError: error.message,
      handlingError: handlingError.message,
      stack: handlingError.stack
    });

    res.status(500).json({
      success: false,
      error: {
        id: 'middleware-failure',
        type: 'internal',
        message: 'Une erreur inattendue s\'est produite',
        recoverable: false,
        retryable: false
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Middleware pour capturer les erreurs async non gérées
 */
const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware de validation des erreurs de Joi/validation
 */
const validationErrorHandler = (error, req, res, next) => {
  if (error.name === 'ValidationError' || error.isJoi) {
    const validationError = errorHandler.createError(
      errorHandler.errorTypes.VALIDATION,
      error.details ? error.details.map(d => d.message).join(', ') : error.message,
      {
        statusCode: 400,
        severity: errorHandler.severityLevels.LOW,
        context: {
          fields: error.details ? error.details.map(d => d.path.join('.')) : [],
          validation: true
        },
        userMessage: 'Les données fournies ne sont pas valides.',
        recoverable: true,
        retryable: false
      }
    );

    next(validationError);
    return;
  }

  next(error);
};

/**
 * Middleware pour gérer les erreurs de taille de fichier
 */
const multerErrorHandler = (error, req, res, next) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    const fileSizeError = errorHandler.createError(
      errorHandler.errorTypes.VALIDATION,
      'File size exceeds maximum limit',
      {
        statusCode: 413,
        severity: errorHandler.severityLevels.MEDIUM,
        context: {
          fileSize: error.field,
          limit: error.limit
        },
        userMessage: 'Le fichier est trop volumineux. Taille maximale autorisée dépassée.',
        recoverable: true,
        retryable: false
      }
    );

    next(fileSizeError);
    return;
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    const unexpectedFileError = errorHandler.createError(
      errorHandler.errorTypes.VALIDATION,
      'Unexpected file field',
      {
        statusCode: 400,
        severity: errorHandler.severityLevels.MEDIUM,
        context: {
          field: error.field
        },
        userMessage: 'Type de fichier non autorisé.',
        recoverable: true,
        retryable: false
      }
    );

    next(unexpectedFileError);
    return;
  }

  next(error);
};

/**
 * Middleware pour gérer les erreurs de rate limiting
 */
const rateLimitErrorHandler = (error, req, res, next) => {
  if (error.name === 'RateLimitError' || error.status === 429) {
    const rateLimitError = errorHandler.createError(
      errorHandler.errorTypes.API,
      'Rate limit exceeded',
      {
        statusCode: 429,
        severity: errorHandler.severityLevels.MEDIUM,
        context: {
          limit: error.limit,
          windowMs: error.windowMs,
          ip: req.ip
        },
        userMessage: 'Trop de requêtes. Veuillez patienter avant de réessayer.',
        recoverable: true,
        retryable: true
      }
    );

    next(rateLimitError);
    return;
  }

  next(error);
};

/**
 * Middleware pour gérer les erreurs JWT
 */
const jwtErrorHandler = (error, req, res, next) => {
  if (error.name === 'JsonWebTokenError') {
    const jwtError = errorHandler.createError(
      errorHandler.errorTypes.AUTHENTICATION,
      'Invalid token',
      {
        statusCode: 401,
        severity: errorHandler.severityLevels.MEDIUM,
        context: {
          tokenError: error.message
        },
        userMessage: 'Token d\'authentification invalide. Veuillez vous reconnecter.',
        recoverable: false,
        retryable: false
      }
    );

    next(jwtError);
    return;
  }

  if (error.name === 'TokenExpiredError') {
    const expiredError = errorHandler.createError(
      errorHandler.errorTypes.AUTHENTICATION,
      'Token expired',
      {
        statusCode: 401,
        severity: errorHandler.severityLevels.MEDIUM,
        context: {
          expiredAt: error.expiredAt
        },
        userMessage: 'Session expirée. Veuillez vous reconnecter.',
        recoverable: false,
        retryable: false
      }
    );

    next(expiredError);
    return;
  }

  next(error);
};

/**
 * Middleware pour capturer les erreurs de base de données
 */
const databaseErrorHandler = (error, req, res, next) => {
  if (error.code === 'SQLITE_CONSTRAINT') {
    const constraintError = errorHandler.createError(
      errorHandler.errorTypes.DATABASE,
      'Database constraint violation',
      {
        statusCode: 400,
        severity: errorHandler.severityLevels.MEDIUM,
        context: {
          constraint: error.message
        },
        userMessage: 'Cette opération viole les contraintes de données.',
        recoverable: true,
        retryable: false
      }
    );

    next(constraintError);
    return;
  }

  if (error.code && error.code.startsWith('SQLITE_')) {
    const dbError = errorHandler.createError(
      errorHandler.errorTypes.DATABASE,
      `Database error: ${error.message}`,
      {
        statusCode: 500,
        severity: errorHandler.severityLevels.CRITICAL,
        context: {
          sqliteCode: error.code,
          errno: error.errno
        },
        userMessage: 'Erreur de base de données. Notre équipe a été notifiée.',
        recoverable: true,
        retryable: true
      }
    );

    next(dbError);
    return;
  }

  next(error);
};

/**
 * Configuration complète des middlewares d'erreur
 */
const setupErrorHandling = (app) => {
  // Middlewares de traitement spécifiques (dans l'ordre)
  app.use(validationErrorHandler);
  app.use(multerErrorHandler);
  app.use(rateLimitErrorHandler);
  app.use(jwtErrorHandler);
  app.use(databaseErrorHandler);

  // Handler pour les routes non trouvées
  app.use(notFoundHandler);

  // Middleware principal de gestion d'erreurs (doit être en dernier)
  app.use(errorMiddleware);

  // Gestionnaire d'erreurs non capturées
  process.on('uncaughtException', async (error) => {
    logger.error('Uncaught Exception', {
      message: error.message,
      stack: error.stack
    });

    await errorHandler.handleError(
      errorHandler.createError(
        errorHandler.errorTypes.INTERNAL,
        `Uncaught Exception: ${error.message}`,
        {
          severity: errorHandler.severityLevels.CRITICAL,
          context: { uncaught: true },
          recoverable: false
        }
      )
    );

    // Arrêter proprement l'application
    process.exit(1);
  });

  // Gestionnaire de promesses rejetées non gérées
  process.on('unhandledRejection', async (reason, promise) => {
    logger.error('Unhandled Rejection', {
      reason: reason,
      promise: promise
    });

    await errorHandler.handleError(
      errorHandler.createError(
        errorHandler.errorTypes.INTERNAL,
        `Unhandled Rejection: ${reason}`,
        {
          severity: errorHandler.severityLevels.CRITICAL,
          context: { unhandledRejection: true },
          recoverable: false
        }
      )
    );
  });
};

module.exports = {
  errorMiddleware,
  notFoundHandler,
  asyncErrorHandler,
  validationErrorHandler,
  multerErrorHandler,
  rateLimitErrorHandler,
  jwtErrorHandler,
  databaseErrorHandler,
  setupErrorHandling
};
