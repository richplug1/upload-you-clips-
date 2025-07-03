const express = require('express');
const authService = require('../services/authService');
const validation = require('../services/validation');
const logger = require('../services/logger');
const database = require('../models/database');
const fileManager = require('../services/fileManager');
const videoProcessor = require('../services/videoProcessor');

const router = express.Router();

// All admin routes require admin access
router.use(authService.authenticateToken.bind(authService));
router.use(validation.validateAdminAccess);

// Get system stats
router.get('/stats',
  validation.asyncHandler(async (req, res) => {
    try {
      const stats = {
        users: {
          total: await database.get('SELECT COUNT(*) as count FROM users'),
          active: await database.get('SELECT COUNT(*) as count FROM users WHERE last_login > datetime("now", "-30 days")'),
          new: await database.get('SELECT COUNT(*) as count FROM users WHERE created_at > datetime("now", "-7 days")')
        },
        jobs: {
          total: await database.get('SELECT COUNT(*) as count FROM jobs'),
          pending: await database.get('SELECT COUNT(*) as count FROM jobs WHERE status = "pending"'),
          processing: await database.get('SELECT COUNT(*) as count FROM jobs WHERE status = "processing"'),
          completed: await database.get('SELECT COUNT(*) as count FROM jobs WHERE status = "completed"'),
          failed: await database.get('SELECT COUNT(*) as count FROM jobs WHERE status = "failed"')
        },
        clips: {
          total: await database.get('SELECT COUNT(*) as count FROM clips'),
          active: await database.get('SELECT COUNT(*) as count FROM clips WHERE is_archived = 0'),
          archived: await database.get('SELECT COUNT(*) as count FROM clips WHERE is_archived = 1'),
          size: await database.get('SELECT SUM(size) as total FROM clips WHERE is_archived = 0')
        },
        storage: await fileManager.getStorageStats(),
        system: await logger.logSystemHealth()
      };

      res.json(stats);

    } catch (error) {
      logger.error('Get admin stats error', { 
        error: error.message, 
        userId: req.user.id 
      });
      
      res.status(500).json({ error: 'Failed to get system stats' });
    }
  })
);

// Get users list
router.get('/users',
  validation.validatePagination,
  validation.asyncHandler(async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;
      const search = req.query.search || '';

      let whereClause = '';
      let params = [];

      if (search) {
        whereClause = 'WHERE email LIKE ? OR name LIKE ?';
        params = [`%${search}%`, `%${search}%`];
      }

      const users = await database.all(
        `SELECT id, email, name, subscription_type, created_at, last_login, is_active 
         FROM users ${whereClause} 
         ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      const totalCount = await database.get(
        `SELECT COUNT(*) as count FROM users ${whereClause}`,
        params
      );

      res.json({
        users,
        pagination: {
          page,
          limit,
          total: totalCount.count,
          pages: Math.ceil(totalCount.count / limit)
        }
      });

    } catch (error) {
      logger.error('Get users error', { 
        error: error.message, 
        userId: req.user.id 
      });
      
      res.status(500).json({ error: 'Failed to get users' });
    }
  })
);

// Get user details
router.get('/users/:userId',
  validation.asyncHandler(async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await database.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const stats = await database.getUserStats(userId);
      const recentActivity = await logger.getUserActivityStats(userId, 168); // 7 days

      res.json({
        user: authService.sanitizeUser(user),
        stats,
        recentActivity
      });

    } catch (error) {
      logger.error('Get user details error', { 
        error: error.message, 
        userId: req.user.id,
        targetUserId: req.params.userId 
      });
      
      res.status(500).json({ error: 'Failed to get user details' });
    }
  })
);

// Update user
router.put('/users/:userId',
  validation.asyncHandler(async (req, res) => {
    try {
      const { userId } = req.params;
      const { subscription_type, is_active } = req.body;

      const user = await database.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const updateData = {};
      if (subscription_type !== undefined) updateData.subscription_type = subscription_type;
      if (is_active !== undefined) updateData.is_active = is_active ? 1 : 0;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updateData);
      values.push(userId);

      await database.run(
        `UPDATE users SET ${fields} WHERE id = ?`,
        values
      );

      logger.logActivity(req.user.id, 'admin_user_update', 'user', userId, updateData);

      res.json({ message: 'User updated successfully' });

    } catch (error) {
      logger.error('Update user error', { 
        error: error.message, 
        userId: req.user.id,
        targetUserId: req.params.userId 
      });
      
      res.status(500).json({ error: 'Failed to update user' });
    }
  })
);

// Get jobs queue
router.get('/jobs',
  validation.validatePagination,
  validation.asyncHandler(async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;
      const status = req.query.status || '';

      let whereClause = '';
      let params = [];

      if (status) {
        whereClause = 'WHERE status = ?';
        params = [status];
      }

      const jobs = await database.all(
        `SELECT j.*, u.email as user_email, u.name as user_name 
         FROM jobs j 
         LEFT JOIN users u ON j.user_id = u.id 
         ${whereClause} 
         ORDER BY j.created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      const totalCount = await database.get(
        `SELECT COUNT(*) as count FROM jobs ${whereClause}`,
        params
      );

      const queueStats = await videoProcessor.getQueueStatus();

      res.json({
        jobs,
        queueStats,
        pagination: {
          page,
          limit,
          total: totalCount.count,
          pages: Math.ceil(totalCount.count / limit)
        }
      });

    } catch (error) {
      logger.error('Get admin jobs error', { 
        error: error.message, 
        userId: req.user.id 
      });
      
      res.status(500).json({ error: 'Failed to get jobs' });
    }
  })
);

