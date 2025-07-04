import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, CheckCircle, AlertCircle, Monitor, Clock, Sliders, Type, Sparkles, Play } from 'lucide-react';
import { videoService } from '../services/video';
import { Job, ClipOptions, VideoClip } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useErrorHandler } from '../utils/errorHandler';
import AIAssistant from './AIAssistant';

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
  const { isAuthenticated } = useAuth();
  const { captureUploadError, captureValidationError, captureProcessingError } = useErrorHandler();
  
  // Clip generation options
  const [clipDurations, setClipDurations] = useState<number[]>([30, 60]);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [numberOfClips, setNumberOfClips] = useState(3);
  const [enableSubtitles, setEnableSubtitles] = useState(true);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) {
      captureValidationError('No file selected for upload');
      return;
    }

    // Check authentication - allow demo mode
    if (!isAuthenticated) {
      // Show info message about demo mode
      console.log('Demo Mode: Upload working without authentication');
      // Continue with upload in demo mode
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      const errorMsg = 'Please select a valid video file';
      setError(errorMsg);
      captureValidationError(errorMsg, { fileType: file.type, fileName: file.name });
      return;
    }

    // Validate file size (100MB - matching backend limit)
    if (file.size > 100 * 1024 * 1024) {
      const errorMsg = 'File size must be less than 100MB';
      setError(errorMsg);
      captureValidationError(errorMsg, { fileSize: file.size, fileName: file.name });
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const job = await videoService.uploadVideo(file, (progress) => {
        setUploadProgress(progress);
      });

      onVideoUploaded(job);
    } catch (err: any) {
      console.error('Upload error:', err);
      const errorMessage = err.message || 'Upload failed';
      setError(errorMessage);
      
      captureUploadError(errorMessage, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [onVideoUploaded, isAuthenticated, captureUploadError, captureValidationError]);

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

  // Predefined custom durations in seconds (5m, 10m, 15m, 20m, 30m, 60m)
  const customDurationOptions = [300, 600, 900, 1200, 1800, 3600]; // 5min to 60min in seconds

  const toggleCustomDuration = (duration: number) => {
    if (clipDurations.includes(duration)) {
      setClipDurations(clipDurations.filter(d => d !== duration));
    } else {
      setClipDurations([...clipDurations, duration]);
    }
    // Ne pas fermer le dropdown pour permettre la sélection multiple
  };

  const handleGenerateClips = async () => {
    if (!currentJob) {
      captureValidationError('No video job available for clip generation');
      return;
    }
    
    const options: ClipOptions = {
      clipLength: clipDurations[0] || 30,
      numberOfClips,
      enableSubtitles,
      minScore: 0.5,
      language: 'fr',
      outputFormat: 'mp4',
      clipDurations,
      aspectRatio,
      includeSubtitles: enableSubtitles,
      maxClips: numberOfClips,
      platform: 'custom'
    };

    try {
      onGenerateClips(options);
      setIsLoading(true);
      setLoadingMessage('Starting video processing...');
      
      // Start processing with real backend
      const processingJob = await videoService.processVideo(currentJob.id, options);
      
      // Poll for completion
      await videoService.pollJobStatus(processingJob.id, (job) => {
        if (job.progress <= 25) {
          setLoadingMessage('Analyzing video content...');
        } else if (job.progress <= 50) {
          setLoadingMessage('Identifying key moments...');
        } else if (job.progress <= 75) {
          setLoadingMessage('Generating clips...');
        } else {
          setLoadingMessage('Finalizing clips...');
        }
      });
      
      // Get the generated clips
      const clips = await videoService.getUserClips();
      const jobClips = clips.filter(clip => (clip.job_id || clip.jobId) === currentJob.id);
      
      onClipsGenerated(jobClips);
    } catch (error) {
      console.error('Error generating clips:', error);
      const errorMessage = error instanceof Error ? error.message : 'Clip generation failed';
      captureProcessingError(`Failed to generate clips: ${errorMessage}`, {
        jobId: currentJob.id,
        options,
        error
      });
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Demo Mode Indicator */}
      {!isAuthenticated && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center space-x-2">
          <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-yellow-800">D</span>
          </div>
          <div>
            <p className="text-sm font-medium text-yellow-800">Demo Mode Active</p>
            <p className="text-xs text-yellow-700">Upload working without account • Full features available after login</p>
          </div>
        </div>
      )}

      {!currentJob ? (
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-xl p-4 text-center transition-all duration-300 cursor-pointer group
            ${isDragActive 
              ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-purple-50 scale-105' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 hover:scale-105'
            }
            ${uploading ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          <div className="space-y-2">
            {/* Upload Icon */}
            <div className={`
              w-10 h-10 mx-auto rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110
              ${isDragActive 
                ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl' 
                : 'bg-gradient-to-br from-gray-400 to-gray-600 group-hover:from-blue-500 group-hover:to-purple-600 group-hover:shadow-xl'
              }
            `}>
              <Upload className={`w-5 h-5 text-white transition-transform duration-300 ${isDragActive ? 'animate-bounce' : 'group-hover:animate-bounce'}`} />
            </div>
            
            {/* Upload Text */}
            <div>
              <p className="text-sm font-bold text-gray-900 mb-1">
                {isDragActive ? '🎉 Drop it here!' : 'Drag & Drop Your Video'}
              </p>
              <p className="text-xs text-gray-600 mb-2">
                or <span className="text-blue-600 font-semibold cursor-pointer hover:underline">browse files</span>
              </p>
              
              {/* File Format Info */}
              <div className="flex flex-wrap justify-center gap-1 mb-2">
                {['MP4', 'MOV', 'AVI'].map((format) => (
                  <span key={format} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                    {format}
                  </span>
                ))}
              </div>
              
              {/* Size Limit */}
              <div className="inline-flex items-center space-x-1 bg-gradient-to-r from-green-100 to-blue-100 px-2 py-1 rounded-full">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-gray-700">Max: 500MB</span>
              </div>
            </div>
          </div>

          {/* Upload Progress Overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <div className="text-center space-y-3">
                {/* Animated Upload Icon */}
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto animate-pulse">
                    <Upload className="w-6 h-6 text-white animate-bounce" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center animate-spin">
                    <span className="text-xs">⚡</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-bold text-gray-900">Uploading...</p>
                  
                  {/* Progress Bar */}
                  <div className="w-32 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 relative"
                      style={{ width: `${uploadProgress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs w-32">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-bold text-blue-600">{uploadProgress}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Success State with Configuration Options */
        <div className="space-y-4">
          {/* Video Upload Success */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200 rounded-xl p-4 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-2 right-2 text-2xl">🎉</div>
              <div className="absolute bottom-2 left-2 text-xl">✨</div>
            </div>
            
            <div className="relative flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-base font-bold text-green-900 mb-1">🎊 Video uploaded successfully!</h3>
                <p className="text-sm text-green-700 mb-2">Configure your clip settings below</p>
                
                <div className="bg-white/50 rounded-lg p-2 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <File className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-900 truncate text-sm">{currentJob.input_file}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      <div className="bg-green-100 px-2 py-1 rounded-full font-medium text-green-700">
                        {currentJob.status === 'completed' ? 'Processed' : 'Ready'}
                      </div>
                      <div className="bg-blue-100 px-2 py-1 rounded-full font-medium text-blue-700">
                        {currentJob.progress}%
                      </div>
                      {onResetUpload && (
                        <button
                          onClick={onResetUpload}
                          className="ml-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full font-medium text-gray-600 transition-colors duration-200"
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
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900">Clip Configuration</h3>
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
                  
                  {/* Custom Duration Buttons - Inline */}
                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span>Extended Durations</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {customDurationOptions.map((duration) => {
                        const isSelected = clipDurations.includes(duration);
                        return (
                          <button
                            key={duration}
                            onClick={() => toggleCustomDuration(duration)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                              isSelected
                                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg transform scale-105'
                                : 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 hover:from-purple-200 hover:to-indigo-200 hover:shadow-md hover:scale-105'
                            }`}
                          >
                            {duration >= 60 ? `${duration / 60}m` : `${duration}s`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Selected Durations Display */}
                  {clipDurations.length > 0 ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Selected Durations:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {clipDurations.sort((a, b) => a - b).map((duration, index) => (
                          <span 
                            key={duration}
                            className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full border border-blue-300"
                          >
                            {duration >= 60 ? `${duration / 60}m` : `${duration}s`}
                            {index < clipDurations.length - 1 && <span className="ml-1">•</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-lg p-2 text-center">
                      ⚠️ Please select at least one duration to generate clips
                    </div>
                  )}
                </div>
              </div>

              {/* Subtitles Toggle - Always Visible */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
                  <Type className="w-4 h-4" />
                  <span>Subtitles</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
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
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700">Auto-generate subtitles</span>
                    <p className="text-xs text-gray-500 mt-1">
                      Automatically add captions to improve engagement
                    </p>
                  </div>
                </label>
              </div>

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

            {/* AI Assistant Section */}
            <div className="mt-6">
              <AIAssistant 
                videoTitle={currentJob?.input_file ? currentJob.input_file.split('/').pop()?.replace(/\.[^/.]+$/, '') || '' : ''}
                onDescriptionGenerated={(description) => {
                  // Could store this in state or pass to parent component
                  console.log('Generated description:', description);
                }}
                onTitlesGenerated={(titles) => {
                  // Could store this in state or pass to parent component
                  console.log('Generated titles:', titles);
                }}
              />
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
