#!/bin/bash

# Script utilitaire pour afficher tous les outils de configuration disponibles
# Usage: ./cloud-status.sh

echo "🔍 OUTILS DE CONFIGURATION CLOUD - UPLOAD YOU CLIPS"
echo "===================================================="
echo ""

# Vérifier si nous sommes dans le bon dossier
if [ ! -f "package.json" ] && [ ! -f "server/package.json" ]; then
    echo "❌ Erreur: Ce script doit être exécuté depuis le dossier racine ou server/"
    echo "💡 Commande: ./cloud-status.sh"
    exit 1
fi

# Aller dans le dossier server si nous sommes dans la racine
if [ -f "server/package.json" ]; then
    cd server
fi

echo "📁 Localisation: $(pwd)"
echo "📦 Projet: $(grep '"name"' package.json | cut -d'"' -f4)"
echo ""

echo "🔧 SCRIPTS DE CONFIGURATION DISPONIBLES:"
echo "----------------------------------------"

# Test des services cloud
if [ -f "test-cloud-services.js" ]; then
    echo "✅ test-cloud-services.js - Test de configuration des services"
    echo "   Usage: node test-cloud-services.js"
else
    echo "❌ test-cloud-services.js - Manquant"
fi

# Configuration des services cloud
if [ -f "setup-cloud-services.js" ]; then
    echo "✅ setup-cloud-services.js - Configuration interactive"
    echo "   Usage: node setup-cloud-services.js [s3|email|all]"
else
    echo "❌ setup-cloud-services.js - Manquant"
fi

echo ""
echo "📋 DOCUMENTATION DISPONIBLE:"
echo "----------------------------"

# Documentation principale
if [ -f "../CLOUD_SERVICES_SETUP.md" ]; then
    echo "✅ CLOUD_SERVICES_SETUP.md - Guide complet de configuration"
else
    echo "❌ CLOUD_SERVICES_SETUP.md - Manquant"
fi

# Documentation des scripts
if [ -f "SCRIPTS_CLOUD_README.md" ]; then
    echo "✅ SCRIPTS_CLOUD_README.md - Guide des scripts"
else
    echo "❌ SCRIPTS_CLOUD_README.md - Manquant"
fi

# Audit complet
if [ -f "../AUDIT_COMPLET.md" ]; then
    echo "✅ AUDIT_COMPLET.md - État complet du système"
else
    echo "❌ AUDIT_COMPLET.md - Manquant"
fi

echo ""
echo "⚙️ ÉTAT ACTUEL DES SERVICES:"
echo "---------------------------"

# Vérifier les variables d'environnement
if [ -f ".env" ]; then
    echo "✅ Fichier .env - Présent"
    
    # Stockage cloud
    if grep -q "^AWS_ACCESS_KEY_ID=" .env; then
        echo "✅ Stockage Cloud - Configuré"
    else
        echo "⚠️ Stockage Cloud - Non configuré (mode local actif)"
    fi
    
    # Service email
    if grep -q "^SMTP_HOST=" .env; then
        echo "✅ Service Email - Configuré"
    else
        echo "⚠️ Service Email - Non configuré (mode console actif)"
    fi
else
    echo "❌ Fichier .env - Manquant"
fi

echo ""
echo "🚀 ACTIONS RECOMMANDÉES:"
echo "------------------------"

echo "1. 🧪 Tester l'état actuel:"
echo "   node test-cloud-services.js"
echo ""

echo "2. 🔧 Configurer les services:"
echo "   node setup-cloud-services.js"
echo ""

echo "3. 📖 Lire la documentation:"
echo "   cat ../CLOUD_SERVICES_SETUP.md"
echo ""

echo "4. 🔄 Redémarrer l'application:"
echo "   npm run dev"
echo ""

echo "💡 NOTE: L'application fonctionne sans configuration cloud."
echo "   Les services cloud améliorent l'expérience en production."
echo ""

# Afficher un test rapide si Node.js est disponible
if command -v node &> /dev/null; then
    echo "🔍 TEST RAPIDE (5 secondes)..."
    echo "------------------------------"
    timeout 5s node test-cloud-services.js 2>/dev/null | head -10 || echo "⏰ Timeout - utilisez 'node test-cloud-services.js' pour le test complet"
fi

echo ""
echo "✅ Vérification terminée!"
echo "🆘 En cas de problème, consultez SCRIPTS_CLOUD_README.md"
