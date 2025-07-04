// Types centralisés pour l'application
export interface Job {
  id: string;
  user_id: string;
  input_file: string;
  filename: string;
  path: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  duration: number;
  created_at: string;
  updated_at: string;
  createdAt: string; // Alias pour compatibilité
}

export interface VideoClip {
  id: string;
  jobId: string;
  job_id?: string; // Alias pour compatibilité
  title: string;
  description: string;
  path: string;
  thumbnail: string;
  thumbnail_url?: string; // Alias pour compatibilité
  startTime: number;
  duration: number;
  createdAt: string;
  created_at?: string; // Alias pour compatibilité
  timestamp?: string; // Alias pour compatibilité
  filename: string;
  downloadUrl: string;
  aspectRatio: string;
  hasSubtitles: boolean;
  is_archived?: boolean; // Propriété optionnelle pour compatibilité
  user_id?: number; // Propriété optionnelle pour compatibilité
  size?: number; // Propriété optionnelle pour compatibilité
  metadata?: string; // Propriété optionnelle pour compatibilité
}

export interface ClipOptions {
  clipLength: number;
  numberOfClips: number;
  enableSubtitles: boolean;
  minScore: number;
  language: string;
  outputFormat: string;
  clipDurations?: number[]; // Propriété optionnelle pour compatibilité
  aspectRatio?: string; // Propriété optionnelle pour compatibilité
  includeSubtitles?: boolean; // Alias pour enableSubtitles
  maxClips?: number; // Alias pour numberOfClips
  platform?: string; // Propriété optionnelle pour compatibilité
}

export interface User {
  id: string;
  email: string;
  credits: number;
  subscription?: string;
}

export interface ErrorLog {
  id: string;
  type: string;
  severity: string;
  message: string;
  created_at: string;
  user_email?: string;
  url?: string;
  method?: string;
  ip_address?: string;
  recoverable: boolean;
  retryable: boolean;
}

export interface ErrorStats {
  totalErrors: number;
  byType: Record<string, Record<string, number>>;
  recentErrors: ErrorLog[];
  lastUpdated: string;
}
