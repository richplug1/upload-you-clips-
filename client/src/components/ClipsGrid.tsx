import { useState, useMemo } from 'react';
import { VideoClip } from '../App';
import ClipThumbnail from './ClipThumbnail';
import DashboardCard from './DashboardCard';
import { Play, Download, Share2, Grid3x3, List, Search, Filter, SortAsc, SortDesc } from 'lucide-react';

interface ClipsGridProps {
  clips: VideoClip[];
  onDeleteClip: (clipId: string) => void;
}

const ClipsGrid = ({ clips, onDeleteClip }: ClipsGridProps) => {
  const [selectedClip, setSelectedClip] = useState<VideoClip | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'duration' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterAspectRatio, setFilterAspectRatio] = useState<string>('all');

  const handlePlayClip = (clip: VideoClip) => {
    setSelectedClip(clip);
  };

  const closeVideoModal = () => {
    setSelectedClip(null);
  };

  const getTotalDuration = () => {
    return clips.reduce((acc, clip) => acc + clip.duration, 0);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Filter and sort clips
  const filteredAndSortedClips = useMemo(() => {
    let filtered = clips.filter(clip => {
      const matchesSearch = clip.filename.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAspectRatio = filterAspectRatio === 'all' || clip.aspectRatio === filterAspectRatio;
      return matchesSearch && matchesAspectRatio;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'duration':
          comparison = a.duration - b.duration;
          break;
        case 'name':
          comparison = a.filename.localeCompare(b.filename);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [clips, searchTerm, sortBy, sortOrder, filterAspectRatio]);

  const uniqueAspectRatios = [...new Set(clips.map(clip => clip.aspectRatio))];

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  if (clips.length === 0) {
    return null;
  }

  return (
    <>
      <DashboardCard
        title="Generated Clips"
        description={`${filteredAndSortedClips.length} of ${clips.length} clips shown • Total: ${formatDuration(getTotalDuration())}`}
        icon={<Play className="w-6 h-6 text-white" />}
        badge={filteredAndSortedClips.length}
        gradient="from-purple-50 to-pink-50"
        className="card-reveal"
      >
        {/* Controls Bar */}
        <div className="mb-6 space-y-4">
          {/* Search and Filters Row */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search clips..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Aspect Ratio Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterAspectRatio}
                onChange={(e) => setFilterAspectRatio(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              >
                <option value="all">All Ratios</option>
                {uniqueAspectRatios.map(ratio => (
                  <option key={ratio} value={ratio}>{ratio}</option>
                ))}
              </select>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'duration' | 'name')}
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              >
                <option value="date">Sort by Date</option>
                <option value="duration">Sort by Duration</option>
                <option value="name">Sort by Name</option>
              </select>
              <button
                onClick={toggleSortOrder}
                className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200"
              >
                {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* View Mode and Actions Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">View:</span>
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === 'grid'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bulk Actions */}
            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105">
                <Download className="w-4 h-4" />
                <span>Download All</span>
              </button>
              <button className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:from-purple-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105">
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* Clips Grid */}
        {filteredAndSortedClips.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <Search className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No clips found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterAspectRatio !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'No clips have been generated yet'}
            </p>
            {(searchTerm || filterAspectRatio !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterAspectRatio('all');
                }}
                className="px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filteredAndSortedClips.map((clip, index) => (
              <ClipThumbnail
                key={clip.id}
                clip={clip}
                index={index}
                onDeleteClip={onDeleteClip}
                onPlayClip={handlePlayClip}
              />
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-4">
            {filteredAndSortedClips.map((clip, index) => (
              <div
                key={clip.id}
                className="flex items-center space-x-4 bg-white/70 rounded-2xl p-4 border border-gray-100 hover:shadow-lg transition-all duration-300"
              >
                {/* Thumbnail */}
                <div className="relative w-24 h-16 bg-gray-900 rounded-xl overflow-hidden flex-shrink-0">
                  <video
                    src={clip.downloadUrl}
                    className="w-full h-full object-cover"
                    preload="metadata"
                    muted
                    onLoadedMetadata={(e) => {
                      e.currentTarget.currentTime = Math.min(2, clip.duration / 2);
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <button
                      onClick={() => handlePlayClip(clip)}
                      className="w-6 h-6 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                    >
                      <Play className="w-3 h-3 text-gray-900 ml-0.5" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">
                    {clip.filename.replace(/\.[^/.]+$/, "")}
                  </h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{clip.aspectRatio}</span>
                    <span>{formatDuration(clip.duration)}</span>
                    <span>{new Date(clip.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <a
                    href={clip.downloadUrl}
                    download={clip.filename}
                    className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
                  >
                    Download
                  </a>
                  <button
                    onClick={() => onDeleteClip(clip.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardCard>

      {/* Video Modal */}
      {selectedClip && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative bg-white rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh]">
            {/* Close Button */}
            <button
              onClick={closeVideoModal}
              className="absolute top-4 right-4 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors z-10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Video Player */}
            <video
              src={selectedClip.downloadUrl}
              controls
              autoPlay
              className="w-full h-auto max-h-[80vh]"
            />

            {/* Video Info */}
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {selectedClip.filename.replace(/\.[^/.]+$/, "")}
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>{selectedClip.aspectRatio}</span>
                  <span>{formatDuration(selectedClip.duration)}</span>
                  <span>{new Date(selectedClip.createdAt).toLocaleDateString()}</span>
                </div>
                <a
                  href={selectedClip.downloadUrl}
                  download={selectedClip.filename}
                  className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-300"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClipsGrid;
