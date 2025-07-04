import { useState, useEffect } from 'react';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import OptionsPanel from './components/OptionsPanel';
import ClipsGrid from './components/ClipsGrid';
import AdvancedMetrics from './components/AdvancedMetrics';
import DashboardCard from './components/DashboardCard';
import LoadingOverlay from './components/LoadingOverlay';
import { useToast } from './components/ToastNotification';
import { Upload, Settings, Sparkles } from 'lucide-react';
import { VideoClip, Job, ClipOptions } from './types';

function App() {
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const { success, error, info, ToastContainer } = useToast();

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVideoUploaded = (job: Job) => {
    setCurrentJob(job);
    setClips([]);
    success('Video uploaded successfully!', 'Your video is ready for processing');
  };

  const handleClipsGenerated = (newClips: VideoClip[]) => {
    setClips(newClips);
    setIsLoading(false);
    success(
      `${newClips.length} clips generated!`, 
      'Your clips are ready for download'
    );
  };

  const handleGenerateClips = (options: ClipOptions) => {
    setIsLoading(true);
    setLoadingMessage('Generating clips...');
    info('Processing started', 'Generating your clips with AI');
  };

  const handleDeleteClip = (clipId: string) => {
    setClips(clips.filter(clip => clip.id !== clipId));
    info('Clip deleted', 'The clip has been removed from your collection');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Header />
      
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5ZmE4ZGEiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMTAiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40"></div>
      
      <main className="relative container mx-auto px-4 py-8 max-w-7xl">
        {/* Upload Section - Show only when no clips */}
        {clips.length === 0 && (
          <>
            <div className="flex justify-center mb-8">
              <div className="w-full max-w-2xl">
                <DashboardCard
                  title="Upload Video & Configure Clips"
                  description="Transform your content into viral clips with custom settings"
                  icon={<Upload className="w-6 h-6 text-white" />}
                  gradient="from-blue-50 to-indigo-100"
                  className="card-reveal hover-lift"
                >
                  <div className="transform transition-all duration-300 hover:scale-[1.01]">
                    <UploadSection 
                      onVideoUploaded={handleVideoUploaded}
                      currentJob={currentJob}
                      onGenerateClips={handleGenerateClips}
                      onClipsGenerated={handleClipsGenerated}
                      setIsLoading={setIsLoading}
                      setLoadingMessage={setLoadingMessage}
                    />
                  </div>
                </DashboardCard>
              </div>
            </div>

            {/* Quick Tips when waiting */}
            {currentJob && (
              <div className="flex justify-center">
                <div className="w-full max-w-lg">
                  <DashboardCard
                    title="Quick Tips"
                    description="Get the best results"
                    icon={<Settings className="w-6 h-6 text-white" />}
                    gradient="from-green-50 to-emerald-100"
                    className="card-reveal hover-lift"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3 p-3 bg-white/70 rounded-xl">
                        <span className="text-xl">🎯</span>
                        <div>
                          <h4 className="font-medium text-gray-900">Choose the right aspect ratio</h4>
                          <p className="text-sm text-gray-600">16:9 for YouTube, 9:16 for TikTok, 1:1 for Instagram</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-3 bg-white/70 rounded-xl">
                        <span className="text-xl">⏱️</span>
                        <div>
                          <h4 className="font-medium text-gray-900">Optimal clip duration</h4>
                          <p className="text-sm text-gray-600">15-30s for high engagement, 60s+ for detailed content</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-3 bg-white/70 rounded-xl">
                        <span className="text-xl">📝</span>
                        <div>
                          <h4 className="font-medium text-gray-900">Enable subtitles</h4>
                          <p className="text-sm text-gray-600">Increases engagement by up to 80% on social media</p>
                        </div>
                      </div>
                    </div>
                  </DashboardCard>
                </div>
              </div>
            )}
          </>
        )}

        {/* Full Screen Grid for Generated Clips */}
        {clips.length > 0 && (
          <div className="w-full">
            {/* Generated Clips Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setClips([])}
                  className="flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 hover:bg-white/90 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Upload className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-700 font-medium">Upload New Video</span>
                </button>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{clips.length} clips generated</span>
                  <span>•</span>
                  <span>Total duration: {formatDuration(clips.reduce((acc, clip) => acc + clip.duration, 0))}</span>
                </div>
              </div>
              
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Generated Clips
              </h2>
              <p className="text-gray-600 text-lg">
                Your viral-ready clips are ready for download and sharing
              </p>
            </div>

            {/* Full Width Clips Grid */}
            <ClipsGrid
              clips={clips}
              onDeleteClip={handleDeleteClip}
            />
            
            {/* Advanced Metrics - Full width */}
            <div className="mt-8">
              <AdvancedMetrics />
            </div>
          </div>
        )}
      </main>
      
      {/* Loading Overlay */}
      {isLoading && <LoadingOverlay message={loadingMessage} />}
      
      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

export default App;
