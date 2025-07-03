import React, { useState, useEffect } from 'react';
import { openaiService, OpenAIStatus } from '../services/openai';
import { Sparkles, Loader2, AlertCircle, Lightbulb, FileText, Tag } from 'lucide-react';

interface AIAssistantProps {
  videoTitle?: string;
  onDescriptionGenerated?: (description: string) => void;
  onTitlesGenerated?: (titles: string[]) => void;
}

export default function AIAssistant({
  videoTitle = '',
  onDescriptionGenerated,
  onTitlesGenerated
}: AIAssistantProps) {
  const [status, setStatus] = useState<OpenAIStatus>({ available: false, message: 'Checking...' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedDescription, setGeneratedDescription] = useState<string>('');
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
  const [tags, setTags] = useState<string>('');

  useEffect(() => {
    checkOpenAIStatus();
  }, []);

  const checkOpenAIStatus = async () => {
    try {
      const openaiStatus = await openaiService.getStatus();
      setStatus(openaiStatus);
    } catch (error) {
      console.error('Failed to check OpenAI status:', error);
      setStatus({
        available: false,
        message: 'Failed to check OpenAI service availability'
      });
    }
  };

  const generateDescription = async () => {
    if (!videoTitle.trim()) {
      setError('Please provide a video title first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const tagList = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      const description = await openaiService.generateDescription(videoTitle, tagList);
      setGeneratedDescription(description);
      onDescriptionGenerated?.(description);
    } catch (error) {
      console.error('Failed to generate description:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate description');
    } finally {
      setIsLoading(false);
    }
  };

  const generateTitles = async () => {
    if (!videoTitle.trim()) {
      setError('Please provide a video title first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const titles = await openaiService.suggestTitles(videoTitle, 5);
      setSuggestedTitles(titles);
      onTitlesGenerated?.(titles);
    } catch (error) {
      console.error('Failed to generate titles:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate titles');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
    });
  };

  if (!status.available) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-gray-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">AI Assistant: {status.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-purple-900">AI Assistant</h3>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Tags Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Tag className="w-4 h-4 inline mr-1" />
          Tags (optional, comma-separated)
        </label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="gaming, tutorial, review..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={generateDescription}
          disabled={isLoading || !videoTitle.trim()}
          className="w-full flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileText className="w-4 h-4" />
          )}
          <span>Generate Description</span>
        </button>

        <button
          onClick={generateTitles}
          disabled={isLoading || !videoTitle.trim()}
          className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Lightbulb className="w-4 h-4" />
          )}
          <span>Suggest Clip Titles</span>
        </button>
      </div>

      {/* Generated Description */}
      {generatedDescription && (
        <div className="mt-4 p-4 bg-white rounded-lg border border-purple-200">
          <h4 className="font-medium text-gray-900 mb-2">Generated Description:</h4>
          <p className="text-gray-700 text-sm leading-relaxed mb-3">{generatedDescription}</p>
          <button
            onClick={() => copyToClipboard(generatedDescription)}
            className="text-purple-600 hover:text-purple-700 text-sm font-medium"
          >
            Copy to Clipboard
          </button>
        </div>
      )}

      {/* Suggested Titles */}
      {suggestedTitles.length > 0 && (
        <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
          <h4 className="font-medium text-gray-900 mb-2">Suggested Clip Titles:</h4>
          <div className="space-y-2">
            {suggestedTitles.map((title, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded border hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm text-gray-700">{title}</span>
                <button
                  onClick={() => copyToClipboard(title)}
                  className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                >
                  Copy
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!videoTitle.trim() && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-800 text-sm">
            💡 Upload a video or enter a title to use AI-powered features!
          </p>
        </div>
      )}
    </div>
  );
}
