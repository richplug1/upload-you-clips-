const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const authService = require('../services/authService');
const validation = require('../services/validation');
const logger = require('../services/logger');
const database = require('../models/database');
const videoProcessor = require('../services/videoProcessor');
const { checkVideoProcessingCredits, deductCredits } = require('../middleware/creditMiddleware');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueId}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/wmv', 'video/webm'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  }
});

// Upload video file
router.post('/upload',
  authService.optionalAuth.bind(authService),
  validation.uploadLimiter,
  upload.single('video'),
  validation.validateFileUpload,
  validation.logActivity('file_upload', 'video'),
  validation.asyncHandler(async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No video file uploaded' });
      }

      const fileId = uuidv4();
      const fileName = req.file.filename;
      const filePath = req.file.path;
      const originalName = req.file.originalname;
      const fileSize = req.file.size;

      // Get video metadata
      const metadata = await videoProcessor.getVideoMetadata(filePath);

      // Store file info in database and create job object
      const job = {
        id: fileId,
        user_id: req.user?.id || null,
        status: 'uploaded',
        input_file: fileName,
        output_files: null,
        settings: JSON.stringify({ originalName, fileSize, metadata }),
        progress: 0,
        error_message: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: null
      };

      if (req.user) {
        await database.run(
          `INSERT INTO jobs (id, user_id, input_file, settings, status) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            fileId,
            req.user.id,
            fileName,
            JSON.stringify({ originalName, fileSize, metadata }),
            'uploaded'
          ]
        );
      } else {
        // For demo mode, just log the upload
        logger.info('Demo upload completed', { fileId, fileName, originalName });
      }

      logger.logFileOperation('upload', fileName, req.user?.id, true);
      
      res.json({
        message: 'Video uploaded successfully',
        job
      });

    } catch (error) {
      logger.error('Upload error', { 
        error: error.message, 
        userId: req.user?.id,
        fileName: req.file?.filename
      });

      // Clean up uploaded file on error
      if (req.file) {
        try {
          const fs = require('fs').promises;
          await fs.unlink(req.file.path);
        } catch (cleanupError) {
          logger.error('Failed to cleanup uploaded file', { error: cleanupError.message });
        }
      }
      
      res.status(500).json({ error: 'Upload failed' });
    }
  })
);

// Process video into clips
router.post('/process',
  authService.authenticateToken, // Require authentication for credit checking
  validation.validateVideoProcessing,
  checkVideoProcessingCredits, // Check credits and subscription limits
  validation.logActivity('video_process', 'job'),
  validation.asyncHandler(async (req, res) => {
    try {
      const { fileId, fileName, duration, customDuration, generateSubtitles, clipsCount = 3 } = req.body;

      if (!fileId && !fileName) {
        return res.status(400).json({ error: 'File ID or file name is required' });
      }

      const jobId = uuidv4();
      const userId = req.user.userId;
      const inputFile = fileName || fileId;
      const inputPath = path.join(__dirname, '../uploads', inputFile);
      const requiredCredits = req.requiredCredits; // Set by creditMiddleware

      // Check if file exists
      const fs = require('fs').promises;
      try {
        await fs.access(inputPath);
      } catch (error) {
        return res.status(404).json({ error: 'Video file not found' });
      }

      // Deduct credits before processing
      try {
        await database.deductUserCredits(userId, requiredCredits, {
          video_id: jobId,
          clips_generated: clipsCount,
          video_duration: duration
        });
        
        logger.info('Credits deducted for video processing', {
          userId,
          jobId,
          credits: requiredCredits,
          duration,
          clipsCount
        });
      } catch (creditError) {
        return res.status(403).json({ 
          error: 'Failed to deduct credits',
          message: creditError.message
        });
      }

      // Create processing job
      await database.createJob({
        id: jobId,
        userId,
        inputFile,
        settings: {
          duration,
          customDuration,
          generateSubtitles,
          clipsCount,
          creditsDeducted: requiredCredits
        }
      });

      // Start processing asynchronously
      videoProcessor.createClips(jobId, userId, inputPath, {
        duration,
        customDuration,
        generateSubtitles,
        clipsCount
      }).catch(error => {
        logger.error('Video processing failed', { 
          error: error.message, 
          jobId, 
          userId 
        });
        
        // If processing fails, consider refunding credits
        // This would require additional logic to handle partial refunds
        logger.warn('Video processing failed after credits deducted', {
          jobId,
          userId,
          creditsDeducted: requiredCredits
        });
      });

      logger.logVideoProcessing(jobId, userId, 'started');
      
      res.json({
        message: 'Video processing started',
        jobId,
        status: 'processing',
        creditsDeducted: requiredCredits,
        estimatedClips: clipsCount
      });

    } catch (error) {
      logger.error('Process initiation error', { 
        error: error.message, 
        userId: req.user?.userId 
      });
      
      res.status(500).json({ error: 'Failed to start processing' });
    }
  })
);

// Get job status
router.get('/job/:jobId',
  authService.optionalAuth.bind(authService),
  validation.validateJobId,
  validation.asyncHandler(async (req, res) => {
    try {
      const { jobId } = req.params;

      const job = await database.get(
        'SELECT * FROM jobs WHERE id = ?',
        [jobId]
      );

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      // Check if user has access to this job
      if (job.user_id && req.user && job.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get associated clips if job is completed
      let clips = [];
      if (job.status === 'completed') {
        clips = await database.getClipsByUser(job.user_id || 0);
        clips = clips.filter(clip => clip.job_id === jobId);
      }

      res.json({
        job: {
          id: job.id,
          status: job.status,
          progress: job.progress,
          error: job.error_message,
          createdAt: job.created_at,
          completedAt: job.completed_at
        },
        clips
      });

    } catch (error) {
      logger.error('Get job status error', { 
        error: error.message, 
        jobId: req.params.jobId 
      });
      
      res.status(500).json({ error: 'Failed to get job status' });
    }
  })
);

// Get user's jobs
router.get('/jobs',
  authService.authenticateToken.bind(authService),
  validation.validatePagination,
  validation.asyncHandler(async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const jobs = await database.all(
        `SELECT * FROM jobs WHERE user_id = ? 
         ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [req.user.id, limit, offset]
      );

      const totalCount = await database.get(
        'SELECT COUNT(*) as count FROM jobs WHERE user_id = ?',
        [req.user.id]
      );

      res.json({
        jobs,
        pagination: {
          page,
          limit,
          total: totalCount.count,
          pages: Math.ceil(totalCount.count / limit)
        }
      });

    } catch (error) {
      logger.error('Get jobs error', { 
        error: error.message, 
        userId: req.user.id 
      });
      
      res.status(500).json({ error: 'Failed to get jobs' });
    }
  })
);

