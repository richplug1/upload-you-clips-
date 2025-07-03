const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');
const database = require('../models/database');
const logger = require('./logger');
const videoProcessor = require('./videoProcessor');

class FileManagerService {
  constructor() {
    this.uploadsDir = path.join(__dirname, '../uploads');
    this.clipsDir = path.join(__dirname, '../clips');
    this.thumbnailsDir = path.join(__dirname, '../thumbnails');
    this.tempDir = path.join(__dirname, '../temp');
    this.backupDir = path.join(__dirname, '../backups');
    
    this.initializeDirectories();
    this.startScheduledTasks();
  }

  async initializeDirectories() {
    const directories = [
      this.uploadsDir,
      this.clipsDir,
      this.thumbnailsDir,
      this.tempDir,
      this.backupDir
    ];

    for (const dir of directories) {
      try {
        await fs.mkdir(dir, { recursive: true });
        logger.info(`Directory ensured: ${dir}`);
      } catch (error) {
        logger.error(`Failed to create directory ${dir}`, { error: error.message });
      }
    }
  }

  startScheduledTasks() {
    // Clean up expired clips every hour
    cron.schedule('0 * * * *', () => {
      this.cleanupExpiredClips();
    });

    // Clean up temporary files every 30 minutes
    cron.schedule('*/30 * * * *', () => {
      this.cleanupTempFiles();
    });

    // Clean up orphaned files every 6 hours
    cron.schedule('0 */6 * * *', () => {
      this.cleanupOrphanedFiles();
    });

    // Archive old logs daily at 2 AM
    cron.schedule('0 2 * * *', () => {
      this.archiveOldLogs();
    });

    // Database cleanup daily at 3 AM
    cron.schedule('0 3 * * *', () => {
      this.cleanupDatabase();
    });

    // System health check every 15 minutes
    cron.schedule('*/15 * * * *', () => {
      this.systemHealthCheck();
    });

    // Backup important data daily at 1 AM
    cron.schedule('0 1 * * *', () => {
      this.createBackup();
    });

    logger.info('File management scheduled tasks started');
  }

  // Clean up expired clips
  async cleanupExpiredClips() {
    try {
      logger.info('Starting expired clips cleanup');
      
      // Get expired clips
      const expiredClips = await database.all(
        'SELECT * FROM clips WHERE expires_at < CURRENT_TIMESTAMP AND is_archived = 0'
      );

      let deletedCount = 0;
      let failedCount = 0;

      for (const clip of expiredClips) {
        try {
          // Delete clip file
          const clipPath = path.join(this.clipsDir, clip.filename);
          await this.safeDeleteFile(clipPath);

          // Delete thumbnail
          const thumbnailName = clip.filename.replace('.mp4', '_thumb.jpg');
          const thumbnailPath = path.join(this.thumbnailsDir, thumbnailName);
          await this.safeDeleteFile(thumbnailPath);

          // Archive clip in database
          await database.run(
            'UPDATE clips SET is_archived = 1 WHERE id = ?',
            [clip.id]
          );

          deletedCount++;
          logger.logFileOperation('delete', clip.filename, clip.user_id, true);

        } catch (error) {
          failedCount++;
          logger.error(`Failed to delete expired clip ${clip.filename}`, {
            error: error.message,
            clipId: clip.id,
            userId: clip.user_id
          });
        }
      }

      logger.info(`Expired clips cleanup completed: ${deletedCount} deleted, ${failedCount} failed`);
      
    } catch (error) {
      logger.error('Expired clips cleanup failed', { error: error.message });
    }
  }

  // Clean up temporary files
  async cleanupTempFiles() {
    try {
      logger.info('Starting temporary files cleanup');
      
      const files = await fs.readdir(this.tempDir);
      const now = Date.now();
      const maxAge = 2 * 60 * 60 * 1000; // 2 hours
      
      let deletedCount = 0;

      for (const file of files) {
        try {
          const filePath = path.join(this.tempDir, file);
          const stats = await fs.stat(filePath);
          
          if (now - stats.mtime.getTime() > maxAge) {
            await this.safeDeleteFile(filePath);
            deletedCount++;
            logger.logFileOperation('cleanup_temp', file, null, true);
          }
        } catch (error) {
          logger.error(`Failed to cleanup temp file ${file}`, { error: error.message });
        }
      }

      logger.info(`Temporary files cleanup completed: ${deletedCount} files deleted`);
      
    } catch (error) {
      logger.error('Temporary files cleanup failed', { error: error.message });
    }
  }

