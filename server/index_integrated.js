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

// Import routes
const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');
const clipRoutes = require('./routes/clips');
const adminRoutes = require('./routes/admin');

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
app.use('/api/oauth', require('./routes/oauth'));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/clips', express.static(path.join(__dirname, 'clips')));
app.use('/thumbnails', express.static(path.join(__dirname, 'thumbnails')));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const health = await fileManager.systemHealthCheck();
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      ...health
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(500).json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

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

// Error reporting endpoint
app.post('/api/errors', validation.asyncHandler(async (req, res) => {
  try {
    const { message, stack, url, userAgent, timestamp, userId, metadata } = req.body;
    
    await logger.logError({
      userId: userId || null,
      errorType: 'client_error',
      errorMessage: message,
      stackTrace: stack,
      url,
      userAgent,
      ipAddress: req.ip,
      metadata: { timestamp, ...metadata }
    });
    
    res.json({ message: 'Error reported successfully' });
  } catch (error) {
    logger.error('Error reporting failed', { error: error.message });
    res.status(500).json({ error: 'Failed to report error' });
  }
}));

// API documentation endpoint (basic)
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
        'GET /api/admin/errors': 'Get error logs',
        'POST /api/admin/cleanup': 'Force system cleanup'
      }
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use(logger.errorMiddleware);

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

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', { 
    reason: reason.toString(),
    stack: reason.stack,
    promise: promise.toString()
  });
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { 
    error: error.message,
    stack: error.stack
  });
  
  // Exit the process after logging
  process.exit(1);
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
