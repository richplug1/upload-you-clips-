export interface VideoAnalysis {
  highlights: string[];
  suggestedClips: Array<{
    title: string;
    startTime: number;
    endTime: number;
    description: string;
  }>;
  tags: string[];
  summary: string;
}

export interface OpenAIStatus {
  available: boolean;
  message: string;
}

class OpenAIService {
  private baseUrl = '/api/openai';

  /**
   * Check if OpenAI service is available
   */
  async getStatus(): Promise<OpenAIStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/status`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to check OpenAI status:', error);
      return {
        available: false,
        message: 'OpenAI service is unavailable'
      };
    }
  }

  /**
   * Check if OpenAI is configured
   */
  async isConfigured(): Promise<boolean> {
    const status = await this.getStatus();
    return status.available;
  }

  /**
   * Generate video description using AI
   */
  async generateDescription(videoTitle: string, tags?: string[]): Promise<string> {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${this.baseUrl}/generate-description`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          videoTitle,
          tags: tags || []
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.description;
    } catch (error) {
      console.error('Failed to generate description:', error);
      throw error;
    }
  }

  /**
   * Suggest clip titles using AI
   */
  async suggestTitles(originalTitle: string, clipCount: number = 3): Promise<string[]> {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${this.baseUrl}/suggest-titles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          originalTitle,
          clipCount
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.titles;
    } catch (error) {
      console.error('Failed to suggest titles:', error);
      throw error;
    }
  }

  /**
   * Analyze video content using AI
   */
  async analyzeContent(transcript: string, duration: number): Promise<VideoAnalysis> {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${this.baseUrl}/analyze-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          transcript,
          duration
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.analysis;
    } catch (error) {
      console.error('Failed to analyze content:', error);
      throw error;
    }
  }
}

export const openaiService = new OpenAIService();
