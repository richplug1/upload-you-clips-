#!/bin/bash

echo "🔍 VÉRIFICATION RAPIDE DES SERVEURS"
echo "=================================="

# Test Backend
echo "🔧 Backend (localhost:5000):"
if curl -s http://localhost:5000/ > /dev/null; then
    echo "  ✅ Serveur actif"
    curl -s http://localhost:5000/ | jq -r '.message, .status'
else
    echo "  ❌ Serveur inactif"
fi

echo ""

# Test Frontend  
echo "🎨 Frontend (localhost:3000):"
if curl -s http://localhost:3000/ > /dev/null; then
    echo "  ✅ Serveur actif"
    echo "  📱 Interface disponible à http://localhost:3000"
else
    echo "  ❌ Serveur inactif"
fi

echo ""

# Test OAuth
echo "🔐 OAuth Google:"
if curl -s http://localhost:5000/api/oauth/google/url > /dev/null; then
    OAUTH_RESPONSE=$(curl -s http://localhost:5000/api/oauth/google/url)
    if echo "$OAUTH_RESPONSE" | grep -q '"success":true'; then
        echo "  ✅ OAuth configuré et fonctionnel"
        echo "  🔑 Client ID: $(echo "$OAUTH_RESPONSE" | grep -o 'client_id=[^&]*' | cut -d= -f2)"
    else
        echo "  ❌ OAuth non configuré"
    fi
else
    echo "  ❌ Endpoint OAuth inaccessible"
fi

echo ""
echo "🎯 POUR TESTER OAUTH:"
echo "1. Ajoutez les URLs de oauth-origins.txt et oauth-redirects.txt dans Google Cloud Console"
echo "2. Ouvrez http://localhost:3000"
echo "3. Cliquez 'Login' puis 'Sign in with Google'"
