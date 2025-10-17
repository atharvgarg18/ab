# Vercel Deployment - Quick Start

## Prerequisites
- Vercel account (free at vercel.com)
- MongoDB Atlas URI (free tier)
- Google Gemini API key

## Deployment Steps

### Step 1: Get Your Backend URL
```bash
cd backend
vercel deploy --prod
```
Copy the URL it shows (e.g., `https://yourname-backend.vercel.app`)

### Step 2: Add Environment Variables to Backend on Vercel
In Vercel dashboard for backend project:
- Settings → Environment Variables
- Add: `MONGODB_URI` = your MongoDB connection string
- Add: `GEMINI_API_KEY` = your Google Gemini API key
- Redeploy the backend

### Step 3: Update Frontend API URL
Edit `frontend/.env.production`:
```
VITE_API_URL=https://yourname-backend.vercel.app
```

### Step 4: Deploy Frontend
```bash
cd frontend
vercel deploy --prod
```

### Step 5: Done!
Your app is now live. Test it:
- Visit the frontend URL
- Try uploading a timetable
- Test the chatbot

## Troubleshooting

**API calls failing?**
- Check if VITE_API_URL is set correctly in `.env.production`
- Verify environment variables are set in Vercel dashboard
- Check MongoDB URI has whitelist IP: 0.0.0.0/0

**File upload not working?**
- Ensure MONGODB_URI and GEMINI_API_KEY are set
- Check backend logs in Vercel dashboard

**Database connection timeout?**
- Add your Vercel IP to MongoDB whitelist in Atlas dashboard
- Or use 0.0.0.0/0 to allow all IPs (less secure but works)
