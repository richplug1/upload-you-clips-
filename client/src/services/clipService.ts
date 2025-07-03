import { authService } from './authService';

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
  timeUntilExpiry?: number;
  isExpired?: boolean;
}

interface ClipAnalytics {
  clip: {
    id: string;
    filename: string;
    created_at: string;
  };
  analytics: {
    totalViews: number;
    totalDownloads: number;
    viewsByDate: Array<{
      date: string;
      count: number;
    }>;
  };
}

class ClipService {
  private baseUrl = '/api/clips';

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    const token = authService.getToken();
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return headers;
  }

  // Get user's clips
  async getClips(
    page = 1,
    limit = 20,
    includeArchived = false
  ): Promise<{
    clips: Clip[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      archived: includeArchived.toString(),
    });

    const response = await fetch(`${this.baseUrl}?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get clips');
    }

    const data = await response.json();
    
    // Calculate time until expiry for each clip
    const now = new Date().getTime();
    data.clips = data.clips.map((clip: Clip) => ({
      ...clip,
      timeUntilExpiry: Math.max(0, new Date(clip.expiresAt).getTime() - now),
      isExpired: new Date(clip.expiresAt).getTime() < now,
    }));

    return data;
  }

  // Get specific clip
  async getClip(clipId: string): Promise<Clip> {
    const response = await fetch(`${this.baseUrl}/${clipId}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get clip');
    }

    const clip = await response.json();
    const now = new Date().getTime();
    
    return {
      ...clip,
      timeUntilExpiry: Math.max(0, new Date(clip.expiresAt).getTime() - now),
      isExpired: new Date(clip.expiresAt).getTime() < now,
    };
  }

  // Get clip stream URL
  getStreamUrl(clipId: string): string {
    return `${this.baseUrl}/${clipId}/stream`;
  }

  // Get clip download URL
  getDownloadUrl(clipId: string): string {
    return `${this.baseUrl}/${clipId}/download`;
  }

  // Get clip thumbnail URL
  getThumbnailUrl(clipId: string): string {
    return `${this.baseUrl}/${clipId}/thumbnail`;
  }

  // Download clip
  async downloadClip(clipId: string, filename?: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${clipId}/download`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to download clip');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `clip_${clipId}.mp4`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  // Delete clip
  async deleteClip(clipId: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/${clipId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete clip');
    }

    return response.json();
  }

  // Archive/unarchive clip
  async archiveClip(clipId: string, archived: boolean): Promise<{ message: string; archived: boolean }> {
    const response = await fetch(`${this.baseUrl}/${clipId}/archive`, {
      method: 'PATCH',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ archived }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to archive clip');
    }

    return response.json();
  }

  // Bulk delete clips
  async bulkDelete(clipIds: string[]): Promise<{
    message: string;
    deleted: number;
    failed: number;
  }> {
    const response = await fetch(`${this.baseUrl}/bulk-delete`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clipIds }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete clips');
    }

    return response.json();
  }

  // Get clip analytics
  async getClipAnalytics(clipId: string): Promise<ClipAnalytics> {
    const response = await fetch(`${this.baseUrl}/${clipId}/analytics`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get clip analytics');
    }

    return response.json();
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

  // Format time until expiry
  formatTimeUntilExpiry(milliseconds: number): string {
    if (milliseconds <= 0) return 'Expired';

    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
    const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  // Get expiry color based on time remaining
  getExpiryColor(milliseconds: number): string {
    if (milliseconds <= 0) return 'text-red-600';
    
    const days = milliseconds / (1000 * 60 * 60 * 24);
    
    if (days < 1) return 'text-red-500';
    if (days < 3) return 'text-orange-500';
    if (days < 7) return 'text-yellow-500';
    return 'text-green-500';
  }

  // Check if clip is about to expire (within 24 hours)
  isAboutToExpire(milliseconds: number): boolean {
    return milliseconds > 0 && milliseconds < 24 * 60 * 60 * 1000;
  }

  // Create a video element for playing clips
  createVideoElement(clipId: string, options: {
    autoplay?: boolean;
    controls?: boolean;
    muted?: boolean;
    loop?: boolean;
    preload?: 'auto' | 'metadata' | 'none';
    className?: string;
  } = {}): HTMLVideoElement {
    const video = document.createElement('video');
    
    video.src = this.getStreamUrl(clipId);
    video.autoplay = options.autoplay || false;
    video.controls = options.controls !== false;
    video.muted = options.muted || false;
    video.loop = options.loop || false;
    video.preload = options.preload || 'metadata';
    
    if (options.className) {
      video.className = options.className;
    }

    return video;
  }

  // Check if video can play
  async canPlayVideo(clipId: string): Promise<boolean> {
    return new Promise((resolve) => {
      const video = this.createVideoElement(clipId, { preload: 'metadata' });
      
      video.addEventListener('canplay', () => resolve(true), { once: true });
      video.addEventListener('error', () => resolve(false), { once: true });
      
      // Timeout after 5 seconds
      setTimeout(() => resolve(false), 5000);
    });
  }

  // Get video thumbnail as blob
  async getThumbnailBlob(clipId: string): Promise<Blob> {
    const response = await fetch(this.getThumbnailUrl(clipId), {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get thumbnail');
    }

    return response.blob();
  }

  // Share clip (generate shareable link)
  generateShareableLink(clipId: string): string {
    // In a real app, this would generate a temporary public link
    return `${window.location.origin}/clip/${clipId}`;
  }

  // Export clip data for backup
  exportClipData(clip: Clip): string {
    const exportData = {
      id: clip.id,
      filename: clip.filename,
      duration: clip.duration,
      size: clip.size,
      metadata: clip.metadata,
      createdAt: clip.createdAt,
      expiresAt: clip.expiresAt,
    };

    return JSON.stringify(exportData, null, 2);
  }
}

export const clipService = new ClipService();
export type { Clip, ClipAnalytics };
