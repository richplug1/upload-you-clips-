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

      // Error logs
      `CREATE TABLE IF NOT EXISTS error_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        error_type TEXT NOT NULL,
        error_message TEXT NOT NULL,
        stack_trace TEXT,
        url TEXT,
        user_agent TEXT,
        ip_address TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
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
    const { userId, errorType, errorMessage, stackTrace, url, userAgent, ipAddress, metadata } = errorData;
    
    return this.run(
      `INSERT INTO error_logs (user_id, error_type, error_message, stack_trace, url, user_agent, ip_address, metadata) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, errorType, errorMessage, stackTrace, url, userAgent, ipAddress, JSON.stringify(metadata)]
    );
  }

  // System settings
  async getSetting(key) {
    const setting = await this.get('SELECT value FROM system_settings WHERE key = ?', [key]);
    return setting ? setting.value : null;
  }

  async setSetting(key, value, description = null) {
    return this.run(
      `INSERT OR REPLACE INTO system_settings (key, value, description, updated_at) 
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      [key, value, description]
    );
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
