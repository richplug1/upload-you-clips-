// Google OAuth Configuration
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const database = require('../models/database');
const authService = require('./authService');

class GoogleOAuthService {
  constructor() {
    this.isConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    
    if (this.isConfigured) {
      this.initializePassport();
    } else {
      console.log('Google OAuth not configured - environment variables missing');
    }
  }

  initializePassport() {
    // Only initialize if credentials are available
    if (!this.isConfigured) {
      console.warn('Cannot initialize Google OAuth - missing credentials');
      return;
    }
    // Configure Google OAuth Strategy
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google OAuth Profile:', {
          id: profile.id,
          email: profile.emails?.[0]?.value,
          name: profile.displayName
        });

        // Check if user exists with this Google ID
        let user = await database.getUserByGoogleId(profile.id);
        
        if (user) {
          // User exists, update last login
          await database.updateUserLastLogin(user.id);
          return done(null, user);
        }

        // Check if user exists with this email
        const email = profile.emails?.[0]?.value;
        if (email) {
          user = await database.getUserByEmail(email);
          
          if (user) {
            // Link Google account to existing user
            await database.linkGoogleAccount(user.id, profile.id);
            await database.updateUserLastLogin(user.id);
            return done(null, user);
          }
        }

        // Create new user
        user = await database.createUser({
          email: email || `${profile.id}@google.oauth`,
          name: profile.displayName || 'Google User',
          password_hash: null, // OAuth users don't have passwords
          google_id: profile.id,
          avatar_url: profile.photos?.[0]?.value,
          subscription_type: 'free'
        });

        return done(null, user);
      } catch (error) {
        console.error('Google OAuth Error:', error);
        return done(error, null);
      }
    }));

    // Serialize user for session
    passport.serializeUser((user, done) => {
      done(null, user.id);
    });

    // Deserialize user from session
    passport.deserializeUser(async (id, done) => {
      try {
        const user = await database.getUserById(id);
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    });
  }

  // Generate auth URL for frontend
  getAuthUrl() {
    if (!this.isConfigured) {
      throw new Error('Google OAuth not configured');
    }
    
    const scopes = ['openid', 'email', 'profile'];
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/auth/google/callback",
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/oauth/v2/auth?${params.toString()}`;
  }

  // Handle OAuth callback
  async handleCallback(code) {
    if (!this.isConfigured) {
      throw new Error('Google OAuth not configured');
    }
    
    try {
      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/auth/google/callback",
          grant_type: 'authorization_code',
        }),
      });

      const tokens = await tokenResponse.json();

      if (!tokens.access_token) {
        throw new Error('Failed to get access token');
      }

      // Get user profile
      const profileResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`);
      const profile = await profileResponse.json();

      // Same logic as passport strategy
      let user = await database.getUserByGoogleId(profile.id);
      
      if (!user && profile.email) {
        user = await database.getUserByEmail(profile.email);
        if (user) {
          await database.linkGoogleAccount(user.id, profile.id);
        }
      }

      if (!user) {
        user = await database.createUser({
          email: profile.email || `${profile.id}@google.oauth`,
          name: profile.name || 'Google User',
          password_hash: null,
          google_id: profile.id,
          avatar_url: profile.picture,
          subscription_type: 'free'
        });
      }

      await database.updateUserLastLogin(user.id);

      // Generate JWT token for our app
      const token = authService.generateToken(user);

      return {
        user: authService.sanitizeUser(user),
        token
      };

    } catch (error) {
      console.error('OAuth callback error:', error);
      throw error;
    }
  }

  // Check if Google OAuth is properly configured
  isOAuthConfigured() {
    return this.isConfigured;
  }
}

module.exports = new GoogleOAuthService();
