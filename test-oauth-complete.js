#!/usr/bin/env node

/**
 * Test complet OAuth Google - Connexion/Inscription
 * Ce script teste tous les endpoints OAuth
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:5000';
const CLIENT_URL = 'http://localhost:3000';

// Fonction pour faire une requête HTTP
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OAuth-Test-Script'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Tests OAuth
async function testOAuth() {
  console.log('🚀 TEST OAUTH GOOGLE - CONNEXION/INSCRIPTION');
  console.log('===========================================\n');

  try {
    // 1. Test de santé des serveurs
    console.log('1️⃣ Vérification des serveurs...');
    const healthCheck = await makeRequest(`${BASE_URL}/api/health`);
    console.log(`   ✅ Backend: ${healthCheck.status === 200 ? 'OK' : 'ERREUR'}`);

    // 2. Test de l'endpoint OAuth URL
    console.log('\n2️⃣ Test génération URL OAuth...');
    const oauthUrl = await makeRequest(`${BASE_URL}/api/oauth/google/url`);
    
    if (oauthUrl.status === 200 && oauthUrl.data.success) {
      console.log('   ✅ URL OAuth générée avec succès');
      console.log(`   🔗 URL: ${oauthUrl.data.authUrl.substring(0, 100)}...`);
      
      // Vérifier que l'URL contient le bon Client ID
      const clientIdMatch = oauthUrl.data.authUrl.includes('706243992924-f8pesc74hlva9lipa5qm79tgl9oi18ac.apps.googleusercontent.com');
      console.log(`   🔑 Client ID correct: ${clientIdMatch ? '✅' : '❌'}`);
    } else {
      console.log('   ❌ Erreur génération URL OAuth');
      console.log(`   📝 Réponse: ${JSON.stringify(oauthUrl.data)}`);
    }

    // 3. Test de la configuration OAuth
    console.log('\n3️⃣ Vérification configuration OAuth...');
    const configCheck = await makeRequest(`${BASE_URL}/api/oauth/config`);
    
    if (configCheck.status === 200) {
      console.log('   ✅ Configuration OAuth accessible');
      console.log(`   🔧 Détails: ${JSON.stringify(configCheck.data)}`);
    } else {
      console.log('   ⚠️  Endpoint config OAuth non disponible (normal)');
    }

    // 4. Test du frontend
    console.log('\n4️⃣ Test du frontend...');
    try {
      const frontendCheck = await makeRequest(CLIENT_URL);
      console.log(`   ✅ Frontend: ${frontendCheck.status === 200 ? 'OK' : 'ERREUR'}`);
    } catch (e) {
      console.log('   ❌ Frontend non accessible');
    }

    // 5. Instructions pour test manuel
    console.log('\n5️⃣ Instructions pour test manuel:');
    console.log('   🌐 Ouvrez: http://localhost:3000');
    console.log('   🔐 Cliquez sur "Login" ou "Sign in with Google"');
    console.log('   ✅ Vous devriez être redirigé vers Google OAuth');
    console.log('   📝 Après connexion, vous devriez revenir sur l\'app');

    // 6. URLs pour Google Cloud Console
    console.log('\n6️⃣ URLs pour Google Cloud Console:');
    console.log('   📋 Authorized JavaScript origins:');
    console.log('      - http://localhost:3000');
    console.log('      - http://localhost:3001');
    console.log('      - http://localhost:5173');
    console.log('      - http://localhost:5000');
    console.log('   🔄 Authorized redirect URIs:');
    console.log('      - http://localhost:5000/api/oauth/google/callback');
    console.log('      - http://localhost:3000/auth/callback');
    console.log('      - http://localhost:3001/auth/callback');
    console.log('      - http://localhost:5173/auth/callback');

    console.log('\n✅ TESTS OAUTH TERMINÉS');
    console.log('========================');
    console.log('🎯 Statut: Configuration OAuth prête pour les tests');
    console.log('💡 Testez maintenant manuellement sur http://localhost:3000');

  } catch (error) {
    console.error('❌ ERREUR LORS DES TESTS:', error.message);
  }
}

// Exécuter les tests
testOAuth();
