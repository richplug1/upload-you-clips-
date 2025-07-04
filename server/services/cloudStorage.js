const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');
const errorHandler = require('./errorHandler');

class CloudStorageService {
  constructor() {
    this.s3Client = null;
    this.bucketName = process.env.AWS_S3_BUCKET;
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.isEnabled = false;
    
    this.init();
  }

  init() {
    try {
      // Check if AWS credentials are configured
      if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && this.bucketName) {
        this.s3Client = new S3Client({
          region: this.region,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
          }
        });
        
        this.isEnabled = true;
        logger.info('Cloud storage (S3) initialized successfully', {
          bucket: this.bucketName,
          region: this.region
        });
      } else {
        logger.warn('Cloud storage not configured - using local storage', {
          missingVars: this.getMissingVars()
        });
      }
    } catch (error) {
      const handledError = errorHandler.createError(
        errorHandler.errorTypes.CLOUD_STORAGE,
        `Failed to initialize cloud storage: ${error.message}`,
        {
          severity: errorHandler.severityLevels.HIGH,
          context: {
            region: this.region,
            bucketName: this.bucketName,
            hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
          },
          cause: error,
          retryable: true
        }
      );
      
      errorHandler.handleError(handledError);
      logger.error('Failed to initialize cloud storage', { error: error.message });
    }
  }

  getMissingVars() {
    const missing = [];
    if (!process.env.AWS_ACCESS_KEY_ID) missing.push('AWS_ACCESS_KEY_ID');
    if (!process.env.AWS_SECRET_ACCESS_KEY) missing.push('AWS_SECRET_ACCESS_KEY');
    if (!this.bucketName) missing.push('AWS_S3_BUCKET');
    return missing;
  }

  isConfigured() {
    return this.isEnabled && this.s3Client;
  }

  // Upload file to S3
  async uploadFile(filePath, key, metadata = {}) {
    if (!this.isConfigured()) {
      throw errorHandler.createError(
        errorHandler.errorTypes.CLOUD_STORAGE,
        'Cloud storage not configured',
        {
          statusCode: 503,
          severity: errorHandler.severityLevels.MEDIUM,
          context: { 
            filePath, 
            key,
            missingVars: this.getMissingVars()
          },
          userMessage: 'Le stockage cloud n\'est pas configuré. Utilisation du stockage local.',
          retryable: false
        }
      );
    }

    try {
      // Read file from local storage
      const fileContent = await fs.readFile(filePath);
      const fileStats = await fs.stat(filePath);
      
      // Determine content type
      const contentType = this.getContentType(filePath);
      
      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: fileContent,
        ContentType: contentType,
        Metadata: {
          ...metadata,
          uploadedAt: new Date().toISOString(),
          originalPath: filePath,
          size: fileStats.size.toString()
        }
      };

      const command = new PutObjectCommand(uploadParams);
      const result = await this.s3Client.send(command);
      
      logger.info('File uploaded to S3', {
        key,
        bucket: this.bucketName,
        size: fileStats.size,
        etag: result.ETag
      });

      return {
        key,
        bucket: this.bucketName,
        url: this.getPublicUrl(key),
        etag: result.ETag,
        size: fileStats.size,
        contentType
      };
    } catch (error) {
      const handledError = errorHandler.createError(
        errorHandler.errorTypes.CLOUD_STORAGE,
        `Failed to upload file to cloud storage: ${error.message}`,
        {
          severity: errorHandler.severityLevels.HIGH,
          context: {
            filePath,
            key,
            bucket: this.bucketName,
            fileExists: await fs.access(filePath).then(() => true).catch(() => false)
          },
          cause: error,
          retryable: true
        }
      );
      
      logger.error('S3 upload failed', { error: error.message, key });
      throw handledError;
    }
  }

  // Download file from S3
  async downloadFile(key, localPath) {
    if (!this.isConfigured()) {
      throw errorHandler.createError(
        errorHandler.errorTypes.CLOUD_STORAGE,
        'Cloud storage not configured',
        {
          statusCode: 503,
          severity: errorHandler.severityLevels.MEDIUM,
          context: { 
            key, 
            localPath,
            missingVars: this.getMissingVars()
          },
          userMessage: 'Le stockage cloud n\'est pas configuré.',
          retryable: false
        }
      );
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const response = await this.s3Client.send(command);
      const fileContent = await this.streamToBuffer(response.Body);
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(localPath), { recursive: true });
      
      // Write file to local storage
      await fs.writeFile(localPath, fileContent);
      
      logger.info('File downloaded from S3', {
        key,
        localPath,
        size: fileContent.length
      });

      return {
        localPath,
        size: fileContent.length,
        metadata: response.Metadata
      };
    } catch (error) {
      const handledError = errorHandler.createError(
        errorHandler.errorTypes.CLOUD_STORAGE,
        `Failed to download file from cloud storage: ${error.message}`,
        {
          severity: errorHandler.severityLevels.HIGH,
          context: {
            key,
            localPath,
            bucket: this.bucketName
          },
          cause: error,
          retryable: true,
          userMessage: 'Échec du téléchargement du fichier depuis le stockage cloud.'
        }
      );
      
      logger.error('S3 download failed', { error: error.message, key });
      throw handledError;
    }
  }

  // Delete file from S3
  async deleteFile(key) {
    if (!this.isConfigured()) {
      throw errorHandler.createError(
        errorHandler.errorTypes.CLOUD_STORAGE,
        'Cloud storage not configured',
        {
          statusCode: 503,
          severity: errorHandler.severityLevels.MEDIUM,
          context: { 
            key,
            missingVars: this.getMissingVars()
          },
          userMessage: 'Le stockage cloud n\'est pas configuré.',
          retryable: false
        }
      );
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      await this.s3Client.send(command);
      
      logger.info('File deleted from S3', { key });
      return true;
    } catch (error) {
      const handledError = errorHandler.createError(
        errorHandler.errorTypes.CLOUD_STORAGE,
        `Failed to delete file from cloud storage: ${error.message}`,
        {
          severity: errorHandler.severityLevels.HIGH,
          context: {
            key,
            bucket: this.bucketName
          },
          cause: error,
          retryable: true,
          userMessage: 'Échec de la suppression du fichier depuis le stockage cloud.'
        }
      );
      
      logger.error('S3 deletion failed', { error: error.message, key });
      throw handledError;
    }
  }

  // List files in S3 bucket
  async listFiles(prefix = '', maxKeys = 1000) {
    if (!this.isConfigured()) {
      throw errorHandler.createError(
        errorHandler.errorTypes.CLOUD_STORAGE,
        'Cloud storage not configured',
        {
          statusCode: 503,
          severity: errorHandler.severityLevels.MEDIUM,
          context: { 
            prefix,
            maxKeys,
            missingVars: this.getMissingVars()
          },
          userMessage: 'Le stockage cloud n\'est pas configuré.',
          retryable: false
        }
      );
    }

    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys
      });

      const response = await this.s3Client.send(command);
      
      const files = (response.Contents || []).map(file => ({
        key: file.Key,
        size: file.Size,
        lastModified: file.LastModified,
        etag: file.ETag,
        url: this.getPublicUrl(file.Key)
      }));

      return {
        files,
        isTruncated: response.IsTruncated,
        nextToken: response.NextContinuationToken,
        totalCount: response.KeyCount
      };
    } catch (error) {
      const handledError = errorHandler.createError(
        errorHandler.errorTypes.CLOUD_STORAGE,
        `Failed to list files from cloud storage: ${error.message}`,
        {
          severity: errorHandler.severityLevels.MEDIUM,
          context: {
            prefix,
            maxKeys,
            bucket: this.bucketName
          },
          cause: error,
          retryable: true,
          userMessage: 'Échec de la récupération de la liste des fichiers.'
        }
      );
      
      logger.error('S3 list failed', { error: error.message, prefix });
      throw handledError;
    }
  }

  // Generate presigned URL for temporary access
  async getPresignedUrl(key, expiresIn = 3600, operation = 'GET') {
    if (!this.isConfigured()) {
      throw errorHandler.createError(
        errorHandler.errorTypes.CLOUD_STORAGE,
        'Cloud storage not configured',
        {
          statusCode: 503,
          severity: errorHandler.severityLevels.MEDIUM,
          context: { 
            key,
            operation,
            expiresIn,
            missingVars: this.getMissingVars()
          },
          userMessage: 'Le stockage cloud n\'est pas configuré.',
          retryable: false
        }
      );
    }

    try {
      let command;
      
      if (operation === 'GET') {
        command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key
        });
      } else if (operation === 'PUT') {
        command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key
        });
      } else {
        throw errorHandler.createError(
          errorHandler.errorTypes.VALIDATION,
          `Unsupported operation: ${operation}`,
          {
            severity: errorHandler.severityLevels.LOW,
            context: { 
              key,
              operation,
              supportedOperations: ['GET', 'PUT']
            },
            userMessage: 'Opération non supportée.',
            retryable: false
          }
        );
      }

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      
      logger.info('Presigned URL generated', {
        key,
        operation,
        expiresIn
      });

      return url;
    } catch (error) {
      if (error.isAppError) {
        throw error;
      }
      
      const handledError = errorHandler.createError(
        errorHandler.errorTypes.CLOUD_STORAGE,
        `Failed to generate presigned URL: ${error.message}`,
        {
          severity: errorHandler.severityLevels.MEDIUM,
          context: {
            key,
            operation,
            expiresIn,
            bucket: this.bucketName
          },
          cause: error,
          retryable: true,
          userMessage: 'Échec de la génération de l\'URL temporaire.'
        }
      );
      
      logger.error('Presigned URL generation failed', { error: error.message, key });
      throw handledError;
    }
  }

  // Upload video with automatic key generation
  async uploadVideo(filePath, userId, jobId) {
    try {
      const fileName = path.basename(filePath);
      const extension = path.extname(fileName);
      const key = `videos/${userId}/${jobId}/${Date.now()}-${fileName}`;
      
      return await this.uploadFile(filePath, key, {
        userId: userId.toString(),
        jobId,
        type: 'video',
        originalName: fileName
      });
    } catch (error) {
      if (error.isAppError) {
        throw error;
      }
      
      throw errorHandler.createError(
        errorHandler.errorTypes.CLOUD_STORAGE,
        `Failed to upload video: ${error.message}`,
        {
          severity: errorHandler.severityLevels.HIGH,
          context: {
            filePath,
            userId,
            jobId,
            type: 'video'
          },
          cause: error,
          retryable: true,
          userMessage: 'Échec du téléchargement de la vidéo vers le stockage cloud.'
        }
      );
    }
  }

  // Upload clip with automatic key generation
  async uploadClip(filePath, userId, jobId, clipId) {
    try {
      const fileName = path.basename(filePath);
      const extension = path.extname(fileName);
      const key = `clips/${userId}/${jobId}/${clipId}-${fileName}`;
      
      return await this.uploadFile(filePath, key, {
        userId: userId.toString(),
        jobId,
        clipId,
        type: 'clip',
        originalName: fileName
      });
    } catch (error) {
      if (error.isAppError) {
        throw error;
      }
      
      throw errorHandler.createError(
        errorHandler.errorTypes.CLOUD_STORAGE,
        `Failed to upload clip: ${error.message}`,
        {
          severity: errorHandler.severityLevels.HIGH,
          context: {
            filePath,
            userId,
            jobId,
            clipId,
            type: 'clip'
          },
          cause: error,
          retryable: true,
          userMessage: 'Échec du téléchargement du clip vers le stockage cloud.'
        }
      );
    }
  }

  // Upload thumbnail with automatic key generation
  async uploadThumbnail(filePath, userId, jobId, clipId) {
    try {
      const fileName = path.basename(filePath);
      const extension = path.extname(fileName);
      const key = `thumbnails/${userId}/${jobId}/${clipId}-thumb${extension}`;
      
      return await this.uploadFile(filePath, key, {
        userId: userId.toString(),
        jobId,
        clipId,
        type: 'thumbnail',
        originalName: fileName
      });
    } catch (error) {
      if (error.isAppError) {
        throw error;
      }
      
      throw errorHandler.createError(
        errorHandler.errorTypes.CLOUD_STORAGE,
        `Failed to upload thumbnail: ${error.message}`,
        {
          severity: errorHandler.severityLevels.MEDIUM,
          context: {
            filePath,
            userId,
            jobId,
            clipId,
            type: 'thumbnail'
          },
          cause: error,
          retryable: true,
          userMessage: 'Échec du téléchargement de la miniature vers le stockage cloud.'
        }
      );
    }
  }

  // Clean up old files (for cost optimization)
  async cleanupOldFiles(daysOld = 30) {
    if (!this.isConfigured()) {
      return { deleted: 0, message: 'Cloud storage not configured' };
    }

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const { files } = await this.listFiles();
      const oldFiles = files.filter(file => file.lastModified < cutoffDate);
      
      let deletedCount = 0;
      const errors = [];
      
      for (const file of oldFiles) {
        try {
          await this.deleteFile(file.key);
          deletedCount++;
        } catch (error) {
          logger.warn('Failed to delete old file', { key: file.key, error: error.message });
          errors.push({ key: file.key, error: error.message });
        }
      }
      
      logger.info('Cloud storage cleanup completed', {
        totalFiles: files.length,
        deletedCount,
        cutoffDate,
        errors: errors.length
      });
      
      return { 
        deleted: deletedCount, 
        total: files.length,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      const handledError = errorHandler.createError(
        errorHandler.errorTypes.CLOUD_STORAGE,
        `Cloud storage cleanup failed: ${error.message}`,
        {
          severity: errorHandler.severityLevels.MEDIUM,
          context: {
            daysOld,
            bucket: this.bucketName
          },
          cause: error,
          retryable: true,
          userMessage: 'Échec du nettoyage du stockage cloud.'
        }
      );
      
      logger.error('Cloud storage cleanup failed', { error: error.message });
      throw handledError;
    }
  }

  // Helper methods
  getContentType(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
      '.wmv': 'video/x-ms-wmv',
      '.webm': 'video/webm',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    
    return contentTypes[extension] || 'application/octet-stream';
  }

  getPublicUrl(key) {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async streamToBuffer(stream) {
    try {
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch (error) {
      throw errorHandler.createError(
        errorHandler.errorTypes.CLOUD_STORAGE,
        `Failed to convert stream to buffer: ${error.message}`,
        {
          severity: errorHandler.severityLevels.MEDIUM,
          context: { streamError: true },
          cause: error,
          retryable: true,
          userMessage: 'Erreur lors de la lecture du flux de données.'
        }
      );
    }
  }

  // Health check for cloud storage service
  async healthCheck() {
    const health = {
      service: 'CloudStorage',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      details: {}
    };

    try {
      if (!this.isConfigured()) {
        health.status = 'disabled';
        health.details = {
          configured: false,
          missingVars: this.getMissingVars(),
          message: 'Cloud storage not configured - using local storage'
        };
        return health;
      }

      // Test basic connectivity by listing a small number of files
      const testResult = await this.listFiles('', 1);
      
      health.details = {
        configured: true,
        bucket: this.bucketName,
        region: this.region,
        connectivity: 'ok',
        testFileCount: testResult.totalCount || 0
      };

      logger.info('Cloud storage health check passed', health.details);
      
    } catch (error) {
      health.status = 'unhealthy';
      health.details = {
        configured: true,
        bucket: this.bucketName,
        region: this.region,
        connectivity: 'failed',
        error: error.message
      };
      
      logger.error('Cloud storage health check failed', { error: error.message });
    }

    return health;
  }

  // Get storage statistics
  async getStorageStats() {
    if (!this.isConfigured()) {
      return {
        enabled: false,
        message: 'Cloud storage not configured',
        missingVars: this.getMissingVars()
      };
    }

    try {
      const { files } = await this.listFiles();
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      
      const stats = {
        enabled: true,
        bucket: this.bucketName,
        region: this.region,
        totalFiles: files.length,
        totalSize,
        totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
        lastUpdated: new Date().toISOString()
      };
      
      return stats;
    } catch (error) {
      logger.error('Failed to get storage stats', { error: error.message });
      
      // Ne pas lever une erreur pour les statistiques, retourner un état d'erreur
      return {
        enabled: true,
        bucket: this.bucketName,
        region: this.region,
        error: error.message,
        lastUpdated: new Date().toISOString()
      };
    }
  }
}

// Export singleton instance
const cloudStorage = new CloudStorageService();
module.exports = cloudStorage;
