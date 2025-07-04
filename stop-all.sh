#!/bin/bash

echo "🛑 Arrêt de tous les serveurs..."

# Arrêter tous les processus nodemon
echo "Arrêt des processus nodemon..."
pkill -f nodemon

# Arrêter les processus node liés au projet
echo "Arrêt des processus Node.js du projet..."
pkill -f "index_integrated.js"
pkill -f "upload-you-clips"

# Attendre un peu
sleep 2

# Vérifier s'il reste des processus sur les ports
echo "Vérification des ports..."
lsof -ti:5000 | xargs kill -9 2>/dev/null || echo "Port 5000 libre"
lsof -ti:3001 | xargs kill -9 2>/dev/null || echo "Port 3001 libre"

echo "✅ Nettoyage terminé"
echo ""
echo "Pour redémarrer:"
echo "  Backend: cd server && node test-oauth-server.js"
echo "  Frontend: cd client && npm run dev"
