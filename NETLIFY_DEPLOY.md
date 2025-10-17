# Netlify Deployment Guide - Full Stack

## ✅ Project Structure Ready
Your project is now configured to deploy BOTH frontend and backend on Netlify!

## How It Works
- **Frontend**: React app built and served from `frontend/dist`
- **Backend**: Serverless functions in `netlify/functions/api.js`
- **API Routing**: `/api/*` requests automatically proxied to Netlify Functions

## Deployment Steps

### Step 1: Push to GitHub (Already Done ✓)
```bash
git add .
git commit -m "Configure for Netlify deployment"
git push origin main
```

### Step 2: Deploy on Netlify

#### Option A: Netlify Dashboard (Easiest - Recommended)

1. **Go to Netlify**
   - Visit: https://app.netlify.com
   - Sign in with GitHub

2. **Import Your Project**
   - Click "Add new site" → "Import an existing project"
   - Choose "GitHub"
   - Authorize Netlify to access your GitHub
   - Select repository: `atharvgarg18/ab`

3. **Configure Build Settings**
   - Netlify will auto-detect settings from `netlify.toml`
   - Verify:
     - **Base directory**: `frontend`
     - **Build command**: `npm install && npm run build`
     - **Publish directory**: `frontend/dist`
     - **Functions directory**: `netlify/functions`

4. **Set Environment Variables** (CRITICAL!)
   - Go to Site settings → Environment variables → Add variables
   - Add these three variables:
   
   ```
   MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/timetable?retryWrites=true&w=majority
   GEMINI_API_KEY = your_gemini_api_key_here
   NODE_VERSION = 18
   ```

5. **Deploy Site**
   - Click "Deploy site"
   - Wait 3-5 minutes for build
   - Your site will be live at: `https://[random-name].netlify.app`

6. **Test Your Deployment**
   - Visit your site URL
   - Try uploading a timetable
   - Create tasks and use the chatbot
   - Check browser console for errors

7. **Rename Your Site** (Optional)
   - Site settings → General → Change site name
   - Choose something like: `my-smart-timetable.netlify.app`

#### Option B: Netlify CLI

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy from project root
cd /Users/dev/Downloads/ab
netlify deploy --prod

# Follow prompts and use these settings:
# - Build command: npm install && npm run build
# - Publish directory: frontend/dist
# - Functions directory: netlify/functions
```

## Environment Variables Required

Set these in Netlify Dashboard (Site settings → Environment variables):

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIzaSy...` |
| `NODE_VERSION` | Node.js version | `18` |

**Where to find these:**
- `MONGODB_URI`: Your existing MongoDB Atlas connection string
- `GEMINI_API_KEY`: Your existing Gemini API key
- Both are currently in `/backend/.env`

## Project Structure

```
ab/
├── frontend/                 # React frontend
│   ├── dist/                # Built files (created during build)
│   ├── src/
│   └── package.json
├── backend/                  # Original backend code
│   └── src/
│       ├── models/          # Mongoose models (used by functions)
│       ├── services/        # Business logic (used by functions)
│       └── controllers/
├── netlify/                  # Netlify-specific files
│   ├── functions/
│   │   └── api.js          # Main serverless function handler
│   └── package.json         # Function dependencies
└── netlify.toml             # Netlify configuration
```

## How Netlify Functions Work

1. **Frontend makes API call**: `/api/timetable/upload`
2. **Netlify redirects** (via `netlify.toml`): `/.netlify/functions/api/timetable/upload`
3. **Function executes**: `netlify/functions/api.js` handles the request
4. **Response returned**: JSON data back to frontend

## Testing Your Deployment

### 1. Test Health Endpoint
```bash
curl https://your-site.netlify.app/api/health
```

Should return:
```json
{
  "status": "ok",
  "message": "Netlify Function API is running",
  "timestamp": "2025-10-17T..."
}
```

### 2. Test in Browser
- Visit your deployed site
- Open DevTools → Network tab
- Upload a timetable image
- Check API requests are successful (200 status)

### 3. Common Issues

**Build Fails**
- Check build logs in Netlify dashboard
- Verify Node version is 18
- Ensure all dependencies are listed in package.json

**API Calls Return 404**
- Check environment variables are set
- Verify `netlify.toml` redirects are correct
- Check function logs in Netlify dashboard

**MongoDB Connection Fails**
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas allows Netlify IPs (allow all IPs: 0.0.0.0/0)
- Test connection string locally first

**File Upload Fails**
- Netlify Functions have 10MB limit (already configured)
- Check file size isn't too large
- Verify multer is configured correctly

**Gemini API Fails**
- Verify `GEMINI_API_KEY` is set correctly
- Check API key has proper permissions
- Test API key directly

## Continuous Deployment

Once connected to GitHub:
- ✅ **Every push to `main`** → Auto-deploy to production
- ✅ **Pull requests** → Create preview deployments
- ✅ **Rollback** → Revert to any previous deploy
- ✅ **Build logs** → See what happened during deployment

## Monitoring & Logs

### Function Logs
- Netlify Dashboard → Functions → View logs
- See console.log() outputs
- Debug errors and performance

### Build Logs  
- Netlify Dashboard → Deploys → Click deploy → View logs
- See npm install and build output

### Analytics
- Netlify Dashboard → Analytics
- Page views, bandwidth, function invocations

## Performance Optimization

Netlify automatically provides:
- ✅ **CDN**: Global edge network
- ✅ **HTTPS**: Free SSL certificate
- ✅ **Caching**: Static assets cached at edge
- ✅ **Compression**: Gzip/Brotli enabled
- ✅ **HTTP/2**: Modern protocol support

## Cost

**Free Tier Includes:**
- 100GB bandwidth/month
- 300 build minutes/month
- 125K function invocations/month
- Unlimited sites

This is MORE than enough for your app!

## Your URLs After Deployment

- **Frontend + Backend**: `https://[your-site-name].netlify.app`
- **API Endpoint**: `https://[your-site-name].netlify.app/api/*`
- **GitHub Repo**: `https://github.com/atharvgarg18/ab`

## Next Steps After Deployment

1. ✅ Test all features thoroughly
2. ✅ Set up custom domain (optional)
3. ✅ Enable deploy notifications (Slack, email)
4. ✅ Set up form notifications (if needed)
5. ✅ Monitor function logs regularly

---

## Quick Start Commands

```bash
# 1. Commit and push latest changes
git add .
git commit -m "Ready for Netlify deployment"
git push origin main

# 2. Deploy via CLI (optional)
npm install -g netlify-cli
netlify login
netlify deploy --prod

# 3. Or use Netlify Dashboard (recommended)
# Just connect GitHub repo and click Deploy!
```

---

**Ready to deploy!** 🚀

The easiest way is **Option A** (Netlify Dashboard). Just follow the steps above and you'll be live in minutes!

