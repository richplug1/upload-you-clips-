#!/bin/bash

echo "🚀 DÉMARRAGE DES SERVEURS UPLOAD YOU CLIPS"
echo "========================================="

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "Port $port est déjà utilisé"
        return 0
    else
        echo "Port $port est libre"
        return 1
    fi
}

# Function to start backend
start_backend() {
    echo "🔧 Démarrage du Backend (port 5000)..."
    cd /workspaces/upload-you-clips-/server
    if check_port 5000; then
        echo "  ⚠️  Backend déjà en cours d'exécution"
    else
        echo "  🔄 Lancement du backend..."
        npm start > /dev/null 2>&1 &
        BACKEND_PID=$!
        echo "  📋 Backend PID: $BACKEND_PID"
        sleep 3
        if check_port 5000; then
            echo "  ✅ Backend démarré avec succès"
        else
            echo "  ❌ Échec du démarrage backend"
        fi
    fi
}

# Function to start frontend
start_frontend() {
    echo "🎨 Démarrage du Frontend (port 3000)..."
    cd /workspaces/upload-you-clips-/client
    if check_port 3000; then
        echo "  ⚠️  Frontend déjà en cours d'exécution"
    else
        echo "  🔄 Lancement du frontend..."
        npm run dev > /dev/null 2>&1 &
        FRONTEND_PID=$!
        echo "  📋 Frontend PID: $FRONTEND_PID"
        sleep 5
        if check_port 3000; then
            echo "  ✅ Frontend démarré avec succès"
        else
            echo "  ❌ Échec du démarrage frontend"
        fi
    fi
}

# Main execution
echo ""
start_backend
echo ""
start_frontend
echo ""

# Final status check
echo "🔍 VÉRIFICATION FINALE:"
echo "======================"
cd /workspaces/upload-you-clips-
./check-status.sh

echo ""
echo "🎯 PRÊT À UTILISER:"
echo "=================="
echo "🔧 Backend API: http://localhost:5000"
echo "🎨 Frontend App: http://localhost:3000"
echo "📚 API Docs: http://localhost:5000/api/docs"
echo "🏥 Health Check: http://localhost:5000/api/health"
echo ""
echo "💡 Pour arrêter les serveurs: pkill -f 'npm.*start' && pkill -f 'npm.*dev'"
