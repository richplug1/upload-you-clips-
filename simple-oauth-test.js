#!/usr/bin/env node

const http = require('http');

console.log('🔍 TEST GOOGLE OAUTH - DIAGNOSTIC SIMPLE\n');

async function testEndpoint(url, name) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ success: true, status: res.statusCode, data: json });
        } catch (e) {
          resolve({ success: true, status: res.statusCode, data: data.substring(0, 100) });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });
  });
}

async function runDiagnostic() {
  console.log('1. Backend Health Check:');
  const health = await testEndpoint('http://localhost:5000/api/health', 'Health');
  console.log(health.success ? `✅ Backend OK (${health.status})` : `❌ Backend: ${health.error}`);
  
  console.log('\n2. OAuth URL Generation:');
  const oauth = await testEndpoint('http://localhost:5000/api/oauth/google/url', 'OAuth');
  if (oauth.success && oauth.data.success) {
    console.log('✅ OAuth URL générée avec succès');
    console.log(`   URL: ${oauth.data.authUrl ? oauth.data.authUrl.substring(0, 80) + '...' : 'N/A'}`);
  } else {
    console.log(`❌ OAuth: ${oauth.error || JSON.stringify(oauth.data)}`);
  }
  
  console.log('\n3. Frontend Test:');
  const frontend = await testEndpoint('http://localhost:3000', 'Frontend');
  console.log(frontend.success ? `✅ Frontend OK (${frontend.status})` : `❌ Frontend: ${frontend.error}`);
  
  console.log('\n4. Frontend Proxy Test:');
  const proxy = await testEndpoint('http://localhost:3000/api/oauth/google/url', 'Proxy');
  if (proxy.success && proxy.data.success) {
    console.log('✅ Proxy frontend → backend fonctionne');
  } else {
    console.log(`❌ Proxy: ${proxy.error || JSON.stringify(proxy.data)}`);
  }
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Ouvrir http://localhost:3000 dans un navigateur');
  console.log('2. Cliquer sur "Login" puis "Sign in with Google"');
  console.log('3. Vérifier la redirection vers Google OAuth');
  console.log('4. Après connexion Google, vérifier le retour à l\'app');
}

runDiagnostic();
