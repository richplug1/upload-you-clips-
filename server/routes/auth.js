const express = require('express');
const authService = require('../services/authService');
const validation = require('../services/validation');
const logger = require('../services/logger');
const database = require('../models/database');

const router = express.Router();

// Register new user
router.post('/register', 
  validation.authLimiter,
  validation.validateRegister,
  validation.asyncHandler(async (req, res) => {
    try {
      const { email, password, name } = req.body;
      const deviceInfo = req.get('User-Agent');
      const ipAddress = req.ip;

      const result = await authService.registerUser({
        email,
        password,
        name,
        deviceInfo,
        ipAddress
      });

      logger.logAuth('register', result.user.id, email, true, null, req);
      
      res.status(201).json({
        message: 'User registered successfully',
        user: result.user,
        token: result.token
      });

    } catch (error) {
      logger.logAuth('register', null, req.body.email, false, error.message, req);
      
      if (error.message === 'User already exists with this email') {
        return res.status(409).json({ error: error.message });
      }
      
      logger.error('Registration error', { 
        error: error.message, 
        email: req.body.email,
        ip: req.ip 
      });
      
      res.status(500).json({ error: 'Registration failed' });
    }
  })
);

// Login user
router.post('/login',
  validation.authLimiter,
  validation.validateLogin,
  validation.asyncHandler(async (req, res) => {
    try {
      const { email, password } = req.body;
      const deviceInfo = req.get('User-Agent');
      const ipAddress = req.ip;

      const result = await authService.loginUser({
        email,
        password,
        deviceInfo,
        ipAddress
      });

      logger.logAuth('login', result.user.id, email, true, null, req);
      
      res.json({
        message: 'Login successful',
        user: result.user,
        token: result.token
      });

    } catch (error) {
      logger.logAuth('login', null, req.body.email, false, error.message, req);
      
      res.status(401).json({ error: error.message });
    }
  })
);

// Google OAuth
router.post('/google',
  validation.authLimiter,
  validation.asyncHandler(async (req, res) => {
    try {
      const { googleToken, googleId, email, name, avatarUrl } = req.body;
      const deviceInfo = req.get('User-Agent');
      const ipAddress = req.ip;

      // In a real app, you would verify the Google token here
      // For now, we'll assume the token is valid

      const result = await authService.googleAuth({
        googleId,
        email,
        name,
        avatarUrl,
        deviceInfo,
        ipAddress
      });

      logger.logAuth('google_login', result.user.id, email, true, null, req);
      
      res.json({
        message: 'Google authentication successful',
        user: result.user,
        token: result.token
      });

    } catch (error) {
      logger.logAuth('google_login', null, req.body.email, false, error.message, req);
      
      res.status(401).json({ error: error.message });
    }
  })
);

// Logout
router.post('/logout',
  authService.authenticateToken.bind(authService),
  validation.asyncHandler(async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      await authService.logoutUser(token);

      logger.logAuth('logout', req.user.id, req.user.email, true, null, req);
      
      res.json({ message: 'Logout successful' });

    } catch (error) {
      logger.error('Logout error', { 
        error: error.message, 
        userId: req.user?.id 
      });
      
      res.status(500).json({ error: 'Logout failed' });
    }
  })
);

// Logout all sessions
router.post('/logout-all',
  authService.authenticateToken.bind(authService),
  validation.asyncHandler(async (req, res) => {
    try {
      await authService.logoutAllSessions(req.user.id);

      logger.logAuth('logout_all', req.user.id, req.user.email, true, null, req);
      
      res.json({ message: 'Logged out from all devices' });

    } catch (error) {
      logger.error('Logout all error', { 
        error: error.message, 
        userId: req.user?.id 
      });
      
      res.status(500).json({ error: 'Logout failed' });
    }
  })
);

// Change password
router.post('/change-password',
  authService.authenticateToken.bind(authService),
  validation.validatePasswordChange,
  validation.asyncHandler(async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      await authService.changePassword(req.user.id, currentPassword, newPassword);

      logger.logAuth('password_change', req.user.id, req.user.email, true, null, req);
      
      res.json({ message: 'Password changed successfully' });

    } catch (error) {
      logger.logAuth('password_change', req.user.id, req.user.email, false, error.message, req);
      
      if (error.message === 'Current password is incorrect') {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Password change failed' });
    }
  })
);

// Request password reset
router.post('/forgot-password',
  validation.authLimiter,
  validation.asyncHandler(async (req, res) => {
    try {
      const { email } = req.body;
      
      const result = await authService.requestPasswordReset(email);
      
      res.json(result);

    } catch (error) {
      logger.error('Password reset request error', { 
        error: error.message, 
        email: req.body.email 
      });
      
      res.status(500).json({ error: 'Password reset request failed' });
    }
  })
);

// Reset password with token
router.post('/reset-password',
  validation.authLimiter,
  validation.asyncHandler(async (req, res) => {
    try {
      const { resetToken, newPassword } = req.body;
      
      await authService.resetPassword(resetToken, newPassword);
      
      res.json({ message: 'Password reset successful' });

    } catch (error) {
      if (error.message === 'Invalid or expired reset token') {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Password reset failed' });
    }
  })
);

// Verify token (for client-side validation)
router.get('/verify',
  authService.authenticateToken.bind(authService),
  validation.asyncHandler(async (req, res) => {
    res.json({
      valid: true,
      user: req.user
    });
  })
);

// Get user profile
router.get('/profile',
  authService.authenticateToken.bind(authService),
  validation.asyncHandler(async (req, res) => {
    try {
      const user = await database.getUserById(req.user.id);
      const stats = await database.getUserStats(req.user.id);
      
      res.json({
        user: authService.sanitizeUser(user),
        stats
      });

    } catch (error) {
      logger.error('Get profile error', { 
        error: error.message, 
        userId: req.user.id 
      });
      
      res.status(500).json({ error: 'Failed to get profile' });
    }
  })
);

// Update user profile
router.put('/profile',
  authService.authenticateToken.bind(authService),
  validation.validateUserSettings,
  validation.logActivity('profile_update', 'user'),
  validation.asyncHandler(async (req, res) => {
    try {
      const { name, email, preferences } = req.body;
      const updateData = {};
      
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (preferences) updateData.preferences = JSON.stringify(preferences);
      
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }
      
      // Check if email is already taken
      if (email && email !== req.user.email) {
        const existingUser = await database.getUserByEmail(email);
        if (existingUser && existingUser.id !== req.user.id) {
          return res.status(409).json({ error: 'Email is already taken' });
        }
      }
      
      const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updateData);
      values.push(req.user.id);
      
      await database.run(
        `UPDATE users SET ${fields} WHERE id = ?`,
        values
      );
      
      const updatedUser = await database.getUserById(req.user.id);
      
      res.json({
        message: 'Profile updated successfully',
        user: authService.sanitizeUser(updatedUser)
      });

    } catch (error) {
      logger.error('Update profile error', { 
        error: error.message, 
        userId: req.user.id 
      });
      
      res.status(500).json({ error: 'Failed to update profile' });
    }
  })
);

module.exports = router;
