const express = require('express');
const router = express.Router();
const errorHandler = require('../services/errorHandler');
const database = require('../models/database');
const { authenticateToken } = require('../middleware/auth');
const { asyncErrorHandler } = require('../middleware/errorMiddleware');

/**
 * Routes d'administration pour le monitoring des erreurs
 * Nécessite une authentification admin
 */

// Middleware pour vérifier les permissions admin
const requireAdmin = asyncErrorHandler(async (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    const error = errorHandler.createError(
      errorHandler.errorTypes.AUTHORIZATION,
      'Admin access required',
      {
        statusCode: 403,
        userMessage: 'Accès administrateur requis',
        context: { userId: req.user?.id, role: req.user?.role }
      }
    );
    throw error;
  }
  next();
});

/**
 * GET /api/admin/errors/stats
 * Récupère les statistiques d'erreurs
 */
router.get('/stats', authenticateToken, requireAdmin, asyncErrorHandler(async (req, res) => {
  const { days = 7 } = req.query;
  
  try {
    // Statistiques du service d'erreurs en mémoire
    const serviceStats = errorHandler.getErrorStats();
    
    // Statistiques de la base de données
    const dbStats = await database.getErrorStats(parseInt(days));
    const topErrors = await database.getTopErrors(parseInt(days), 10);
    
    res.json({
      success: true,
      data: {
        period: `${days} days`,
        inMemory: serviceStats,
        database: {
          stats: dbStats,
          topErrors: topErrors
        },
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    throw errorHandler.createError(
      errorHandler.errorTypes.API,
      `Failed to retrieve error statistics: ${error.message}`,
      {
        severity: errorHandler.severityLevels.MEDIUM,
        context: { days }
      }
    );
  }
}));

/**
 * GET /api/admin/errors/logs
 * Récupère les logs d'erreurs avec pagination et filtres
 */
router.get('/logs', authenticateToken, requireAdmin, asyncErrorHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    severity = null,
    type = null,
    userId = null,
    startDate = null,
    endDate = null
  } = req.query;

  try {
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const options = {
      limit: parseInt(limit),
      offset,
      severity,
      type,
      userId: userId ? parseInt(userId) : null,
      startDate,
      endDate
    };

    const logs = await database.getErrorLogs(options);
    
    // Compter le total pour la pagination
    const totalQuery = await database.get(`
      SELECT COUNT(*) as total FROM error_logs el
      WHERE 1=1
      ${severity ? 'AND el.severity = ?' : ''}
      ${type ? 'AND el.type = ?' : ''}
      ${userId ? 'AND el.user_id = ?' : ''}
      ${startDate ? 'AND el.created_at >= ?' : ''}
      ${endDate ? 'AND el.created_at <= ?' : ''}
    `, [severity, type, userId, startDate, endDate].filter(Boolean));

    const total = totalQuery.total;
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        },
        filters: {
          severity,
          type,
          userId,
          startDate,
          endDate
        }
      }
    });
  } catch (error) {
    throw errorHandler.createError(
      errorHandler.errorTypes.API,
      `Failed to retrieve error logs: ${error.message}`,
      {
        severity: errorHandler.severityLevels.MEDIUM,
        context: { page, limit, filters: { severity, type, userId } }
      }
    );
  }
}));

/**
 * GET /api/admin/errors/log/:id
 * Récupère un log d'erreur spécifique avec tous les détails
 */
router.get('/log/:id', authenticateToken, requireAdmin, asyncErrorHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const errorLog = await database.get(`
      SELECT el.*, u.email as user_email, u.name as user_name
      FROM error_logs el
      LEFT JOIN users u ON el.user_id = u.id
      WHERE el.id = ?
    `, [id]);

    if (!errorLog) {
      const error = errorHandler.createError(
        errorHandler.errorTypes.API,
        'Error log not found',
        {
          statusCode: 404,
          userMessage: 'Log d\'erreur non trouvé',
          context: { errorId: id }
        }
      );
      throw error;
    }

    // Parser le contexte JSON
    if (errorLog.context) {
      try {
        errorLog.context = JSON.parse(errorLog.context);
      } catch (parseError) {
        errorLog.context = { raw: errorLog.context };
      }
    }

    res.json({
      success: true,
      data: errorLog
    });
  } catch (error) {
    if (error.type) throw error; // Re-throw handled errors
    
    throw errorHandler.createError(
      errorHandler.errorTypes.API,
      `Failed to retrieve error log: ${error.message}`,
      {
        severity: errorHandler.severityLevels.MEDIUM,
        context: { errorId: id }
      }
    );
  }
}));

/**
 * POST /api/admin/errors/test
 * Crée une erreur de test pour valider le système
 */
