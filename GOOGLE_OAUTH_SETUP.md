# Guide de Configuration Google OAuth

## 📋 Prérequis
- Un compte Google
- Accès à Google Cloud Console
- Votre application en cours d'exécution (frontend sur localhost:3000, backend sur localhost:5000)

## 🚀 Étape 1 : Configuration Google Cloud Console

### 1.1 Créer un nouveau projet
1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Cliquez sur **"Select a project"** en haut
3. Cliquez sur **"NEW PROJECT"**
4. Nommez votre projet : `upload-you-clips`
5. Cliquez sur **"CREATE"**

### 1.2 Activer l'API Google+
1. Dans le menu de gauche, allez à **"APIs & Services" > "Library"**
2. Recherchez **"Google+ API"** ou **"People API"**
3. Cliquez sur **"Google+ API"**
4. Cliquez sur **"ENABLE"**

### 1.3 Configurer l'écran de consentement OAuth
1. Allez à **"APIs & Services" > "OAuth consent screen"**
2. Sélectionnez **"External"** (pour tester avec n'importe quel compte Google)
3. Cliquez sur **"CREATE"**

#### Remplissez les informations requises :
- **App name** : `Upload You Clips`
- **User support email** : Votre email
- **Developer contact information** : Votre email
- **Authorized domains** : `localhost` (pour le développement)

4. Cliquez sur **"SAVE AND CONTINUE"**
5. Sur la page "Scopes", cliquez **"SAVE AND CONTINUE"** (gardez les scopes par défaut)
6. Sur la page "Test users", ajoutez votre email pour les tests
7. Cliquez sur **"SAVE AND CONTINUE"**

## 🔑 Étape 2 : Créer les identifiants OAuth

### 2.1 Créer les identifiants
1. Allez à **"APIs & Services" > "Credentials"**
2. Cliquez sur **"+ CREATE CREDENTIALS"**
3. Sélectionnez **"OAuth 2.0 Client IDs"**

### 2.2 Configurer le client OAuth
- **Application type** : `Web application`
- **Name** : `Upload You Clips Web Client`

#### JavaScript origins autorisées :
```
http://localhost:3000
http://127.0.0.1:3000
```

#### URIs de redirection autorisées :
```
http://localhost:3000
http://localhost:3000/auth/callback
http://127.0.0.1:3000
http://127.0.0.1:3000/auth/callback
```

3. Cliquez sur **"CREATE"**

### 2.3 Récupérer vos identifiants
Après création, vous obtiendrez :
- **Client ID** : `1234567890-abcdefghijk.apps.googleusercontent.com`
- **Client Secret** : `GOCSPX-abcdefghijklmnop`

⚠️ **IMPORTANT** : Gardez ces informations secrètes !

## 📁 Étape 3 : Configuration des variables d'environnement

### 3.1 Backend (.env)
```env
# Google OAuth
GOOGLE_CLIENT_ID=1234567890-abcdefghijk.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnop
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback

# Frontend URL pour les redirections
FRONTEND_URL=http://localhost:3000
```

### 3.2 Frontend (.env.local)
```env
# Google OAuth Client ID (publique)
REACT_APP_GOOGLE_CLIENT_ID=1234567890-abcdefghijk.apps.googleusercontent.com
```

## 🔧 Étape 4 : Installation des dépendances

### Backend
```bash
npm install passport passport-google-oauth20 passport-jwt
```

### Frontend
```bash
npm install @google-cloud/local-auth googleapis
```

## 📝 Étape 5 : URLs importantes pour référence

- **Google Cloud Console** : https://console.cloud.google.com/
- **OAuth Playground** (pour tester) : https://developers.google.com/oauthplayground/
- **Documentation Google OAuth** : https://developers.google.com/identity/protocols/oauth2

## ⚠️ Notes importantes

1. **Développement vs Production** :
   - Pour le développement : utilisez `localhost`
   - Pour la production : remplacez par votre vrai domaine

2. **Sécurité** :
   - Ne jamais exposer le `Client Secret` côté frontend
   - Utilisez HTTPS en production
   - Stockez les secrets dans des variables d'environnement

3. **Limites** :
   - Google limite le nombre de requêtes par jour
   - En mode "Testing", seuls les utilisateurs ajoutés peuvent se connecter
   - Pour publier publiquement, vous devez passer en mode "Production"

## 🧪 Test rapide
Une fois configuré, vous pouvez tester avec cette URL :
```
https://accounts.google.com/oauth/v2/auth?client_id=VOTRE_CLIENT_ID&redirect_uri=http://localhost:3000&response_type=code&scope=openid%20email%20profile
```
