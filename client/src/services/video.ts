import axios from 'axios';
import { config } from '../config/env';
import { authService } from './auth';
import { Job, VideoClip, ClipOptions } from '../types';

export interface VideoMetadata {
  duration: number;
  size: number;
  bitrate: number;
  format: string;
  video: {
    codec: string;
    width: number;
    height: number;
    fps: number;
    bitrate: number;
  } | null;
  audio: {
    codec: string;
    channels: number;
    sample_rate: number;
    bitrate: number;
  } | null;
}

class VideoService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.api.baseUrl;
  }

  private getAuthHeaders() {
    const headers = authService.getAuthHeaders();
    // If no auth headers, add demo mode header
    if (!headers.Authorization) {
      return { 'X-Demo-Mode': 'true' };
    }
    return headers;
  }

  async uploadVideo(file: File, onProgress?: (progress: number) => void): Promise<Job> {
    const formData = new FormData();
    formData.append('video', file);

    try {
      const response = await axios.post(`${this.baseUrl}/api/videos/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...this.getAuthHeaders(),
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });

      return response.data.job;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Upload failed');
      }
      throw new Error('Network error during upload');
    }
  }

  async processVideo(jobId: string, options: ClipOptions): Promise<Job> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/videos/process`, {
        jobId,
        options,
      }, {
        headers: this.getAuthHeaders(),
      });

      return response.data.job;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Processing failed');
      }
      throw new Error('Network error during processing');
    }
  }

  async getJobStatus(jobId: string): Promise<Job> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/videos/job/${jobId}`, {
        headers: this.getAuthHeaders(),
      });

      return response.data.job;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to get job status');
      }
      throw new Error('Network error while checking job status');
    }
  }

  async getUserJobs(): Promise<Job[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/videos/jobs`, {
        headers: this.getAuthHeaders(),
      });

      return response.data.jobs;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to get jobs');
      }
      throw new Error('Network error while fetching jobs');
    }
  }

  async deleteJob(jobId: string): Promise<void> {
    try {
      await axios.delete(`${this.baseUrl}/api/videos/job/${jobId}`, {
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to delete job');
      }
      throw new Error('Network error while deleting job');
    }
  }

  async getUserClips(): Promise<VideoClip[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/clips`, {
        headers: this.getAuthHeaders(),
      });

      // Add download URLs to clips
      return response.data.clips.map((clip: VideoClip) => ({
        ...clip,
        downloadUrl: `${this.baseUrl}/clips/${clip.filename}`,
        thumbnail: clip.thumbnail ? `${this.baseUrl}/thumbnails/${clip.thumbnail}` : undefined,
      }));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to get clips');
      }
      throw new Error('Network error while fetching clips');
    }
  }

  async getClip(clipId: string): Promise<VideoClip> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/clips/${clipId}`, {
        headers: this.getAuthHeaders(),
      });

      const clip = response.data.clip;
      return {
        ...clip,
        downloadUrl: `${this.baseUrl}/clips/${clip.filename}`,
        thumbnail_url: clip.thumbnail_url ? `${this.baseUrl}/thumbnails/${clip.thumbnail_url}` : undefined,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to get clip');
      }
      throw new Error('Network error while fetching clip');
    }
  }

  async deleteClip(clipId: string): Promise<void> {
    try {
      await axios.delete(`${this.baseUrl}/api/clips/${clipId}`, {
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to delete clip');
      }
      throw new Error('Network error while deleting clip');
    }
  }

  async bulkDeleteClips(clipIds: string[]): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/api/clips/bulk-delete`, { clipIds }, {
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to delete clips');
      }
      throw new Error('Network error while deleting clips');
    }
  }

  async downloadClip(clipId: string): Promise<Blob> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/clips/${clipId}/download`, {
        headers: this.getAuthHeaders(),
        responseType: 'blob',
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to download clip');
      }
      throw new Error('Network error while downloading clip');
    }
  }

  // Utility function to trigger download in browser
  downloadClipToFile(clipId: string, filename: string): void {
    const link = document.createElement('a');
    link.href = `${this.baseUrl}/api/clips/${clipId}/download`;
    link.download = filename;
    link.target = '_blank';
    
    // Add auth header for download
    const token = authService.getToken();
    if (token) {
      link.href += `?token=${encodeURIComponent(token)}`;
    }
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Poll job status until completion
  async pollJobStatus(jobId: string, onProgress?: (job: Job) => void): Promise<Job> {
    const checkStatus = async (): Promise<Job> => {
      const job = await this.getJobStatus(jobId);
      
      if (onProgress) {
        onProgress(job);
      }

      if (job.status === 'completed' || job.status === 'failed') {
        return job;
      }

      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
      return checkStatus();
    };

    return checkStatus();
  }
}

export const videoService = new VideoService();
