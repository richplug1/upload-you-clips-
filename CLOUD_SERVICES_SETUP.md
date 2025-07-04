# 🔧 CONFIGURATION DES SERVICES CLOUD
## Guide de Configuration pour le Stockage Cloud et Email

**Date:** 4 Juillet 2025  
**Version:** 1.0.0  
**Statut:** Guide de Configuration  

---

## 📋 RÉSUMÉ DE CONFIGURATION

### ✅ Services Installés et Configurés
- **AWS S3 SDK** - Installé et prêt à l'emploi
- **Nodemailer** - Installé et prêt à l'emploi
- **Services Backend** - Stubs fonctionnels créés
- **Variables d'environnement** - Templates configurés

### ⚙️ Actions Requises pour Production
- **Stockage Cloud** - Configurer les clés API AWS/alternatives
- **Service Email** - Configurer les paramètres SMTP
- **Tests** - Valider les configurations

---

## ☁️ CONFIGURATION STOCKAGE CLOUD (AWS S3)

### 1. **Option 1: AWS S3 (Recommandé)**

#### A. Créer un Bucket S3
1. Connectez-vous à [AWS Console](https://console.aws.amazon.com/)
2. Allez dans **S3** → **Create bucket**
3. Nom du bucket: `upload-you-clips-storage` (ou votre nom)
4. Région: `us-east-1` (ou votre région)
5. Permissions: **Public access** désactivé (sécurisé)

#### B. Créer un Utilisateur IAM
1. Allez dans **IAM** → **Users** → **Create user**
2. Nom: `upload-you-clips-s3-user`
3. **Attach policies**: `AmazonS3FullAccess`
4. **Create access key** → **Application running on AWS compute service**
5. Copiez `Access Key ID` et `Secret Access Key`

#### C. Configuration dans `.env`
```bash
# Décommentez et configurez ces lignes dans server/.env
AWS_ACCESS_KEY_ID=AKIA...votre-clé-access-20-caractères
AWS_SECRET_ACCESS_KEY=votre-clé-secrète-40-caractères
AWS_REGION=us-east-1
AWS_S3_BUCKET=upload-you-clips-storage
```

### 2. **Option 2: DigitalOcean Spaces (Alternative)**

#### A. Créer un Space
1. Connectez-vous à [DigitalOcean](https://cloud.digitalocean.com/)
2. Allez dans **Spaces** → **Create a Space**
3. Nom: `upload-you-clips-space`
4. Région: `NYC3` (ou votre région)

#### B. Générer les Clés API
1. **API** → **Spaces Keys** → **Generate New Key**
2. Nom: `upload-you-clips-key`
3. Copiez `Access Key` et `Secret Key`

#### C. Configuration dans `.env`
```bash
# Décommentez et configurez ces lignes dans server/.env
AWS_ACCESS_KEY_ID=votre-spaces-access-key
AWS_SECRET_ACCESS_KEY=votre-spaces-secret-key
AWS_REGION=nyc3
AWS_S3_BUCKET=upload-you-clips-space
AWS_ENDPOINT=https://nyc3.digitaloceanspaces.com
```

### 3. **Option 3: Cloudflare R2 (Alternative)**

#### A. Créer un Bucket R2
1. Connectez-vous à [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Allez dans **R2** → **Create bucket**
3. Nom: `upload-you-clips-r2`

#### B. Créer un Token API
1. **R2** → **Manage R2 API tokens** → **Create API token**
2. Nom: `upload-you-clips-token`
3. Permissions: **Object Read & Write**
4. Copiez `Access Key ID` et `Secret Access Key`

#### C. Configuration dans `.env`
```bash
# Décommentez et configurez ces lignes dans server/.env
AWS_ACCESS_KEY_ID=votre-r2-access-key
AWS_SECRET_ACCESS_KEY=votre-r2-secret-key
AWS_REGION=auto
AWS_S3_BUCKET=upload-you-clips-r2
AWS_ENDPOINT=https://account-id.r2.cloudflarestorage.com
```

---

## 📧 CONFIGURATION SERVICE EMAIL (SMTP)

### 1. **Option 1: Gmail SMTP (Recommandé pour Développement)**

#### A. Configurer Gmail
1. Activez la **2-Step Verification** sur votre compte Google
2. Allez dans **App passwords** → **Select app: Mail**
3. Générez un **App password** (16 caractères)
4. Copiez le mot de passe généré

#### B. Configuration dans `.env`
```bash
# Décommentez et configurez ces lignes dans server/.env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-app-password-16-caractères
EMAIL_FROM=noreply@uploadyouclips.com
```

### 2. **Option 2: SendGrid (Recommandé pour Production)**

#### A. Créer un Compte SendGrid
1. Inscrivez-vous sur [SendGrid](https://sendgrid.com/)
2. Vérifiez votre compte et domaine
3. Créez une **API Key** → **Full Access**
4. Copiez la clé API générée

#### B. Configuration dans `.env`
```bash
# Décommentez et configurez ces lignes dans server/.env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.votre-sendgrid-api-key
EMAIL_FROM=noreply@votredomaine.com
```

### 3. **Option 3: Outlook/Hotmail**

#### A. Configurer Outlook
1. Activez la **2-Step Verification**
2. Créez un **App password** spécifique
3. Copiez le mot de passe généré

#### B. Configuration dans `.env`
```bash
# Décommentez et configurez ces lignes dans server/.env
SMTP_HOST=smtp.live.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@outlook.com
SMTP_PASS=votre-app-password
EMAIL_FROM=noreply@uploadyouclips.com
```

### 4. **Option 4: Serveur SMTP Personnalisé**

#### Configuration dans `.env`
```bash
# Décommentez et configurez ces lignes dans server/.env
SMTP_HOST=mail.votredomaine.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@votredomaine.com
SMTP_PASS=votre-mot-de-passe-email
EMAIL_FROM=noreply@votredomaine.com
```

---

## 🧪 TESTS DE CONFIGURATION

### 1. **Tester le Stockage Cloud**
```bash
# Depuis le dossier server/
node -e "
const cloudStorage = require('./services/cloudStorage');
console.log('Cloud Storage Status:', cloudStorage.isConfigured());
cloudStorage.getStorageStats().then(stats => {
  console.log('Stats:', stats);
}).catch(err => {
  console.error('Error:', err.message);
});
"
```

### 2. **Tester le Service Email**
```bash
# Depuis le dossier server/
node -e "
const emailService = require('./services/emailService');
console.log('Email Service Status:', emailService.isConfigured());
emailService.sendWelcomeEmail('test@example.com', 'Test User').then(() => {
  console.log('Email sent successfully');
}).catch(err => {
  console.error('Error:', err.message);
});
"
```

### 3. **Tester via API**
```bash
# Test stockage cloud
curl -X GET "http://localhost:5000/api/admin/storage-stats" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test service email (si endpoint créé)
curl -X POST "http://localhost:5000/api/admin/test-email" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com"}'
```

---

## 🔄 PROCESSUS DE MIGRATION

### 1. **Migration des Fichiers Existants vers S3**
```bash
# Créer un script de migration (optionnel)
node -e "
const cloudStorage = require('./services/cloudStorage');
const fs = require('fs');
const path = require('path');

async function migrateFiles() {
  const uploadsDir = './uploads';
  const files = fs.readdirSync(uploadsDir);
  
  for (const file of files) {
    const filePath = path.join(uploadsDir, file);
    try {
      const result = await cloudStorage.uploadFile(filePath, \`migrated/\${file}\`);
      console.log(\`Migrated: \${file}\`);
    } catch (error) {
      console.error(\`Failed to migrate \${file}:\`, error.message);
    }
  }
}

migrateFiles();
"
```

### 2. **Nettoyage des Fichiers Locaux**
```bash
# Après migration réussie, nettoyer les fichiers locaux
# ⚠️ ATTENTION: Vérifiez que tous les fichiers sont bien migrés avant!
rm -rf ./uploads/*
rm -rf ./clips/*
rm -rf ./thumbnails/*
```

---

## 📊 MONITORING ET SURVEILLANCE

### 1. **Surveillance des Coûts**
- **AWS S3**: Configurez des alertes de coût dans AWS CloudWatch
- **DigitalOcean**: Surveillez l'utilisation dans le dashboard
- **Cloudflare R2**: Surveillez les métriques R2

### 2. **Surveillance des Emails**
- **SendGrid**: Dashboard d'analytics intégré
- **Gmail**: Limitations de quotas (surveillez les erreurs)
- **Outlook**: Limitations de quotas (surveillez les erreurs)

### 3. **Logs et Erreurs**
```bash
# Vérifier les logs du service
tail -f logs/combined.log | grep -E "(S3|email|cloud)"

# Vérifier les erreurs spécifiques
tail -f logs/error.log | grep -E "(S3|SMTP|email)"
```

---

## 🚨 SÉCURITÉ ET BONNES PRATIQUES

### 1. **Sécurité des Clés API**
- ❌ **Ne jamais** commiter les clés dans Git
- ✅ Utiliser des variables d'environnement
- ✅ Rotation régulière des clés (tous les 90 jours)
- ✅ Permissions minimales nécessaires

### 2. **Sécurité des Emails**
- ✅ Utiliser des **App Passwords** au lieu des mots de passe principaux
- ✅ Activer la **2-Step Verification**
- ✅ Limiter les permissions SMTP
- ✅ Surveiller les quotas d'envoi

### 3. **Sécurité du Stockage**
- ✅ Buckets privés par défaut
- ✅ Politique IAM restrictive
- ✅ Chiffrement au repos activé
- ✅ Versioning activé (pour S3)

---

## 🎯 RÉSUMÉ DES ACTIONS

### ✅ **Pour Activer le Stockage Cloud:**
1. Choisir un provider (AWS S3, DigitalOcean, Cloudflare R2)
2. Créer un bucket/space
3. Générer les clés API
4. Décommenter et configurer les variables dans `.env`
5. Redémarrer le serveur
6. Tester la configuration

### ✅ **Pour Activer le Service Email:**
1. Choisir un provider (Gmail, SendGrid, Outlook, Custom)
2. Configurer l'authentification (App Password, API Key)
3. Décommenter et configurer les variables dans `.env`
4. Redémarrer le serveur
5. Tester l'envoi d'email

### ✅ **Validation:**
- Services configurés et testés
- Logs propres sans erreurs
- Fallback local fonctionnel en cas de problème
- Monitoring activé

---

**📝 Note:** Les services fonctionnent en mode fallback par défaut. La configuration cloud est optionnelle pour le développement mais recommandée pour la production.
