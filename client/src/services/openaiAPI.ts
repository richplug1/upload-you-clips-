import axios from 'axios';
import { config } from '../config/env';

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

class OpenAIAPIService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.api.baseUrl;
  }

  async checkStatus(): Promise<{ available: boolean; message: string }> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/openai/status`);
      return response.data;
    } catch (error) {
      console.error('Error checking OpenAI status:', error);
      return { available: false, message: 'Unable to check OpenAI service status' };
    }
  }

  async generateVideoDescription(videoTitle: string, tags: string[] = []): Promise<string> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/openai/generate-description`, {
        videoTitle,
        tags
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      return response.data.description;
    } catch (error) {
      console.error('Error generating video description:', error);
      
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || error.message;
        if (message.includes('Language model') && message.includes('not available')) {
          throw new Error('The requested language model is not available. This may be due to API quota or model access restrictions.');
        }
        throw new Error(message);
      }
      
      throw new Error('Failed to generate video description');
    }
  }

  async suggestClipTitles(originalTitle: string, clipCount: number = 3): Promise<string[]> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/openai/suggest-titles`, {
        originalTitle,
        clipCount
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      return response.data.titles;
    } catch (error) {
      console.error('Error suggesting clip titles:', error);
      
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || error.message;
        if (message.includes('Language model') && message.includes('not available')) {
          throw new Error('The requested language model is not available. This may be due to API quota or model access restrictions.');
        }
        throw new Error(message);
      }
      
      throw new Error('Failed to suggest clip titles');
    }
  }

  async analyzeVideoContent(transcript: string, duration: number): Promise<string> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/openai/analyze-content`, {
        transcript,
        duration
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      return response.data.analysis;
    } catch (error) {
      console.error('Error analyzing video content:', error);
      
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || error.message;
        if (message.includes('Language model') && message.includes('not available')) {
          throw new Error('The requested language model is not available. This may be due to API quota or model access restrictions.');
        }
        throw new Error(message);
      }
      
      throw new Error('Failed to analyze video content');
    }
  }
}

export const openAIAPIService = new OpenAIAPIService();
