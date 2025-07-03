const winston = require('winston');
const path = require('path');
const database = require('../models/database');

// Custom log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

winston.addColors(logColors);

// Create logs directory
const logsDir = path.join(__dirname, '../logs');

// Custom format for logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// File format (without colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

class Logger {
  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      levels: logLevels,
      format: fileFormat,
      defaultMeta: { service: 'upload-clips-app' },
      transports: [
        // Error logs
        new winston.transports.File({
          filename: path.join(logsDir, 'error.log'),
          level: 'error',
          maxsize: 10485760, // 10MB
          maxFiles: 5
        }),
        
        // Combined logs
        new winston.transports.File({
          filename: path.join(logsDir, 'combined.log'),
          maxsize: 10485760, // 10MB
          maxFiles: 10
        }),
        
        // HTTP access logs
        new winston.transports.File({
          filename: path.join(logsDir, 'access.log'),
          level: 'http',
          maxsize: 10485760, // 10MB
          maxFiles: 5
        })
      ]
    });

    // Add console transport for development
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(new winston.transports.Console({
        format: logFormat
      }));
    }
  }

  // Log levels
  error(message, meta = {}) {
    this.logger.error(message, meta);
    this.logToDatabase('error', message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
    this.logToDatabase('warn', message, meta);
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  http(message, meta = {}) {
    this.logger.http(message, meta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  // Log to database for critical errors
  async logToDatabase(level, message, meta = {}) {
    if (level === 'error' || level === 'warn') {
      try {
        await database.logError({
          userId: meta.userId || null,
          errorType: level,
          errorMessage: message,
          stackTrace: meta.stack || null,
          url: meta.url || null,
          userAgent: meta.userAgent || null,
          ipAddress: meta.ipAddress || null,
          metadata: meta
        });
      } catch (error) {
        console.error('Failed to log to database:', error);
      }
    }
  }

  // Log user activity
  async logActivity(userId, action, resourceType = null, resourceId = null, metadata = {}, req = null) {
    try {
      await database.logActivity({
        userId,
        action,
        resourceType,
        resourceId,
        metadata,
        ipAddress: req ? req.ip : null,
        userAgent: req ? req.get('User-Agent') : null
      });
    } catch (error) {
      this.error('Failed to log user activity', { error: error.message, userId, action });
    }
  }

  // Log API requests
  logRequest(req, res, responseTime) {
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user ? req.user.id : null
    };

    const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${responseTime}ms`;
    
    if (res.statusCode >= 400) {
      this.error(message, logData);
    } else {
      this.http(message, logData);
    }
  }

  // Log video processing
  logVideoProcessing(jobId, userId, status, progress = null, error = null) {
    const message = `Video processing ${status} - Job: ${jobId}, User: ${userId}`;
    const meta = { jobId, userId, status, progress };

    if (error) {
      meta.error = error;
      this.error(message, meta);
    } else {
      this.info(message, meta);
    }
  }

  // Log authentication events
  logAuth(event, userId = null, email = null, success = true, reason = null, req = null) {
    const message = `Auth ${event}: ${email || userId} - ${success ? 'SUCCESS' : 'FAILED'}`;
    const meta = {
      event,
      userId,
      email,
      success,
      reason,
      ip: req ? req.ip : null,
      userAgent: req ? req.get('User-Agent') : null
    };

    if (success) {
      this.info(message, meta);
    } else {
      this.warn(message, meta);
    }

    // Log activity
    if (userId) {
      this.logActivity(userId, event, 'auth', null, meta, req);
    }
  }

  // Log file operations
  logFileOperation(operation, filename, userId = null, success = true, error = null) {
    const message = `File ${operation}: ${filename} - ${success ? 'SUCCESS' : 'FAILED'}`;
    const meta = { operation, filename, userId, success };

    if (error) {
      meta.error = error;
      this.error(message, meta);
    } else {
      this.info(message, meta);
    }
  }

  // Log security events
  logSecurity(event, severity = 'medium', details = {}, req = null) {
    const message = `Security Event: ${event} (${severity})`;
    const meta = {
      event,
      severity,
      ...details,
      ip: req ? req.ip : null,
      userAgent: req ? req.get('User-Agent') : null,
      timestamp: new Date().toISOString()
    };

    if (severity === 'high' || severity === 'critical') {
      this.error(message, meta);
    } else {
      this.warn(message, meta);
    }
  }

  // Get recent logs
  async getRecentLogs(level = 'info', limit = 100) {
    return new Promise((resolve, reject) => {
      const options = {
        from: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        until: new Date(),
        limit,
        start: 0,
        order: 'desc',
        fields: ['timestamp', 'level', 'message', 'meta']
      };

      this.logger.query(options, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  // Get error statistics
  async getErrorStats(hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    try {
      const errorStats = await database.all(`
        SELECT 
          error_type,
          COUNT(*) as count,
          MAX(created_at) as last_occurrence
        FROM error_logs 
        WHERE created_at > ?
        GROUP BY error_type
        ORDER BY count DESC
      `, [since.toISOString()]);

      return errorStats;
    } catch (error) {
      this.error('Failed to get error statistics', { error: error.message });
      return [];
    }
  }

  // Get user activity stats
  async getUserActivityStats(userId, hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    try {
      const activityStats = await database.all(`
        SELECT 
          action,
          resource_type,
          COUNT(*) as count,
          MAX(created_at) as last_action
        FROM user_activity 
        WHERE user_id = ? AND created_at > ?
        GROUP BY action, resource_type
        ORDER BY count DESC
      `, [userId, since.toISOString()]);

      return activityStats;
    } catch (error) {
      this.error('Failed to get user activity statistics', { error: error.message, userId });
      return [];
    }
  }

  // Performance monitoring
  startTimer(label) {
    return console.time(label);
  }

  endTimer(label) {
    return console.timeEnd(label);
  }

  // Memory usage logging
  logMemoryUsage() {
    const usage = process.memoryUsage();
    const message = `Memory Usage - RSS: ${Math.round(usage.rss / 1024 / 1024)}MB, Heap: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`;
    this.debug(message, usage);
  }

  // System health check
  async logSystemHealth() {
    const health = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      version: process.version,
      platform: process.platform
    };

    this.info('System Health Check', health);
    return health;
  }
}

// Create and export logger instance
const logger = new Logger();

// Express middleware for request logging
logger.requestMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - start;
    logger.logRequest(req, res, responseTime);
  });
  
  next();
};

// Error handling middleware
logger.errorMiddleware = (err, req, res, next) => {
  const meta = {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user ? req.user.id : null,
    stack: err.stack,
    body: req.body
  };

  logger.error(err.message, meta);
  
  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ error: 'Internal server error' });
  } else {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
};

module.exports = logger;
