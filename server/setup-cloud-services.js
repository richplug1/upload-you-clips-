#!/usr/bin/env node

/**
 * Script de configuration rapide pour activer les services cloud
 * Usage: node setup-cloud-services.js [service]
 * Services: s3, email, all
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

class CloudServicesSetup {
  constructor() {
    this.envPath = path.join(__dirname, '.env');
    this.envConfig = new Map();
  }

  async loadEnvFile() {
    try {
      const content = await fs.readFile(this.envPath, 'utf8');
      const lines = content.split('\n');
      
      for (const line of lines) {
        if (line.includes('=') && !line.trim().startsWith('#')) {
          const [key, ...values] = line.split('=');
          this.envConfig.set(key.trim(), values.join('=').trim());
        }
      }
      
      console.log('✅ Fichier .env chargé');
    } catch (error) {
      console.log('❌ Erreur lors du chargement du .env:', error.message);
      process.exit(1);
    }
  }

  async saveEnvFile() {
    try {
      const content = await fs.readFile(this.envPath, 'utf8');
      let newContent = content;
      
      // Update existing values
      for (const [key, value] of this.envConfig.entries()) {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        const commentRegex = new RegExp(`^# ${key}=.*$`, 'm');
        
        if (regex.test(newContent)) {
          newContent = newContent.replace(regex, `${key}=${value}`);
        } else if (commentRegex.test(newContent)) {
          newContent = newContent.replace(commentRegex, `${key}=${value}`);
        }
      }
      
      await fs.writeFile(this.envPath, newContent);
      console.log('✅ Fichier .env mis à jour');
    } catch (error) {
      console.log('❌ Erreur lors de la sauvegarde:', error.message);
    }
  }

  async setupS3() {
    console.log('\n☁️ Configuration du Stockage Cloud (AWS S3)\n');
    
    const provider = await question('Choisissez votre provider (1: AWS S3, 2: DigitalOcean Spaces, 3: Cloudflare R2): ');
    
    switch (provider) {
      case '1':
        await this.setupAWSS3();
        break;
      case '2':
        await this.setupDigitalOceanSpaces();
        break;
      case '3':
        await this.setupCloudflareR2();
        break;
      default:
        console.log('❌ Option invalide');
        return;
    }
  }

  async setupAWSS3() {
    console.log('\n🔧 Configuration AWS S3\n');
    
    const accessKeyId = await question('AWS Access Key ID: ');
    const secretAccessKey = await question('AWS Secret Access Key: ');
    const region = await question('AWS Region (défaut: us-east-1): ') || 'us-east-1';
    const bucket = await question('Nom du bucket S3: ');
    
    this.envConfig.set('AWS_ACCESS_KEY_ID', accessKeyId);
    this.envConfig.set('AWS_SECRET_ACCESS_KEY', secretAccessKey);
    this.envConfig.set('AWS_REGION', region);
    this.envConfig.set('AWS_S3_BUCKET', bucket);
    
    console.log('\n✅ Configuration AWS S3 prête');
  }

  async setupDigitalOceanSpaces() {
    console.log('\n🔧 Configuration DigitalOcean Spaces\n');
    
    const accessKey = await question('Spaces Access Key: ');
    const secretKey = await question('Spaces Secret Key: ');
    const region = await question('Region (ex: nyc3, fra1, sgp1): ');
    const spaceName = await question('Nom du Space: ');
    
    this.envConfig.set('AWS_ACCESS_KEY_ID', accessKey);
    this.envConfig.set('AWS_SECRET_ACCESS_KEY', secretKey);
    this.envConfig.set('AWS_REGION', region);
    this.envConfig.set('AWS_S3_BUCKET', spaceName);
    this.envConfig.set('AWS_ENDPOINT', `https://${region}.digitaloceanspaces.com`);
    
    console.log('\n✅ Configuration DigitalOcean Spaces prête');
  }

  async setupCloudflareR2() {
    console.log('\n🔧 Configuration Cloudflare R2\n');
    
    const accessKeyId = await question('R2 Access Key ID: ');
    const secretAccessKey = await question('R2 Secret Access Key: ');
    const accountId = await question('Account ID Cloudflare: ');
    const bucketName = await question('Nom du bucket R2: ');
    
    this.envConfig.set('AWS_ACCESS_KEY_ID', accessKeyId);
    this.envConfig.set('AWS_SECRET_ACCESS_KEY', secretAccessKey);
    this.envConfig.set('AWS_REGION', 'auto');
    this.envConfig.set('AWS_S3_BUCKET', bucketName);
    this.envConfig.set('AWS_ENDPOINT', `https://${accountId}.r2.cloudflarestorage.com`);
    
    console.log('\n✅ Configuration Cloudflare R2 prête');
  }

  async setupEmail() {
    console.log('\n📧 Configuration du Service Email\n');
    
    const provider = await question('Choisissez votre provider (1: Gmail, 2: SendGrid, 3: Outlook, 4: Custom SMTP): ');
    
    switch (provider) {
      case '1':
        await this.setupGmail();
        break;
      case '2':
        await this.setupSendGrid();
        break;
      case '3':
        await this.setupOutlook();
        break;
      case '4':
        await this.setupCustomSMTP();
        break;
      default:
        console.log('❌ Option invalide');
        return;
    }
  }

  async setupGmail() {
    console.log('\n🔧 Configuration Gmail SMTP\n');
    console.log('ℹ️ Assurez-vous d\'avoir activé la 2-Step Verification et créé un App Password');
    
    const email = await question('Votre email Gmail: ');
    const appPassword = await question('App Password Gmail (16 caractères): ');
    const fromEmail = await question('Email d\'expéditeur (défaut: noreply@uploadyouclips.com): ') || 'noreply@uploadyouclips.com';
    
    this.envConfig.set('SMTP_HOST', 'smtp.gmail.com');
    this.envConfig.set('SMTP_PORT', '587');
    this.envConfig.set('SMTP_SECURE', 'false');
    this.envConfig.set('SMTP_USER', email);
    this.envConfig.set('SMTP_PASS', appPassword);
    this.envConfig.set('EMAIL_FROM', fromEmail);
    
    console.log('\n✅ Configuration Gmail prête');
  }

  async setupSendGrid() {
    console.log('\n🔧 Configuration SendGrid\n');
    
    const apiKey = await question('SendGrid API Key: ');
    const fromEmail = await question('Email d\'expéditeur vérifié: ');
    
    this.envConfig.set('SMTP_HOST', 'smtp.sendgrid.net');
    this.envConfig.set('SMTP_PORT', '587');
    this.envConfig.set('SMTP_SECURE', 'false');
    this.envConfig.set('SMTP_USER', 'apikey');
    this.envConfig.set('SMTP_PASS', apiKey);
    this.envConfig.set('EMAIL_FROM', fromEmail);
    
    console.log('\n✅ Configuration SendGrid prête');
  }

  async setupOutlook() {
    console.log('\n🔧 Configuration Outlook SMTP\n');
    
    const email = await question('Votre email Outlook: ');
    const password = await question('Mot de passe ou App Password: ');
    const fromEmail = await question('Email d\'expéditeur (défaut: noreply@uploadyouclips.com): ') || 'noreply@uploadyouclips.com';
    
    this.envConfig.set('SMTP_HOST', 'smtp.live.com');
    this.envConfig.set('SMTP_PORT', '587');
    this.envConfig.set('SMTP_SECURE', 'false');
    this.envConfig.set('SMTP_USER', email);
    this.envConfig.set('SMTP_PASS', password);
    this.envConfig.set('EMAIL_FROM', fromEmail);
    
    console.log('\n✅ Configuration Outlook prête');
  }

  async setupCustomSMTP() {
    console.log('\n🔧 Configuration SMTP Personnalisé\n');
    
    const host = await question('SMTP Host: ');
    const port = await question('SMTP Port (défaut: 587): ') || '587';
    const secure = await question('Connexion sécurisée? (y/N): ');
    const user = await question('Nom d\'utilisateur SMTP: ');
    const pass = await question('Mot de passe SMTP: ');
    const fromEmail = await question('Email d\'expéditeur: ');
    
    this.envConfig.set('SMTP_HOST', host);
    this.envConfig.set('SMTP_PORT', port);
    this.envConfig.set('SMTP_SECURE', secure.toLowerCase() === 'y' ? 'true' : 'false');
    this.envConfig.set('SMTP_USER', user);
    this.envConfig.set('SMTP_PASS', pass);
    this.envConfig.set('EMAIL_FROM', fromEmail);
    
    console.log('\n✅ Configuration SMTP personnalisé prête');
  }

  async run() {
    console.log('🚀 Configuration des Services Cloud - Upload You Clips\n');
    
    const args = process.argv.slice(2);
    const service = args[0];
    
    await this.loadEnvFile();
    
    if (!service || service === 'all') {
      const choice = await question('Que voulez-vous configurer? (1: Stockage Cloud, 2: Email, 3: Les deux): ');
      
      switch (choice) {
        case '1':
          await this.setupS3();
          break;
        case '2':
          await this.setupEmail();
          break;
        case '3':
          await this.setupS3();
          await this.setupEmail();
          break;
        default:
          console.log('❌ Option invalide');
          process.exit(1);
      }
    } else if (service === 's3') {
      await this.setupS3();
    } else if (service === 'email') {
      await this.setupEmail();
    } else {
      console.log('❌ Service invalide. Utilisez: s3, email, ou all');
      process.exit(1);
    }
    
    await this.saveEnvFile();
    
    console.log('\n🎉 Configuration terminée!');
    console.log('🔄 Redémarrez le serveur pour appliquer les changements: npm run dev');
    console.log('🧪 Testez la configuration: node test-cloud-services.js');
    
    rl.close();
  }
}

// Execute if called directly
if (require.main === module) {
  const setup = new CloudServicesSetup();
  setup.run().catch(error => {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  });
}

module.exports = CloudServicesSetup;
