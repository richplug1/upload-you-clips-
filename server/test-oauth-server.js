// Test minimal du serveur OAuth
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware basique
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Serveur de test fonctionnel' 
  });
});

// Route OAuth test
app.get('/api/oauth/google/url', (req, res) => {
  try {
    console.log('🔍 Test OAuth endpoint appelé');
    console.log('🔑 GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'DÉFINI' : 'NON DÉFINI');
    console.log('🔐 GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'DÉFINI' : 'NON DÉFINI');
    
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(503).json({
        error: 'Google OAuth non configuré',
        configured: false,
        missing: {
          clientId: !process.env.GOOGLE_CLIENT_ID,
          clientSecret: !process.env.GOOGLE_CLIENT_SECRET
        }
      });
    }
    
    // Générer l'URL OAuth Google
    const scopes = ['openid', 'email', 'profile'];
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/oauth/google/callback",
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent'
    });

    const authUrl = `https://accounts.google.com/oauth/v2/auth?${params.toString()}`;
    
    console.log('✅ URL OAuth générée avec succès');
    
    res.json({
      success: true,
      authUrl,
      message: 'Google OAuth URL générée avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur dans l\'endpoint OAuth:', error);
    res.status(500).json({
      error: 'Erreur lors de la génération de l\'URL OAuth',
      details: error.message
    });
  }
});

// Route racine
app.get('/', (req, res) => {
  res.json({ 
    message: 'Upload You Clips - Serveur de test OAuth',
    endpoints: [
      'GET /api/health',
      'GET /api/oauth/google/url'
    ]
  });
});

// Démarrage du serveur
const server = app.listen(PORT, () => {
  console.log('🚀 SERVEUR DE TEST OAUTH DÉMARRÉ');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
  console.log(`🔑 OAuth: http://localhost:${PORT}/api/oauth/google/url`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Test des variables d'environnement
  console.log('\n🔍 CONFIGURATION:');
  console.log(`GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? 'DÉFINI' : 'NON DÉFINI'}`);
  console.log(`GOOGLE_CLIENT_SECRET: ${process.env.GOOGLE_CLIENT_SECRET ? 'DÉFINI' : 'NON DÉFINI'}`);
  console.log(`GOOGLE_REDIRECT_URI: ${process.env.GOOGLE_REDIRECT_URI || 'NON DÉFINI'}`);
  console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL || 'NON DÉFINI'}`);
});

// Gestion des erreurs
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} déjà utilisé. Essayez:`);
    console.error(`   killall node`);
    console.error(`   ou changez le PORT dans .env`);
  } else {
    console.error('❌ Erreur serveur:', error);
  }
  process.exit(1);
});

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur de test...');
  server.close(() => {
    console.log('✅ Serveur arrêté proprement');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt du serveur de test...');
  server.close(() => {
    console.log('✅ Serveur arrêté proprement');
    process.exit(0);
  });
});