  // Clean up orphaned files (files without database entries)
  async cleanupOrphanedFiles() {
    try {
      logger.info('Starting orphaned files cleanup');
      
      // Check clips directory
      await this.cleanupOrphanedInDirectory(this.clipsDir, 'clips', 'filename');
      
      // Check uploads directory
      await this.cleanupOrphanedInDirectory(this.uploadsDir, 'jobs', 'input_file');
      
      logger.info('Orphaned files cleanup completed');
      
    } catch (error) {
      logger.error('Orphaned files cleanup failed', { error: error.message });
    }
  }

  async cleanupOrphanedInDirectory(directory, tableName, columnName) {
    try {
      const files = await fs.readdir(directory);
      let deletedCount = 0;

      for (const file of files) {
        try {
          // Check if file exists in database
          const record = await database.get(
            `SELECT 1 FROM ${tableName} WHERE ${columnName} LIKE ?`,
            [`%${file}%`]
          );

          if (!record) {
            const filePath = path.join(directory, file);
            await this.safeDeleteFile(filePath);
            deletedCount++;
            logger.logFileOperation('cleanup_orphaned', file, null, true);
          }
        } catch (error) {
          logger.error(`Failed to check orphaned file ${file}`, { error: error.message });
        }
      }

      logger.info(`Orphaned files in ${directory}: ${deletedCount} files deleted`);
      
    } catch (error) {
      logger.error(`Failed to cleanup orphaned files in ${directory}`, { error: error.message });
    }
  }

  // Archive old logs
  async archiveOldLogs() {
    try {
      logger.info('Starting log archival');
      
      const logsDir = path.join(__dirname, '../logs');
      const archiveDir = path.join(logsDir, 'archive');
      
      await fs.mkdir(archiveDir, { recursive: true });
      
      const files = await fs.readdir(logsDir);
      const now = Date.now();
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      
      let archivedCount = 0;

      for (const file of files) {
        if (file === 'archive') continue;
        
        try {
          const filePath = path.join(logsDir, file);
          const stats = await fs.stat(filePath);
          
          if (now - stats.mtime.getTime() > maxAge) {
            const archivePath = path.join(archiveDir, `${Date.now()}_${file}`);
            await fs.rename(filePath, archivePath);
            archivedCount++;
          }
        } catch (error) {
          logger.error(`Failed to archive log file ${file}`, { error: error.message });
        }
      }

      logger.info(`Log archival completed: ${archivedCount} files archived`);
      
    } catch (error) {
      logger.error('Log archival failed', { error: error.message });
    }
  }

  // Database cleanup
  async cleanupDatabase() {
    try {
      logger.info('Starting database cleanup');
      
      // Clean up expired sessions
      await database.cleanupExpiredSessions();
      
      // Clean up old activity logs (keep 90 days)
      await database.cleanupOldLogs(90);
      
      // Clean up old error logs (keep 180 days)
      const cutoffDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
      await database.run(
        'DELETE FROM error_logs WHERE created_at < ?',
        [cutoffDate.toISOString()]
      );
      
      // Update database statistics
      await database.run('VACUUM');
      
      logger.info('Database cleanup completed');
      
    } catch (error) {
      logger.error('Database cleanup failed', { error: error.message });
    }
  }

  // System health check
  async systemHealthCheck() {
    try {
      const health = {
        timestamp: new Date().toISOString(),
        diskSpace: await this.getDiskUsage(),
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        activeJobs: await this.getActiveJobsCount(),
        totalClips: await this.getTotalClipsCount(),
        errorRate: await this.getRecentErrorRate()
      };

      // Log health status
      logger.info('System health check', health);

      // Check for potential issues
      if (health.diskSpace.usagePercent > 85) {
        logger.warn('High disk usage detected', { 
          usage: health.diskSpace.usagePercent,
          available: health.diskSpace.available 
        });
      }

      if (health.memory.heapUsed / health.memory.heapTotal > 0.8) {
        logger.warn('High memory usage detected', { 
          usage: Math.round((health.memory.heapUsed / health.memory.heapTotal) * 100) 
        });
      }

      if (health.errorRate > 10) {
        logger.warn('High error rate detected', { errorRate: health.errorRate });
      }

      return health;
      
    } catch (error) {
      logger.error('System health check failed', { error: error.message });
    }
  }

