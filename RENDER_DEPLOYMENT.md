# Deploy Backend to Render.com

## Steps:

### 1. Create Render Account
- Go to https://render.com
- Sign up with GitHub

### 2. Create New Web Service
- Click "New Web Service"
- Connect your GitHub repository
- Select the `ab` repository

### 3. Configure Service
- **Name:** `ab-backend`
- **Root Directory:** `backend`
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Plan:** Free (or Paid if you want better uptime)

### 4. Add Environment Variables
Click "Environment" and add:
- `MONGODB_URI` = `mongodb+srv://atharvgarg877_db_user:atharv@cluster0.fof7sfp.mongodb.net/test?retryWrites=true&w=majority`
- `GEMINI_API_KEY` = `AIzaSyBILS4noR786cP5277mse8RN9_FpwbxgY8`
- `NODE_ENV` = `production`

### 5. Deploy
- Click "Create Web Service"
- Wait 5-10 minutes for build and deploy
- You'll get a URL like `https://ab-backend-xxxx.onrender.com`

### 6. Update Frontend
Update `frontend/.env.production`:
```
VITE_API_URL=https://ab-backend-xxxx.onrender.com
```

### 7. Redeploy Frontend
Push the change to GitHub and frontend will auto-deploy on Netlify/Vercel

---

## Testing

After deployment:
1. Visit `https://ab-backend-xxxx.onrender.com/` - should show server running
2. Visit `https://ab-backend-xxxx.onrender.com/debug` - should show MongoDB connected
3. Visit your frontend and test file upload

---

## Important Notes

- **Render free tier:** Services spin down after 15 mins of inactivity
- To keep it always running, upgrade to Paid tier ($7/month)
- First deploy takes 5-10 mins, subsequent deploys are faster
- MongoDB connection will work immediately (Render's outbound network is better than Vercel free)

---

## Troubleshooting

**If backend isn't connecting:**
1. Check Render logs (Render dashboard → Your Service → Logs)
2. Make sure environment variables are set correctly
3. Make sure MongoDB whitelist includes `0.0.0.0/0`

**If upload is slow:**
- Free tier has limited resources
- Consider upgrading to paid tier for better performance
