# 🚀 SCRIPTS DE CONFIGURATION - SERVICES CLOUD

## Configuration Rapide des Services Cloud

Ce dossier contient des scripts pour configurer facilement les services cloud (stockage S3 et email SMTP) dans votre application Upload You Clips.

---

## 🔧 SCRIPTS DISPONIBLES

### 1. **test-cloud-services.js** - Test de Configuration
```bash
node test-cloud-services.js
```
- Vérifie l'état de configuration des services cloud
- Teste la connectivité (S3 et SMTP)
- Affiche un rapport détaillé avec recommandations

### 2. **setup-cloud-services.js** - Configuration Interactive
```bash
# Configuration complète (stockage + email)
node setup-cloud-services.js

# Configuration stockage seulement
node setup-cloud-services.js s3

# Configuration email seulement
node setup-cloud-services.js email
```
- Interface interactive de configuration
- Support de multiples providers
- Mise à jour automatique du fichier `.env`

---

## 🌟 UTILISATION RECOMMANDÉE

### 1. **Développement Local**
```bash
# Vérifier l'état actuel
node test-cloud-services.js

# L'application fonctionne sans configuration cloud
# Stockage local + emails dans la console
```

### 2. **Configuration pour Production**
```bash
# Étape 1: Tester l'état actuel
node test-cloud-services.js

# Étape 2: Configurer les services
node setup-cloud-services.js

# Étape 3: Vérifier la configuration
node test-cloud-services.js

# Étape 4: Redémarrer l'application
npm run dev
```

---

## 📋 PROVIDERS SUPPORTÉS

### 🗄️ **Stockage Cloud**
- **AWS S3** - Service de stockage Amazon
- **DigitalOcean Spaces** - Alternative économique
- **Cloudflare R2** - Stockage sans frais de sortie

### 📧 **Service Email**
- **Gmail SMTP** - Idéal pour développement
- **SendGrid** - Recommandé pour production
- **Outlook/Hotmail** - Alternative Microsoft
- **SMTP Personnalisé** - Votre propre serveur

---

## 🔍 EXEMPLE DE SORTIE

### Script de Test
```
🔍 Test des Services Cloud - Upload You Clips

☁️ Test du Stockage Cloud (S3)...
⚠️ Stockage cloud non configuré (mode local actif)
💡 Variables manquantes: [ 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET' ]

📧 Test du Service Email (SMTP)...
⚠️ Service email non configuré (mode console actif)
💡 Variables manquantes: [ 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS' ]

📊 RÉSUMÉ DES TESTS
┌─────────────────┬─────────────┬─────────────┬─────────────┐
│ Service         │ Configuré   │ Testé       │ Statut      │
├─────────────────┼─────────────┼─────────────┼─────────────┤
│ Stockage Cloud  │ ❌ Non      │ ❌ Non      │ ⚠️ Non conf. │
│ Service Email   │ ❌ Non      │ ❌ Non      │ ⚠️ Non conf. │
└─────────────────┴─────────────┴─────────────┴─────────────┘
```

### Script de Configuration
```
🚀 Configuration des Services Cloud - Upload You Clips

Que voulez-vous configurer? (1: Stockage Cloud, 2: Email, 3: Les deux): 1

☁️ Configuration du Stockage Cloud (AWS S3)

Choisissez votre provider (1: AWS S3, 2: DigitalOcean Spaces, 3: Cloudflare R2): 1

🔧 Configuration AWS S3

AWS Access Key ID: AKIA...
AWS Secret Access Key: ****
AWS Region (défaut: us-east-1): us-west-2
Nom du bucket S3: my-upload-clips-bucket

✅ Configuration AWS S3 prête
✅ Fichier .env mis à jour

🎉 Configuration terminée!
🔄 Redémarrez le serveur pour appliquer les changements: npm run dev
🧪 Testez la configuration: node test-cloud-services.js
```

---

## 🔒 SÉCURITÉ

### Variables d'Environnement
- Les scripts modifient uniquement le fichier `.env`
- Aucune clé API n'est stockée dans le code
- Le fichier `.env` est ignoré par Git

### Bonnes Pratiques
- Utilisez des **App Passwords** pour Gmail/Outlook
- Activez la **2-Step Verification**
- Limitez les permissions des clés API
- Rotation régulière des clés (90 jours)

---

## 🆘 DÉPANNAGE

### Problèmes Courants

#### 1. **Erreur SMTP Gmail**
```
Error: Invalid login: 534-5.7.9 Application-specific password required
```
**Solution:** Créez un App Password dans les paramètres Google

#### 2. **Erreur S3 Access Denied**
```
Error: Access Denied
```
**Solution:** Vérifiez les permissions IAM de votre utilisateur

#### 3. **Erreur de Connexion SMTP**
```
Error: ECONNECTION: connect ECONNREFUSED
```
**Solution:** Vérifiez le SMTP_HOST et SMTP_PORT

#### 4. **Variables Non Trouvées**
```
Error: Cannot read properties of undefined
```
**Solution:** Vérifiez que le fichier `.env` existe et est bien formaté

---

## 📚 RESSOURCES

### Documentation Officielle
- [CLOUD_SERVICES_SETUP.md](../CLOUD_SERVICES_SETUP.md) - Guide complet
- [AUDIT_COMPLET.md](../AUDIT_COMPLET.md) - État du système

### Liens Utiles
- [AWS S3 Console](https://console.aws.amazon.com/s3/)
- [DigitalOcean Spaces](https://cloud.digitalocean.com/spaces)
- [Cloudflare R2](https://dash.cloudflare.com/r2)
- [SendGrid](https://sendgrid.com/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)

---

## 🤝 SUPPORT

En cas de problème :
1. Vérifiez les logs : `tail -f logs/combined.log`
2. Testez la configuration : `node test-cloud-services.js`
3. Consultez la documentation : `CLOUD_SERVICES_SETUP.md`
4. Redémarrez l'application : `npm run dev`

---

**💡 Astuce:** L'application fonctionne parfaitement sans configuration cloud. Les services cloud sont optionnels et améliorent l'expérience en production.