// Cancel job
router.post('/jobs/:jobId/cancel',
  validation.asyncHandler(async (req, res) => {
    try {
      const { jobId } = req.params;

      const job = await database.get('SELECT * FROM jobs WHERE id = ?', [jobId]);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      if (!['pending', 'processing'].includes(job.status)) {
        return res.status(400).json({ error: 'Job cannot be cancelled' });
      }

      await database.updateJob(jobId, { 
        status: 'cancelled',
        error_message: `Cancelled by admin ${req.user.email}`
      });

      logger.logActivity(req.user.id, 'admin_job_cancel', 'job', jobId);

      res.json({ message: 'Job cancelled successfully' });

    } catch (error) {
      logger.error('Cancel job error', { 
        error: error.message, 
        userId: req.user.id,
        jobId: req.params.jobId 
      });
      
      res.status(500).json({ error: 'Failed to cancel job' });
    }
  })
);

// Get error logs
router.get('/errors',
  validation.validatePagination,
  validation.asyncHandler(async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;
      const type = req.query.type || '';
      const hours = parseInt(req.query.hours) || 24;

      const since = new Date(Date.now() - hours * 60 * 60 * 1000);

      let whereClause = 'WHERE created_at > ?';
      let params = [since.toISOString()];

      if (type) {
        whereClause += ' AND error_type = ?';
        params.push(type);
      }

      const errors = await database.all(
        `SELECT e.*, u.email as user_email 
         FROM error_logs e 
         LEFT JOIN users u ON e.user_id = u.id 
         ${whereClause} 
         ORDER BY e.created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      const totalCount = await database.get(
        `SELECT COUNT(*) as count FROM error_logs ${whereClause}`,
        params
      );

      const errorStats = await logger.getErrorStats(hours);

      res.json({
        errors,
        errorStats,
        pagination: {
          page,
          limit,
          total: totalCount.count,
          pages: Math.ceil(totalCount.count / limit)
        }
      });

    } catch (error) {
      logger.error('Get admin errors error', { 
        error: error.message, 
        userId: req.user.id 
      });
      
      res.status(500).json({ error: 'Failed to get error logs' });
    }
  })
);

// Get system settings
router.get('/settings',
  validation.asyncHandler(async (req, res) => {
    try {
      const settings = await database.all('SELECT * FROM system_settings ORDER BY key');
      res.json(settings);

    } catch (error) {
      logger.error('Get settings error', { 
        error: error.message, 
        userId: req.user.id 
      });
      
      res.status(500).json({ error: 'Failed to get settings' });
    }
  })
);

// Update system setting
router.put('/settings/:key',
  validation.asyncHandler(async (req, res) => {
    try {
      const { key } = req.params;
      const { value, description } = req.body;

      if (!value) {
        return res.status(400).json({ error: 'Value is required' });
      }

      await database.setSetting(key, value, description);

      logger.logActivity(req.user.id, 'admin_setting_update', 'setting', key, { value, description });

      res.json({ message: 'Setting updated successfully' });

    } catch (error) {
      logger.error('Update setting error', { 
        error: error.message, 
        userId: req.user.id,
        key: req.params.key 
      });
      
      res.status(500).json({ error: 'Failed to update setting' });
    }
  })
);

// Force cleanup
router.post('/cleanup',
  validation.asyncHandler(async (req, res) => {
    try {
      await fileManager.forceCleanup();

      logger.logActivity(req.user.id, 'admin_force_cleanup', 'system');

      res.json({ message: 'Cleanup completed successfully' });

    } catch (error) {
      logger.error('Force cleanup error', { 
        error: error.message, 
        userId: req.user.id 
      });
      
      res.status(500).json({ error: 'Failed to perform cleanup' });
    }
  })
);

// Create backup
router.post('/backup',
  validation.asyncHandler(async (req, res) => {
    try {
      await fileManager.createManualBackup();

      logger.logActivity(req.user.id, 'admin_manual_backup', 'system');

      res.json({ message: 'Backup created successfully' });

    } catch (error) {
      logger.error('Create backup error', { 
        error: error.message, 
        userId: req.user.id 
      });
      
      res.status(500).json({ error: 'Failed to create backup' });
    }
  })
);

// Get activity logs
router.get('/activity',
  validation.validatePagination,
  validation.asyncHandler(async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 100;
      const offset = (page - 1) * limit;
      const action = req.query.action || '';
      const userId = req.query.userId || '';
      const hours = parseInt(req.query.hours) || 24;

      const since = new Date(Date.now() - hours * 60 * 60 * 1000);

      let whereClause = 'WHERE a.created_at > ?';
      let params = [since.toISOString()];

      if (action) {
        whereClause += ' AND a.action = ?';
        params.push(action);
      }

      if (userId) {
        whereClause += ' AND a.user_id = ?';
        params.push(userId);
      }

      const activities = await database.all(
        `SELECT a.*, u.email as user_email, u.name as user_name 
         FROM user_activity a 
         LEFT JOIN users u ON a.user_id = u.id 
         ${whereClause} 
         ORDER BY a.created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      const totalCount = await database.get(
        `SELECT COUNT(*) as count FROM user_activity a ${whereClause}`,
        params
      );

      res.json({
        activities,
        pagination: {
          page,
          limit,
          total: totalCount.count,
          pages: Math.ceil(totalCount.count / limit)
        }
      });

    } catch (error) {
      logger.error('Get activity logs error', { 
        error: error.message, 
        userId: req.user.id 
      });
      
      res.status(500).json({ error: 'Failed to get activity logs' });
    }
  })
);

