#!/bin/bash

echo "🛑 ARRÊT DES SERVEURS UPLOAD YOU CLIPS"
echo "====================================="

# Function to stop servers by process name
stop_servers() {
    echo "🔧 Arrêt du Backend..."
    pkill -f "npm.*start" 2>/dev/null && echo "  ✅ Backend arrêté" || echo "  ⚠️  Backend pas en cours d'exécution"
    
    echo "🎨 Arrêt du Frontend..."
    pkill -f "npm.*dev" 2>/dev/null && echo "  ✅ Frontend arrêté" || echo "  ⚠️  Frontend pas en cours d'exécution"
    
    echo "🔄 Arrêt des processus Node.js restants..."
    pkill -f "node.*index" 2>/dev/null && echo "  ✅ Processus Node.js arrêtés" || echo "  ⚠️  Aucun processus Node.js trouvé"
}

# Function to check if ports are free
check_ports() {
    echo ""
    echo "🔍 Vérification des ports:"
    
    if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "  ❌ Port 5000 (Backend) encore utilisé"
    else
        echo "  ✅ Port 5000 (Backend) libre"
    fi
    
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "  ❌ Port 3000 (Frontend) encore utilisé"
    else
        echo "  ✅ Port 3000 (Frontend) libre"
    fi
}

# Main execution
stop_servers
sleep 2
check_ports

echo ""
echo "✅ SERVEURS ARRÊTÉS"
echo "=================="
echo "💡 Pour redémarrer: ./start-servers.sh"
