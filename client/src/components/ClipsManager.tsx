import { useState } from 'react';
import { VideoClip } from '../types';
import { Play, Download, Trash2, Edit3, MessageSquare, Share2, Clock } from 'lucide-react';
import axios from 'axios';

interface ClipsManagerProps {
  clips: VideoClip[];
  onDeleteClip: (clipId: string) => void;
}

const ClipsManager = ({ clips, onDeleteClip }: ClipsManagerProps) => {
  const [expandedClip, setExpandedClip] = useState<string | null>(null);

  const handleDeleteClip = async (clipId: string) => {
    try {
      await axios.delete(`/api/clip/${clipId}`);
      onDeleteClip(clipId);
    } catch (error) {
      console.error('Failed to delete clip:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  return (
    <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl p-8 shadow-xl">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
              <span className="text-xs font-bold text-white">{clips.length}</span>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Your Generated Clips</h2>
            <p className="text-gray-600 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              {clips.length} clip{clips.length !== 1 ? 's' : ''} ready for download and sharing
            </p>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="hidden sm:flex items-center space-x-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{clips.length}</div>
            <div className="text-xs text-gray-500">Total Clips</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {clips.reduce((acc, clip) => acc + clip.duration, 0).toFixed(0)}s
            </div>
            <div className="text-xs text-gray-500">Total Duration</div>
          </div>
        </div>
      </div>

      {/* Clips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {clips.map((clip, index) => (
          <div
            key={clip.id}
            className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-white/40 overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2"
          >
            {/* Video Preview */}
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 aspect-video overflow-hidden">
              <video
                src={clip.downloadUrl}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                preload="metadata"
                controls={false}
                onMouseEnter={(e) => {
                  e.currentTarget.currentTime = 2;
                }}
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <div className="absolute inset-0 flex items-center justify-center">
                  <button className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-300 transform group-hover:scale-110">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </button>
                </div>
              </div>
              
              {/* Top Badges */}
              <div className="absolute top-4 left-4 flex items-center space-x-2">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                  Clip #{index + 1}
                </div>
                {clip.hasSubtitles && (
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center space-x-1">
                    <MessageSquare className="w-3 h-3" />
                    <span>CC</span>
                  </div>
                )}
              </div>
              
              {/* Duration Badge */}
              <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 shadow-lg">
                <Clock className="w-3 h-3" />
                <span>{formatDuration(clip.duration)}</span>
              </div>
              
              {/* Bottom Info */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getAspectRatioIcon(clip.aspectRatio)}</span>
                    <span className="text-white text-sm font-medium bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg">
                      {clip.aspectRatio}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-6">
              {/* Clip Title */}
              <div className="mb-4">
                <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">
                  {clip.filename.replace(/\.[^/.]+$/, "")}
                </h3>
                <p className="text-sm text-gray-500">
                  Created {new Date(clip.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <a
                  href={clip.downloadUrl}
                  download={clip.filename}
                  className="group/btn flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-xl font-medium text-sm hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <Download className="w-4 h-4 group-hover/btn:animate-bounce" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => setExpandedClip(expandedClip === clip.id ? null : clip.id)}
                  className="group/btn flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-4 rounded-xl font-medium text-sm hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <Edit3 className="w-4 h-4 group-hover/btn:rotate-12 transition-transform duration-300" />
                  <span>More</span>
                </button>
              </div>

              {/* Expanded Options */}
              {expandedClip === clip.id && (
                <div className="border-t border-gray-100 pt-4 space-y-3 animate-slide-up">
                  <button className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2.5 px-4 rounded-xl text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105">
                    <Share2 className="w-4 h-4" />
                    <span>Share Link</span>
                  </button>
                  <button className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-orange-500 to-red-500 text-white py-2.5 px-4 rounded-xl text-sm font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-300 transform hover:scale-105">
                    <MessageSquare className="w-4 h-4" />
                    <span>Toggle Captions</span>
                  </button>
                  <button
                    onClick={() => handleDeleteClip(clip.id)}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-red-500 to-rose-500 text-white py-2.5 px-4 rounded-xl text-sm font-medium hover:from-red-600 hover:to-rose-600 transition-all duration-300 transform hover:scale-105"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Clip</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bulk Actions */}
      {clips.length > 1 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Bulk Actions</h3>
              <p className="text-sm text-gray-600">Perform actions on all clips at once</p>
            </div>
            <div className="text-2xl">🚀</div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="group flex items-center space-x-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
              <Download className="w-5 h-5 group-hover:animate-bounce" />
              <span>Download All ({clips.length})</span>
            </button>
            <button className="group flex items-center space-x-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
              <Share2 className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
              <span>Share Collection</span>
            </button>
            <button className="group flex items-center space-x-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
              <Edit3 className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
              <span>Batch Edit</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClipsManager;
