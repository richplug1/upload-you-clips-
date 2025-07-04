// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');

// Import services and models
const database = require('./models/database');
const logger = require('./services/logger');
const validation = require('./services/validation');
const fileManager = require('./services/fileManager');
const errorHandler = require('./services/errorHandler');

// Import middleware
const { setupErrorHandling, asyncErrorHandler } = require('./middleware/errorMiddleware');

// Import routes
const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');
const clipRoutes = require('./routes/clips');
const adminRoutes = require('./routes/admin');
const oauthRoutes = require('./routes/oauth');
const openaiRoutes = require('./routes/openai');
const subscriptionRoutes = require('./routes/subscription');
const errorMonitoringRoutes = require('./routes/errorMonitoring');
const systemHealthRoutes = require('./routes/systemHealth');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(validation.helmetConfig);
app.use(validation.sanitizeRequest);

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Request logging middleware
app.use(logger.requestMiddleware);

// Rate limiting (apply to all routes)
app.use(validation.generalLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/clips', clipRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/openai', openaiRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/admin/errors', errorMonitoringRoutes);
app.use('/api/system', systemHealthRoutes);

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/clips', express.static(path.join(__dirname, 'clips')));
app.use('/thumbnails', express.static(path.join(__dirname, 'thumbnails')));

// Health check endpoint (enhanced with error handling)
app.get('/api/health', asyncErrorHandler(async (req, res) => {
  try {
    const health = await fileManager.systemHealthCheck();
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      ...health
    });
  } catch (error) {
    const healthError = errorHandler.createError(
      errorHandler.errorTypes.INTERNAL,
      `Health check failed: ${error.message}`,
      {
        severity: errorHandler.severityLevels.HIGH,
        context: { healthCheck: true },
        retryable: true
      }
    );
    throw healthError;
  }
}));

// Root endpoint - Welcome message
app.get('/', (req, res) => {
  res.json({
    message: 'Upload You Clips API Server',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      docs: '/api/docs',
      oauth: '/api/oauth/google/url'
    }
  });
});

// API root endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Upload You Clips API',
    version: '1.0.0',
    docs: '/api/docs',
    health: '/api/health',
    oauth: '/api/oauth/google/url'
  });
});

// Error reporting endpoint (improved with new error handler)
app.post('/api/errors', asyncErrorHandler(async (req, res) => {
  try {
    const { message, stack, url, userAgent, timestamp, userId, metadata } = req.body;
    
    const clientError = errorHandler.createError(
      errorHandler.errorTypes.API,
      `Client Error: ${message}`,
      {
        severity: errorHandler.severityLevels.MEDIUM,
        context: {
          clientSide: true,
          url,
          userAgent,
          timestamp,
          metadata
        },
        userMessage: 'Une erreur côté client a été signalée'
      }
    );

    const result = await errorHandler.handleError(clientError, req, {
      userId: userId || null,
      clientStack: stack
    });
    
    res.json({ 
      message: 'Error reported successfully',
      errorId: result.id
    });
  } catch (error) {
    throw errorHandler.createError(
      errorHandler.errorTypes.API,
      `Failed to report client error: ${error.message}`,
      {
        severity: errorHandler.severityLevels.MEDIUM,
        context: { clientReporting: true }
      }
    );
  }
}));

// API documentation endpoint (enhanced with error monitoring)
app.get('/api/docs', (req, res) => {
  res.json({
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register new user',
        'POST /api/auth/login': 'Login user',
        'POST /api/auth/google': 'Google OAuth login',
        'POST /api/auth/logout': 'Logout user',
        'GET /api/auth/profile': 'Get user profile',
        'PUT /api/auth/profile': 'Update user profile'
      },
      videos: {
        'POST /api/videos/upload': 'Upload video file',
        'POST /api/videos/process': 'Process video into clips',
        'GET /api/videos/job/:jobId': 'Get job status',
        'GET /api/videos/jobs': 'Get user jobs',
        'DELETE /api/videos/job/:jobId': 'Delete job'
      },
      clips: {
        'GET /api/clips': 'Get user clips',
        'GET /api/clips/:clipId': 'Get specific clip',
        'GET /api/clips/:clipId/stream': 'Stream clip video',
        'GET /api/clips/:clipId/download': 'Download clip',
        'DELETE /api/clips/:clipId': 'Delete clip',
        'POST /api/clips/bulk-delete': 'Bulk delete clips'
      },
      admin: {
        'GET /api/admin/stats': 'Get system statistics',
        'GET /api/admin/users': 'Get users list',
        'GET /api/admin/jobs': 'Get jobs queue',
        'POST /api/admin/cleanup': 'Force system cleanup'
      },
      errorMonitoring: {
        'GET /api/admin/errors/stats': 'Get error statistics',
        'GET /api/admin/errors/logs': 'Get error logs',
        'GET /api/admin/errors/log/:id': 'Get specific error log',
        'POST /api/admin/errors/test': 'Generate test error',
        'DELETE /api/admin/errors/cleanup': 'Cleanup old error logs',
        'GET /api/admin/errors/export': 'Export error logs',
        'GET /api/admin/errors/health': 'Error health status'
      },
      subscription: {
        'GET /api/subscription/plans': 'Get subscription plans',
        'GET /api/subscription/status': 'Get user subscription status',
        'POST /api/subscription/calculate-cost': 'Calculate processing cost',
        'POST /api/subscription/upgrade': 'Upgrade subscription',
        'POST /api/subscription/buy-credits': 'Buy additional credits',
        'GET /api/subscription/history': 'Get credit usage history'
      }
    }
  });
});

// Setup error handling middleware (must be after all routes)
setupErrorHandling(app);

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  
  try {
    await database.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database', { error: error.message });
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  
  try {
    await database.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database', { error: error.message });
  }
  
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Initialize database
    await database.init();
    logger.info('Database initialized successfully');
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      console.log(`
🚀 Upload You Clips Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Server:           http://localhost:${PORT}
📚 API Docs:         http://localhost:${PORT}/api/docs
🏥 Health Check:     http://localhost:${PORT}/api/health
🔧 Environment:      ${process.env.NODE_ENV || 'development'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Services Active:
   • Database (SQLite)
   • Authentication (JWT)
   • File Management
   • Video Processing
   • Error Logging
   • Rate Limiting
   • Security Middleware
   • Automated Cleanup
   • Real-time Analytics

🎬 Ready to process videos!
      `);
    });
    
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
