const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    this.client = null;
    this.isConfigured = false;
    
    if (process.env.OPENAI_API_KEY) {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.isConfigured = true;
    }
  }

  async chat(messages, model = 'gpt-3.5-turbo') {
    if (!this.isConfigured) {
      throw new Error('OpenAI API key is not configured');
    }

    try {
      const completion = await this.client.chat.completions.create({
        model,
        messages,
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 1000,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('OpenAI API Error:', error);
      
      if (error.error?.code === 'model_not_found') {
        throw new Error(`Language model "${model}" is not available. Please check your OpenAI subscription or try "gpt-3.5-turbo".`);
      }
      
      if (error.error?.code === 'insufficient_quota') {
        throw new Error('OpenAI API quota exceeded. Please check your billing settings.');
      }
      
      if (error.error?.code === 'invalid_api_key') {
        throw new Error('Invalid OpenAI API key. Please check your configuration.');
      }
      
      throw new Error(`OpenAI service error: ${error.message}`);
    }
  }

  async generateVideoDescription(videoTitle, tags = []) {
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful assistant that generates engaging video descriptions based on titles and tags.'
      },
      {
        role: 'user',
        content: `Generate an engaging description for a video with the title "${videoTitle}"${tags.length > 0 ? ` and tags: ${tags.join(', ')}` : ''}.`
      }
    ];

    return this.chat(messages);
  }

  async suggestClipTitles(originalTitle, clipCount) {
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful assistant that suggests creative titles for video clips based on the original video title.'
      },
      {
        role: 'user',
        content: `Suggest ${clipCount} creative and engaging titles for clips extracted from a video titled "${originalTitle}". Return only the titles, one per line.`
      }
    ];

    const response = await this.chat(messages);
    return response.split('\n').filter(title => title.trim()).slice(0, clipCount);
  }

  async analyzeVideoContent(transcript, duration) {
    const messages = [
      {
        role: 'system',
        content: 'You are a video content analyzer that identifies the best moments for creating clips based on transcript and timing.'
      },
      {
        role: 'user',
        content: `Analyze this video transcript and suggest the best 3-5 moments for creating clips. Video duration: ${duration} seconds.\n\nTranscript: ${transcript}`
      }
    ];

    return this.chat(messages);
  }
}

module.exports = new OpenAIService();
