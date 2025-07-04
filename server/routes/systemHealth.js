const express = require('express');
const errorHandler = require('../services/errorHandler');
const logger = require('../services/logger');
const database = require('../models/database');

const router = express.Router();

/**
 * Test d'erreur pour vérifier le système de gestion d'erreurs
 */
router.post('/test-error', async (req, res, next) => {
  try {
    const { errorType = 'TEST', severity = 'MEDIUM', message = 'Test error generated' } = req.body;
    
    const testError = errorHandler.createError(
      errorHandler.errorTypes[errorType] || errorHandler.errorTypes.INTERNAL,
      message,
      {
        severity: errorHandler.severityLevels[severity] || errorHandler.severityLevels.MEDIUM,
        context: {
          testError: true,
          timestamp: new Date().toISOString(),
          userAgent: req.get('User-Agent'),
          ip: req.ip
        },
        userMessage: 'Ceci est une erreur de test pour vérifier le système.'
      }
    );

    // Traiter l'erreur à travers le système
    const result = await errorHandler.handleError(testError, req, {
      userId: req.user?.id || null,
      testGenerated: true
    });

    res.json({
      success: true,
      message: 'Test error generated successfully',
      errorId: result.id,
      errorDetails: {
        type: testError.type,
        severity: testError.severity,
        message: testError.message,
        userMessage: testError.userMessage
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Endpoint de health check détaillé pour le monitoring
 */
router.get('/health', async (req, res) => {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {},
      errors: {},
      system: {}
    };

    // Vérifier la base de données
    try {
      await database.get('SELECT 1');
      healthData.services.database = { status: 'healthy', message: 'Database connection OK' };
    } catch (error) {
      healthData.services.database = { status: 'unhealthy', message: error.message };
      healthData.status = 'degraded';
    }

    // Vérifier le système de logging
    try {
      logger.info('Health check performed');
      healthData.services.logging = { status: 'healthy', message: 'Logging system OK' };
    } catch (error) {
      healthData.services.logging = { status: 'unhealthy', message: error.message };
      healthData.status = 'degraded';
    }

    // Statistiques d'erreurs récentes
    try {
      const errorStats = await database.getErrorStats(24);
      healthData.errors = {
        last24h: errorStats.totalErrors || 0,
        critical: errorStats.criticalErrors || 0,
        errorRate: errorStats.errorRate || 0,
        status: errorStats.totalErrors > 100 ? 'high' : errorStats.totalErrors > 50 ? 'medium' : 'low'
      };
      
      if (errorStats.totalErrors > 100) {
        healthData.status = 'degraded';
      }
    } catch (error) {
      healthData.errors = { status: 'unknown', message: 'Unable to fetch error statistics' };
    }

    // Informations système
    healthData.system = {
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
        usage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
      },
      cpu: {
        usage: process.cpuUsage()
      }
    };

    // Déterminer le statut global
    if (healthData.services.database?.status === 'unhealthy') {
      healthData.status = 'unhealthy';
    }

    const statusCode = healthData.status === 'healthy' ? 200 : 
                      healthData.status === 'degraded' ? 202 : 503;

    res.status(statusCode).json(healthData);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      message: 'Health check failed',
      error: error.message
    });
  }
});

/**
 * Endpoint pour nettoyer manuellement les anciens logs d'erreurs
 */
router.delete('/cleanup-errors', async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const deletedCount = await database.cleanupErrorLogs(cutoffDate);
    
    logger.info('Manual error log cleanup performed', {
      deletedCount,
      cutoffDate: cutoffDate.toISOString(),
      requestedBy: req.user?.id || 'system'
    });

    res.json({
      success: true,
      message: `Cleanup completed successfully`,
      deletedCount,
      cutoffDate: cutoffDate.toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Endpoint pour obtenir un rapport détaillé des erreurs
 */
router.get('/error-report', async (req, res, next) => {
  try {
    const { 
      hours = 24,
      includeResolved = false,
      severity = null,
      type = null,
      format = 'json'
    } = req.query;

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    // Statistiques générales
    const stats = await database.getErrorStats(hours);
    
    // Logs détaillés
    const logs = await database.getErrorLogs({
      startDate: since.toISOString(),
      severity,
      type,
      limit: 1000
    });

    // Analyse des tendances
    const trends = await database.all(`
      SELECT 
        strftime('%Y-%m-%d %H:00:00', created_at) as hour,
        COUNT(*) as count,
        severity
      FROM error_logs 
      WHERE created_at >= ? 
      GROUP BY hour, severity 
      ORDER BY hour`, 
      [since.toISOString()]
    );

    const report = {
      metadata: {
        generatedAt: new Date().toISOString(),
        timeRange: {
          start: since.toISOString(),
          end: new Date().toISOString(),
          hours: hours
        },
        requestedBy: req.user?.id || 'system'
      },
      summary: stats,
      trends,
      errors: logs.map(log => ({
        id: log.id,
        timestamp: log.created_at,
        type: log.type,
        severity: log.severity,
        message: log.message,
        userEmail: log.user_email,
        context: log.context ? JSON.parse(log.context) : null
      }))
    };

    if (format === 'csv') {
      // Conversion en CSV pour export
      const csv = convertToCSV(report.errors);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="error-report-${Date.now()}.csv"`);
      res.send(csv);
    } else {
      res.json(report);
    }
  } catch (error) {
    next(error);
  }
});

/**
 * Fonction utilitaire pour convertir en CSV
 */
function convertToCSV(data) {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');
  
  return csvContent;
}

module.exports = router;
