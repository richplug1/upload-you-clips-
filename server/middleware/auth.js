const jwt = require('jsonwebtoken');
const errorHandler = require('../services/errorHandler');

/**
 * Middleware d'authentification par token JWT
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    const error = errorHandler.createError(
      errorHandler.errorTypes.AUTHENTICATION,
      'Token d\'accès manquant',
      {
        statusCode: 401,
        severity: errorHandler.severityLevels.LOW,
        context: {
          endpoint: req.path,
          method: req.method,
          ip: req.ip
        },
        userMessage: 'Authentification requise',
        retryable: false
      }
    );
    return res.status(401).json(errorHandler.formatErrorResponse(error));
  }

  jwt.verify(token, process.env.JWT_SECRET || 'default-secret', (err, user) => {
    if (err) {
      const error = errorHandler.createError(
        errorHandler.errorTypes.AUTHENTICATION,
        'Token d\'accès invalide',
        {
          statusCode: 403,
          severity: errorHandler.severityLevels.LOW,
          context: {
            endpoint: req.path,
            method: req.method,
            ip: req.ip,
            tokenError: err.message
          },
          userMessage: 'Token d\'accès invalide',
          retryable: false
        }
      );
      return res.status(403).json(errorHandler.formatErrorResponse(error));
    }

    req.user = user;
    next();
  });
};

/**
 * Middleware d'authentification admin
 */
const authenticateAdmin = (req, res, next) => {
  authenticateToken(req, res, (err) => {
    if (err) return next(err);

    if (!req.user || req.user.role !== 'admin') {
      const error = errorHandler.createError(
        errorHandler.errorTypes.AUTHENTICATION,
        'Accès admin requis',
        {
          statusCode: 403,
          severity: errorHandler.severityLevels.MEDIUM,
          context: {
            endpoint: req.path,
            method: req.method,
            ip: req.ip,
            userRole: req.user?.role || 'unknown'
          },
          userMessage: 'Accès administrateur requis',
          retryable: false
        }
      );
      return res.status(403).json(errorHandler.formatErrorResponse(error));
    }

    next();
  });
};

/**
 * Middleware optionnel d'authentification (ne bloque pas si pas de token)
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET || 'default-secret', (err, user) => {
    if (err) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
};

module.exports = {
  authenticateToken,
  authenticateAdmin,
  optionalAuth
};
