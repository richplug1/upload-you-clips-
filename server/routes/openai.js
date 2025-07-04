const express = require('express');
const router = express.Router();
const openaiService = require('../services/openaiService');
const { authenticateToken } = require('../services/authService');

// Generate video description
router.post('/generate-description', authenticateToken, async (req, res) => {
  try {
    const { videoTitle, tags } = req.body;
    
    if (!videoTitle) {
      return res.status(400).json({ error: 'Video title is required' });
    }

    const description = await openaiService.generateVideoDescription(videoTitle, tags);
    
    res.json({ description });
  } catch (error) {
    console.error('Generate description error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Suggest clip titles
router.post('/suggest-titles', authenticateToken, async (req, res) => {
  try {
    const { originalTitle, clipCount = 3 } = req.body;
    
    if (!originalTitle) {
      return res.status(400).json({ error: 'Original title is required' });
    }

    const titles = await openaiService.suggestClipTitles(originalTitle, clipCount);
    
    res.json({ titles });
  } catch (error) {
    console.error('Suggest titles error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Analyze video content
router.post('/analyze-content', authenticateToken, async (req, res) => {
  try {
    const { transcript, duration } = req.body;
    
    if (!transcript || !duration) {
      return res.status(400).json({ error: 'Transcript and duration are required' });
    }

    const analysis = await openaiService.analyzeVideoContent(transcript, duration);
    
    res.json({ analysis });
  } catch (error) {
    console.error('Analyze content error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check OpenAI service status
router.get('/status', (req, res) => {
  res.json({ 
    available: openaiService.isConfigured,
    message: openaiService.isConfigured ? 'OpenAI service is available' : 'OpenAI API key not configured'
  });
});

// Generate text with OpenAI
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { prompt, maxTokens = 150 } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await openaiService.generateText(prompt, { max_tokens: maxTokens });
    
    res.json({ 
      success: true,
      response,
      tokens_used: response.usage?.total_tokens || 0
    });
  } catch (error) {
    console.error('Generate text error:', error);
    res.status(500).json({ 
      error: error.message,
      success: false
    });
  }
});

// Test endpoint without authentication
router.get('/test', async (req, res) => {
  try {
    res.json({ 
      success: true,
      message: 'OpenAI endpoint is working',
      timestamp: new Date().toISOString(),
      openai_configured: !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here'
    });
  } catch (error) {
    console.error('OpenAI test error:', error);
    res.status(500).json({ 
      error: error.message,
      success: false
    });
  }
});

module.exports = router;
