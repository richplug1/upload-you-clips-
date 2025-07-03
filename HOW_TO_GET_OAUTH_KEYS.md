# 🔑 How to Get Google OAuth API Keys - Step by Step

## 📋 What You'll Get
After following this guide, you'll have:
- **Client ID**: `1077143105260-lfqpc6kvqdg1vsq3e92a5ce5l7kants9.apps.googleusercontent.com` (public, safe to use in frontend)
- **Client Secret**: `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` (private, only for backend)

---

## 🚀 Step-by-Step Instructions

### 📝 Step 1: Access Google Cloud Console
1. **Open your browser** and go to: https://console.cloud.google.com/
2. **Sign in** with your Google account
3. You'll see the Google Cloud Console dashboard

### 📁 Step 2: Create a New Project
1. **Look at the top of the page** - you'll see a project selector (usually says "Select a project")
2. **Click on the project selector**
3. **Click "NEW PROJECT"** button (top right of the popup)
4. **Fill in the project details:**
   - **Project name**: `upload-you-clips` (or any name you prefer)
   - **Organization**: Leave as default
   - **Location**: Leave as default
5. **Click "CREATE"** button
6. **Wait for the project to be created** (usually takes 10-30 seconds)
7. **Make sure your new project is selected** in the project selector

### 🔌 Step 3: Enable the Required APIs
1. **In the left sidebar**, click on **"APIs & Services"**
2. **Click on "Library"**
3. **Search for "Google+ API"** in the search box
4. **Click on "Google+ API"** from the results
5. **Click the "ENABLE" button**
6. **Wait for it to enable** (usually instant)

*Alternative: You can also enable "People API" which provides similar functionality*

### 🛡️ Step 4: Configure OAuth Consent Screen
This step is REQUIRED before creating credentials.

1. **Go back to "APIs & Services"** in the left sidebar
2. **Click on "OAuth consent screen"**
3. **Choose "External"** (this allows any Google user to sign in)
4. **Click "CREATE"**

#### Fill in the OAuth Consent Screen Form:

**Page 1 - App Information:**
- **App name**: `Upload You Clips`
- **User support email**: Your email address
- **App logo**: (optional - you can skip this)
- **App domain**: (optional for development)
- **Authorized domains**: Type `localhost` (for development)
- **Developer contact information**: Your email address
- **Click "SAVE AND CONTINUE"**

**Page 2 - Scopes:**
- **Leave everything as default**
- **Click "SAVE AND CONTINUE"**

**Page 3 - Test Users:**
- **Add your email address** (this allows you to test the app)
- **Add any other emails** of people who should be able to test
- **Click "SAVE AND CONTINUE"**

**Page 4 - Summary:**
- **Review everything**
- **Click "BACK TO DASHBOARD"**

### 🔑 Step 5: Create OAuth 2.0 Credentials
This is where you get your actual API keys!

1. **Go to "APIs & Services" > "Credentials"**
2. **Click the "+ CREATE CREDENTIALS" button**
3. **Select "OAuth 2.0 Client IDs"**

#### Configure the OAuth Client:

**Application type**: Select **"Web application"**

**Name**: `Upload You Clips Web Client` (or any descriptive name)

**Authorized JavaScript origins**:
Click "ADD URI" and add these one by one:
```
http://localhost:3000
http://localhost:3001
http://127.0.0.1:3000
http://127.0.0.1:3001
```

**Authorized redirect URIs**:
Click "ADD URI" and add these one by one:
```
http://localhost:5000/api/oauth/google/callback
http://localhost:3000/auth/callback
http://localhost:3001/auth/callback
http://127.0.0.1:5000/api/oauth/google/callback
http://127.0.0.1:3000/auth/callback
http://127.0.0.1:3001/auth/callback
```

**Click "CREATE"**

### 🎉 Step 6: Get Your Credentials
After creating the OAuth client, a popup will appear with your credentials:

**Copy these values immediately:**
- **Client ID**: `1077143105260-lfqpc6kvqdg1vsq3e92a5ce5l7kants9.apps.googleusercontent.com`
- **Client secret**: `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`

