# Google OAuth Quick Start Guide

## ⚡ Quick Setup (5 minutes)

### 1️⃣ Get Google Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: `upload-you-clips`
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Copy your **Client ID** and **Client Secret**

### 2️⃣ Configure Environment Variables

**Backend** - Create `server/.env`:
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/oauth/google/callback
FRONTEND_URL=http://localhost:3000
```

**Frontend** - Create `client/.env.local`:
```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### 3️⃣ Required Redirect URIs in Google Console
Add these exact URIs in Google Cloud Console:
```
http://localhost:5000/api/oauth/google/callback
http://localhost:3000/auth/callback
```

### 4️⃣ Test
1. Start servers: `npm run dev` (in both server and client folders)
2. Go to http://localhost:3000
3. Click "Login" → "Sign in with Google"
4. ✅ Success!

## 🔗 Detailed guide
For detailed instructions, see [GOOGLE_OAUTH_SETUP_EN.md](./GOOGLE_OAUTH_SETUP_EN.md)

## 🆘 Need help?
- Check browser console for errors
- Verify environment variables are loaded
- Ensure redirect URIs match exactly in Google Console
