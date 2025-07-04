import { useState, useRef, memo, useCallback } from 'react';
import { Play, Download, Share2, Trash2, Clock, MessageSquare, Eye, Pause } from 'lucide-react';
import { VideoClip } from '../types';
import { LazyVideo } from './OptimizedComponents';
import { usePerformance } from '../utils/performance';

interface ClipThumbnailProps {
  clip: VideoClip;
  index: number;
  onDeleteClip: (clipId: string) => void;
  onPlayClip: (clip: VideoClip) => void;
}

const ClipThumbnail = memo<ClipThumbnailProps>(({ clip, index, onDeleteClip, onPlayClip }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isVideoHovered, setIsVideoHovered] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { throttle } = usePerformance();

  const handleDeleteClick = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const confirmDelete = useCallback(() => {
    onDeleteClip(clip.id);
    setShowDeleteConfirm(false);
  }, [onDeleteClip, clip.id]);

  const cancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAspectRatioClasses = (ratio: string) => {
    switch (ratio) {
      case '9:16':
        return 'aspect-[9/16]'; // Portrait
      case '1:1':
        return 'aspect-square'; // Square
      case '16:9':
      default:
        return 'aspect-video'; // Landscape
    }
  };

  const getAspectRatioIcon = (ratio: string) => {
    switch (ratio) {
      case '16:9':
        return '📺';
      case '9:16':
        return '📱';
      case '1:1':
        return '⭐';
      default:
        return '🎬';
    }
  };

  const handleVideoHover = useCallback(() => {
    if (!isPlaying) {
      setIsVideoHovered(true);
      if (videoRef.current) {
        videoRef.current.play().catch(() => {
          // Ignore autoplay errors
        });
      }
    }
  }, [isPlaying]);

  const handleVideoLeave = useCallback(() => {
    if (!isPlaying) {
      setIsVideoHovered(false);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = Math.min(2, clip.duration / 2);
      }
    }
  }, [isPlaying, clip.duration]);

  const handlePlayClick = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
        setShowControls(false);
      } else {
        videoRef.current.currentTime = 0; // Start from beginning
        videoRef.current.play();
        setIsPlaying(true);
        setShowControls(true);
      }
    }
  }, [isPlaying]);

  const handleVideoEnded = useCallback(() => {
    setIsPlaying(false);
    setShowControls(false);
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(2, clip.duration / 2);
    }
  }, [clip.duration]);

  const handleVideoClick = useCallback(() => {
    if (isPlaying && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  return (
    <div 
      className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden border border-gray-100 animate-slide-up"
      style={{ animationDelay: `${index * 100}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail Container */}
      <div 
        className={`relative ${getAspectRatioClasses(clip.aspectRatio)} bg-gradient-to-br from-gray-900 to-gray-700 overflow-hidden`}
        onMouseEnter={handleVideoHover}
        onMouseLeave={handleVideoLeave}
      >
        {/* Video Thumbnail */}
        <video
          ref={videoRef}
          src={clip.downloadUrl}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 cursor-pointer"
          preload="metadata"
          muted={!isPlaying}
          loop={false}
          controls={showControls}
          onClick={handleVideoClick}
          onEnded={handleVideoEnded}
          onLoadedMetadata={(e) => {
            e.currentTarget.currentTime = Math.min(2, clip.duration / 2);
          }}
        />

        {/* Interactive Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-60'}`} />

        {/* Hover Effects */}
        <div className={`absolute inset-0 transition-all duration-500 ${isVideoHovered ? 'bg-black/10' : 'bg-transparent'}`} />

        {/* Play Button with Pulse Effect */}
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
          isPlaying ? 'opacity-0 pointer-events-none' : 
          (isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-75')
        }`}>
          <button
            onClick={handlePlayClick}
            className="relative w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 hover:scale-110 transition-all duration-300 border border-white/30 group-hover:animate-pulse-ring"
          >
            <Play className="w-8 h-8 text-white ml-1" />
            {!isVideoHovered && !isPlaying && (
              <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse-ring"></div>
            )}
          </button>
        </div>

        {/* Preview/Playing Indicator */}
        {(isVideoHovered || isPlaying) && (
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 bg-blue-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 animate-slide-up">
            {isPlaying ? (
              <>
                <Play className="w-3 h-3" />
                <span>Playing</span>
              </>
            ) : (
              <>
                <Eye className="w-3 h-3" />
                <span>Preview</span>
              </>
            )}
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center space-x-2">
          <div className="bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-bold">
            #{index + 1}
          </div>
          {clip.hasSubtitles && (
            <div className="bg-blue-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
              <MessageSquare className="w-3 h-3" />
              <span>CC</span>
            </div>
          )}
        </div>

        {/* Duration Badge */}
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>{formatDuration(clip.duration)}</span>
        </div>

        {/* Full Screen Button - only when playing */}
        {isPlaying && (
          <div className="absolute bottom-3 right-3">
            <button
              onClick={() => onPlayClip(clip)}
              className="w-8 h-8 bg-black/50 backdrop-blur-sm text-white rounded-lg flex items-center justify-center hover:bg-black/70 transition-all duration-200"
              title="Open in full screen"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        )}

        {/* Bottom Info */}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getAspectRatioIcon(clip.aspectRatio)}</span>
              <span className="text-white text-sm font-medium bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg">
                {clip.aspectRatio}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5">
        {/* Clip Title */}
        <div className="mb-4">
          <h3 className="font-bold text-gray-900 text-base truncate">
            {clip.filename.replace(/\.[^/.]+$/, "")}
          </h3>
          <p className="text-xs text-gray-500">
            {new Date(clip.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-3">
          <a
            href={clip.downloadUrl}
            download={clip.filename}
            className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2.5 px-4 rounded-xl text-sm font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </a>
          <button className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105">
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDeleteClick}
            className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl flex items-center justify-center hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 group"
            title="Remove clip"
          >
            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ClipThumbnail.displayName = 'ClipThumbnail';

export default ClipThumbnail;
