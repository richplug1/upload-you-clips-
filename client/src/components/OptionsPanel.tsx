import React, { useState } from 'react';
import { Job, ClipOptions, VideoClip } from '../types';
import { Play, Settings, Sliders, Monitor, Clock, Type, Sparkles } from 'lucide-react';

interface OptionsPanelProps {
  job: Job;
  onGenerateClips: (options: ClipOptions) => void;
  onClipsGenerated: (clips: VideoClip[]) => void;
  setIsLoading: (loading: boolean) => void;
  setLoadingMessage: (message: string) => void;
}

const OptionsPanel = ({ job, onGenerateClips, onClipsGenerated, setIsLoading, setLoadingMessage }: OptionsPanelProps) => {
  const [clipDurations, setClipDurations] = useState<number[]>([30, 60]);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [numberOfClips, setNumberOfClips] = useState(3);
  const [enableSubtitles, setEnableSubtitles] = useState(true);

  const aspectRatioOptions = [
    { value: '16:9', label: 'Landscape', icon: '📺', description: 'Perfect for YouTube, Twitter' },
    { value: '9:16', label: 'Portrait', icon: '📱', description: 'Ideal for TikTok, Stories' },
    { value: '1:1', label: 'Square', icon: '⭐', description: 'Great for Instagram Posts' },
  ];

  const durationOptions = [15, 30, 60, 90, 120];

  const handleGenerateClips = async () => {
    const options: ClipOptions = {
      clipLength: clipDurations[0] || 30,
      numberOfClips,
      enableSubtitles,
      minScore: 0,
      language: 'auto',
      outputFormat: 'mp4',
      clipDurations,
      aspectRatio,
      includeSubtitles: enableSubtitles,
      maxClips: numberOfClips,
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
        jobId: job.id,
        title: `Clip ${index + 1}`,
        description: `Generated clip ${index + 1} from ${job.filename}`,
        filename: `${job.filename.replace(/\.[^/.]+$/, "")}_clip_${index + 1}.mp4`,
        path: `/clips/clip-${Date.now()}-${index}.mp4`,
        thumbnail: `thumbnail-${Date.now()}-${index}.jpg`,
        duration: clipDurations[index % clipDurations.length],
        startTime: index * 30,
        aspectRatio,
        hasSubtitles: enableSubtitles,
        createdAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
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

  const addDuration = (duration: number) => {
    if (!clipDurations.includes(duration)) {
      setClipDurations([...clipDurations, duration]);
    }
  };

  const removeDuration = (duration: number) => {
    setClipDurations(clipDurations.filter(d => d !== duration));
  };

  return (
    <div className="space-y-6">
      {/* Video Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <Play className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{job.filename}</h4>
            <p className="text-sm text-gray-600">Duration: {Math.floor(job.duration / 60)}:{(job.duration % 60).toString().padStart(2, '0')}</p>
          </div>
        </div>
      </div>

      {/* Aspect Ratio Selection */}
      <div>
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
          <Monitor className="w-4 h-4" />
          <span>Aspect Ratio</span>
        </label>
        <div className="grid grid-cols-1 gap-3">
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
                  <span className="text-2xl">{option.icon}</span>
                  <div>
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </div>
                </div>
                <div className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                  {option.value}
                </div>
              </div>
            </button>
          ))}
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
          <div className="text-xs text-gray-500">
            Selected: {clipDurations.sort((a, b) => a - b).join(', ')} seconds
          </div>
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
            max="10"
            value={numberOfClips}
            onChange={(e) => setNumberOfClips(parseInt(e.target.value))}
            className="slider w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>1</span>
            <span>5</span>
            <span>10</span>
          </div>
        </div>
      </div>

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

      {/* Generate Button */}
      <button
        onClick={handleGenerateClips}
        className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white py-4 px-6 rounded-2xl font-semibold text-lg hover:from-purple-600 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
      >
        <Sparkles className="w-6 h-6" />
        <span>Generate {numberOfClips} Clips</span>
      </button>
    </div>
  );
};

export default OptionsPanel;
