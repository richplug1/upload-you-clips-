const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const database = require('../models/database');
const errorHandler = require('./errorHandler');
const logger = require('./logger');

class VideoProcessorService {
  constructor() {
    this.outputDir = path.join(__dirname, '../clips');
    this.thumbnailDir = path.join(__dirname, '../thumbnails');
    this.ensureDirectories();
  }

  async ensureDirectories() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      await fs.mkdir(this.thumbnailDir, { recursive: true });
    } catch (error) {
      throw errorHandler.createError(
        errorHandler.errorTypes.FILE_SYSTEM,
        `Failed to create video processing directories: ${error.message}`,
        {
          severity: errorHandler.severityLevels.HIGH,
          context: {
            outputDir: this.outputDir,
            thumbnailDir: this.thumbnailDir,
            originalError: error.message
          },
          userMessage: 'Erreur lors de l\'initialisation du système de traitement vidéo.'
        }
      );
    }
  }

  // Get video metadata
  async getVideoMetadata(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          const videoError = errorHandler.createError(
            errorHandler.errorTypes.VIDEO_PROCESSING,
            `Failed to read video metadata: ${err.message}`,
            {
              severity: errorHandler.severityLevels.MEDIUM,
              context: {
                filePath,
                ffprobeError: err.message
              },
              userMessage: 'Impossible de lire les métadonnées de la vidéo.'
            }
          );
          reject(videoError);
        } else {
          const videoStream = metadata.streams.find(s => s.codec_type === 'video');
          const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
          
          resolve({
            duration: metadata.format.duration,
            size: metadata.format.size,
            bitrate: metadata.format.bit_rate,
            format: metadata.format.format_name,
            video: videoStream ? {
              codec: videoStream.codec_name,
              width: videoStream.width,
              height: videoStream.height,
              fps: eval(videoStream.r_frame_rate),
              bitrate: videoStream.bit_rate
            } : null,
            audio: audioStream ? {
              codec: audioStream.codec_name,
              channels: audioStream.channels,
              sample_rate: audioStream.sample_rate,
              bitrate: audioStream.bit_rate
            } : null
          });
        }
      });
    });
  }

  // Generate thumbnail
  async generateThumbnail(inputPath, outputPath, timeOffset = '50%') {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .screenshots({
          timestamps: [timeOffset],
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
          size: '320x240'
        })
        .on('end', () => resolve(outputPath))
        .on('error', (err) => {
          const thumbnailError = errorHandler.createError(
            errorHandler.errorTypes.VIDEO_PROCESSING,
            `Thumbnail generation failed: ${err.message}`,
            {
              severity: errorHandler.severityLevels.MEDIUM,
              context: {
                inputPath,
                outputPath,
                timeOffset,
                ffmpegError: err.message
              },
              userMessage: 'Échec de la génération de la miniature.'
            }
          );
          reject(thumbnailError);
        });
    });
  }

  // Create video clips based on duration settings
  async createClips(jobId, userId, inputPath, settings) {
    try {
      const metadata = await this.getVideoMetadata(inputPath);
      const { duration, customDuration, generateSubtitles } = settings;
      
      // Update job status
      await database.updateJob(jobId, { status: 'processing', progress: 10 });

      const clipDuration = customDuration || duration || 300; // Default 5 minutes
      const totalDuration = metadata.duration;
      const numClips = Math.ceil(totalDuration / clipDuration);
      
      const clips = [];
      
      for (let i = 0; i < numClips; i++) {
        const startTime = i * clipDuration;
        const endTime = Math.min(startTime + clipDuration, totalDuration);
        const actualDuration = endTime - startTime;
        
        // Skip very short clips
        if (actualDuration < 10) continue;
        
        const clipId = uuidv4();
        const clipFilename = `${clipId}_part${i + 1}.mp4`;
        const clipPath = path.join(this.outputDir, clipFilename);
        const thumbnailPath = path.join(this.thumbnailDir, `${clipId}_thumb.jpg`);
        
        // Create clip
        await this.createClip(inputPath, clipPath, startTime, actualDuration, generateSubtitles);
        
        // Generate thumbnail
        await this.generateThumbnail(clipPath, thumbnailPath, '10%');
        
        // Get file size
        const stats = await fs.stat(clipPath);
        
        // Save clip to database
        await database.createClip({
          id: clipId,
          jobId,
          userId,
          filename: clipFilename,
          duration: actualDuration,
          size: stats.size,
          thumbnailUrl: `/thumbnails/${path.basename(thumbnailPath)}`,
          metadata: {
            partNumber: i + 1,
            totalParts: numClips,
            startTime,
            endTime,
            originalDuration: totalDuration,
            hasSubtitles: generateSubtitles
          }
        });
        
        clips.push({
          id: clipId,
          filename: clipFilename,
          duration: actualDuration,
          size: stats.size,
          thumbnailUrl: `/thumbnails/${path.basename(thumbnailPath)}`,
          partNumber: i + 1,
          totalParts: numClips
        });
        
        // Update progress
        const progress = Math.round(((i + 1) / numClips) * 80) + 10;
        await database.updateJob(jobId, { progress });
      }
      
      // Update job completion
      await database.updateJob(jobId, { 
        status: 'completed', 
        progress: 100,
        output_files: JSON.stringify(clips),
        completed_at: new Date().toISOString()
      });
      
      return clips;
      
    } catch (error) {
      logger.error('Error creating clips', { 
        error: error.message, 
        jobId, 
        userId,
        inputPath
      });
      
      await database.updateJob(jobId, { 
        status: 'failed', 
        error_message: error.message 
      });
      
      if (error.isAppError) {
        throw error;
      }
      
      throw errorHandler.createError(
        errorHandler.errorTypes.VIDEO_PROCESSING,
        `Video clip creation failed: ${error.message}`,
        {
          severity: errorHandler.severityLevels.HIGH,
          context: {
            jobId,
            userId,
            inputPath,
            settings,
            originalError: error.message
          },
          userMessage: 'Échec de la création des clips vidéo. Veuillez réessayer.'
        }
      );
    }
  }

  // Create individual clip
  async createClip(inputPath, outputPath, startTime, duration, addSubtitles = false) {
    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath)
        .setStartTime(startTime)
        .setDuration(duration)
        .outputOptions([
          '-c:v libx264',
          '-preset fast',
          '-crf 23',
          '-c:a aac',
          '-b:a 128k',
          '-movflags +faststart'
        ]);

      if (addSubtitles) {
        // Basic subtitle filter (you might want to integrate with speech recognition service)
        command = command.outputOptions([
          '-vf', 'subtitles=filename=temp_subs.srt:force_style="FontSize=24,PrimaryColour=&Hffffff"'
        ]);
      }

      command
        .output(outputPath)
        .on('progress', (progress) => {
          // You can emit progress events here
          logger.debug(`Processing clip: ${progress.percent}% done`, {
            inputPath,
            outputPath,
            startTime,
            duration
          });
        })
        .on('end', () => resolve(outputPath))
        .on('error', (err) => {
          const clipError = errorHandler.createError(
            errorHandler.errorTypes.VIDEO_PROCESSING,
            `Video clip creation failed: ${err.message}`,
            {
              severity: errorHandler.severityLevels.HIGH,
              context: {
                inputPath,
                outputPath,
                startTime,
                duration,
                addSubtitles,
                ffmpegError: err.message
              },
              userMessage: 'Échec de la création du clip vidéo.'
            }
          );
          reject(clipError);
        })
        .run();
    });
  }

  // Merge clips back together
  async mergeClips(clipPaths, outputPath) {
    return new Promise((resolve, reject) => {
      const command = ffmpeg();
      
      clipPaths.forEach(clipPath => {
        command.input(clipPath);
      });
      
      command
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .mergeToFile(outputPath);
    });
  }

  // Convert video format
  async convertVideo(inputPath, outputPath, format = 'mp4') {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .output(outputPath)
        .outputOptions([
          '-c:v libx264',
          '-preset medium',
          '-crf 23',
          '-c:a aac',
          '-b:a 128k'
        ])
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run();
    });
  }

  // Extract audio from video
  async extractAudio(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .output(outputPath)
        .outputOptions([
          '-vn',
          '-c:a aac',
          '-b:a 192k'
        ])
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run();
    });
  }

  // Add watermark to video
  async addWatermark(inputPath, outputPath, watermarkPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .input(watermarkPath)
        .complexFilter([
          '[0:v][1:v] overlay=W-w-10:H-h-10:enable=\'between(t,0,20)\' [v]'
        ])
        .outputOptions([
          '-map', '[v]',
          '-map', '0:a',
          '-c:a copy',
          '-c:v libx264',
          '-preset fast'
        ])
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run();
    });
  }

  // Optimize video for web
  async optimizeForWeb(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .output(outputPath)
        .outputOptions([
          '-c:v libx264',
          '-preset slow',
          '-crf 28',
          '-c:a aac',
          '-b:a 96k',
          '-movflags +faststart',
          '-vf scale=1280:720'
        ])
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run();
    });
  }

  // Create video preview (short clip)
  async createPreview(inputPath, outputPath, duration = 30) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(10) // Start 10 seconds in
        .setDuration(duration)
        .output(outputPath)
        .outputOptions([
          '-c:v libx264',
          '-preset fast',
          '-crf 28',
          '-c:a aac',
          '-b:a 96k',
          '-vf scale=640:360'
        ])
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run();
    });
  }

  // Batch process multiple videos
  async batchProcess(jobs) {
    const results = [];
    
    for (const job of jobs) {
      try {
        const result = await this.createClips(
          job.id,
          job.userId,
          job.inputPath,
          job.settings
        );
        results.push({ jobId: job.id, success: true, clips: result });
      } catch (error) {
        results.push({ jobId: job.id, success: false, error: error.message });
      }
    }
    
    return results;
  }

  // Clean up old files
  async cleanupOldFiles(maxAgeInDays = 30) {
    const cutoffDate = new Date(Date.now() - maxAgeInDays * 24 * 60 * 60 * 1000);
    
    try {
      // Get expired clips
      const expiredClips = await database.all(
        'SELECT filename FROM clips WHERE created_at < ? OR expires_at < CURRENT_TIMESTAMP',
        [cutoffDate.toISOString()]
      );
      
      // Delete files
      for (const clip of expiredClips) {
        try {
          const clipPath = path.join(this.outputDir, clip.filename);
          const thumbnailPath = path.join(this.thumbnailDir, clip.filename.replace('.mp4', '_thumb.jpg'));
          
          await fs.unlink(clipPath).catch(() => {}); // Ignore errors
          await fs.unlink(thumbnailPath).catch(() => {}); // Ignore errors
        } catch (error) {
          console.error(`Error deleting file ${clip.filename}:`, error);
        }
      }
      
      // Archive clips in database
      await database.archiveExpiredClips();
      
      console.log(`Cleaned up ${expiredClips.length} expired clips`);
      
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  // Get processing queue status
  async getQueueStatus() {
    const stats = await database.all(`
      SELECT 
        status,
        COUNT(*) as count,
        AVG(progress) as avg_progress
      FROM jobs 
      WHERE created_at > datetime('now', '-24 hours')
      GROUP BY status
    `);
    
    return stats;
  }
}

module.exports = new VideoProcessorService();