// Delete job
router.delete('/job/:jobId',
  authService.authenticateToken.bind(authService),
  validation.validateJobId,
  validation.logActivity('job_delete', 'job'),
  validation.asyncHandler(async (req, res) => {
    try {
      const { jobId } = req.params;

      const job = await database.get(
        'SELECT * FROM jobs WHERE id = ? AND user_id = ?',
        [jobId, req.user.id]
      );

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      // Delete associated clips first
      const clips = await database.all(
        'SELECT * FROM clips WHERE job_id = ?',
        [jobId]
      );

      const fs = require('fs').promises;
      for (const clip of clips) {
        try {
          // Delete clip file
          const clipPath = path.join(__dirname, '../clips', clip.filename);
          await fs.unlink(clipPath).catch(() => {});

          // Delete thumbnail
          const thumbnailName = clip.filename.replace('.mp4', '_thumb.jpg');
          const thumbnailPath = path.join(__dirname, '../thumbnails', thumbnailName);
          await fs.unlink(thumbnailPath).catch(() => {});
        } catch (error) {
          logger.error(`Failed to delete clip files for ${clip.id}`, { error: error.message });
        }
      }

      // Delete clips from database
      await database.run('DELETE FROM clips WHERE job_id = ?', [jobId]);

      // Delete input file
      try {
        const inputPath = path.join(__dirname, '../uploads', job.input_file);
        await fs.unlink(inputPath).catch(() => {});
      } catch (error) {
        logger.error(`Failed to delete input file for job ${jobId}`, { error: error.message });
      }

      // Delete job from database
      await database.run('DELETE FROM jobs WHERE id = ?', [jobId]);

      logger.logFileOperation('delete_job', job.input_file, req.user.id, true);
      
      res.json({ message: 'Job deleted successfully' });

    } catch (error) {
      logger.error('Delete job error', { 
        error: error.message, 
        jobId: req.params.jobId,
        userId: req.user.id 
      });
      
      res.status(500).json({ error: 'Failed to delete job' });
    }
  })
);

// Get video metadata
router.post('/metadata',
  authService.optionalAuth.bind(authService),
  validation.asyncHandler(async (req, res) => {
    try {
      const { fileName, fileId } = req.body;

      if (!fileName && !fileId) {
        return res.status(400).json({ error: 'File name or ID is required' });
      }

      const inputFile = fileName || fileId;
      const inputPath = path.join(__dirname, '../uploads', inputFile);

      // Check if file exists
      const fs = require('fs').promises;
      try {
        await fs.access(inputPath);
      } catch (error) {
        return res.status(404).json({ error: 'Video file not found' });
      }

      const metadata = await videoProcessor.getVideoMetadata(inputPath);
      
      res.json({
        fileName: inputFile,
        metadata
      });

    } catch (error) {
      logger.error('Get metadata error', { 
        error: error.message, 
        fileName: req.body.fileName 
      });
      
      res.status(500).json({ error: 'Failed to get video metadata' });
    }
  })
);

module.exports = router;
