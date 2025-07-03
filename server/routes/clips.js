const express = require('express');
const authService = require('../services/authService');
const validation = require('../services/validation');
const logger = require('../services/logger');
const database = require('../models/database');
const path = require('path');

const router = express.Router();

// Get user's clips
router.get('/',
  authService.optionalAuth.bind(authService),
  validation.validatePagination,
  validation.asyncHandler(async (req, res) => {
    try {
      const userId = req.user?.id;
      const includeArchived = req.query.archived === 'true';
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      if (!userId) {
        return res.json({
          clips: [],
          pagination: { page: 1, limit, total: 0, pages: 0 }
        });
      }

      // Get clips with pagination
      const whereClause = includeArchived 
        ? 'WHERE user_id = ?' 
        : 'WHERE user_id = ? AND is_archived = 0';
      
      const clips = await database.all(
        `SELECT * FROM ${whereClause} 
         ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );

      // Get total count
      const totalCount = await database.get(
        `SELECT COUNT(*) as count FROM clips ${whereClause}`,
        [userId]
      );

      // Parse metadata for each clip
      const clipsWithMetadata = clips.map(clip => ({
        ...clip,
        metadata: clip.metadata ? JSON.parse(clip.metadata) : {},
        expiresAt: clip.expires_at,
        isArchived: clip.is_archived === 1
      }));

      res.json({
        clips: clipsWithMetadata,
        pagination: {
          page,
          limit,
          total: totalCount.count,
          pages: Math.ceil(totalCount.count / limit)
        }
      });

    } catch (error) {
      logger.error('Get clips error', { 
        error: error.message, 
        userId: req.user?.id 
      });
      
      res.status(500).json({ error: 'Failed to get clips' });
    }
  })
);

// Get specific clip
router.get('/:clipId',
  authService.optionalAuth.bind(authService),
  validation.validateClipId,
  validation.asyncHandler(async (req, res) => {
    try {
      const { clipId } = req.params;

      const clip = await database.get(
        'SELECT * FROM clips WHERE id = ?',
        [clipId]
      );

      if (!clip) {
        return res.status(404).json({ error: 'Clip not found' });
      }

      // Check if user has access to this clip
      if (clip.user_id && req.user && clip.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const clipWithMetadata = {
        ...clip,
        metadata: clip.metadata ? JSON.parse(clip.metadata) : {},
        expiresAt: clip.expires_at,
        isArchived: clip.is_archived === 1
      };

      res.json(clipWithMetadata);

    } catch (error) {
      logger.error('Get clip error', { 
        error: error.message, 
        clipId: req.params.clipId 
      });
      
      res.status(500).json({ error: 'Failed to get clip' });
    }
  })
);

// Download clip
router.get('/:clipId/download',
  authService.optionalAuth.bind(authService),
  validation.validateClipId,
  validation.logActivity('clip_download', 'clip'),
  validation.asyncHandler(async (req, res) => {
    try {
      const { clipId } = req.params;

      const clip = await database.get(
        'SELECT * FROM clips WHERE id = ?',
        [clipId]
      );

      if (!clip) {
        return res.status(404).json({ error: 'Clip not found' });
      }

      // Check if user has access to this clip
      if (clip.user_id && req.user && clip.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const clipPath = path.join(__dirname, '../clips', clip.filename);
      
      // Check if file exists
      const fs = require('fs').promises;
      try {
        await fs.access(clipPath);
      } catch (error) {
        return res.status(404).json({ error: 'Clip file not found' });
      }

      logger.logFileOperation('download', clip.filename, req.user?.id, true);
      
      res.download(clipPath, clip.filename);

    } catch (error) {
      logger.error('Download clip error', { 
        error: error.message, 
        clipId: req.params.clipId 
      });
      
      res.status(500).json({ error: 'Failed to download clip' });
    }
  })
);

// Stream clip video
router.get('/:clipId/stream',
  authService.optionalAuth.bind(authService),
  validation.validateClipId,
  validation.asyncHandler(async (req, res) => {
    try {
      const { clipId } = req.params;

      const clip = await database.get(
        'SELECT * FROM clips WHERE id = ?',
        [clipId]
      );

      if (!clip) {
        return res.status(404).json({ error: 'Clip not found' });
      }

      // Check if user has access to this clip
      if (clip.user_id && req.user && clip.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const clipPath = path.join(__dirname, '../clips', clip.filename);
      
      // Check if file exists
      const fs = require('fs');
      if (!fs.existsSync(clipPath)) {
        return res.status(404).json({ error: 'Clip file not found' });
      }

      const stat = fs.statSync(clipPath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        // Support for video seeking
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(clipPath, { start, end });
        
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'video/mp4',
        };
        
        res.writeHead(206, head);
        file.pipe(res);
      } else {
        const head = {
          'Content-Length': fileSize,
          'Content-Type': 'video/mp4',
        };
        
        res.writeHead(200, head);
        fs.createReadStream(clipPath).pipe(res);
      }

    } catch (error) {
      logger.error('Stream clip error', { 
        error: error.message, 
        clipId: req.params.clipId 
      });
      
      res.status(500).json({ error: 'Failed to stream clip' });
    }
  })
);

// Get clip thumbnail
router.get('/:clipId/thumbnail',
  authService.optionalAuth.bind(authService),
  validation.validateClipId,
  validation.asyncHandler(async (req, res) => {
    try {
      const { clipId } = req.params;

      const clip = await database.get(
        'SELECT * FROM clips WHERE id = ?',
        [clipId]
      );

      if (!clip) {
        return res.status(404).json({ error: 'Clip not found' });
      }

      // Check if user has access to this clip
      if (clip.user_id && req.user && clip.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const thumbnailName = clip.filename.replace('.mp4', '_thumb.jpg');
      const thumbnailPath = path.join(__dirname, '../thumbnails', thumbnailName);
      
      // Check if file exists
      const fs = require('fs').promises;
      try {
        await fs.access(thumbnailPath);
      } catch (error) {
        return res.status(404).json({ error: 'Thumbnail not found' });
      }

      res.sendFile(thumbnailPath);

    } catch (error) {
      logger.error('Get thumbnail error', { 
        error: error.message, 
        clipId: req.params.clipId 
      });
      
      res.status(500).json({ error: 'Failed to get thumbnail' });
    }
  })
);

// Delete clip
router.delete('/:clipId',
  authService.authenticateToken.bind(authService),
  validation.validateClipId,
  validation.logActivity('clip_delete', 'clip'),
  validation.asyncHandler(async (req, res) => {
    try {
      const { clipId } = req.params;

      const clip = await database.get(
        'SELECT * FROM clips WHERE id = ? AND user_id = ?',
        [clipId, req.user.id]
      );

      if (!clip) {
        return res.status(404).json({ error: 'Clip not found' });
      }

      // Delete physical files
      const fs = require('fs').promises;
      try {
        // Delete clip file
        const clipPath = path.join(__dirname, '../clips', clip.filename);
        await fs.unlink(clipPath).catch(() => {});

        // Delete thumbnail
        const thumbnailName = clip.filename.replace('.mp4', '_thumb.jpg');
        const thumbnailPath = path.join(__dirname, '../thumbnails', thumbnailName);
        await fs.unlink(thumbnailPath).catch(() => {});
      } catch (error) {
        logger.error(`Failed to delete clip files for ${clipId}`, { error: error.message });
      }

      // Delete from database
      await database.deleteClip(clipId, req.user.id);

      logger.logFileOperation('delete', clip.filename, req.user.id, true);
      
      res.json({ message: 'Clip deleted successfully' });

    } catch (error) {
      logger.error('Delete clip error', { 
        error: error.message, 
        clipId: req.params.clipId,
        userId: req.user.id 
      });
      
      res.status(500).json({ error: 'Failed to delete clip' });
    }
  })
);

// Archive/unarchive clip
router.patch('/:clipId/archive',
  authService.authenticateToken.bind(authService),
  validation.validateClipId,
  validation.logActivity('clip_archive', 'clip'),
  validation.asyncHandler(async (req, res) => {
    try {
      const { clipId } = req.params;
      const { archived } = req.body;

      const clip = await database.get(
        'SELECT * FROM clips WHERE id = ? AND user_id = ?',
        [clipId, req.user.id]
      );

      if (!clip) {
        return res.status(404).json({ error: 'Clip not found' });
      }

      await database.run(
        'UPDATE clips SET is_archived = ? WHERE id = ?',
        [archived ? 1 : 0, clipId]
      );
      
      res.json({ 
        message: `Clip ${archived ? 'archived' : 'unarchived'} successfully`,
        archived: archived 
      });

    } catch (error) {
      logger.error('Archive clip error', { 
        error: error.message, 
        clipId: req.params.clipId,
        userId: req.user.id 
      });
      
      res.status(500).json({ error: 'Failed to archive clip' });
    }
  })
);

// Get clip analytics
router.get('/:clipId/analytics',
  authService.authenticateToken.bind(authService),
  validation.validateClipId,
  validation.asyncHandler(async (req, res) => {
    try {
      const { clipId } = req.params;

      const clip = await database.get(
        'SELECT * FROM clips WHERE id = ? AND user_id = ?',
        [clipId, req.user.id]
      );

      if (!clip) {
        return res.status(404).json({ error: 'Clip not found' });
      }

      // Get analytics data
      const views = await database.all(
        `SELECT COUNT(*) as count, DATE(created_at) as date 
         FROM user_activity 
         WHERE resource_id = ? AND action IN ('clip_view', 'clip_download', 'clip_stream')
         GROUP BY DATE(created_at)
         ORDER BY date DESC
         LIMIT 30`,
        [clipId]
      );

      const totalViews = await database.get(
        `SELECT COUNT(*) as count 
         FROM user_activity 
         WHERE resource_id = ? AND action IN ('clip_view', 'clip_download', 'clip_stream')`,
        [clipId]
      );

      const downloads = await database.get(
        `SELECT COUNT(*) as count 
         FROM user_activity 
         WHERE resource_id = ? AND action = 'clip_download'`,
        [clipId]
      );

      res.json({
        clip: {
          id: clip.id,
          filename: clip.filename,
          created_at: clip.created_at
        },
        analytics: {
          totalViews: totalViews.count,
          totalDownloads: downloads.count,
          viewsByDate: views
        }
      });

    } catch (error) {
      logger.error('Get clip analytics error', { 
        error: error.message, 
        clipId: req.params.clipId,
        userId: req.user.id 
      });
      
      res.status(500).json({ error: 'Failed to get clip analytics' });
    }
  })
);

// Bulk operations
router.post('/bulk-delete',
  authService.authenticateToken.bind(authService),
  validation.logActivity('clips_bulk_delete', 'clip'),
  validation.asyncHandler(async (req, res) => {
    try {
      const { clipIds } = req.body;

      if (!Array.isArray(clipIds) || clipIds.length === 0) {
        return res.status(400).json({ error: 'Clip IDs array is required' });
      }

      const clips = await database.all(
        `SELECT * FROM clips WHERE id IN (${clipIds.map(() => '?').join(',')}) AND user_id = ?`,
        [...clipIds, req.user.id]
      );

      if (clips.length === 0) {
        return res.status(404).json({ error: 'No clips found' });
      }

      const fs = require('fs').promises;
      let deletedCount = 0;
      let failedCount = 0;

      for (const clip of clips) {
        try {
          // Delete physical files
          const clipPath = path.join(__dirname, '../clips', clip.filename);
          await fs.unlink(clipPath).catch(() => {});

          const thumbnailName = clip.filename.replace('.mp4', '_thumb.jpg');
          const thumbnailPath = path.join(__dirname, '../thumbnails', thumbnailName);
          await fs.unlink(thumbnailPath).catch(() => {});

          // Delete from database
          await database.deleteClip(clip.id, req.user.id);

          deletedCount++;
          logger.logFileOperation('bulk_delete', clip.filename, req.user.id, true);

        } catch (error) {
          failedCount++;
          logger.error(`Failed to delete clip ${clip.id}`, { error: error.message });
        }
      }
      
      res.json({ 
        message: `Bulk delete completed: ${deletedCount} deleted, ${failedCount} failed`,
        deleted: deletedCount,
        failed: failedCount
      });

    } catch (error) {
      logger.error('Bulk delete error', { 
        error: error.message, 
        userId: req.user.id 
      });
      
      res.status(500).json({ error: 'Failed to delete clips' });
    }
  })
);

module.exports = router;
