import { useState, useEffect, memo, useCallback, useMemo, Suspense } from 'react';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import OptionsPanel from './components/OptionsPanel';
import ClipsGrid from './components/ClipsGrid';
import DashboardCard from './components/DashboardCard';
import LoadingOverlay from './components/LoadingOverlay';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorReporter from './components/ErrorReporter';
import ErrorTester from './components/ErrorTester';
import Footer from './components/Footer';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import DebugComponent from './components/DebugComponent';
import SimpleOAuthTest from './components/SimpleOAuthTest';
import { LazyAdvancedMetrics } from './components/OptimizedComponents';
import { Skeleton } from './components/OptimizedComponents';
import { useToast } from './components/ToastNotification';
import { useErrorHandler } from './utils/errorHandler';
import { usePerformance } from './utils/performance';
import { useAuth } from './contexts/AuthContext';
import { videoService, Job, ClipOptions, VideoClip } from './services/video';
import { Upload, Settings, Sparkles, Clock } from 'lucide-react';

interface AppProps {
  onBackToLanding?: () => void;
  onLogout?: () => void;
}

function App({ onBackToLanding, onLogout }: AppProps) {
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [clips, setClips] = useState<VideoClip[]>([]); // Active clips (< 30 days)
  const [allClips, setAllClips] = useState<VideoClip[]>([]); // All clips including archived
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [highlightClipsSection, setHighlightClipsSection] = useState(false);
  const [hasGeneratedClips, setHasGeneratedClips] = useState(false); // Track if clips were ever generated
  const [clipsExpiryTime, setClipsExpiryTime] = useState<Date | null>(null); // Track when clips expire
  const [, forceUpdate] = useState(0); // Force re-render for expiry timer
  const { success, error, info, ToastContainer } = useToast();
  const { captureUploadError, captureProcessingError, captureUserError } = useErrorHandler();
  const { debounce, memoize } = usePerformance();
  const { user, isAuthenticated, logout } = useAuth();

  // Load user's clips on mount and when authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      loadUserData();
    } else {
      // Clear data when not authenticated
      setClips([]);
      setAllClips([]);
      setCurrentJob(null);
    }
  }, [isAuthenticated]);

  const loadUserData = async () => {
    try {
      const [userClips, userJobs] = await Promise.all([
        videoService.getUserClips(),
        videoService.getUserJobs()
      ]);
      
      setAllClips(userClips);
      
      // Filter active clips (not archived)
      const activeClips = userClips.filter(clip => !clip.is_archived);
      setClips(activeClips);
      
      // Set current job if there's a pending/processing job
      const activeJob = userJobs.find(job => 
        job.status === 'pending' || job.status === 'processing'
      );
      if (activeJob) {
        setCurrentJob(activeJob);
      }
      
      if (activeClips.length > 0) {
        setHasGeneratedClips(true);
        // Set expiry time based on oldest clip
        const oldestClip = activeClips.reduce((oldest, clip) => 
          new Date(clip.created_at) < new Date(oldest.created_at) ? clip : oldest
        );
        const expiryTime = new Date(oldestClip.created_at);
        expiryTime.setDate(expiryTime.getDate() + 30);
        setClipsExpiryTime(expiryTime);
      }
    } catch (err) {
      console.error('Failed to load user data:', err);
      if (err instanceof Error) {
        error('Failed to load your data', err.message);
      }
    }
  };

  // Check clips expiry every hour (since expiry is 30 days, no need to check frequently)
  useEffect(() => {
    const interval = setInterval(checkClipsExpiry, 3600000); // Check every hour (3600000ms)
    return () => clearInterval(interval);
  }, [clipsExpiryTime, clips]);

  // Update expiry display every hour (no need for real-time updates for 30-day expiry)
  useEffect(() => {
    if (clipsExpiryTime && clips.length > 0) {
      const interval = setInterval(() => {
        // Force re-render to update the expiry time display
        forceUpdate(prev => prev + 1);
      }, 3600000); // Update every hour
      return () => clearInterval(interval);
    }
  }, [clipsExpiryTime, clips.length]);

  // Also check expiry on component mount and when expiry time changes
  useEffect(() => {
    checkClipsExpiry();
  }, [clipsExpiryTime]);

  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleVideoUploaded = useCallback((job: Job) => {
    try {
      setCurrentJob(job);
      // Don't clear existing clips when uploading a new video - keep them visible
      success('Video uploaded successfully!', 'Your video is ready for processing');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown upload error';
      captureUploadError(`Failed to handle video upload: ${errorMessage}`, { job, error: err });
      error('Upload Error', 'Failed to process the uploaded video');
    }
  }, [success, error, captureUploadError]);

  const handleClipsGenerated = (newClips: VideoClip[]) => {
    try {
      setClips(prevClips => [...prevClips, ...newClips]); // Add to existing clips instead of replacing
      setAllClips(prevAll => [...prevAll, ...newClips]); // Add to permanent collection
      setHasGeneratedClips(true); // Mark that clips have been generated
      // Set expiry time to 30 days from now
      const expiryTime = new Date();
      expiryTime.setDate(expiryTime.getDate() + 30);
      setClipsExpiryTime(expiryTime);
      setIsLoading(false);
      // Auto-clean the uploaded video to prepare for next upload
      setCurrentJob(null);
      success(
        `${newClips.length} clips generated!`, 
        'Upload panel is ready for your next video • All clips are kept for 30 days'
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown processing error';
      captureProcessingError(`Failed to handle generated clips: ${errorMessage}`, { 
        clipsCount: newClips.length, 
        error: err 
      });
      error('Processing Error', 'Failed to save generated clips');
      setIsLoading(false);
    }
  };

  const handleGenerateClips = (options: ClipOptions) => {
    setIsLoading(true);
    setLoadingMessage('Generating clips...');
    info('Processing started', 'Generating your clips with AI');
  };

  const handleDeleteClip = async (clipId: string) => {
    try {
      // Delete from backend
      await videoService.deleteClip(clipId);
      
      // Remove from local state
      setClips(clips.filter(clip => clip.id !== clipId));
      setAllClips(allClips.filter(clip => clip.id !== clipId));
      
      success('Clip deleted', 'The clip has been permanently removed');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown deletion error';
      captureUserError(`Failed to delete clip: ${errorMessage}`, 'delete_clip', { clipId, error: err });
      error('Deletion Error', 'Failed to delete the clip');
    }
  };

  // Function to manually reset upload state
  const handleResetUpload = () => {
    setCurrentJob(null);
    // Don't reset clips or hasGeneratedClips - keep them for navigation
    info('Upload reset', 'Ready for a new video upload');
  };

  // Function to check and handle clip expiry - Archive instead of delete
  const checkClipsExpiry = () => {
    if (clipsExpiryTime && new Date() >= clipsExpiryTime && clips.length > 0) {
      // Archive the current clips instead of deleting them
      const archivedClips = clips.map(clip => ({
        ...clip,
        isArchived: true,
        archivedAt: new Date().toISOString()
      }));
      
      // Update allClips with archived status
      setAllClips(prevAll => 
        prevAll.map(clip => 
          clips.find(c => c.id === clip.id) 
            ? { ...clip, isArchived: true, archivedAt: new Date().toISOString() }
            : clip
        )
      );
      
      // Clear active clips but keep the navigation visible
      setClips([]);
      setClipsExpiryTime(null);
      info('Clips archived', `${archivedClips.length} clips moved to archive after 30 days • Still accessible in history`);
    }
  };

  // Memoized total duration calculation
  const totalDuration = useMemo(() => {
    return clips.reduce((acc, clip) => acc + clip.duration, 0);
  }, [clips]);

  // Memoized time until expiry calculation
  const timeUntilExpiry = useMemo(() => {
    if (!clipsExpiryTime) return null;
    const now = new Date();
    const timeLeft = clipsExpiryTime.getTime() - now.getTime();
    if (timeLeft <= 0) return null;
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }, [clipsExpiryTime]);

  // Demo function to show full grid (temporary)
  const generateDemoClips = () => {
    const demoClips: VideoClip[] = Array.from({ length: 12 }, (_, i) => ({
      id: `demo-${i}`,
      job_id: 'demo-job',
      user_id: 1,
      filename: `Demo_Clip_${i + 1}.mp4`,
      duration: 30 + Math.random() * 60,
      size: 1024 * 1024 * (5 + Math.random() * 10), // 5-15MB
      thumbnail_url: `demo-thumbnail-${i}.jpg`,
      metadata: JSON.stringify({ aspectRatio: ['16:9', '9:16', '1:1'][i % 3] }),
      is_archived: false,
      created_at: new Date().toISOString(),
      downloadUrl: `/demo/clip-${i}.mp4`,
      aspectRatio: ['16:9', '9:16', '1:1'][i % 3] as '16:9' | '9:16' | '1:1',
      hasSubtitles: Math.random() > 0.5
    }));
    setClips(prevClips => [...prevClips, ...demoClips]); // Add to existing clips instead of replacing
    setAllClips(prevAll => [...prevAll, ...demoClips]); // Add to permanent collection
    setHasGeneratedClips(true); // Mark that clips have been generated
    // Set expiry time to 30 days from now for demo
    const expiryTime = new Date();
    expiryTime.setDate(expiryTime.getDate() + 30);
    setClipsExpiryTime(expiryTime);
    // Auto-clean upload state for demo
    setCurrentJob(null);
    success(`${demoClips.length} demo clips generated!`, 'Upload panel is ready for new video • All clips kept for 30 days');
  };

  // Function to navigate to generated clips section
  const navigateToClips = () => {
    const element = document.getElementById('generated-clips-section');
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      setHighlightClipsSection(true);
      setTimeout(() => setHighlightClipsSection(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Header onBackToLanding={onBackToLanding} onLogout={onLogout} />
      
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5ZmE4ZGEiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMTAiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40"></div>
      
      <main className="relative container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Navigation Banner - Top Center */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => setShowLearnMore(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200 hover:bg-white/90 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md group"
            >
              <Sparkles className="w-5 h-5 text-blue-600 group-hover:text-blue-700" />
              <span className="text-gray-700 font-medium group-hover:text-gray-900">Learn More</span>
              <span className="text-blue-600 group-hover:text-blue-700">→</span>
            </button>
            
            {hasGeneratedClips && (
              <button
                onClick={navigateToClips}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500/80 to-pink-500/80 backdrop-blur-sm rounded-full border border-purple-300 hover:from-purple-500/90 hover:to-pink-500/90 transition-all duration-200 shadow-sm hover:shadow-md group text-white"
              >
                <Sparkles className="w-5 h-5 group-hover:text-purple-100" />
                <span className="font-medium group-hover:text-purple-100">
                  {clips.length > 0 ? 'View Generated Clips' : 'View Previous Clips'}
                </span>
                <span className="group-hover:text-purple-100">↓</span>
              </button>
            )}
          </div>
        </div>

        {/* Upload Section - Top Center */}
        <div className="flex justify-center mb-8">
          <div className="w-full max-w-3xl">
            <DashboardCard
              title="Upload & Configure"
              description="Transform your content into viral clips"
              icon={<Upload className="w-5 h-5 text-white" />}
              gradient="from-blue-50 to-indigo-100"
              className="card-reveal hover-lift"
            >
              <UploadSection 
                onVideoUploaded={handleVideoUploaded}
                currentJob={currentJob}
                onGenerateClips={handleGenerateClips}
                onClipsGenerated={handleClipsGenerated}
                setIsLoading={setIsLoading}
                setLoadingMessage={setLoadingMessage}
                onResetUpload={handleResetUpload}
              />
            </DashboardCard>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="w-full">
          {clips.length === 0 ? (
            /* Empty State - Clean minimal state */
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                <Upload className="w-10 h-10 text-blue-600" />
              </div>
            </div>
          ) : (
            /* Generated Clips Section - Stable Dashboard Card */
            <div className={`mb-8 transition-all duration-1000 ${highlightClipsSection ? 'ring-4 ring-purple-400/50 ring-offset-4 ring-offset-transparent scale-[1.02]' : ''}`} id="generated-clips-section">
              <DashboardCard
                title="Generated Clips"
                description={`${clips.length} clips ready • Total duration: ${formatDuration(totalDuration)}`}
                icon={<Sparkles className="w-5 h-5 text-white" />}
                gradient="from-purple-50 to-pink-100"
                className="card-reveal hover-lift"
              >
                <div className="space-y-6">
                  {/* Clips Header with Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-gray-700">
                        All clips generated successfully
                      </span>
                      {clipsExpiryTime && timeUntilExpiry && (
                        <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-200">
                          Expires in {timeUntilExpiry}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleResetUpload}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <Upload className="w-4 h-4" />
                        <span>New Upload</span>
                      </button>
                    </div>
                  </div>

                  {/* Clips Grid */}
                  <ClipsGrid
                    clips={clips}
                    onDeleteClip={handleDeleteClip}
                  />
                </div>
              </DashboardCard>
            </div>
          )}

          {/* Advanced Metrics - Always visible when clips exist */}
          {clips.length > 0 && (
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
              <LazyAdvancedMetrics
                currentJob={currentJob}
                clips={clips}
              />
            </Suspense>
          )}
        </div>
      </main>
      
      {/* Loading Overlay */}
      {isLoading && <LoadingOverlay message={loadingMessage} />}
      
      {/* Learn More Modal */}
      {showLearnMore && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Learn More
                  </h2>
                  <p className="text-gray-600 mt-1">Everything you need to know about creating viral clips</p>
                </div>
                <button
                  onClick={() => setShowLearnMore(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <span className="text-2xl text-gray-400 hover:text-gray-600">×</span>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-8">
              {/* Tips Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Pro Tip - Aspect Ratios */}
                <div className="bg-gradient-to-br from-orange-50 to-red-100 rounded-xl p-6 border border-orange-200/50">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="text-2xl">🎯</div>
                    <div>
                      <h3 className="font-semibold text-orange-900">Pro Tip</h3>
                      <p className="text-sm text-orange-700">Aspect ratios</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <strong className="text-orange-900">16:9</strong>
                      <span className="text-orange-700">Perfect for YouTube and Twitter</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <strong className="text-orange-900">9:16</strong>
                      <span className="text-orange-700">Ideal for TikTok and Instagram Stories</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <strong className="text-orange-900">1:1</strong>
                      <span className="text-orange-700">Best for Instagram feed posts</span>
                    </div>
                  </div>
                </div>

                {/* Best Practice - Durations */}
                <div className="bg-gradient-to-br from-cyan-50 to-blue-100 rounded-xl p-6 border border-cyan-200/50">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="text-2xl">⏱️</div>
                    <div>
                      <h3 className="font-semibold text-blue-900">Best Practice</h3>
                      <p className="text-sm text-blue-700">Optimal durations</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <strong className="text-blue-900">15-30s</strong>
                      <span className="text-blue-700">Maximum engagement</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <strong className="text-blue-900">60s</strong>
                      <span className="text-blue-700">Detailed explanations</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <strong className="text-blue-900">90s+</strong>
                      <span className="text-blue-700">In-depth content</span>
                    </div>
                  </div>
                </div>

                {/* Feature - Auto Subtitles */}
                <div className="bg-gradient-to-br from-violet-50 to-purple-100 rounded-xl p-6 border border-violet-200/50 md:col-span-2 lg:col-span-1">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="text-2xl">📝</div>
                    <div>
                      <h3 className="font-semibold text-purple-900">Feature</h3>
                      <p className="text-sm text-purple-700">Auto subtitles</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="text-purple-900">
                      AI-generated subtitles increase engagement by <strong>80%</strong>
                    </div>
                    <div className="text-purple-700">Works in multiple languages</div>
                    <button
                      onClick={() => {
                        generateDemoClips();
                        setShowLearnMore(false);
                      }}
                      className="mt-4 w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span className="font-medium">Preview Demo</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200/50">
                <h3 className="font-semibold text-gray-900 mb-4">Getting Started</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                      <Upload className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">1. Upload</h4>
                    <p className="text-sm text-gray-600">Select your video file (MP4, MOV, AVI)</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 rounded-full flex items-center justify-center">
                      <Settings className="w-6 h-6 text-purple-600" />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">2. Configure</h4>
                    <p className="text-sm text-gray-600">Choose aspect ratio, duration, and options</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-green-600" />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">3. Generate</h4>
                    <p className="text-sm text-gray-600">AI creates optimized clips for social media</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast Notifications */}
      <ToastContainer />
      
      {/* Error System - Hidden but functional */}
      {/* <ErrorReporter /> */}
      {/* <ErrorTester /> */}

      {/* Footer */}
      <Footer />

      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts
        onUpload={() => {
          // Could trigger file upload dialog
          const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
          fileInput?.click();
        }}
        onGenerateClips={() => {
          // Could trigger clip generation if video is available
          if (currentJob) {
            generateDemoClips();
          }
        }}
        onSettings={() => {
          // Could open settings modal
        }}
      />
      <DebugComponent />
      <SimpleOAuthTest />
    </div>
  );
}

export default App;
