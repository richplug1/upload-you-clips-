# 🔑 Google OAuth Configuration - Copy & Paste

## 📍 Authorized JavaScript Origins
**Copy all these URLs (one by one) into Google Cloud Console:**

```
http://localhost:3000
```

```
http://localhost:3001
```

```
http://localhost:5173
```

```
http://127.0.0.1:3000
```

```
http://127.0.0.1:3001
```

```
http://127.0.0.1:5173
```

---

## 🔄 Authorized Redirect URIs
**Copy all these URLs (one by one) into Google Cloud Console:**

```
http://localhost:5000/api/oauth/google/callback
```

```
http://localhost:3000/auth/callback
```

```
http://localhost:3001/auth/callback
```

```
http://localhost:5173/auth/callback
```

```
http://127.0.0.1:5000/api/oauth/google/callback
```

```
http://127.0.0.1:3000/auth/callback
```

```
http://127.0.0.1:3001/auth/callback
```

```
http://127.0.0.1:5173/auth/callback
```

---

## 🎯 Quick Setup Steps:

1. **Go to** [Google Cloud Console](https://console.cloud.google.com/)
2. **Navigate to** APIs & Services → Credentials
3. **Click your OAuth Client ID:** `1077143105260-ruq2rhn2ue71eno57bu91jj73bl8jg3f.apps.googleusercontent.com`
4. **For JavaScript Origins:** Click "ADD URI" → Copy/paste each URL above (no paths allowed)
5. **For Redirect URIs:** Click "ADD URI" → Copy/paste each URI above (paths allowed)
6. **Click SAVE**
7. **Wait 5-10 minutes** for changes to take effect

---

## ✅ Ready to Test!
Once added, test OAuth by clicking "Sign in with Google" in your app!
