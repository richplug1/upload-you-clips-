const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const database = require('../models/database');
const errorHandler = require('./errorHandler');

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
  }

  // Generate JWT token
  generateToken(user) {
    return jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        name: user.name,
        subscriptionType: user.subscription_type
      },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn }
    );
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw errorHandler.createError(
        errorHandler.errorTypes.AUTHENTICATION,
        'Invalid or expired token',
        {
          severity: errorHandler.severityLevels.MEDIUM,
          context: { tokenVerification: true },
          userMessage: 'Votre session a expiré. Veuillez vous reconnecter.'
        }
      );
    }
  }

  // Register new user with email/password
  async registerUser(userData) {
    try {
      const { email, password, name } = userData;

      // Check if user already exists
      const existingUser = await database.getUserByEmail(email);
      if (existingUser) {
        throw errorHandler.createError(
          errorHandler.errorTypes.VALIDATION,
          'User already exists with this email',
          {
            severity: errorHandler.severityLevels.LOW,
            context: { email, registration: true },
            userMessage: 'Un utilisateur avec cette adresse email existe déjà.'
          }
        );
      }

      // Create new user
      const user = await database.createUser({
        email,
        password,
        name,
        googleId: null,
        avatarUrl: null
      });

      // Generate token
      const token = this.generateToken(user);

      // Store session
      await this.createSession(user.id, token, userData.deviceInfo, userData.ipAddress);

      return {
        user: this.sanitizeUser(user),
        token
      };
    } catch (error) {
      if (error.isAppError) {
        throw error;
      }
      
      throw errorHandler.createError(
        errorHandler.errorTypes.AUTHENTICATION,
        `User registration failed: ${error.message}`,
        {
          severity: errorHandler.severityLevels.HIGH,
          context: { 
            email: userData.email,
            registration: true,
            originalError: error.message
          },
          userMessage: 'Échec de la création du compte. Veuillez réessayer.'
        }
      );
    }
  }

  // Login user with email/password
  async loginUser(credentials) {
    try {
      const { email, password, deviceInfo, ipAddress } = credentials;

      // Get user by email
      const user = await database.getUserByEmail(email);
      if (!user) {
        throw errorHandler.createError(
          errorHandler.errorTypes.AUTHENTICATION,
          'Invalid credentials',
          {
            severity: errorHandler.severityLevels.LOW,
            context: { email, login: true },
            userMessage: 'Identifiants invalides.'
          }
        );
      }

      // Check password
      if (!user.password_hash) {
        throw errorHandler.createError(
          errorHandler.errorTypes.AUTHENTICATION,
          'Please login with Google or reset your password',
          {
            severity: errorHandler.severityLevels.LOW,
            context: { email, googleAccount: true },
            userMessage: 'Veuillez vous connecter avec Google ou réinitialiser votre mot de passe.'
          }
        );
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        throw errorHandler.createError(
          errorHandler.errorTypes.AUTHENTICATION,
          'Invalid credentials',
          {
            severity: errorHandler.severityLevels.LOW,
            context: { email, invalidPassword: true },
            userMessage: 'Identifiants invalides.'
          }
        );
      }

      // Update last login
      await database.updateUserLastLogin(user.id);

      // Generate token
      const token = this.generateToken(user);

      // Store session
      await this.createSession(user.id, token, deviceInfo, ipAddress);

      return {
        user: this.sanitizeUser(user),
        token
      };
    } catch (error) {
      if (error.isAppError) {
        throw error;
      }
      
      throw errorHandler.createError(
        errorHandler.errorTypes.AUTHENTICATION,
        `Login failed: ${error.message}`,
        {
          severity: errorHandler.severityLevels.HIGH,
          context: { 
            email: credentials.email,
            login: true,
            originalError: error.message
          },
          userMessage: 'Échec de la connexion. Veuillez réessayer.'
        }
      );
    }
  }

  // Google OAuth login/register
  async googleAuth(googleUserData) {
    const { googleId, email, name, avatarUrl, deviceInfo, ipAddress } = googleUserData;

    // Check if user exists with Google ID
    let user = await database.get('SELECT * FROM users WHERE google_id = ?', [googleId]);
    
    if (!user) {
      // Check if user exists with email
      user = await database.getUserByEmail(email);
      
      if (user) {
        // Link Google account to existing user
        await database.run(
          'UPDATE users SET google_id = ?, avatar_url = ? WHERE id = ?',
          [googleId, avatarUrl, user.id]
        );
        user.google_id = googleId;
        user.avatar_url = avatarUrl;
      } else {
        // Create new user
        user = await database.createUser({
          email,
          password: null,
          googleId,
          name,
          avatarUrl
        });
      }
    }

    // Update last login
    await database.updateUserLastLogin(user.id);

    // Generate token
    const token = this.generateToken(user);

    // Store session
    await this.createSession(user.id, token, deviceInfo, ipAddress);

    return {
      user: this.sanitizeUser(user),
      token
    };
  }

  // Create user session
  async createSession(userId, token, deviceInfo, ipAddress) {
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    return database.run(
      `INSERT INTO user_sessions (user_id, token_hash, device_info, ip_address, expires_at) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, tokenHash, deviceInfo, ipAddress, expiresAt.toISOString()]
    );
  }

  // Validate session
  async validateSession(token) {
    try {
      const decoded = this.verifyToken(token);
      const user = await database.getUserById(decoded.userId);
      
      if (!user) {
        throw errorHandler.createError(
          errorHandler.errorTypes.AUTHENTICATION,
          'User not found',
          {
            severity: errorHandler.severityLevels.MEDIUM,
            context: { sessionValidation: true, userId: decoded.userId },
            userMessage: 'Session invalide. Veuillez vous reconnecter.'
          }
        );
      }

      return {
        user: this.sanitizeUser(user),
        decoded
      };
    } catch (error) {
      if (error.isAppError) {
        throw error;
      }
      
      throw errorHandler.createError(
        errorHandler.errorTypes.AUTHENTICATION,
        'Invalid session',
        {
          severity: errorHandler.severityLevels.MEDIUM,
          context: { sessionValidation: true, originalError: error.message },
          userMessage: 'Session invalide. Veuillez vous reconnecter.'
        }
      );
    }
  }

  // Logout user (invalidate session)
  async logoutUser(token) {
    try {
      const decoded = this.verifyToken(token);
      const tokenHash = await bcrypt.hash(token, 10);
      
      return database.run(
        'UPDATE user_sessions SET is_active = 0 WHERE user_id = ? AND token_hash = ?',
        [decoded.userId, tokenHash]
      );
    } catch (error) {
      // Token might be invalid, but we still want to attempt cleanup
      return true;
    }
  }

  // Logout all sessions for user
  async logoutAllSessions(userId) {
    return database.run(
      'UPDATE user_sessions SET is_active = 0 WHERE user_id = ?',
      [userId]
    );
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    const user = await database.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check current password
    if (user.password_hash) {
      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await database.run(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newPasswordHash, userId]
    );

    return true;
  }

  // Request password reset
  async requestPasswordReset(email) {
    const user = await database.getUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists
      return { success: true, message: 'If the email exists, a reset link has been sent' };
    }

    // Generate reset token
    const resetToken = uuidv4();
    const resetTokenHash = await bcrypt.hash(resetToken, 10);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token (you might want to create a separate table for this)
    await database.run(
      `INSERT INTO user_sessions (user_id, token_hash, device_info, ip_address, expires_at) 
       VALUES (?, ?, ?, ?, ?)`,
      [user.id, resetTokenHash, 'password_reset', 'system', expiresAt.toISOString()]
    );

    // In a real app, you would send an email here
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return { success: true, message: 'If the email exists, a reset link has been sent' };
  }

  // Reset password with token
  async resetPassword(resetToken, newPassword) {
    const resetTokenHash = await bcrypt.hash(resetToken, 10);
    
    const session = await database.get(
      `SELECT * FROM user_sessions 
       WHERE token_hash = ? AND device_info = 'password_reset' AND is_active = 1 AND expires_at > CURRENT_TIMESTAMP`,
      [resetTokenHash]
    );

    if (!session) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await database.run(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newPasswordHash, session.user_id]
    );

    // Invalidate reset token
    await database.run(
      'UPDATE user_sessions SET is_active = 0 WHERE id = ?',
      [session.id]
    );

    return true;
  }

  // Remove sensitive data from user object
  sanitizeUser(user) {
    const { password_hash, ...sanitized } = user;
    return sanitized;
  }

  // Middleware for protecting routes
  authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    this.validateSession(token)
      .then(({ user, decoded }) => {
        req.user = user;
        req.decoded = decoded;
        next();
      })
      .catch(error => {
        console.error('Token validation error:', error);
        res.status(403).json({ error: 'Invalid or expired token' });
      });
  }

  // Middleware for optional authentication
  optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    this.validateSession(token)
      .then(({ user, decoded }) => {
        req.user = user;
        req.decoded = decoded;
        next();
      })
      .catch(error => {
        // Invalid token, but continue without auth
        next();
      });
  }
}

module.exports = new AuthService();