// Analytics endpoint
router.get('/analytics',
  validation.asyncHandler(async (req, res) => {
    try {
      const days = parseInt(req.query.days) || 30;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const analytics = {
        users: {
          daily: await database.all(
            `SELECT DATE(created_at) as date, COUNT(*) as count 
             FROM users 
             WHERE created_at > ? 
             GROUP BY DATE(created_at) 
             ORDER BY date`,
            [since.toISOString()]
          ),
          active: await database.all(
            `SELECT DATE(last_login) as date, COUNT(*) as count 
             FROM users 
             WHERE last_login > ? 
             GROUP BY DATE(last_login) 
             ORDER BY date`,
            [since.toISOString()]
          )
        },
        jobs: {
          daily: await database.all(
            `SELECT DATE(created_at) as date, status, COUNT(*) as count 
             FROM jobs 
             WHERE created_at > ? 
             GROUP BY DATE(created_at), status 
             ORDER BY date, status`,
            [since.toISOString()]
          ),
          completion: await database.all(
            `SELECT 
               COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
               COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
               COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
               COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing,
               DATE(created_at) as date
             FROM jobs 
             WHERE created_at > ? 
             GROUP BY DATE(created_at) 
             ORDER BY date`,
            [since.toISOString()]
          )
        },
        clips: {
          daily: await database.all(
            `SELECT DATE(created_at) as date, COUNT(*) as count, SUM(size) as total_size 
             FROM clips 
             WHERE created_at > ? 
             GROUP BY DATE(created_at) 
             ORDER BY date`,
            [since.toISOString()]
          )
        },
        errors: {
          daily: await database.all(
            `SELECT DATE(created_at) as date, error_type, COUNT(*) as count 
             FROM error_logs 
             WHERE created_at > ? 
             GROUP BY DATE(created_at), error_type 
             ORDER BY date, error_type`,
            [since.toISOString()]
          )
        }
      };

      res.json(analytics);

    } catch (error) {
      logger.error('Get analytics error', { 
        error: error.message, 
        userId: req.user.id 
      });
      
      res.status(500).json({ error: 'Failed to get analytics' });
    }
  })
);

module.exports = router;
