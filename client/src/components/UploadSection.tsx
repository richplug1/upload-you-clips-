import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, CheckCircle, AlertCircle, Monitor, Clock, Sliders, Type, Sparkles, Play } from 'lucide-react';
import axios from 'axios';
import { Job, ClipOptions, VideoClip } from '../App';

interface UploadSectionProps {
  onVideoUploaded: (job: Job) => void;
  currentJob: Job | null;
  onGenerateClips: (options: ClipOptions) => void;
  onClipsGenerated: (clips: VideoClip[]) => void;
  setIsLoading: (loading: boolean) => void;
  setLoadingMessage: (message: string) => void;
  onResetUpload?: () => void;
}

const UploadSection = ({ onVideoUploaded, currentJob, onGenerateClips, onClipsGenerated, setIsLoading, setLoadingMessage, onResetUpload }: UploadSectionProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Clip generation options
  const [clipDurations, setClipDurations] = useState<number[]>([30, 60]);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [numberOfClips, setNumberOfClips] = useState(3);
  const [enableSubtitles, setEnableSubtitles] = useState(true);
  const [customDuration, setCustomDuration] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('video', file);

    try {
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        },
      });

      const job: Job = {
        id: response.data.jobId,
        filename: response.data.filename,
        path: '',
        duration: response.data.duration,
        status: 'uploaded',
        createdAt: new Date().toISOString(),
      };

      onVideoUploaded(job);
    } catch (err: any) {
      console.error('Upload error:', err);
      console.error('Error response:', err.response);
      const errorMessage = err.response?.data?.error || err.message || 'Upload failed';
      setError(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [onVideoUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm']
    },
    maxSize: 500 * 1024 * 1024, // 500MB
    multiple: false,
    disabled: uploading
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Aspect ratio options
  const aspectRatioOptions = [
    { value: '16:9', label: 'Landscape', icon: '📺', description: 'YouTube, Twitter' },
    { value: '9:16', label: 'Portrait', icon: '📱', description: 'TikTok, Stories' },
    { value: '1:1', label: 'Square', icon: '⭐', description: 'Instagram Posts' },
  ];

  // Duration options
  const durationOptions = [15, 30, 60, 90, 120, 180];

  const addDuration = (duration: number) => {
    if (!clipDurations.includes(duration)) {
      setClipDurations([...clipDurations, duration]);
    }
  };

  const removeDuration = (duration: number) => {
    setClipDurations(clipDurations.filter(d => d !== duration));
  };

  const addCustomDuration = () => {
    const duration = parseInt(customDuration);
    if (duration > 0 && duration <= 300 && !clipDurations.includes(duration)) {
      setClipDurations([...clipDurations, duration]);
      setCustomDuration('');
    }
  };

  const handleGenerateClips = async () => {
    if (!currentJob) return;
    
    const options: ClipOptions = {
      clipDurations,
      aspectRatio,
      numberOfClips,
      enableSubtitles,
    };

    onGenerateClips(options);

    try {
      setIsLoading(true);
      setLoadingMessage('Starting AI analysis...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      setLoadingMessage('Processing video content...');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      setLoadingMessage('Generating clips...');

      // Mock generated clips
      const mockClips: VideoClip[] = Array.from({ length: numberOfClips }, (_, index) => ({
        id: `clip-${Date.now()}-${index}`,
        jobId: currentJob.id,
        filename: `${currentJob.filename.replace(/\.[^/.]+$/, "")}_clip_${index + 1}.mp4`,
        path: `/clips/clip-${Date.now()}-${index}.mp4`,
        duration: clipDurations[index % clipDurations.length],
        startTime: index * 30,
        aspectRatio,
        hasSubtitles: enableSubtitles,
        createdAt: new Date().toISOString(),
        downloadUrl: `http://localhost:5000/clips/clip-${Date.now()}-${index}.mp4`,
      }));

      await new Promise(resolve => setTimeout(resolve, 2000));
      setLoadingMessage('Finalizing clips...');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onClipsGenerated(mockClips);
    } catch (error) {
      console.error('Error generating clips:', error);
      setIsLoading(false);
    }
  };

  return (
    <>
      {!currentJob ? (
        <div
          {...getRootProps()}
          className={`
            relative border-3 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer group
            ${isDragActive 
              ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-purple-50 scale-105' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 hover:scale-105'
            }
            ${uploading ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          <div className="space-y-4">
            {/* Upload Icon */}
            <div className={`
              w-16 h-16 mx-auto rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110
              ${isDragActive 
                ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl' 
                : 'bg-gradient-to-br from-gray-400 to-gray-600 group-hover:from-blue-500 group-hover:to-purple-600 group-hover:shadow-xl'
              }
            `}>
              <Upload className={`w-8 h-8 text-white transition-transform duration-300 ${isDragActive ? 'animate-bounce' : 'group-hover:animate-bounce'}`} />
            </div>
            
            {/* Upload Text */}
            <div>
              <p className="text-lg font-bold text-gray-900 mb-2">
                {isDragActive ? '🎉 Drop it here!' : 'Drag & Drop Your Video'}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                or <span className="text-blue-600 font-semibold cursor-pointer hover:underline">browse files</span>
              </p>
              
              {/* File Format Info */}
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {['MP4', 'MOV', 'AVI', 'MKV', 'WebM'].map((format) => (
                  <span key={format} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                    {format}
                  </span>
                ))}
              </div>
              
              {/* Size Limit */}
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-100 to-blue-100 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-gray-700">Max size: 500MB</span>
              </div>
            </div>
          </div>

          {/* Upload Progress Overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <div className="text-center space-y-4">
                {/* Animated Upload Icon */}
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
                    <Upload className="w-8 h-8 text-white animate-bounce" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-spin">
                    <span className="text-xs">⚡</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <p className="text-lg font-bold text-gray-900">Uploading...</p>
                  
                  {/* Progress Bar */}
                  <div className="w-48 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 relative"
                      style={{ width: `${uploadProgress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm w-48">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-bold text-blue-600">{uploadProgress}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Success State with Configuration Options */
        <div className="space-y-6">
          {/* Video Upload Success */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200 rounded-2xl p-6 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-4 text-4xl">🎉</div>
              <div className="absolute bottom-4 left-4 text-2xl">✨</div>
            </div>
            
            <div className="relative flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-900 mb-2">🎊 Video uploaded successfully!</h3>
                <p className="text-green-700 mb-3">Configure your clip settings below</p>
                
                <div className="bg-white/50 rounded-xl p-3 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <File className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-900 truncate text-sm">{currentJob.filename}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs">
                      <div className="bg-green-100 px-2 py-1 rounded-full font-medium text-green-700">
                        {formatDuration(currentJob.duration)}
                      </div>
                      <div className="bg-blue-100 px-2 py-1 rounded-full font-medium text-blue-700">
                        Ready
                      </div>
                      {onResetUpload && (
                        <button
                          onClick={onResetUpload}
                          className="ml-2 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full font-medium text-gray-600 transition-colors duration-200"
                          title="Upload new video"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration Panel */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Clip Configuration</h3>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
              </button>
            </div>

            <div className="space-y-6">
              {/* Aspect Ratio Selection */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
                  <Monitor className="w-4 h-4" />
                  <span>Aspect Ratio</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {aspectRatioOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setAspectRatio(option.value as any)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        aspectRatio === option.value
                          ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{option.icon}</span>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{option.label}</div>
                            <div className="text-xs text-gray-500">{option.description}</div>
                          </div>
                        </div>
                        <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                          {option.value}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Clips */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
                  <Sliders className="w-4 h-4" />
                  <span>Number of Clips: {numberOfClips}</span>
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={numberOfClips}
                    onChange={(e) => setNumberOfClips(parseInt(e.target.value))}
                    className="slider w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>1</span>
                    <span>4</span>
                    <span>8</span>
                  </div>
                </div>
              </div>

              {/* Clip Durations */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
                  <Clock className="w-4 h-4" />
                  <span>Clip Durations (seconds)</span>
                </label>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {durationOptions.map((duration) => (
                      <button
                        key={duration}
                        onClick={() => 
                          clipDurations.includes(duration) 
                            ? removeDuration(duration) 
                            : addDuration(duration)
                        }
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          clipDurations.includes(duration)
                            ? 'bg-green-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {duration}s
                      </button>
                    ))}
                  </div>
                  
                  {/* Custom Duration Input */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      placeholder="Custom (3-300s)"
                      value={customDuration}
                      onChange={(e) => setCustomDuration(e.target.value)}
                      min="3"
                      max="300"
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent w-32"
                    />
                    <button
                      onClick={addCustomDuration}
                      disabled={!customDuration || parseInt(customDuration) < 3 || parseInt(customDuration) > 300}
                      className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Selected: {clipDurations.sort((a, b) => a - b).join(', ')} seconds
                  </div>
                </div>
              </div>

              {/* Advanced Options */}
              {showAdvanced && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-medium text-gray-900">Advanced Options</h4>
                  
                  {/* Subtitles Toggle */}
                  <div>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableSubtitles}
                        onChange={(e) => setEnableSubtitles(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                        enableSubtitles ? 'bg-purple-500' : 'bg-gray-300'
                      }`}>
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                          enableSubtitles ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Type className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Auto-generate subtitles</span>
                      </div>
                    </label>
                    <p className="text-xs text-gray-500 ml-15 mt-1">
                      Automatically add captions to improve engagement
                    </p>
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleGenerateClips}
                disabled={clipDurations.length === 0}
                className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white py-4 px-6 rounded-2xl font-semibold text-lg hover:from-purple-600 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <Sparkles className="w-6 h-6" />
                <span>Generate {numberOfClips} Clips</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mt-4 bg-gradient-to-br from-red-50 to-rose-100 border-2 border-red-200 rounded-2xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-red-900 mb-1">Upload Failed</h4>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UploadSection;
