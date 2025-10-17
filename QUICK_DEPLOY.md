# 🚀 Quick Netlify Deployment Checklist

## ✅ Files Ready (Pushed to GitHub)
- `netlify.toml` - Configuration
- `netlify/functions/api.js` - Backend serverless function
- `netlify/package.json` - Function dependencies
- `frontend/.env.production` - Production environment
- `NETLIFY_DEPLOY.md` - Full guide

## 📋 Deployment Steps (5 minutes)

### 1. Go to Netlify
🔗 https://app.netlify.com

### 2. Click "Add new site"
→ Import an existing project
→ Choose GitHub
→ Select: `atharvgarg18/ab`

### 3. Auto-configured (via netlify.toml)
✅ Base directory: `frontend`
✅ Build command: `npm install && npm run build`
✅ Publish directory: `frontend/dist`
✅ Functions: `netlify/functions`

### 4. Set Environment Variables ⚠️ CRITICAL
Go to: Site settings → Environment variables

Add these 3 variables:

```
MONGODB_URI
mongodb+srv://atharv:admin1234@smarttimetable.wudxm.mongodb.net/timetable?retryWrites=true&w=majority

GEMINI_API_KEY
(your Gemini API key from backend/.env)

NODE_VERSION
18
```

### 5. Deploy Site
Click "Deploy site" button
Wait 3-5 minutes

### 6. Test Your Site
Visit: `https://[random-name].netlify.app`

Test:
- ✅ Upload timetable
- ✅ Create tasks
- ✅ Drag and drop
- ✅ ChatBot

### 7. Rename (Optional)
Site settings → Change site name
Example: `smart-timetable-app`

## 🎯 That's It!

Your app is now live with:
- Frontend (React)
- Backend (Netlify Functions)
- Database (MongoDB Atlas)
- AI (Gemini API)

All on one platform! 🎉

## 📞 Need Help?
Check the full guide: `NETLIFY_DEPLOY.md`
