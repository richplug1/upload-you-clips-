# 🚀 Guide de Démarrage Rapide - Google OAuth

## ⚡ Configuration en 5 minutes

### 1. Obtenez vos identifiants Google (5 min)
1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet : `upload-you-clips`
3. Activez l'API Google+ ou People API
4. Configurez l'écran de consentement OAuth (mode "External")
5. Créez des identifiants OAuth 2.0 :
   - Type : Application Web
   - Origins autorisées : `http://localhost:3000`
   - URIs de redirection : `http://localhost:5000/api/oauth/google/callback`

### 2. Configuration Backend (1 min)
```bash
cd server
cp .env.example .env
```

Éditez `.env` et ajoutez vos identifiants :
```bash
GOOGLE_CLIENT_ID=votre-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre-client-secret
```

### 3. Configuration Frontend (1 min)
```bash
cd client
cp .env.example .env.local
```

Éditez `.env.local` et ajoutez votre Client ID :
```bash
VITE_GOOGLE_CLIENT_ID=votre-client-id.apps.googleusercontent.com
```
```

Éditez `.env.local` et ajoutez votre Client ID :
```bash
VITE_GOOGLE_CLIENT_ID=votre-client-id.apps.googleusercontent.com
```

### 4. Redémarrer les serveurs (1 min)
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend  
cd client
npm run dev
```

### 5. Tester (30 secondes)
1. Ouvrez http://localhost:3000
2. Cliquez sur "Login" dans le header
3. Cliquez sur "Sign in with Google"
4. Connectez-vous avec votre compte Google

## ✅ C'est tout !

Votre authentification Google OAuth est maintenant fonctionnelle !

## 🔧 Fonctionnalités disponibles :
- ✅ Connexion avec Google
- ✅ Création automatique de compte
- ✅ Liaison avec comptes existants
- ✅ Session persistante
- ✅ Déconnexion
- ✅ Profil utilisateur

## 🛠️ Dépannage

### Erreur "Google OAuth not configured"
- Vérifiez que `VITE_GOOGLE_CLIENT_ID` est défini dans `client/.env.local`
- Redémarrez le serveur frontend

### Erreur "redirect_uri_mismatch"
- Vérifiez que l'URI de redirection dans Google Console est exactement :
  `http://localhost:5000/api/oauth/google/callback`

### Erreur "unauthorized_client"
- Vérifiez que le Client ID est correct dans les deux fichiers .env
- Assurez-vous que l'API Google+ est activée

## 📚 Pour aller plus loin
- Consultez le fichier `GOOGLE_OAUTH_SETUP.md` pour plus de détails
- Configuration en production : remplacez `localhost` par votre domaine
- Mode production Google : passez en mode "Production" dans Google Console
