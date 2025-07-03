const { body, param, query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const logger = require('./logger');
const database = require('../models/database');

class ValidationService {
  constructor() {
    this.setupRateLimiting();
    this.setupSecurity();
  }

  // Rate limiting configurations
  setupRateLimiting() {
    // General API rate limiting
    this.generalLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        logger.logSecurity('rate_limit_exceeded', 'medium', {
          ip: req.ip,
          path: req.path,
          limit: 100
        }, req);
        res.status(429).json({
          error: 'Too many requests from this IP, please try again later'
        });
      }
    });

    // Upload rate limiting
    this.uploadLimiter = rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // limit each IP to 10 uploads per hour
      message: {
        error: 'Upload limit exceeded, please try again later'
      },
      handler: (req, res) => {
        logger.logSecurity('upload_limit_exceeded', 'high', {
          ip: req.ip,
          userId: req.user ? req.user.id : null
        }, req);
        res.status(429).json({
          error: 'Upload limit exceeded, please try again later'
        });
      }
    });

    // Auth rate limiting
    this.authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // limit each IP to 5 login attempts per windowMs
      message: {
        error: 'Too many login attempts, please try again later'
      },
      handler: (req, res) => {
        logger.logSecurity('auth_limit_exceeded', 'high', {
          ip: req.ip,
          email: req.body.email
        }, req);
        res.status(429).json({
          error: 'Too many login attempts, please try again later'
        });
      }
    });
  }

  // Security middleware setup
  setupSecurity() {
    this.helmetConfig = helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          mediaSrc: ["'self'", "blob:"],
          connectSrc: ["'self'"]
        }
      }
    });
  }

  // Validation middleware
  handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation errors', {
        errors: errors.array(),
        path: req.path,
        method: req.method,
        ip: req.ip,
        userId: req.user ? req.user.id : null
      });
      
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  };

  // Authentication validation
  validateRegister = [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    this.handleValidationErrors
  ];

  validateLogin = [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    this.handleValidationErrors
  ];

  validatePasswordChange = [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    this.handleValidationErrors
  ];

  // File upload validation
  validateFileUpload = async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const file = req.file;
      const maxSize = await database.getSetting('max_file_size') || 100000000; // 100MB default
      
      // Check file size
      if (file.size > parseInt(maxSize)) {
        logger.logSecurity('file_size_exceeded', 'medium', {
          fileName: file.originalname,
          size: file.size,
          maxSize,
          userId: req.user ? req.user.id : null
        }, req);
        
        return res.status(400).json({
          error: `File size exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`
        });
      }

      // Check file type
      const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/wmv', 'video/webm'];
      if (!allowedTypes.includes(file.mimetype)) {
        logger.logSecurity('invalid_file_type', 'medium', {
          fileName: file.originalname,
          mimeType: file.mimetype,
          userId: req.user ? req.user.id : null
        }, req);
        
        return res.status(400).json({
          error: 'Invalid file type. Only video files are allowed'
        });
      }

      // Check user limits
      if (req.user) {
        const userStats = await database.getUserStats(req.user.id);
        const maxClips = await database.getSetting('max_clips_per_user') || 50;
        
        if (userStats.total_clips >= parseInt(maxClips)) {
          return res.status(400).json({
            error: `You have reached the maximum number of clips (${maxClips}). Please delete some clips before uploading new ones.`
          });
        }
      }

      next();
    } catch (error) {
      logger.error('File validation error', { error: error.message, userId: req.user ? req.user.id : null });
      res.status(500).json({ error: 'File validation failed' });
    }
  };

  // Video processing validation
  validateVideoProcessing = [
    body('duration')
      .optional()
      .isInt({ min: 10, max: 3600 })
      .withMessage('Duration must be between 10 and 3600 seconds'),
    body('customDuration')
      .optional()
      .isInt({ min: 10, max: 3600 })
      .withMessage('Custom duration must be between 10 and 3600 seconds'),
    body('generateSubtitles')
      .optional()
      .isBoolean()
      .withMessage('Generate subtitles must be a boolean'),
    this.handleValidationErrors
  ];

  // Clip management validation
  validateClipId = [
    param('clipId')
      .isUUID()
      .withMessage('Invalid clip ID format'),
    this.handleValidationErrors
  ];

  validateJobId = [
    param('jobId')
      .isUUID()
      .withMessage('Invalid job ID format'),
    this.handleValidationErrors
  ];

  // Pagination validation
  validatePagination = [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    this.handleValidationErrors
  ];

  // User settings validation
  validateUserSettings = [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('preferences')
      .optional()
      .isObject()
      .withMessage('Preferences must be an object'),
    this.handleValidationErrors
  ];

  // Admin validation
  validateAdminAccess = async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await database.getUserById(req.user.id);
      if (!user || user.subscription_type !== 'admin') {
        logger.logSecurity('unauthorized_admin_access', 'high', {
          userId: req.user.id,
          path: req.path
        }, req);
        
        return res.status(403).json({ error: 'Admin access required' });
      }

      next();
    } catch (error) {
      logger.error('Admin validation error', { error: error.message, userId: req.user ? req.user.id : null });
      res.status(500).json({ error: 'Access validation failed' });
    }
  };

  // IP whitelist validation (for sensitive operations)
  validateIPWhitelist = (whitelist = []) => {
    return (req, res, next) => {
      const clientIP = req.ip;
      
      if (whitelist.length > 0 && !whitelist.includes(clientIP)) {
        logger.logSecurity('ip_not_whitelisted', 'high', {
          ip: clientIP,
          path: req.path,
          whitelist
        }, req);
        
        return res.status(403).json({ error: 'Access denied from this IP address' });
      }
      
      next();
    };
  };

  // CORS validation
  validateCORS = (req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'];
    
    if (origin && !allowedOrigins.includes(origin)) {
      logger.logSecurity('invalid_cors_origin', 'medium', {
        origin,
        allowedOrigins
      }, req);
      
      return res.status(403).json({ error: 'CORS policy violation' });
    }
    
    next();
  };

  // Request sanitization
  sanitizeRequest = (req, res, next) => {
    // Remove potentially dangerous properties
    const dangerousProps = ['__proto__', 'constructor', 'prototype'];
    
    const sanitize = (obj) => {
      if (obj && typeof obj === 'object') {
        for (const prop of dangerousProps) {
          delete obj[prop];
        }
        
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            sanitize(obj[key]);
          }
        }
      }
    };
    
    sanitize(req.body);
    sanitize(req.query);
    sanitize(req.params);
    
    next();
  };

  // Activity logging middleware
  logActivity = (action, resourceType = null) => {
    return async (req, res, next) => {
      try {
        if (req.user) {
          await logger.logActivity(
            req.user.id,
            action,
            resourceType,
            req.params.id || req.params.clipId || req.params.jobId || null,
            { method: req.method, path: req.path },
            req
          );
        }
        next();
      } catch (error) {
        logger.error('Activity logging error', { error: error.message });
        next(); // Don't block the request
      }
    };
  };

  // Error boundary for async middleware
  asyncHandler = (fn) => {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };
}

module.exports = new ValidationService();
