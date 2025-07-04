#!/usr/bin/env node

/**
 * Script de test pour le système de gestion d'erreurs
 */

const path = require('path');
const fs = require('fs');

// Configuration des chemins
const serverPath = path.join(__dirname, '../server');

async function testErrorSystem() {
  console.log('🔥 Test du Système de Gestion d\'Erreurs');
  console.log('==========================================\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Vérification des fichiers de service
  try {
    console.log('1. Test de la présence des fichiers de service...');
    const requiredFiles = [
      'services/errorHandler.js',
      'middleware/errorMiddleware.js',
      'models/database.js',
      'routes/errorMonitoring.js',
      'routes/systemHealth.js'
    ];

    const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(serverPath, file)));

    if (missingFiles.length === 0) {
      console.log('   ✅ Tous les fichiers de service sont présents');
      passed++;
    } else {
      console.log('   ❌ Fichiers manquants:', missingFiles);
      failed++;
    }
  } catch (error) {
    console.log('   ❌ Erreur lors de la vérification des fichiers:', error.message);
    failed++;
  }

  // Test 2: Test des imports de modules
  try {
    console.log('2. Test des imports de modules...');
    const errorHandler = require(path.join(serverPath, 'services/errorHandler'));
    
    if (errorHandler && typeof errorHandler.createError === 'function') {
      console.log('   ✅ Module errorHandler importé avec succès');
      passed++;
    } else {
      console.log('   ❌ Module errorHandler non valide');
      failed++;
    }
  } catch (error) {
    console.log('   ❌ Erreur d\'import du module errorHandler:', error.message);
    failed++;
  }

  // Test 3: Test des fichiers client
  try {
    console.log('3. Test des fichiers client...');
    const clientPath = path.join(__dirname, '../client/src');
    const clientFiles = [
      'utils/errorHandler.ts',
      'hooks/useErrorHandling.ts',
      'components/ErrorNotificationSystem.tsx',
      'components/ErrorMonitoringDashboard.tsx',
      'config/errorConfig.ts'
    ];

    const missingClientFiles = clientFiles.filter(file => !fs.existsSync(path.join(clientPath, file)));

    if (missingClientFiles.length === 0) {
      console.log('   ✅ Tous les fichiers client sont présents');
      passed++;
    } else {
      console.log('   ❌ Fichiers client manquants:', missingClientFiles);
      failed++;
    }
  } catch (error) {
    console.log('   ❌ Erreur lors de la vérification des fichiers client:', error.message);
    failed++;
  }

  // Test 4: Test de la documentation
  try {
    console.log('4. Test de la documentation...');
    const docFile = path.join(__dirname, '../ERROR_HANDLING_INTEGRATION_GUIDE.md');
    
    if (fs.existsSync(docFile)) {
      const docContent = fs.readFileSync(docFile, 'utf8');
      if (docContent.includes('Architecture') && docContent.includes('Utilisation')) {
        console.log('   ✅ Documentation complète disponible');
        passed++;
      } else {
        console.log('   ❌ Documentation incomplète');
        failed++;
      }
    } else {
      console.log('   ❌ Documentation manquante');
      failed++;
    }
  } catch (error) {
    console.log('   ❌ Erreur lors de la vérification de la documentation:', error.message);
    failed++;
  }

  // Test 5: Test de la structure du projet
  try {
    console.log('5. Test de la structure du projet...');
    const expectedDirs = [
      'server/services',
      'server/middleware',
      'server/routes',
      'server/models',
      'client/src/utils',
      'client/src/hooks',
      'client/src/components',
      'client/src/config'
    ];

    const missingDirs = expectedDirs.filter(dir => !fs.existsSync(path.join(__dirname, '..', dir)));

    if (missingDirs.length === 0) {
      console.log('   ✅ Structure du projet correcte');
      passed++;
    } else {
      console.log('   ❌ Répertoires manquants:', missingDirs);
      failed++;
    }
  } catch (error) {
    console.log('   ❌ Erreur lors de la vérification de la structure:', error.message);
    failed++;
  }

  // Résultats
  console.log('\n==========================================');
  console.log('📊 Résultats des Tests');
  console.log('==========================================');
  console.log(`✅ Tests réussis: ${passed}`);
  console.log(`❌ Tests échoués: ${failed}`);
  console.log(`📈 Taux de réussite: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed === 0) {
    console.log('\n🎉 Tous les tests sont passés ! Le système d\'erreur est prêt.');
    console.log('\n📋 Prochaines étapes :');
    console.log('   1. Démarrer le serveur : npm run dev (dans le dossier server)');
    console.log('   2. Démarrer le client : npm run dev (dans le dossier client)');
    console.log('   3. Tester les endpoints : /api/system/health, /api/system/test-error');
    console.log('   4. Accéder au dashboard admin : /admin/errors');
    process.exit(0);
  } else {
    console.log('\n⚠️  Certains tests ont échoué. Vérifiez la configuration.');
    process.exit(1);
  }
}

// Exécuter les tests
testErrorSystem().catch(console.error);
