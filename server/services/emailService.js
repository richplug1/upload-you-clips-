const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');
const errorHandler = require('./errorHandler');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isEnabled = false;
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@uploadyouclips.com';
    this.templates = new Map();
    
    this.init();
  }

  async init() {
    try {
      // Check if email credentials are configured
      if (this.hasEmailConfig()) {
        await this.createTransporter();
        await this.loadEmailTemplates();
        this.isEnabled = true;
        
        logger.info('Email service initialized successfully', {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          secure: process.env.SMTP_SECURE === 'true'
        });
      } else {
        logger.warn('Email service not configured', {
          missingVars: this.getMissingVars()
        });
      }
    } catch (error) {
      const handledError = errorHandler.createError(
        errorHandler.errorTypes.EMAIL,
        `Failed to initialize email service: ${error.message}`,
        {
          severity: errorHandler.severityLevels.HIGH,
          context: {
            hasConfig: this.hasEmailConfig(),
            missingVars: this.getMissingVars(),
            host: process.env.SMTP_HOST
          },
          cause: error,
          retryable: true
        }
      );
      
      errorHandler.handleError(handledError);
      logger.error('Failed to initialize email service', { error: error.message });
    }
  }

  hasEmailConfig() {
    return process.env.SMTP_HOST && 
           process.env.SMTP_USER && 
           process.env.SMTP_PASS;
  }

  getMissingVars() {
    const missing = [];
    if (!process.env.SMTP_HOST) missing.push('SMTP_HOST');
    if (!process.env.SMTP_USER) missing.push('SMTP_USER');
    if (!process.env.SMTP_PASS) missing.push('SMTP_PASS');
    return missing;
  }

  async createTransporter() {
    const config = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };

    this.transporter = nodemailer.createTransporter(config);
    
    // Verify connection
    await this.transporter.verify();
  }

  async loadEmailTemplates() {
    const templatesDir = path.join(__dirname, '../templates/email');
    
    try {
      // Create templates directory if it doesn't exist
      await fs.mkdir(templatesDir, { recursive: true });
      
      // Load built-in templates
      await this.createBuiltInTemplates(templatesDir);
      
      // Load all template files
      const files = await fs.readdir(templatesDir);
      
      for (const file of files) {
        if (file.endsWith('.hbs') || file.endsWith('.handlebars')) {
          const templateName = path.basename(file, path.extname(file));
          const templatePath = path.join(templatesDir, file);
          const templateContent = await fs.readFile(templatePath, 'utf8');
          
          this.templates.set(templateName, handlebars.compile(templateContent));
        }
      }
      
      logger.info('Email templates loaded', { 
        count: this.templates.size,
        templates: Array.from(this.templates.keys())
      });
    } catch (error) {
      logger.warn('Failed to load email templates', { error: error.message });
    }
  }

  async createBuiltInTemplates(templatesDir) {
    const templates = {
      'welcome': {
        subject: 'Welcome to Upload You Clips!',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to Upload You Clips</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb;">Welcome to Upload You Clips, {{name}}!</h1>
            
            <p>Thank you for joining our video processing platform. We're excited to help you create amazing clips from your videos.</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Your Account Details:</h3>
              <ul>
                <li><strong>Plan:</strong> {{plan}}</li>
                <li><strong>Credits:</strong> {{credits}}</li>
                <li><strong>Email:</strong> {{email}}</li>
              </ul>
            </div>
            
            <p>Get started by uploading your first video and let our AI create amazing clips for you!</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{appUrl}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Start Creating Clips</a>
            </div>
            
            <p>If you have any questions, feel free to contact our support team.</p>
            
            <p>Best regards,<br>The Upload You Clips Team</p>
          </div>
        </body>
        </html>`
      },
      
      'processing-complete': {
        subject: 'Your video clips are ready!',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Your clips are ready</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #16a34a;">Your clips are ready! 🎬</h1>
            
            <p>Hi {{name}},</p>
            
            <p>Great news! Your video "{{videoName}}" has been processed successfully.</p>
            
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
              <h3>Processing Results:</h3>
              <ul>
                <li><strong>Clips Generated:</strong> {{clipsCount}}</li>
                <li><strong>Processing Time:</strong> {{processingTime}}</li>
                <li><strong>Credits Used:</strong> {{creditsUsed}}</li>
                <li><strong>Credits Remaining:</strong> {{creditsRemaining}}</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{viewUrl}}" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Your Clips</a>
            </div>
            
            <p>Your clips will be available for download for the next 30 days.</p>
            
            <p>Best regards,<br>The Upload You Clips Team</p>
          </div>
        </body>
        </html>`
      },
      
      'low-credits': {
        subject: 'Low credit balance - Time to recharge!',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Low credit balance</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #ea580c;">Low Credit Balance ⚠️</h1>
            
            <p>Hi {{name}},</p>
            
            <p>Your credit balance is running low. You currently have <strong>{{creditsRemaining}} credits</strong> remaining.</p>
            
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p><strong>Don't let your creativity stop!</strong></p>
              <p>Purchase more credits or upgrade your plan to continue creating amazing clips.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{buyCreditsUrl}}" style="background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">Buy Credits</a>
              <a href="{{upgradeUrl}}" style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Upgrade Plan</a>
            </div>
            
            <p>Questions? Our support team is here to help!</p>
            
            <p>Best regards,<br>The Upload You Clips Team</p>
          </div>
        </body>
        </html>`
      },
      
      'subscription-upgraded': {
        subject: 'Subscription upgraded successfully!',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Subscription upgraded</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #7c3aed;">Subscription Upgraded! 🚀</h1>
            
            <p>Hi {{name}},</p>
            
            <p>Congratulations! Your subscription has been successfully upgraded to the <strong>{{newPlan}}</strong> plan.</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Your New Benefits:</h3>
              <ul>
                {{#each features}}
                <li>{{this}}</li>
                {{/each}}
              </ul>
            </div>
            
            <div style="background: #ede9fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Updated Account:</h3>
              <ul>
                <li><strong>Plan:</strong> {{newPlan}}</li>
                <li><strong>Monthly Credits:</strong> {{monthlyCredits}}</li>
                <li><strong>Current Credits:</strong> {{currentCredits}}</li>
                <li><strong>Next Billing:</strong> {{nextBilling}}</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{dashboardUrl}}" style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Go to Dashboard</a>
            </div>
            
            <p>Thank you for choosing Upload You Clips!</p>
            
            <p>Best regards,<br>The Upload You Clips Team</p>
          </div>
        </body>
        </html>`
      }
    };

    // Save templates to files
    for (const [name, template] of Object.entries(templates)) {
      const filePath = path.join(templatesDir, `${name}.hbs`);
      try {
        await fs.writeFile(filePath, template.html);
      } catch (error) {
        logger.warn(`Failed to create template ${name}`, { error: error.message });
      }
    }
  }

  isConfigured() {
    return this.isEnabled && this.transporter;
  }

  // Test SMTP connection
  async testConnection() {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Email service not configured',
        missingVars: this.getMissingVars()
      };
    }

    try {
      // Verify SMTP connection
      await this.transporter.verify();
      
      logger.info('SMTP connection test successful', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT
      });

      return {
        success: true,
        message: 'SMTP connection verified successfully',
        config: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          secure: process.env.SMTP_SECURE === 'true',
          user: process.env.SMTP_USER
        }
      };
    } catch (error) {
      logger.error('SMTP connection test failed', { 
        error: error.message,
        code: error.code 
      });

      return {
        success: false,
        error: error.message,
        code: error.code,
        suggestion: this.getSMTPErrorSuggestion(error)
      };
    }
  }

  // Get helpful suggestion based on SMTP error
  getSMTPErrorSuggestion(error) {
    const errorCode = error.code || '';
    const errorMessage = error.message || '';

    if (errorCode === 'EAUTH' || errorMessage.includes('Invalid login')) {
      return 'Vérifiez vos identifiants SMTP_USER et SMTP_PASS. Pour Gmail, utilisez un App Password.';
    }
    
    if (errorCode === 'ECONNECTION' || errorMessage.includes('connection')) {
      return 'Vérifiez SMTP_HOST et SMTP_PORT. Assurez-vous que le serveur SMTP est accessible.';
    }
    
    if (errorMessage.includes('self signed certificate')) {
      return 'Problème de certificat SSL. Vérifiez SMTP_SECURE ou configurez rejectUnauthorized: false.';
    }
    
    if (errorCode === 'ETIMEDOUT') {
      return 'Timeout de connexion. Vérifiez votre connexion internet et les paramètres de port.';
    }

    return 'Vérifiez tous vos paramètres SMTP dans le fichier .env';
  }

  // Send email using template
  async sendTemplateEmail(to, templateName, data = {}, options = {}) {
    if (!this.isConfigured()) {
      logger.warn('Email service not configured - email not sent', { to, templateName });
      return { sent: false, reason: 'Email service not configured' };
    }

    try {
      const template = this.templates.get(templateName);
      if (!template) {
        throw new Error(`Template '${templateName}' not found`);
      }

      const html = template({
        ...data,
        appUrl: process.env.CLIENT_URL || 'http://localhost:3000',
        currentYear: new Date().getFullYear()
      });

      const mailOptions = {
        from: options.from || this.fromEmail,
        to,
        subject: options.subject || this.getDefaultSubject(templateName),
        html,
        ...options
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Template email sent successfully', {
        to,
        templateName,
        messageId: result.messageId
      });

      return { 
        sent: true, 
        messageId: result.messageId,
        template: templateName
      };
    } catch (error) {
      logger.error('Failed to send template email', { 
        error: error.message, 
        to, 
        templateName 
      });
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  // Send plain email
  async sendEmail(to, subject, html, options = {}) {
    if (!this.isConfigured()) {
      logger.warn('Email service not configured - email not sent', { to, subject });
      return { sent: false, reason: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: options.from || this.fromEmail,
        to,
        subject,
        html,
        ...options
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email sent successfully', {
        to,
        subject,
        messageId: result.messageId
      });

      return { 
        sent: true, 
        messageId: result.messageId
      };
    } catch (error) {
      logger.error('Failed to send email', { 
        error: error.message, 
        to, 
        subject 
      });
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  // Predefined email methods
  async sendWelcomeEmail(user) {
    return this.sendTemplateEmail(user.email, 'welcome', {
      name: user.name,
      email: user.email,
      plan: user.subscription_type || 'free',
      credits: user.credits || 10
    });
  }

  async sendProcessingCompleteEmail(user, jobData) {
    return this.sendTemplateEmail(user.email, 'processing-complete', {
      name: user.name,
      videoName: jobData.fileName || 'Your video',
      clipsCount: jobData.clipsGenerated || 0,
      processingTime: jobData.processingTime || 'Unknown',
      creditsUsed: jobData.creditsUsed || 0,
      creditsRemaining: jobData.creditsRemaining || 0,
      viewUrl: `${process.env.CLIENT_URL}/clips/${jobData.jobId}`
    });
  }

  async sendLowCreditsEmail(user) {
    return this.sendTemplateEmail(user.email, 'low-credits', {
      name: user.name,
      creditsRemaining: user.creditsRemaining || 0,
      buyCreditsUrl: `${process.env.CLIENT_URL}/buy-credits`,
      upgradeUrl: `${process.env.CLIENT_URL}/subscription`
    });
  }

  async sendSubscriptionUpgradedEmail(user, subscriptionData) {
    return this.sendTemplateEmail(user.email, 'subscription-upgraded', {
      name: user.name,
      newPlan: subscriptionData.plan,
      features: subscriptionData.features || [],
      monthlyCredits: subscriptionData.monthlyCredits,
      currentCredits: subscriptionData.currentCredits,
      nextBilling: subscriptionData.nextBilling,
      dashboardUrl: `${process.env.CLIENT_URL}/dashboard`
    });
  }

  // Bulk email sending (with rate limiting)
  async sendBulkEmails(emails, delayMs = 1000) {
    if (!this.isConfigured()) {
      return { sent: 0, failed: emails.length, reason: 'Email service not configured' };
    }

    let sent = 0;
    let failed = 0;
    const results = [];

    for (const emailData of emails) {
      try {
        const result = await this.sendTemplateEmail(
          emailData.to,
          emailData.template,
          emailData.data,
          emailData.options
        );
        
        results.push({ ...emailData, result, success: true });
        sent++;
        
        // Rate limiting delay
        if (delayMs > 0 && sent < emails.length) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        results.push({ ...emailData, error: error.message, success: false });
        failed++;
      }
    }

    logger.info('Bulk email sending completed', { sent, failed, total: emails.length });
    
    return { sent, failed, total: emails.length, results };
  }

  getDefaultSubject(templateName) {
    const subjects = {
      'welcome': 'Welcome to Upload You Clips!',
      'processing-complete': 'Your video clips are ready!',
      'low-credits': 'Low credit balance - Time to recharge!',
      'subscription-upgraded': 'Subscription upgraded successfully!'
    };
    
    return subjects[templateName] || 'Upload You Clips Notification';
  }

  // Get email service statistics
  getServiceStats() {
    return {
      enabled: this.isEnabled,
      configured: this.isConfigured(),
      templatesLoaded: this.templates.size,
      templates: Array.from(this.templates.keys()),
      fromEmail: this.fromEmail,
      smtpHost: process.env.SMTP_HOST || 'Not configured'
    };
  }

  // Test email configuration
  async testEmailConfig() {
    if (!this.isConfigured()) {
      throw new Error('Email service not configured');
    }

    try {
      await this.transporter.verify();
      return { success: true, message: 'Email configuration is valid' };
    } catch (error) {
      throw new Error(`Email configuration test failed: ${error.message}`);
    }
  }
}

// Export singleton instance
const emailService = new EmailService();
module.exports = emailService;
