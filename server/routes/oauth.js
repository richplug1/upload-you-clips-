const express = require('express');
const googleOAuthService = require('../services/googleOAuthService');
const validation = require('../services/validation');
const logger = require('../services/logger');

const router = express.Router();

// Get Google OAuth URL
router.get('/google/url', validation.asyncHandler(async (req, res) => {
  try {
    if (!googleOAuthService.isOAuthConfigured()) {
      return res.status(503).json({
        error: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.',
        configured: false
      });
    }
    
    const authUrl = googleOAuthService.getAuthUrl();
    
    res.json({
      success: true,
      authUrl,
      message: 'Google OAuth URL generated successfully'
    });
  } catch (error) {
    logger.error('Failed to generate Google OAuth URL', { error: error.message });
    res.status(500).json({
      error: 'Failed to generate authentication URL'
    });
  }
}));

// Handle Google OAuth callback
router.get('/google/callback', validation.asyncHandler(async (req, res) => {
  try {
    if (!googleOAuthService.isOAuthConfigured()) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}?error=${encodeURIComponent('Google OAuth not configured')}`);
    }
    
    const { code, error, error_description } = req.query;

    // Check for OAuth errors
    if (error) {
      logger.error('Google OAuth error', { error, error_description });
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?error=${encodeURIComponent(error_description || error)}`);
    }

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?error=${encodeURIComponent('No authorization code received')}`);
    }

    // Exchange code for user data and JWT token
    const result = await googleOAuthService.handleCallback(code);

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/auth/callback?token=${result.token}&user=${encodeURIComponent(JSON.stringify(result.user))}`;
    
    logger.info('Google OAuth successful', { 
      userId: result.user.id, 
      email: result.user.email 
    });

    res.redirect(redirectUrl);

  } catch (error) {
    logger.error('Google OAuth callback failed', { error: error.message });
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}?error=${encodeURIComponent('Authentication failed')}`);
  }
}));

// Manual OAuth flow (for testing or alternative implementation)
router.post('/google/authenticate', validation.asyncHandler(async (req, res) => {
  try {
    if (!googleOAuthService.isOAuthConfigured()) {
      return res.status(503).json({
        error: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.',
        configured: false
      });
    }
    
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        error: 'Authorization code is required'
      });
    }

    const result = await googleOAuthService.handleCallback(code);

    res.json({
      success: true,
      user: result.user,
      token: result.token,
      message: 'Google authentication successful'
    });

  } catch (error) {
    logger.error('Google manual authentication failed', { error: error.message });
    res.status(400).json({
      error: error.message || 'Google authentication failed'
    });
  }
}));

module.exports = router;
