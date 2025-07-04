import { authService } from './authService';
import { subscriptionService } from './subscription';

interface VideoFile {
  fileId: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  metadata?: VideoMetadata;
}

interface VideoMetadata {
  duration: number;
  size: number;
  bitrate: number;
  format: string;
  video?: {
    codec: string;
    width: number;
    height: number;
    fps: number;
    bitrate: number;
  };
  audio?: {
    codec: string;
    channels: number;
    sample_rate: number;
    bitrate: number;
  };
}

interface ProcessingSettings {
  duration?: number;
  customDuration?: number;
  generateSubtitles?: boolean;
  clipsCount?: number;
}

interface Job {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

interface JobResponse {
  job: Job;
  clips: Clip[];
}

interface Clip {
  id: string;
  jobId: string;
  filename: string;
  duration: number;
  size: number;
  thumbnailUrl: string;
  metadata: any;
  isArchived: boolean;
  createdAt: string;
  expiresAt: string;
}

class VideoService {
  private baseUrl = '/api/videos';

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    const token = authService.getToken();
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return headers;
  }

  // Upload video file
  async uploadVideo(file: File): Promise<VideoFile> {
    const formData = new FormData();
    formData.append('video', file);

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  }

  // Process video into clips with credit checking
  async processVideo(
    fileId: string,
    fileName: string,
    settings: ProcessingSettings
  ): Promise<{ 
    jobId: string; 
    status: string; 
    message: string; 
    creditsDeducted?: number;
    estimatedClips?: number;
  }> {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      throw new Error('Authentication required to process videos');
    }

    // Calculate and check credits before processing
    if (settings.duration && settings.clipsCount) {
      try {
        // Get cost estimate
        const costEstimate = await subscriptionService.calculateProcessingCost(
          settings.duration, 
          settings.clipsCount
        );

        // Check if user can process this video
        const { subscription } = await subscriptionService.getSubscriptionStatus();
        const canProcess = subscriptionService.canProcessVideo(
          subscription, 
          settings.duration, 
          settings.clipsCount
        );

        if (!canProcess.canProcess) {
          throw new Error(canProcess.reason + (canProcess.suggestion ? ` ${canProcess.suggestion}` : ''));
        }

        // Show cost to user (this could be done in the UI before calling this method)
        console.log('Processing will cost:', costEstimate.cost_breakdown.total_credits, 'credits');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Credit check failed: ${errorMessage}`);
      }
    }

    const response = await fetch(`${this.baseUrl}/process`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileId,
        fileName,
        ...settings,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Processing failed');
    }

    return response.json();
  }

  // Check processing cost before actual processing
  async checkProcessingCost(duration: number, clipsCount: number): Promise<{
    canProcess: boolean;
    cost: number;
    userCredits: number;
    reason?: string;
    suggestion?: string;
  }> {
    try {
      // Get cost estimate
      const costEstimate = await subscriptionService.calculateProcessingCost(duration, clipsCount);
      
      // Get user status
      const { subscription, credits } = await subscriptionService.getSubscriptionStatus();
      
      // Check if user can process this video
      const canProcess = subscriptionService.canProcessVideo(subscription, duration, clipsCount);

      return {
        canProcess: canProcess.canProcess && credits.remaining_credits >= costEstimate.cost_breakdown.total_credits,
        cost: costEstimate.cost_breakdown.total_credits,
        userCredits: credits.remaining_credits,
        reason: !canProcess.canProcess ? canProcess.reason : 
                credits.remaining_credits < costEstimate.cost_breakdown.total_credits ? 
                'Insufficient credits' : undefined,
        suggestion: canProcess.suggestion
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        canProcess: false,
        cost: 0,
        userCredits: 0,
        reason: `Failed to check processing cost: ${errorMessage}`
      };
    }
  }

  // Get job status
  async getJobStatus(jobId: string): Promise<JobResponse> {
    const response = await fetch(`${this.baseUrl}/job/${jobId}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get job status');
    }

    return response.json();
  }

  // Get user's jobs
  async getJobs(page = 1, limit = 20): Promise<{
    jobs: Job[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const response = await fetch(
      `${this.baseUrl}/jobs?page=${page}&limit=${limit}`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get jobs');
    }

    return response.json();
  }

  // Delete job
  async deleteJob(jobId: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/job/${jobId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete job');
    }

    return response.json();
  }

  // Get video metadata
  async getVideoMetadata(fileName: string): Promise<{
    fileName: string;
    metadata: VideoMetadata;
  }> {
    const response = await fetch(`${this.baseUrl}/metadata`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileName }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get metadata');
    }

    return response.json();
  }

  // Poll job status until completion
  async pollJobStatus(
    jobId: string,
    onProgress?: (job: Job) => void,
    pollInterval = 2000,
    maxAttempts = 300 // 10 minutes max
  ): Promise<JobResponse> {
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          attempts++;
          
          if (attempts > maxAttempts) {
            reject(new Error('Job polling timeout'));
            return;
          }

          const response = await this.getJobStatus(jobId);
          const { job, clips } = response;

          if (onProgress) {
            onProgress(job);
          }

          if (job.status === 'completed') {
            resolve(response);
          } else if (job.status === 'failed' || job.status === 'cancelled') {
            reject(new Error(job.error || `Job ${job.status}`));
          } else {
            // Continue polling
            setTimeout(poll, pollInterval);
          }
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }

  // Upload and process video in one call
  async uploadAndProcess(
    file: File,
    settings: ProcessingSettings,
    onUploadProgress?: (progress: number) => void,
    onProcessingProgress?: (job: Job) => void
  ): Promise<{ clips: Clip[]; job: Job }> {
    // Upload file
    const uploadedFile = await this.uploadVideo(file);
    
    if (onUploadProgress) {
      onUploadProgress(100);
    }

    // Start processing
    const processResponse = await this.processVideo(
      uploadedFile.fileId,
      uploadedFile.fileName,
      settings
    );

    // Poll for completion
    const result = await this.pollJobStatus(
      processResponse.jobId,
      onProcessingProgress
    );

    return {
      clips: result.clips,
      job: result.job,
    };
  }

  // Cancel job (if supported)
  async cancelJob(jobId: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/job/${jobId}/cancel`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cancel job');
    }

    return response.json();
  }

  // Get processing queue status
  async getQueueStatus(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/queue`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get queue status');
    }

    return response.json();
  }

  // Validate video file before upload
  validateVideoFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = [
      'video/mp4',
      'video/mov',
      'video/avi',
      'video/wmv',
      'video/webm',
    ];

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`,
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Only video files are allowed.',
      };
    }

    return { valid: true };
  }

  // Format file size for display
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Format duration for display
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }
}

export const videoService = new VideoService();
export type { 
  VideoFile, 
  VideoMetadata, 
  ProcessingSettings, 
  Job, 
  JobResponse, 
  Clip 
};