⚠️ **IMPORTANT**: 
- **Save these somewhere safe!**
- **The Client Secret is private** - never share it publicly
- **The Client ID is public** - safe to use in frontend code

### 📝 Step 7: Download Credentials (Optional)
You can also:
1. **Click "DOWNLOAD JSON"** to save the credentials file
2. **Or click "OK"** and find your credentials later in the credentials list

---

## 🔧 Setting Up Your Environment Files

### Backend Configuration
Create `server/.env` file:
```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=1077143105260-lfqpc6kvqdg1vsq3e92a5ce5l7kants9.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=http://localhost:5000/api/oauth/google/callback
FRONTEND_URL=http://localhost:3001

# Other existing configurations...
PORT=5000
JWT_SECRET=your-jwt-secret
```

### Frontend Configuration  
Create `client/.env.local` file:
```env
# Google OAuth (only Client ID - safe for frontend)
VITE_GOOGLE_CLIENT_ID=1077143105260-lfqpc6kvqdg1vsq3e92a5ce5l7kants9.apps.googleusercontent.com

# Other existing configurations...
VITE_API_BASE_URL=http://localhost:5000
```

---

## 🧪 Testing Your Setup

### 1. Restart Your Servers
```bash
# Backend
cd server
npm run dev

# Frontend (in another terminal)
cd client  
npm run dev
```

### 2. Test the OAuth Flow
1. **Open**: http://localhost:3001 (or whatever port your frontend is on)
2. **Click "Login"** in the top right
3. **Click "Sign in with Google"**
4. **You should be redirected to Google**
5. **Sign in with your Google account**
6. **You should be redirected back to your app, now logged in**

### 3. Verify Backend API
```bash
# This should return a Google OAuth URL:
curl http://localhost:5000/api/oauth/google/url

# Expected response:
{
  "success": true,
  "authUrl": "https://accounts.google.com/oauth/v2/auth?..."
}
```

---

## 🔍 Finding Your Credentials Later

If you lose your credentials:

1. **Go to Google Cloud Console**
2. **Select your project**
3. **Go to "APIs & Services" > "Credentials"**
4. **Find your OAuth 2.0 Client ID** in the list
5. **Click on it to view/edit**
6. **Client ID is visible, but you'll need to reset Client Secret if lost**

---

## 🛠️ Troubleshooting

### "Failed to start Google authentication" ou "Registration failed"
- **Cause possible**: Le frontend ne peut pas se connecter au backend
- **Solution**: Vérifiez que le backend fonctionne sur le port 5000
```bash
curl http://localhost:5000/api/oauth/google/url
```

### "Error 400: redirect_uri_mismatch"
- **Check**: Your redirect URIs in Google Console match exactly what your app is using
- **Solution**: Make sure you added all the redirect URIs listed in Step 5
- **Note**: Si votre frontend fonctionne sur un port différent (ex: 3003), ajoutez les URIs correspondantes

### "Error 403: access_denied"  
- **Check**: You're signed in with an email added to "Test users"
- **Solution**: Add your email in "OAuth consent screen" > "Test users"
- **IMPORTANT**: Ceci est la cause la plus fréquente d'échec d'inscription Google OAuth

### "This app isn't verified"
- **This is normal for development**
- **Click "Advanced" then "Go to Upload You Clips (unsafe)"**
- **For production, you'll need to verify your app**

### OAuth not working in your app
- **Check**: Environment variables are correctly set
- **Check**: Servers are restarted after adding .env files
- **Check**: No typos in Client ID/Secret

---

## 📱 Mobile/Production Setup

For production or mobile apps:
1. **Add your production domain** to Authorized JavaScript origins
2. **Add your production redirect URIs**
3. **Switch from "Testing" to "Production"** in OAuth consent screen
4. **Use HTTPS** for all URLs in production

---

## ✅ Success Checklist

- ✅ Google Cloud project created
- ✅ Google+ API enabled
- ✅ OAuth consent screen configured
- ✅ OAuth 2.0 credentials created
- ✅ Client ID and Client Secret copied
- ✅ Environment files configured
- ✅ Servers restarted
- ✅ OAuth flow tested successfully

**🎉 You now have working Google OAuth authentication!**
