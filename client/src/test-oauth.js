// Test script pour vérifier la configuration OAuth
console.log('=== Test Configuration OAuth ===');
console.log('VITE_GOOGLE_CLIENT_ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);
console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);

// Test de la communication avec l'API
async function testOAuthEndpoint() {
  try {
    const response = await fetch('http://localhost:5000/api/oauth/google/url');
    const data = await response.json();
    console.log('Réponse de l\'API OAuth:', data);
  } catch (error) {
    console.error('Erreur lors du test de l\'API OAuth:', error);
  }
}

testOAuthEndpoint();