router.post('/test', authenticateToken, requireAdmin, asyncErrorHandler(async (req, res) => {
  const { type = 'internal', severity = 'low', message = 'Test error' } = req.body;

  try {
    const testError = errorHandler.createError(
      type,
      `Test Error: ${message}`,
      {
        severity,
        context: {
          test: true,
          triggeredBy: req.user.id,
          timestamp: new Date().toISOString()
        },
        userMessage: 'Ceci est une erreur de test générée par l\'administrateur'
      }
    );

    const result = await errorHandler.handleError(testError, req);

    res.json({
      success: true,
      data: {
        message: 'Test error generated successfully',
        errorId: result.id,
        type: result.type,
        severity: severity
      }
    });
  } catch (error) {
    throw errorHandler.createError(
      errorHandler.errorTypes.API,
      `Failed to generate test error: ${error.message}`,
      {
        severity: errorHandler.severityLevels.LOW,
        context: { testParams: { type, severity, message } }
      }
    );
  }
}));

/**
 * DELETE /api/admin/errors/cleanup
 * Nettoie les anciens logs d'erreurs
 */
router.delete('/cleanup', authenticateToken, requireAdmin, asyncErrorHandler(async (req, res) => {
  const { days = 30, severity = null } = req.body;

  try {
    let deletedCount;
    
    if (severity && severity !== 'critical') {
      // Nettoyer seulement les erreurs d'une sévérité spécifique (sauf critical)
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const result = await database.run(
        'DELETE FROM error_logs WHERE created_at < ? AND severity = ?',
        [cutoffDate, severity]
      );
      deletedCount = result.changes;
    } else {
      // Nettoyer selon la méthode par défaut (garde les erreurs critiques)
      const result = await database.cleanupOldErrors(days);
      deletedCount = result.changes;
    }

    res.json({
      success: true,
      data: {
        message: 'Error logs cleanup completed',
        deletedCount,
        daysOld: days,
        severity: severity || 'all (except critical)'
      }
    });
  } catch (error) {
    throw errorHandler.createError(
      errorHandler.errorTypes.API,
      `Failed to cleanup error logs: ${error.message}`,
      {
        severity: errorHandler.severityLevels.MEDIUM,
        context: { days, severity }
      }
    );
  }
}));

/**
 * GET /api/admin/errors/export
 * Exporte les logs d'erreurs en CSV
 */
router.get('/export', authenticateToken, requireAdmin, asyncErrorHandler(async (req, res) => {
  const {
    startDate = null,
    endDate = null,
    severity = null,
    type = null,
    format = 'csv'
  } = req.query;

  try {
    const options = {
      limit: 10000, // Limite pour l'export
      offset: 0,
      severity,
      type,
      startDate,
      endDate
    };

    const logs = await database.getErrorLogs(options);

    if (format === 'csv') {
      // Générer CSV
      const csv = [
        'ID,Type,Severity,Message,User Email,IP Address,URL,Method,Created At',
        ...logs.map(log => [
          log.id,
          log.type,
          log.severity,
          `"${log.message.replace(/"/g, '""')}"`,
          log.user_email || '',
          log.ip_address || '',
          log.url || '',
          log.method || '',
          log.created_at
        ].join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="error-logs-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } else {
      // Format JSON par défaut
      res.json({
        success: true,
        data: {
          logs,
          exportedAt: new Date().toISOString(),
          filters: { startDate, endDate, severity, type }
        }
      });
    }
  } catch (error) {
    throw errorHandler.createError(
      errorHandler.errorTypes.API,
      `Failed to export error logs: ${error.message}`,
      {
        severity: errorHandler.severityLevels.MEDIUM,
        context: { format, filters: { startDate, endDate, severity, type } }
      }
    );
  }
}));

/**
 * GET /api/admin/health/errors
 * Endpoint de santé spécifique aux erreurs
 */
router.get('/health', asyncErrorHandler(async (req, res) => {
  try {
    // Vérifier les erreurs critiques récentes (dernières 24h)
    const recentCritical = await database.getErrorLogs({
      severity: 'critical',
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      limit: 10
    });

    // Vérifier le taux d'erreur récent
    const recentErrors = await database.getErrorLogs({
      startDate: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // Dernière heure
      limit: 100
    });

    const errorRate = recentErrors.length;
    const criticalCount = recentCritical.length;

    const status = {
      healthy: criticalCount === 0 && errorRate < 50,
      criticalErrors: criticalCount,
      recentErrorRate: errorRate,
      lastHour: recentErrors.length,
      status: criticalCount > 0 ? 'critical' : errorRate > 50 ? 'warning' : 'ok'
    };

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    throw errorHandler.createError(
      errorHandler.errorTypes.API,
      `Failed to check error health: ${error.message}`,
      {
        severity: errorHandler.severityLevels.HIGH
      }
    );
  }
}));

module.exports = router;
