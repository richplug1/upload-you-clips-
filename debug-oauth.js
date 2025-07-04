#!/usr/bin/env node

console.log('=== DIAGNOSTIC GOOGLE OAUTH ===\n');

// Test 1: Variables d'environnement backend
console.log('1. VARIABLES BACKEND (.env):');
const fs = require('fs');
try {
  const envContent = fs.readFileSync('./server/.env', 'utf8');
  const googleClientId = envContent.match(/^GOOGLE_CLIENT_ID=(.*)$/m)?.[1];
  const googleClientSecret = envContent.match(/^GOOGLE_CLIENT_SECRET=(.*)$/m)?.[1];
  const googleRedirectUri = envContent.match(/^GOOGLE_REDIRECT_URI=(.*)$/m)?.[1];
  const frontendUrl = envContent.match(/^FRONTEND_URL=(.*)$/m)?.[1];
  
  console.log(`GOOGLE_CLIENT_ID: ${googleClientId || 'NON DÉFINI'}`);
  console.log(`GOOGLE_CLIENT_SECRET: ${googleClientSecret ? 'DÉFINI' : 'NON DÉFINI'}`);
  console.log(`GOOGLE_REDIRECT_URI: ${googleRedirectUri || 'NON DÉFINI'}`);
  console.log(`FRONTEND_URL: ${frontendUrl || 'NON DÉFINI'}`);
} catch (error) {
  console.log('Erreur lecture server/.env:', error.message);
}
console.log('\n2. VARIABLES FRONTEND (.env.local):');
const fs = require('fs');
try {
  const envLocal = fs.readFileSync('./client/.env.local', 'utf8');
  const clientId = envLocal.match(/VITE_GOOGLE_CLIENT_ID=(.*)/)?.[1];
  console.log(`VITE_GOOGLE_CLIENT_ID: ${clientId || 'NON DÉFINI'}`);
} catch (error) {
  console.log('Erreur lecture .env.local:', error.message);
}

// Test 3: Test de connexion backend
console.log('\n3. TEST CONNEXION BACKEND:');
const http = require('http');

function testEndpoint(port, path = '') {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data });
      });
    });
    
    req.on('error', (error) => {
      resolve({ error: error.message });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ error: 'Timeout' });
    });
  });
}

async function runTests() {
  const tests = [
    { port: 5000, path: '', name: 'Backend racine' },
    { port: 5000, path: '/api/health', name: 'Health check' },
    { port: 5000, path: '/api/oauth/google/url', name: 'OAuth URL' },
    { port: 3001, path: '', name: 'Frontend' },
  ];

  for (const test of tests) {
    const result = await testEndpoint(test.port, test.path);
    if (result.error) {
      console.log(`❌ ${test.name}: ${result.error}`);
    } else {
      console.log(`✅ ${test.name}: Status ${result.status}`);
      if (test.path === '/api/oauth/google/url' && result.status === 200) {
        try {
          const json = JSON.parse(result.data);
          console.log(`   OAuth configuré: ${json.success ? 'OUI' : 'NON'}`);
        } catch (e) {
          console.log(`   Réponse: ${result.data.substring(0, 100)}...`);
        }
      }
    }
  }
}

runTests().catch(console.error);
