const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

class Database {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const dbPath = path.join(__dirname, '../data/app.db');
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          this.createTables().then(() => {
            this.isInitialized = true;
            resolve();
          }).catch(reject);
        }
      });
    });
  }

  async createTables() {
    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        google_id TEXT UNIQUE,
        name TEXT NOT NULL,
        avatar_url TEXT,
        subscription_type TEXT DEFAULT 'free',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        is_active BOOLEAN DEFAULT 1
      )`,

      // Subscriptions table
      `CREATE TABLE IF NOT EXISTS subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        plan_id TEXT NOT NULL DEFAULT 'free',
        status TEXT NOT NULL DEFAULT 'active',
        credits_remaining INTEGER DEFAULT 10,
        monthly_limit INTEGER DEFAULT 10,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        auto_renew BOOLEAN DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,

      // Credits table for tracking usage
      `CREATE TABLE IF NOT EXISTS credits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        total_credits INTEGER DEFAULT 0,
        used_credits INTEGER DEFAULT 0,
        remaining_credits INTEGER DEFAULT 0,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,

      // Credit transactions table
      `CREATE TABLE IF NOT EXISTS credit_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        transaction_type TEXT NOT NULL, -- 'earned', 'spent', 'purchased', 'bonus'
        amount INTEGER NOT NULL,
        description TEXT,
        video_id INTEGER,
        clips_generated INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,

      // Jobs table for video processing
      `CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        input_file TEXT NOT NULL,
        output_files TEXT,
        settings TEXT,
        progress INTEGER DEFAULT 0,
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,

      // Generated clips table
      `CREATE TABLE IF NOT EXISTS clips (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        duration REAL,
        size INTEGER,
        thumbnail_url TEXT,
        metadata TEXT,
        is_archived BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        FOREIGN KEY (job_id) REFERENCES jobs (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,

      // User sessions for JWT management
      `CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token_hash TEXT NOT NULL,
        device_info TEXT,
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,

      // Analytics and activity tracking
      `CREATE TABLE IF NOT EXISTS user_activity (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        resource_type TEXT,
        resource_id TEXT,
        metadata TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,

      // Error logs table
      `CREATE TABLE IF NOT EXISTS error_logs (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        severity TEXT NOT NULL,
        message TEXT NOT NULL,
        stack TEXT,
        context TEXT,
        user_id INTEGER,
        session_id TEXT,
        ip_address TEXT,
        user_agent TEXT,
        url TEXT,
        method TEXT,
        recoverable BOOLEAN DEFAULT 1,
        retryable BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,

      // Application metrics table
      `CREATE TABLE IF NOT EXISTS app_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        metric_name TEXT NOT NULL,
        metric_value REAL NOT NULL,
        metric_type TEXT NOT NULL, -- 'counter', 'gauge', 'histogram'
        tags TEXT, -- JSON string of tags
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // System settings
      `CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        description TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const table of tables) {
      await this.run(table);
    }

    // Insert default system settings
    await this.insertDefaultSettings();
  }

  async insertDefaultSettings() {
    const defaultSettings = [
      ['max_file_size', '100000000', 'Maximum file size in bytes (100MB)'],
      ['max_clip_duration', '3600', 'Maximum clip duration in seconds (1 hour)'],
      ['clip_retention_days', '30', 'Days to keep clips before archiving'],
      ['max_clips_per_user', '50', 'Maximum clips per user'],
      ['rate_limit_uploads', '10', 'Uploads per hour limit'],
      ['rate_limit_api', '100', 'API calls per hour limit']
    ];

    for (const [key, value, description] of defaultSettings) {
      await this.run(
        'INSERT OR IGNORE INTO system_settings (key, value, description) VALUES (?, ?, ?)',
        [key, value, description]
      );
    }
  }

  // Wrapper methods for database operations
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // User management methods
  async createUser(userData) {
    const { email, password, googleId, name, avatarUrl } = userData;
    let passwordHash = null;

    if (password) {
      passwordHash = await bcrypt.hash(password, 12);
    }

    const result = await this.run(
      `INSERT INTO users (email, password_hash, google_id, name, avatar_url) 
       VALUES (?, ?, ?, ?, ?)`,
      [email, passwordHash, googleId, name, avatarUrl]
    );

    return this.get('SELECT * FROM users WHERE id = ?', [result.id]);
  }

  async getUserByEmail(email) {
    return this.get('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);
  }

  async getUserById(id) {
    return this.get('SELECT * FROM users WHERE id = ? AND is_active = 1', [id]);
  }

  async updateUserLastLogin(userId) {
    return this.run(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [userId]
    );
  }

  // Job management methods
  async createJob(jobData) {
    const { id, userId, inputFile, settings } = jobData;
    return this.run(
      `INSERT INTO jobs (id, user_id, input_file, settings) 
       VALUES (?, ?, ?, ?)`,
      [id, userId, inputFile, JSON.stringify(settings)]
    );
  }

  async updateJob(jobId, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(jobId);

    return this.run(
      `UPDATE jobs SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
  }

  async getJobsByUser(userId, limit = 50) {
    return this.all(
      'SELECT * FROM jobs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, limit]
    );
  }

  // Clip management methods
  async createClip(clipData) {
    const { id, jobId, userId, filename, duration, size, thumbnailUrl, metadata } = clipData;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    return this.run(
      `INSERT INTO clips (id, job_id, user_id, filename, duration, size, thumbnail_url, metadata, expires_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, jobId, userId, filename, duration, size, thumbnailUrl, JSON.stringify(metadata), expiresAt.toISOString()]
    );
  }

  async getClipsByUser(userId, includeArchived = false) {
    const sql = includeArchived 
      ? 'SELECT * FROM clips WHERE user_id = ? ORDER BY created_at DESC'
      : 'SELECT * FROM clips WHERE user_id = ? AND is_archived = 0 ORDER BY created_at DESC';
    
    return this.all(sql, [userId]);
  }

  async archiveExpiredClips() {
    return this.run(
      'UPDATE clips SET is_archived = 1 WHERE expires_at < CURRENT_TIMESTAMP AND is_archived = 0'
    );
  }

  async deleteClip(clipId, userId) {
    return this.run(
      'DELETE FROM clips WHERE id = ? AND user_id = ?',
      [clipId, userId]
    );
  }

  // Analytics methods
  async logActivity(activityData) {
    const { userId, action, resourceType, resourceId, metadata, ipAddress, userAgent } = activityData;
    
    return this.run(
      `INSERT INTO user_activity (user_id, action, resource_type, resource_id, metadata, ip_address, user_agent) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, action, resourceType, resourceId, JSON.stringify(metadata), ipAddress, userAgent]
    );
  }

  async getUserStats(userId) {
    const stats = await this.get(`
      SELECT 
        COUNT(CASE WHEN j.status = 'completed' THEN 1 END) as completed_jobs,
        COUNT(CASE WHEN j.status = 'failed' THEN 1 END) as failed_jobs,
        COUNT(c.id) as total_clips,
        SUM(c.duration) as total_duration,
        SUM(c.size) as total_size
      FROM users u
      LEFT JOIN jobs j ON u.id = j.user_id
      LEFT JOIN clips c ON u.id = c.user_id AND c.is_archived = 0
      WHERE u.id = ?
    `, [userId]);

    return stats;
  }

  // Error logging
  async logError(errorData) {
    return await this.run(
      `INSERT INTO error_logs (
        id, type, severity, message, stack, context, user_id, session_id,
        ip_address, user_agent, url, method, recoverable, retryable, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        errorData.id,
        errorData.type,
        errorData.severity,
        errorData.message,
        errorData.stack,
        errorData.context,
        errorData.user_id,
        errorData.session_id,
        errorData.ip_address,
        errorData.user_agent,
        errorData.url,
        errorData.method,
        errorData.recoverable,
        errorData.retryable,
        errorData.created_at
      ]
    );
  }

  async getErrorLogs(options = {}) {
    const {
      limit = 100,
      offset = 0,
      severity = null,
      type = null,
      userId = null,
      startDate = null,
      endDate = null
    } = options;

    let sql = `
      SELECT el.*, u.email as user_email
      FROM error_logs el
      LEFT JOIN users u ON el.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (severity) {
      sql += ' AND el.severity = ?';
      params.push(severity);
    }

    if (type) {
      sql += ' AND el.type = ?';
      params.push(type);
    }

    if (userId) {
      sql += ' AND el.user_id = ?';
      params.push(userId);
    }

    if (startDate) {
      sql += ' AND el.created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      sql += ' AND el.created_at <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY el.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return await this.all(sql, params);
  }

  async getErrorStats(days = 7) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    return await this.all(`
      SELECT 
        type,
        severity,
        COUNT(*) as count,
        DATE(created_at) as date
      FROM error_logs 
      WHERE created_at >= ?
      GROUP BY type, severity, DATE(created_at)
      ORDER BY date DESC, count DESC
    `, [startDate]);
  }

  async getTopErrors(days = 7, limit = 10) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    return await this.all(`
      SELECT 
        message,
        type,
        severity,
        COUNT(*) as occurrence_count,
        MAX(created_at) as last_occurrence
      FROM error_logs 
      WHERE created_at >= ?
      GROUP BY message, type, severity
      ORDER BY occurrence_count DESC, last_occurrence DESC
      LIMIT ?
    `, [startDate, limit]);
  }

  async cleanupOldErrors(daysToKeep = 30) {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString();
    return await this.run(
      'DELETE FROM error_logs WHERE created_at < ? AND severity != "critical"',
      [cutoffDate]
    );
  }

  // Application metrics methods
  async recordMetric(name, value, type = 'gauge', tags = {}) {
    return await this.run(
      'INSERT INTO app_metrics (metric_name, metric_value, metric_type, tags) VALUES (?, ?, ?, ?)',
      [name, value, type, JSON.stringify(tags)]
    );
  }

  async getMetrics(metricName, startDate = null, endDate = null, limit = 1000) {
    let sql = 'SELECT * FROM app_metrics WHERE metric_name = ?';
    const params = [metricName];

    if (startDate) {
      sql += ' AND created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      sql += ' AND created_at <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    return await this.all(sql, params);
  }

  async cleanupOldMetrics(daysToKeep = 90) {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString();
    return await this.run(
      'DELETE FROM app_metrics WHERE created_at < ?',
      [cutoffDate]
    );
  }

  // Subscription management methods
  async getUserSubscription(userId) {
    return this.get(
      'SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
  }

  async updateUserSubscription(userId, subscriptionData) {
    const { plan, status, credits_remaining, monthly_limit, expires_at } = subscriptionData;
    
    // Check if subscription exists
    const existing = await this.getUserSubscription(userId);
    
    if (existing) {
      // Update existing subscription
      await this.run(
        `UPDATE subscriptions SET 
         plan_id = ?, status = ?, credits_remaining = ?, 
         monthly_limit = ?, expires_at = ?, last_updated = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [plan, status, credits_remaining, monthly_limit, expires_at, userId]
      );
    } else {
      // Create new subscription
      await this.run(
        `INSERT INTO subscriptions (user_id, plan_id, status, credits_remaining, monthly_limit, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, plan, status, credits_remaining, monthly_limit, expires_at]
      );
    }

    // Update or create credits record
    await this.updateUserCredits(userId, credits_remaining);
    
    return this.getUserSubscription(userId);
  }

  async getUserCredits(userId) {
    let credits = await this.get('SELECT * FROM credits WHERE user_id = ?', [userId]);
    
    if (!credits) {
      // Create default credits record for new user
      await this.run(
        'INSERT INTO credits (user_id, total_credits, used_credits, remaining_credits) VALUES (?, 10, 0, 10)',
        [userId]
      );
      credits = await this.get('SELECT * FROM credits WHERE user_id = ?', [userId]);
    }
    
    return credits;
  }

  async updateUserCredits(userId, totalCredits) {
    const existing = await this.getUserCredits(userId);
    const remainingCredits = totalCredits - existing.used_credits;
    
    await this.run(
      `UPDATE credits SET 
       total_credits = ?, remaining_credits = ?, last_updated = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [totalCredits, Math.max(0, remainingCredits), userId]
    );
    
    return this.getUserCredits(userId);
  }

  async addUserCredits(userId, creditsToAdd) {
    const existing = await this.getUserCredits(userId);
    const newTotal = existing.total_credits + creditsToAdd;
    const newRemaining = existing.remaining_credits + creditsToAdd;
    
    await this.run(
      `UPDATE credits SET 
       total_credits = ?, remaining_credits = ?, last_updated = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [newTotal, newRemaining, userId]
    );

    // Record transaction
    await this.recordCreditTransaction(userId, 'purchased', creditsToAdd, 'Credits purchased');
    
    return this.getUserCredits(userId);
  }

  async deductUserCredits(userId, creditsToDeduct, metadata = {}) {
    const existing = await this.getUserCredits(userId);
    
    if (existing.remaining_credits < creditsToDeduct) {
      throw new Error('Insufficient credits');
    }
    
    const newUsed = existing.used_credits + creditsToDeduct;
    const newRemaining = existing.remaining_credits - creditsToDeduct;
    
    await this.run(
      `UPDATE credits SET 
       used_credits = ?, remaining_credits = ?, last_updated = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [newUsed, newRemaining, userId]
    );

    // Record transaction
    const description = `Credits used for video processing (${metadata.clips_generated || 0} clips)`;
    await this.recordCreditTransaction(userId, 'spent', creditsToDeduct, description, metadata.video_id, metadata.clips_generated);
    
    return this.getUserCredits(userId);
  }

  async recordCreditTransaction(userId, type, amount, description, videoId = null, clipsGenerated = null) {
    return this.run(
      `INSERT INTO credit_transactions 
       (user_id, transaction_type, amount, description, video_id, clips_generated)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, type, amount, description, videoId, clipsGenerated]
    );
  }

  async getCreditUsageHistory(userId, limit = 50, offset = 0) {
    return this.all(
      `SELECT * FROM credit_transactions 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
  }

  async resetMonthlyCredits() {
    // Reset credits for all active subscriptions at the start of each month
    const subscriptions = await this.all(
      'SELECT * FROM subscriptions WHERE status = "active" AND expires_at > CURRENT_TIMESTAMP'
    );

    for (const subscription of subscriptions) {
      await this.run(
        `UPDATE subscriptions SET 
         credits_remaining = monthly_limit,
         last_updated = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [subscription.id]
      );

      await this.run(
        `UPDATE credits SET 
         remaining_credits = ?, 
         last_updated = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [subscription.monthly_limit, subscription.user_id]
      );

      // Record monthly credit refresh
      await this.recordCreditTransaction(
        subscription.user_id, 
        'earned', 
        subscription.monthly_limit, 
        'Monthly credit refresh'
      );
    }
  }

  // Cleanup methods
  async cleanupExpiredSessions() {
    return this.run('DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP');
  }

  async cleanupOldLogs(daysToKeep = 90) {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    return this.run(
      'DELETE FROM user_activity WHERE created_at < ?',
      [cutoffDate.toISOString()]
    );
  }

  // Google OAuth methods
  async getUserByGoogleId(googleId) {
    return await this.get(
      'SELECT * FROM users WHERE google_id = ? AND is_active = 1',
      [googleId]
    );
  }

  async linkGoogleAccount(userId, googleId) {
    return await this.run(
      'UPDATE users SET google_id = ? WHERE id = ?',
      [googleId, userId]
    );
  }

  async updateUserLastLogin(userId) {
    return await this.run(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [userId]
    );
  }

  close() {
    return new Promise((resolve) => {
      this.db.close((err) => {
        if (err) console.error('Error closing database:', err);
        else console.log('Database connection closed');
        resolve();
      });
    });
  }
}

// Export a singleton instance
const database = new Database();
module.exports = database;
