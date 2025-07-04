#!/usr/bin/env node

/**
 * Script de test pour valider la configuration des services cloud
 * Usage: node test-cloud-services.js
 */

const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

const cloudStorage = require('./services/cloudStorage');
const emailService = require('./services/emailService');
const logger = require('./services/logger');

async function testCloudServices() {
  console.log('🔍 Test des Services Cloud - Upload You Clips\n');
  
  const results = {
    cloudStorage: { configured: false, tested: false, error: null },
    emailService: { configured: false, tested: false, error: null }
  };
  
  // Test Cloud Storage
  console.log('☁️ Test du Stockage Cloud (S3)...');
  try {
    results.cloudStorage.configured = cloudStorage.isConfigured();
    
    if (results.cloudStorage.configured) {
      console.log('✅ Configuration détectée');
      
      // Test basic functionality
      const stats = await cloudStorage.getStorageStats();
      console.log('✅ Statistiques récupérées:', {
        bucket: stats.bucket,
        region: stats.region,
        files: stats.totalFiles,
        size: stats.totalSizeMB + ' MB'
      });
      
      results.cloudStorage.tested = true;
      console.log('✅ Stockage cloud: FONCTIONNEL\n');
    } else {
      console.log('⚠️ Stockage cloud non configuré (mode local actif)');
      console.log('💡 Variables manquantes:', cloudStorage.getMissingVars());
      console.log('📖 Voir CLOUD_SERVICES_SETUP.md pour la configuration\n');
    }
  } catch (error) {
    results.cloudStorage.error = error.message;
    console.log('❌ Erreur stockage cloud:', error.message);
    console.log('🔧 Vérifiez vos clés API AWS/S3\n');
  }
  
  // Test Email Service
  console.log('📧 Test du Service Email (SMTP)...');
  try {
    results.emailService.configured = emailService.isConfigured();
    
    if (results.emailService.configured) {
      console.log('✅ Configuration détectée');
      
      // Test connection (without sending actual email)
      const testResult = await emailService.testConnection();
      if (testResult.success) {
        console.log('✅ Connexion SMTP établie');
        results.emailService.tested = true;
        console.log('✅ Service email: FONCTIONNEL\n');
      } else {
        console.log('❌ Échec de connexion SMTP:', testResult.error);
      }
    } else {
      console.log('⚠️ Service email non configuré (mode console actif)');
      console.log('💡 Variables manquantes:', emailService.getMissingVars());
      console.log('📖 Voir CLOUD_SERVICES_SETUP.md pour la configuration\n');
    }
  } catch (error) {
    results.emailService.error = error.message;
    console.log('❌ Erreur service email:', error.message);
    console.log('🔧 Vérifiez vos paramètres SMTP\n');
  }
  
  // Summary
  console.log('📊 RÉSUMÉ DES TESTS\n');
  console.log('┌─────────────────┬─────────────┬─────────────┬─────────────┐');
  console.log('│ Service         │ Configuré   │ Testé       │ Statut      │');
  console.log('├─────────────────┼─────────────┼─────────────┼─────────────┤');
  
  const cloudStatus = results.cloudStorage.configured ? 
    (results.cloudStorage.tested ? '✅ OK' : '⚠️ Erreur') : 
    '⚠️ Non conf.';
  console.log(`│ Stockage Cloud  │ ${results.cloudStorage.configured ? '✅ Oui' : '❌ Non'}      │ ${results.cloudStorage.tested ? '✅ Oui' : '❌ Non'}      │ ${cloudStatus.padEnd(11)} │`);
  
  const emailStatus = results.emailService.configured ? 
    (results.emailService.tested ? '✅ OK' : '⚠️ Erreur') : 
    '⚠️ Non conf.';
  console.log(`│ Service Email   │ ${results.emailService.configured ? '✅ Oui' : '❌ Non'}      │ ${results.emailService.tested ? '✅ Oui' : '❌ Non'}      │ ${emailStatus.padEnd(11)} │`);
  
  console.log('└─────────────────┴─────────────┴─────────────┴─────────────┘\n');
  
  // Recommendations
  console.log('💡 RECOMMANDATIONS\n');
  
  if (!results.cloudStorage.configured) {
    console.log('📁 Stockage Cloud:');
    console.log('   • Mode local actif (fichiers stockés sur le serveur)');
    console.log('   • Pour production: configurez AWS S3, DigitalOcean Spaces, ou Cloudflare R2');
    console.log('   • Voir CLOUD_SERVICES_SETUP.md pour les étapes détaillées\n');
  }
  
  if (!results.emailService.configured) {
    console.log('📧 Service Email:');
    console.log('   • Mode console actif (emails affichés dans les logs)');
    console.log('   • Pour production: configurez Gmail, SendGrid, ou votre serveur SMTP');
    console.log('   • Voir CLOUD_SERVICES_SETUP.md pour les étapes détaillées\n');
  }
  
  const allConfigured = results.cloudStorage.configured && results.emailService.configured;
  const allTested = results.cloudStorage.tested && results.emailService.tested;
  
  if (allConfigured && allTested) {
    console.log('🎉 Tous les services cloud sont configurés et fonctionnels!');
    console.log('✅ Votre application est prête pour la production.');
  } else if (allConfigured) {
    console.log('⚠️ Services configurés mais avec des erreurs de connexion.');
    console.log('🔧 Vérifiez vos clés API et paramètres de connexion.');
  } else {
    console.log('ℹ️ Application fonctionnelle en mode local/développement.');
    console.log('☁️ Configurez les services cloud pour la production.');
  }
  
  console.log('\n📖 Documentation complète: CLOUD_SERVICES_SETUP.md');
  console.log('🚀 Pour redémarrer avec la nouvelle config: npm run dev');
  
  return results;
}

// Execute if called directly
if (require.main === module) {
  testCloudServices().catch(error => {
    console.error('❌ Erreur lors du test:', error.message);
    process.exit(1);
  });
}

module.exports = testCloudServices;
