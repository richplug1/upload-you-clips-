# Google OAuth Configuration Guide

## 📋 Prerequisites
- A Google account
- Access to Google Cloud Console
- Your application running (frontend on localhost:3000, backend on localhost:5000)

## 🚀 Step 1: Google Cloud Console Configuration

### 1.1 Create a new project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on **"Select a project"** at the top
3. Click on **"NEW PROJECT"**
4. Name your project: `upload-you-clips`
5. Click **"CREATE"**

### 1.2 Enable Google+ API
1. In the left menu, go to **"APIs & Services" > "Library"**
2. Search for **"Google+ API"** or **"People API"**
3. Click on **"Google+ API"**
4. Click **"ENABLE"**

### 1.3 Configure OAuth consent screen
1. Go to **"APIs & Services" > "OAuth consent screen"**
2. Select **"External"** (to test with any Google account)
3. Click **"CREATE"**

#### Fill in the required information:
- **App name**: `Upload You Clips`
- **User support email**: Your email
- **Developer contact information**: Your email
- **Authorized domains**: `localhost` (for development)

4. Click **"SAVE AND CONTINUE"**
5. On the "Scopes" page, click **"SAVE AND CONTINUE"** (keep default scopes)
6. On the "Test users" page, add your email for testing
7. Click **"SAVE AND CONTINUE"**

## 🔑 Step 2: Create OAuth credentials

### 2.1 Create credentials
1. Go to **"APIs & Services" > "Credentials"**
2. Click **"+ CREATE CREDENTIALS"**
3. Select **"OAuth 2.0 Client IDs"**

### 2.2 Configure OAuth client
- **Application type**: `Web application`
- **Name**: `Upload You Clips Web Client`

#### Authorized JavaScript origins:
```
http://localhost:3000
http://127.0.0.1:3000
```

#### Authorized redirect URIs:
```
http://localhost:5000/api/oauth/google/callback
http://localhost:3000/auth/callback
http://127.0.0.1:5000/api/oauth/google/callback
http://127.0.0.1:3000/auth/callback
```

3. Click **"CREATE"**

### 2.3 Get your credentials
After creation, you'll receive:
- **Client ID**: `1234567890-abcdefghijk.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-abcdefghijklmnop`

⚠️ **IMPORTANT**: Keep this information secret!

## 📁 Step 3: Environment variables configuration

### 3.1 Backend (.env)
Create a `.env` file in your server folder:
```env
# Google OAuth
GOOGLE_CLIENT_ID=1234567890-abcdefghijk.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnop
GOOGLE_REDIRECT_URI=http://localhost:5000/api/oauth/google/callback

# Frontend URL for redirections
FRONTEND_URL=http://localhost:3000
```

### 3.2 Frontend (.env.local)
Create a `.env.local` file in your client folder:
```env
# Google OAuth Client ID (public - safe to expose)
VITE_GOOGLE_CLIENT_ID=1234567890-abcdefghijk.apps.googleusercontent.com
```

## 🔧 Step 4: Install dependencies

### Backend
```bash
cd server
npm install passport passport-google-oauth20
```

### Frontend (already installed)
```bash
cd client
# Dependencies already included in the project
```

## 🚀 Step 5: Start your servers

### Start backend:
```bash
cd server
npm run dev
```

### Start frontend:
```bash
cd client
npm run dev
```

## 📝 Step 6: Test the OAuth flow

1. Open your app at http://localhost:3000
2. Click "Login" button in the header
3. Click "Sign in with Google" in the modal
4. You should be redirected to Google's OAuth page
5. Sign in with your Google account
6. You should be redirected back to your app, now logged in

## 📝 Important URLs for reference

- **Google Cloud Console**: https://console.cloud.google.com/
- **OAuth Playground** (for testing): https://developers.google.com/oauthplayground/
- **Google OAuth Documentation**: https://developers.google.com/identity/protocols/oauth2

## ⚠️ Important notes

1. **Development vs Production**:
   - For development: use `localhost`
   - For production: replace with your real domain

2. **Security**:
   - Never expose the `Client Secret` on the frontend
   - Use HTTPS in production
   - Store secrets in environment variables

3. **Limitations**:
   - Google limits the number of requests per day
   - In "Testing" mode, only added users can sign in
   - To publish publicly, you must switch to "Production" mode

## 🧪 Quick test
Once configured, you can test with this URL (replace YOUR_CLIENT_ID):
```
https://accounts.google.com/oauth/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:5000/api/oauth/google/callback&response_type=code&scope=openid%20email%20profile
```

## 🔧 Troubleshooting

### Common issues:

1. **"Error 400: redirect_uri_mismatch"**
   - Make sure your redirect URIs in Google Console match exactly
   - Check for trailing slashes or missing protocols

2. **"Error 403: access_denied"**
   - Add your email to test users in OAuth consent screen
   - Make sure your app is in "Testing" mode for development

3. **"Cannot read properties of undefined"**
   - Check that your environment variables are loaded correctly
   - Restart your servers after adding .env files

4. **OAuth not working in modal**
   - Check browser console for errors
   - Verify that CORS is properly configured on backend

## ✅ Success indicators

When everything works correctly:
- ✅ Login button appears for non-authenticated users
- ✅ Google sign-in modal opens without errors
- ✅ Redirect to Google OAuth page works
- ✅ After Google sign-in, user is redirected back to app
- ✅ User information appears in the header
- ✅ Upload functionality works for authenticated users
