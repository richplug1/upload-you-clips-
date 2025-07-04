import React, { useState, useEffect } from 'react';
import { Upload, Play, AlertCircle, CheckCircle, Settings, CreditCard } from 'lucide-react';
import { videoService } from '../services/videoService';
import { subscriptionService } from '../services/subscription';
import { useAuth } from '../contexts/AuthContext';
import CreditStatus from './CreditStatus';
import ProcessingCostCalculator from './ProcessingCostCalculator';
import BuyCreditsModal from './BuyCreditsModal';
import SubscriptionPlans from './SubscriptionPlans';

interface VideoUploadWithCreditsProps {
  onVideoProcessed?: (jobId: string) => void;
}

const VideoUploadWithCredits: React.FC<VideoUploadWithCreditsProps> = ({ onVideoProcessed }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<any>(null);
  const [processingSettings, setProcessingSettings] = useState({
    clipsCount: 3,
    generateSubtitles: false,
    customDuration: 30
  });
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [canProcess, setCanProcess] = useState(false);
  const [processingCost, setProcessingCost] = useState(0);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const [showSubscriptionPlans, setShowSubscriptionPlans] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      loadUserCredits();
    }
  }, [isAuthenticated]);

  const loadUserCredits = async () => {
    try {
      const status = await subscriptionService.getSubscriptionStatus();
      setUserCredits(status.credits.remaining_credits);
    } catch (error) {
      console.error('Failed to load user credits:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setSuccess(null);
      
      // Create video element to get metadata
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        setVideoMetadata({
          duration: video.duration,
          size: file.size,
          format: file.type
        });
      };
      video.src = URL.createObjectURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a video file');
      return;
    }

    if (!isAuthenticated) {
      setError('Please sign in to upload videos');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      
      const uploadResult = await videoService.uploadVideo(selectedFile);
      setUploadedFile(uploadResult);
      setSuccess('Video uploaded successfully!');
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleProcess = async () => {
    if (!uploadedFile || !videoMetadata) {
      setError('Please upload a video first');
      return;
    }

    if (!canProcess) {
      setError('Insufficient credits or processing limits exceeded');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      
      const result = await videoService.processVideo(
        uploadedFile.fileId,
        uploadedFile.fileName,
        {
          duration: videoMetadata.duration,
          clipsCount: processingSettings.clipsCount,
          generateSubtitles: processingSettings.generateSubtitles,
          customDuration: processingSettings.customDuration
        }
      );
      
      setSuccess(`Video processing started! Job ID: ${result.jobId}`);
      
      // Reload credits after processing
      await loadUserCredits();
      
      if (onVideoProcessed) {
        onVideoProcessed(result.jobId);
      }
      
      // Reset form
      setSelectedFile(null);
      setUploadedFile(null);
      setVideoMetadata(null);
      
    } catch (err: any) {
      setError(err.message || 'Processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCostCalculated = (cost: number, canProcessFlag: boolean) => {
    setProcessingCost(cost);
    setCanProcess(canProcessFlag);
  };

  const handleCreditsUpdated = async () => {
    await loadUserCredits();
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload & Process Video</h1>
        <p className="text-gray-600">
          Upload your video and generate clips automatically with AI-powered processing
        </p>
      </div>

      {/* Credit Status */}
      <CreditStatus
        onUpgradeClick={() => setShowSubscriptionPlans(true)}
        onBuyCreditsClick={() => setShowBuyCredits(true)}
      />

      {/* File Upload */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Upload className="w-5 h-5 mr-2" />
          Upload Video
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Video File
            </label>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {selectedFile && videoMetadata && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Video Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Duration:</span>
                  <span className="ml-2 font-medium">{formatDuration(videoMetadata.duration)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Size:</span>
                  <span className="ml-2 font-medium">{formatFileSize(videoMetadata.size)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Format:</span>
                  <span className="ml-2 font-medium">{videoMetadata.format}</span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Upload Video</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Processing Settings */}
      {uploadedFile && videoMetadata && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Processing Settings
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Clips to Generate
              </label>
              <select
                value={processingSettings.clipsCount}
                onChange={(e) => setProcessingSettings({
                  ...processingSettings,
                  clipsCount: parseInt(e.target.value)
                })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={1}>1 clip</option>
                <option value={3}>3 clips</option>
                <option value={5}>5 clips</option>
                <option value={10}>10 clips</option>
                <option value={15}>15 clips</option>
                <option value={20}>20 clips</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clip Duration (seconds)
              </label>
              <input
                type="number"
                value={processingSettings.customDuration}
                onChange={(e) => setProcessingSettings({
                  ...processingSettings,
                  customDuration: parseInt(e.target.value)
                })}
                min="10"
                max="120"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={processingSettings.generateSubtitles}
                onChange={(e) => setProcessingSettings({
                  ...processingSettings,
                  generateSubtitles: e.target.checked
                })}
                className="mr-2"
              />
              <label className="text-sm text-gray-700">Generate subtitles</label>
            </div>
          </div>
        </div>
      )}

      {/* Cost Calculator */}
      {uploadedFile && videoMetadata && (
        <ProcessingCostCalculator
          videoDuration={videoMetadata.duration}
          clipsCount={processingSettings.clipsCount}
          onCostCalculated={handleCostCalculated}
        />
      )}

      {/* Process Button */}
      {uploadedFile && videoMetadata && (
        <button
          onClick={handleProcess}
          disabled={!canProcess || isProcessing}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 ${
            canProcess
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>
                {canProcess 
                  ? `Process Video (${processingCost} credits)` 
                  : 'Insufficient Credits or Limits Exceeded'}
              </span>
            </>
          )}
        </button>
      )}

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <p className="text-sm text-green-800">{success}</p>
          </div>
        </div>
      )}

      {/* Modals */}
      <BuyCreditsModal
        isOpen={showBuyCredits}
        onClose={() => setShowBuyCredits(false)}
        onSuccess={handleCreditsUpdated}
        currentCredits={userCredits}
      />

      {showSubscriptionPlans && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Subscription Plans</h2>
                <button
                  onClick={() => setShowSubscriptionPlans(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <SubscriptionPlans onPlanSelected={handleCreditsUpdated} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoUploadWithCredits;
