# Deployment Guide for Vercel

## 📦 Project Structure
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + MongoDB

## 🚀 Deployment Steps

### Option 1: Deploy as Separate Projects (Recommended)

#### Deploy Backend:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. **Root Directory**: Set to `backend`
5. **Framework Preset**: Other
6. **Build Command**: (leave empty)
7. **Output Directory**: (leave empty)
8. **Environment Variables** - Add these:
   ```
   MONGODB_URI=your_mongodb_connection_string
   GEMINI_API_KEY=your_gemini_api_key
   PORT=3000
   NODE_ENV=production
   ```
9. Click "Deploy"
10. Copy the deployed backend URL (e.g., `https://your-backend.vercel.app`)

#### Deploy Frontend:
1. Click "Add New" → "Project" again
2. Import the same repository
3. **Root Directory**: Set to `frontend`
4. **Framework Preset**: Vite
5. **Build Command**: `npm run build`
6. **Output Directory**: `dist`
7. **Environment Variables** - Add:
   ```
   VITE_API_URL=https://your-backend.vercel.app
   ```
   (Use the backend URL from step 10 above)
8. Click "Deploy"

### Option 2: Deploy from CLI

#### Install Vercel CLI:
```bash
npm install -g vercel
```

#### Deploy Backend:
```bash
cd backend
vercel --prod
# Follow prompts and set environment variables
```

#### Deploy Frontend:
```bash
cd frontend
vercel --prod
# Set VITE_API_URL to your backend URL
```

## 🔧 Environment Variables Needed

### Backend (.env):
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
NODE_ENV=production
```

### Frontend (.env):
```
VITE_API_URL=https://your-backend-url.vercel.app
```

## ⚠️ Important Notes

1. **MongoDB Atlas**: Make sure your MongoDB allows connections from anywhere (0.0.0.0/0) or add Vercel IPs to whitelist
2. **CORS**: Already configured in backend to accept all origins
3. **File Uploads**: Vercel has a 4.5MB limit for serverless functions. Consider using cloud storage (AWS S3, Cloudinary) for production
4. **Gemini API**: Make sure your API key is valid and has quota

## 🔄 Auto-Deploy from GitHub

1. Connect your GitHub repository to Vercel
2. Every push to `main` branch will auto-deploy
3. Pull requests get preview deployments

## 📱 Custom Domain (Optional)

1. Go to Project Settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Update DNS records as instructed

## 🐛 Troubleshooting

### Backend not connecting to MongoDB:
- Check MongoDB Atlas whitelist
- Verify connection string
- Check environment variables

### Frontend can't reach backend:
- Verify VITE_API_URL is correct
- Check CORS settings in backend
- Ensure backend is deployed and running

### Build fails:
- Check all dependencies are in package.json
- Verify Node version compatibility
- Check build logs for specific errors

## 📊 Monitoring

- View logs in Vercel Dashboard
- Set up error tracking (Sentry)
- Monitor MongoDB Atlas usage

## 🎉 Success!

Once both are deployed:
- Frontend URL: `https://your-app.vercel.app`
- Backend URL: `https://your-backend.vercel.app`

Test by:
1. Opening frontend URL
2. Upload a timetable
3. Check if it processes correctly
4. Try the chatbot
5. Create to-do items
