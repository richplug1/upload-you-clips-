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

export interface ClipOptions {
  clipDurations: number[];
  aspectRatio: '16:9' | '9:16' | '1:1';
  numberOfClips: number;
  enableSubtitles: boolean;
}

export interface VideoClip {
  id: string;
  jobId: string;
  filename: string;
  path: string;
  duration: number;
  startTime: number;
  aspectRatio: string;
  hasSubtitles: boolean;
  createdAt: string;
  downloadUrl: string;
}

export interface Job {
  id: string;
  filename: string;
  path: string;
  duration: number;
  status: 'uploaded' | 'processing' | 'completed' | 'error';
  createdAt: string;
  clips?: string[];
}

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

  // Demo function to show full grid (temporary)
  const generateDemoClips = () => {
    const demoClips: VideoClip[] = Array.from({ length: 12 }, (_, i) => ({
      id: `demo-${i}`,
      jobId: 'demo-job',
      filename: `Demo Clip ${i + 1}.mp4`,
      path: '/demo/path',
      duration: 30 + Math.random() * 60,
      startTime: i * 30,
      aspectRatio: ['16:9', '9:16', '1:1'][i % 3],
      hasSubtitles: Math.random() > 0.5,
      createdAt: new Date().toISOString(),
      downloadUrl: `/demo/clip-${i}.mp4`
    }));
    setClips(demoClips);
    success(`${demoClips.length} demo clips generated!`, 'Full grid view active');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Header />
      
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5ZmE4ZGEiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMTAiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40"></div>
      
      <main className="relative container mx-auto px-4 py-8 max-w-7xl">
        
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
              />
            </DashboardCard>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="w-full">
          {clips.length === 0 ? (
            /* Empty State - Just tips */
            <div className="space-y-6">
              {/* Tips Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <DashboardCard
                    title="Pro Tip"
                    description="Aspect ratios"
                    icon={<span className="text-lg">🎯</span>}
                    gradient="from-orange-50 to-red-100"
                    className="card-reveal"
                  >
                    <div className="text-sm space-y-2">
                      <div><strong>16:9</strong> - Perfect for YouTube and Twitter</div>
                      <div><strong>9:16</strong> - Ideal for TikTok and Instagram Stories</div>
                      <div><strong>1:1</strong> - Best for Instagram feed posts</div>
                    </div>
                  </DashboardCard>
                  
                  <DashboardCard
                    title="Best Practice"
                    description="Optimal durations"
                    icon={<span className="text-lg">⏱️</span>}
                    gradient="from-cyan-50 to-blue-100"
                    className="card-reveal"
                  >
                    <div className="text-sm space-y-2">
                      <div><strong>15-30s</strong> - Maximum engagement</div>
                      <div><strong>60s</strong> - Detailed explanations</div>
                      <div><strong>90s+</strong> - In-depth content</div>
                    </div>
                  </DashboardCard>
                  
                  <DashboardCard
                    title="Feature"
                    description="Auto subtitles"
                    icon={<span className="text-lg">📝</span>}
                    gradient="from-violet-50 to-purple-100"
                    className="card-reveal md:col-span-2 xl:col-span-1"
                  >
                    <div className="text-sm space-y-2">
                      <div>AI-generated subtitles increase engagement by <strong>80%</strong></div>
                      <div>Works in multiple languages</div>
                    </div>
                  </DashboardCard>
                </div>
              </div>
            ) : (
              /* Clips Grid */
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                      Generated Clips
                    </h2>
                    <p className="text-gray-600">
                      {clips.length} clips • Total duration: {formatDuration(clips.reduce((acc, clip) => acc + clip.duration, 0))}
                    </p>
                  </div>
                  <button
                    onClick={() => setClips([])}
                    className="flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 hover:bg-white/90 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <Upload className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-700 font-medium">New Project</span>
                  </button>
                </div>

                <ClipsGrid
                  clips={clips}
                  onDeleteClip={handleDeleteClip}
                />
                
                <AdvancedMetrics
                  currentJob={currentJob}
                  clips={clips}
                />
              </div>
            )}
          </div>
        </div>
      </main>
                  clips={clips}
                  onDeleteClip={handleDeleteClip}
                />
                
                <AdvancedMetrics
                  currentJob={currentJob}
                  clips={clips}
                />
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Loading Overlay */}
      {isLoading && <LoadingOverlay message={loadingMessage} />}
      
      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

export default App;
