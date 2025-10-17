# Vercel Deployment - MongoDB Connection Fix

## Problem
Backend returns `FUNCTION_INVOCATION_FAILED` on Vercel because MongoDB Atlas is blocking connections from Vercel servers.

## Solution

### Step 1: Allow All IPs in MongoDB Atlas (Quick Fix)
1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
2. Navigate to **Network Access** → **IP Whitelist**
3. Click **Edit** on any existing rule OR **Add IP Whitelist Entry**
4. Change the IP address to: `0.0.0.0/0` (allows all IPs)
5. Click **Confirm**

**⚠️ Security Note:** This allows connections from anywhere. For production, consider:
- Using Vercel environment-specific IPs only
- Using MongoDB Atlas Realm instead
- IP whitelisting specific Vercel regions

### Step 2: Deploy Backend Again
```bash
cd /Users/dev/Downloads/ab/backend
npx vercel --prod --force
```

### Step 3: Update Frontend with New Backend URL
Once deployed, update the frontend to point to the new backend:

```bash
cd /Users/dev/Downloads/ab/frontend
npx vercel env add VITE_API_URL
# Enter the new backend URL when prompted
npx vercel --prod --force
```

## Deployment URLs
- **Backend:** https://backend-82kr9urx6-atharvs-projects-bda4da03.vercel.app
- **Frontend:** https://fronted-berqcx75t-atharvs-projects-bda4da03.vercel.app

## Testing
After fixing MongoDB whitelist:
1. Visit frontend URL
2. Try uploading a timetable
3. Check the ChatBot and other features

## Environment Variables on Vercel
Both projects should have these environment variables set:

**Backend:**
- `MONGODB_URI` - Your MongoDB connection string
- `GEMINI_API_KEY` - Your Gemini API key
- `NODE_ENV` - Set to `production`

**Frontend:**
- `VITE_API_URL` - Backend URL (e.g., https://backend-82kr9urx6-atharvs-projects-bda4da03.vercel.app)
