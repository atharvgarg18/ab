# ⚡ VERCEL DEPLOYMENT - QUICK START GUIDE

## 5-Minute Setup & Deployment

### Prerequisites
- GitHub account (with repo already set up) ✅
- MongoDB Atlas account with connection string
- Gemini API key from Google
- Vercel account (free)

---

## 🎯 Step 1: Sign Up for Vercel (2 minutes)

1. Go to: https://vercel.com
2. Click "Sign Up" → "Continue with GitHub"
3. Authorize Vercel to access your GitHub repos
4. You're logged in! ✅

---

## 🎯 Step 2: Import Your Project (3 minutes)

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Find your repo: `ab` (or search by GitHub username)
4. Click "Import"

---

## 🎯 Step 3: Configure Settings (5 minutes)

### Build & Development
```
Framework Preset: Other (since it's a custom monorepo)
Build Command: npm install && npm run build
Output Directory: frontend/dist
Install Command: npm install
Root Directory: . (leave as default)
```

### Environment Variables
Add these exact variables:

```
MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
GEMINI_API_KEY = your-gemini-api-key-here
PORT = 3000
NODE_ENV = production
```

**Where to get these:**
- `MONGODB_URI`: MongoDB Atlas dashboard → Connect → Connection String
- `GEMINI_API_KEY`: Google AI Studio → Get API Key

---

## 🎯 Step 4: Deploy (1 click)

1. Review all settings
2. Click blue "Deploy" button
3. Wait 2-3 minutes for build to complete
4. See "Congratulations! Your project has been successfully deployed"

---

## ✅ Verification (2 minutes after deploy completes)

Visit these URLs:

1. **Frontend**: https://ab.vercel.app
   - Should see your app with warm beige theme
   - Dashboard with calendar should load

2. **Backend Health**: https://ab.vercel.app/api/health
   - Should see: `{"status":"ok","message":"Netlify Function API is running"...}`

3. **Test Data**: https://ab.vercel.app/api/timetable/student/STUDENT001
   - Should return JSON (empty array if no data, or your timetable data)

---

## 🎉 Success!

If all three URLs work, your app is **live and fully deployed**!

You can now:
- ✅ Upload timetables
- ✅ Use the ChatBot
- ✅ Create tasks
- ✅ Drag and drop to schedule
- ✅ Everything works end-to-end

---

## 📝 Update API URL (Important!)

After you see your actual Vercel URL, update this file:

**File:** `frontend/.env.production`

```
# Change from:
VITE_API_URL=https://ab.vercel.app

# To your actual URL if it's different:
VITE_API_URL=https://your-actual-vercel-url.vercel.app
```

Then:
```bash
git add frontend/.env.production
git commit -m "Update API URL to actual Vercel deployment URL"
git push origin main
```

Vercel will auto-redeploy! ✅

---

## 🔧 Troubleshooting

### Build Failed?
- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Ensure MongoDB connection string is correct

### API Returns 404?
- Wait 5 minutes, then refresh
- Check if backend deployed: https://ab.vercel.app/api/health
- Check Vercel function logs

### File Upload Not Working?
- Verify `MONGODB_URI` is correct
- Check file is less than 12MB
- Check browser console for exact error

### Everything loads but no data?
- Check MongoDB Atlas allows connections from `0.0.0.0/0`
- Verify connection string in .env

---

## 🚀 Next Steps

### Automatic Deployments
Every time you push to GitHub main branch:
```bash
git push origin main
```

Vercel automatically rebuilds and deploys! No extra steps needed.

### Custom Domain (Optional)
In Vercel dashboard → Settings → Domains:
- Add your custom domain
- Update DNS records (Vercel provides instructions)
- Get free HTTPS certificate automatically

### Monitor Performance
In Vercel dashboard:
- View deployment logs
- Monitor function performance
- Check build times
- See analytics

---

## 📊 Free Tier Limits (Should NOT hit these)

| Resource | Limit | Your Usage |
|----------|-------|-----------|
| Deployments | Unlimited | ~1/day |
| Functions | Unlimited | ~10-20/day |
| Bandwidth | 100GB/month | ~100MB/month |
| Build time | 6000 minutes/month | ~10 min/month |
| Function runtime | 60 seconds | Most < 1 sec |
| Max payload | 12MB | Files < 5MB |

**You'll never hit these limits with a hobby project!**

---

## ⚡ Performance Tips

### Check Your Speeds
```bash
# Frontend
curl -w "@curl-format.txt" -o /dev/null -s https://ab.vercel.app

# API
curl -w "@curl-format.txt" -o /dev/null -s https://ab.vercel.app/api/health
```

### Expected Times
- First load: 1-2 seconds
- API response: 200-500ms
- File upload: 5-10 seconds
- Cold start (first request): < 3 seconds

---

## 🔐 Security

### Automatic
✅ HTTPS enabled by default
✅ DDoS protection included
✅ SSL certificates auto-renewed

### Manual
- [ ] Set MongoDB IP whitelist to `0.0.0.0/0` (or your IP)
- [ ] Keep API keys in environment variables (never commit them!)
- [ ] Enable GitHub branch protection
- [ ] Review Vercel security settings monthly

---

## 💰 Cost Breakdown

### Total Monthly Cost: **$0**

| Service | Free Tier | Your Need |
|---------|-----------|-----------|
| Vercel | Unlimited projects | 1 project ✅ |
| MongoDB | 512MB storage | < 100MB ✅ |
| Google Gemini | $0.075 per 1M input tokens | ~$0-1/month ✅ |
| **Total** | | **$0-1/month** |

---

## 📞 Support Resources

### Official Docs
- Vercel: https://vercel.com/docs
- MongoDB: https://docs.mongodb.com
- Express: https://expressjs.com

### Community
- Vercel Discord: https://vercel.com/discord
- MongoDB Forum: https://community.mongodb.com

---

## ✨ You're All Set!

Your app is deployed and live to the entire internet! 🌍

Share your URL with friends: https://ab.vercel.app

---

## Quick Reference

```bash
# When you make code changes:
git add .
git commit -m "Your message"
git push origin main
# Vercel auto-deploys in 2-3 minutes ✅

# To manually trigger deployment:
# Just go to https://vercel.com/dashboard and click "Redeploy"

# To check deployment status:
# Visit https://vercel.com/dashboard → ab → Deployments

# To view logs:
# https://vercel.com/dashboard → ab → Deployments → [latest] → Logs
```

---

**Deployment Complete! 🎉 Your app is live at https://ab.vercel.app**