  // Create backup
  async createBackup() {
    try {
      logger.info('Starting backup creation');
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(this.backupDir, `backup_${timestamp}`);
      
      await fs.mkdir(backupPath, { recursive: true });
      
      // Backup database
      const dbPath = path.join(__dirname, '../data/app.db');
      const dbBackupPath = path.join(backupPath, 'database.db');
      await fs.copyFile(dbPath, dbBackupPath);
      
      // Backup important configuration files
      const configFiles = [
        path.join(__dirname, '../package.json'),
        path.join(__dirname, '../.env')
      ];
      
      for (const configFile of configFiles) {
        try {
          const fileName = path.basename(configFile);
          const backupFile = path.join(backupPath, fileName);
          await fs.copyFile(configFile, backupFile);
        } catch (error) {
          // File might not exist, continue
        }
      }
      
      // Create backup metadata
      const metadata = {
        timestamp,
        version: require('../package.json').version,
        nodeVersion: process.version,
        systemStats: await this.systemHealthCheck()
      };
      
      await fs.writeFile(
        path.join(backupPath, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      );
      
      // Clean up old backups (keep 7 days)
      await this.cleanupOldBackups();
      
      logger.info(`Backup created successfully: ${backupPath}`);
      
    } catch (error) {
      logger.error('Backup creation failed', { error: error.message });
    }
  }

  async cleanupOldBackups() {
    try {
      const backups = await fs.readdir(this.backupDir);
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      for (const backup of backups) {
        const backupPath = path.join(this.backupDir, backup);
        const stats = await fs.stat(backupPath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await this.deleteDirectory(backupPath);
          logger.info(`Old backup deleted: ${backup}`);
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup old backups', { error: error.message });
    }
  }

  // Utility methods
  async safeDeleteFile(filePath) {
    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      return false; // File doesn't exist
    }
  }

  async deleteDirectory(dirPath) {
    try {
      const files = await fs.readdir(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isDirectory()) {
          await this.deleteDirectory(filePath);
        } else {
          await fs.unlink(filePath);
        }
      }
      
      await fs.rmdir(dirPath);
    } catch (error) {
      throw error;
    }
  }

  async getDiskUsage() {
    try {
      const stats = await fs.statvfs ? fs.statvfs('.') : null;
      if (stats) {
        const total = stats.blocks * stats.frsize;
        const free = stats.bavail * stats.frsize;
        const used = total - free;
        
        return {
          total,
          used,
          available: free,
          usagePercent: Math.round((used / total) * 100)
        };
      }
      return { error: 'Disk usage not available on this platform' };
    } catch (error) {
      return { error: error.message };
    }
  }

  async getActiveJobsCount() {
    try {
      const result = await database.get(
        "SELECT COUNT(*) as count FROM jobs WHERE status IN ('pending', 'processing')"
      );
      return result.count;
    } catch (error) {
      return 0;
    }
  }

  async getTotalClipsCount() {
    try {
      const result = await database.get(
        "SELECT COUNT(*) as count FROM clips WHERE is_archived = 0"
      );
      return result.count;
    } catch (error) {
      return 0;
    }
  }

  async getRecentErrorRate() {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const result = await database.get(
        "SELECT COUNT(*) as count FROM error_logs WHERE created_at > ?",
        [oneHourAgo.toISOString()]
      );
      return result.count;
    } catch (error) {
      return 0;
    }
  }

  // Manual operations
  async forceCleanup() {
    logger.info('Starting manual force cleanup');
    
    await this.cleanupExpiredClips();
    await this.cleanupTempFiles();
    await this.cleanupOrphanedFiles();
    await this.cleanupDatabase();
    
    logger.info('Manual force cleanup completed');
  }

  async createManualBackup() {
    return this.createBackup();
  }

  async getStorageStats() {
    try {
      const stats = {
        uploads: await this.getDirectorySize(this.uploadsDir),
        clips: await this.getDirectorySize(this.clipsDir),
        thumbnails: await this.getDirectorySize(this.thumbnailsDir),
        temp: await this.getDirectorySize(this.tempDir),
        backups: await this.getDirectorySize(this.backupDir),
        logs: await this.getDirectorySize(path.join(__dirname, '../logs'))
      };
      
      stats.total = Object.values(stats).reduce((sum, size) => sum + size, 0);
      
      return stats;
    } catch (error) {
      logger.error('Failed to get storage stats', { error: error.message });
      return {};
    }
  }

  async getDirectorySize(dirPath) {
    try {
      const files = await fs.readdir(dirPath);
      let totalSize = 0;
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isDirectory()) {
          totalSize += await this.getDirectorySize(filePath);
        } else {
          totalSize += stats.size;
        }
      }
      
      return totalSize;
    } catch (error) {
      return 0;
    }
  }
}

module.exports = new FileManagerService();
