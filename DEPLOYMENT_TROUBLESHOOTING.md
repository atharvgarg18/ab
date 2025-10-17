# 🔧 DEPLOYMENT TROUBLESHOOTING & REFERENCE

## Common Issues & Solutions

### 1. Build Failed - "npm run build" error

**Error Message:**
```
ERROR: Build step failed: npm run build exited with 1
```

**Causes & Solutions:**

```
❌ TypeScript errors in frontend
✅ Solution: 
   npm run lint
   Fix any errors locally
   Push to GitHub

❌ Missing dependencies
✅ Solution:
   Check package.json has all packages
   Try: npm install locally
   Push updated package-lock.json

❌ Backend dependency missing
✅ Solution:
   Check backend/package.json exists
   Verify @google/generative-ai is listed
```

---

### 2. Deploy Successful but App Shows 404

**Error:** Page shows Vercel 404 page or blank screen

**Solutions:**

```
Solution 1: Wait for CDN Cache
- Wait 5 minutes
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Check browser console for errors

Solution 2: Check Build Output Directory
In Vercel settings:
- Output Directory should be: frontend/dist
- NOT: frontend/frontend/dist

Solution 3: Verify Environment Variables
- Go to Vercel Dashboard → Settings → Environment Variables
- Ensure VITE_API_URL is set correctly
- Redeploy: go to Deployments → click "Redeploy"
```

---

### 3. API Calls Return 404

**Error:** `/api/timetable/upload` returns 404

**Diagnosis:**
```bash
# Test if backend is running
curl https://ab.vercel.app/api/health

# If returns error, backend not deployed properly
```

**Solutions:**

```
Solution 1: Backend Configuration
- Verify backend/vercel.json exists
- Check it points to src/server.js
- NOT api/index.js

Solution 2: Redeploy Backend
- Push changes to GitHub
git push origin main
- Vercel rebuilds automatically

Solution 3: Check Logs
- Vercel Dashboard → Deployments → [latest] → Logs
- Look for error messages
- Check MongoDB connection string
```

---

### 4. File Upload Shows 413 - Payload Too Large

**Error:** File upload returns 413 status code

**Cause:** Request body too large

**Solutions:**

```
Solution 1: Check File Size
- Vercel supports up to 12MB
- Recommended: Keep files under 5MB
- Check file size before uploading

Solution 2: Increase Timeout (already done)
- backend/vercel.json already has maxDuration: 60
- If still failing, increase to: 120

Solution 3: Test with Smaller File
- Try uploading a 1MB test file
- If works, issue is file size
- Reduce original file and try again
```

---

### 5. MongoDB Connection Error

**Error Message:**
```
[Database] Connection failed: getaddrinfo ENOTFOUND
```

**Cause:** Can't connect to MongoDB

**Solutions:**

```
Solution 1: Check Connection String
- Go to MongoDB Atlas → Cluster → Connect
- Choose: Connect your application
- Copy connection string exactly
- Update VITE_API_URL in Vercel environment variables
- Redeploy

Solution 2: Allow All IPs
- MongoDB Atlas → Network Access → Add IP Address
- Enter: 0.0.0.0/0
- Click Confirm
- Wait 5 minutes for changes
- Redeploy

Solution 3: Check Password
- Connection string might have special characters
- Must be URL-encoded
- Example: password! becomes password%21
- MongoDB Atlas auto-handles this in copy-paste
```

---

### 6. Gemini API Not Working

**Error:**
```
[Gemini] GEMINI_API_KEY is not configured
```

**Solutions:**

```
Solution 1: Add Environment Variable
- Go to Vercel Dashboard → Settings → Environment Variables
- Add: GEMINI_API_KEY = your-key-here
- Click Save
- Redeploy project

Solution 2: Verify API Key
- Get key from: https://aistudio.google.com/app/apikey
- Should start with: AIzaSy...
- Should NOT include quotes

Solution 3: Test Locally First
- Create backend/.env file
- Add: GEMINI_API_KEY=your-key
- Run: npm run dev
- Test if AI works
- Then deploy
```

---

### 7. ChatBot Not Responding

**Error:** ChatBot messages show as loading forever

**Diagnosis:**
```bash
# Check browser console (F12 → Console tab)
# Look for network errors

# If error: CORS policy blocked
# → Backend might not be running

# If error: 500 Internal Server Error
# → Check Vercel logs
```

**Solutions:**

```
Solution 1: Verify Backend Running
curl https://ab.vercel.app/api/health

Solution 2: Check Message Format
- Make sure you're sending text messages
- Not sending empty messages

Solution 3: Check AI API
- Verify GEMINI_API_KEY is set
- Check your Google AI Studio quota
- https://aistudio.google.com -> usage

Solution 4: Check Logs
- Vercel Dashboard → Logs
- Look for chat route errors
- May see rate limiting issues
```

---

### 8. Dashboard Calendar Not Showing

**Error:** Calendar grid is blank or shows errors

**Cause:** Timetable data not loading

**Solutions:**

```
Solution 1: Upload Timetable First
- Dashboard requires timetable data
- Click "📁 Upload Timetable" button
- Select your timetable image
- Wait for processing

Solution 2: Check Student ID
- Make sure studentId is correct
- Try using: STUDENT001
- Check timetable uploaded with this ID

Solution 3: Verify MongoDB
- Check if timetable data saved
- Connect to MongoDB Atlas
- Browse Collections → Timetables
- Should see your uploaded data

Solution 4: Check Network Requests
- Open browser DevTools (F12)
- Go to Network tab
- Try uploading timetable
- Look for /api/timetable/* requests
- Check response for errors
```

---

### 9. Drag and Drop Not Working

**Error:** Can't drag tasks to calendar

**Solutions:**

```
Solution 1: Browser Compatibility
- Use Chrome, Firefox, Safari, Edge
- NOT Internet Explorer

Solution 2: Disable Extensions
- Some browser extensions block drag-drop
- Try in incognito mode
- If works, disable problematic extension

Solution 3: Refresh Page
- Hard refresh: Cmd+Shift+R
- Clear cache
- Try again

Solution 4: Check Console
- Open DevTools (F12)
- Go to Console tab
- Look for JavaScript errors
- Report error message
```

---

### 10. Tasks Not Saving After Refresh

**Error:** Add task, refresh page, task disappears

**Cause:** Tasks stored in localStorage (temporary)

**Solution:**
```
This is expected behavior!

localStorage stores tasks in the browser, not the server.

If you want tasks to persist:
1. Create POST /api/tasks endpoint in backend
2. Save to MongoDB
3. Fetch on page load

For now:
- Tasks are saved in browser for current session
- Closing tab = tasks disappear
- This is fine for a demo app
```

---

## Verification Checklist

### Deployment Success Verification

```bash
# 1. Frontend loads
curl -I https://ab.vercel.app
# Should return: 200 OK

# 2. Backend health check
curl https://ab.vercel.app/api/health
# Should return: {"status":"ok",...}

# 3. Database connection
curl https://ab.vercel.app/api/timetable/student/TEST
# Should return: {"success":true,"data":[]}

# 4. File upload capability
# (Test in browser - can't do with curl)
# Upload small timetable file
# Should complete without errors

# 5. ChatBot capability
# (Test in browser)
# Type message in chatbot
# Should get response within 5 seconds
```

---

## Performance Troubleshooting

### App is Slow

**Check Load Time:**
```bash
# Install curl-format.txt script
# Then:
curl -w "@curl-format.txt" -o /dev/null -s https://ab.vercel.app
```

**Expected Times:**
```
connect: 100-200ms (should be < 200ms)
transfer: 50-100ms (should be < 100ms)
total: 1-2 seconds (should be < 3s)
```

**If Slow:**
```
Cause 1: First load (cold start)
- Cold starts take 2-3 seconds
- Subsequent loads much faster
- This is normal

Cause 2: Network latency
- Check your internet speed
- Ping to Vercel edge: < 100ms typical
- If > 500ms, might be network issue

Cause 3: MongoDB too slow
- Check connection string
- Enable connection pooling
- Check MongoDB Atlas region matches Vercel region
```

---

## Log Analysis Guide

### Where to Find Logs

**Deployment Logs:**
- Vercel Dashboard → ab → Deployments → [select deployment] → Logs

**Function Logs:**
- Vercel Dashboard → ab → Functions → [select function] → Logs

**MongoDB Logs:**
- MongoDB Atlas → Cluster → Logs

### Common Log Errors

```
Error: ENOENT: no such file or directory
→ Missing file, check file paths

Error: Cannot find module 'express'
→ Missing dependency, run npm install

Error: MongooseError: Cannot connect
→ MongoDB connection issue, check URI

Error: getaddrinfo ENOTFOUND
→ DNS resolution failed, check domain name

Error: 503 Service Unavailable
→ Service temporarily down, wait and retry
```

---

## Environment Variables Reference

### Required Variables

```
MONGODB_URI = mongodb+srv://user:pass@cluster.mongodb.net/db?retryWrites=true
GEMINI_API_KEY = AIzaSy...your-api-key...
PORT = 3000
NODE_ENV = production
```

### Optional Variables

```
# For debugging
DEBUG = express:*

# For monitoring
SENTRY_DSN = https://...sentry-key...

# For logging
LOG_LEVEL = info
```

### Where to Set

**Vercel Dashboard:**
- Go to Settings → Environment Variables
- Add variables
- They automatically apply to all deployments
- Don't need to redeploy (unless changing code)

**Local Development:**
- Create backend/.env file
- Add variables there
- Run: npm run dev

---

## Rollback Instructions

### If Deployment Breaks Everything

**Option 1: Revert to Last Working Version**
```bash
git log --oneline -5
# Find last good commit
git revert HEAD
git push origin main
# Vercel auto-redeploys to previous version
```

**Option 2: Manual Rollback on Vercel**
- Vercel Dashboard → ab → Deployments
- Find last working deployment
- Click "..." → Promote to Production
- Done! Reverted to that version

**Option 3: Disable Automatic Deploys**
- Vercel Dashboard → Settings → Git
- Toggle "Automatic Deployments" OFF
- Now must manually trigger deploys
- Click "Redeploy" button to deploy

---

## Getting Help

### Debug Information to Collect

When troubleshooting, gather:

```
1. Error message (exact text)
2. Browser console errors (F12 → Console)
3. Network request details (F12 → Network)
4. Vercel deployment logs
5. MongoDB connection test result
6. API response status code
7. File sizes being uploaded
8. Browser version and OS
```

### Where to Ask for Help

- Vercel Discord: https://vercel.com/discord
- MongoDB Community: https://community.mongodb.com
- Express GitHub Issues: https://github.com/expressjs/express
- Stack Overflow: Tag `vercel`, `mongodb`, `express`

---

## Pro Tips

### Optimization

```
1. Enable Compression
   - Already done by Vercel
   
2. Image Optimization
   - Use modern formats (WebP)
   - Compress before upload

3. Database Indexes
   - Add MongoDB indexes on studentId
   - Speeds up queries 10x

4. Function Optimization
   - Keep functions under 1 second
   - Cache database connections
   - Use connection pooling
```

### Monitoring

```
Set up alerts:
- Vercel Dashboard → Settings → Notifications
- Get email on deployment failures
- Monitor performance metrics

Track usage:
- Vercel Dashboard → Usage
- See function invocations
- Monitor bandwidth usage
```

---

## Checklist for Production Deployment

- [ ] All environment variables set in Vercel
- [ ] MongoDB IP whitelist configured
- [ ] HTTPS enabled (automatic)
- [ ] Error logging set up
- [ ] Database backups configured
- [ ] Custom domain configured (optional)
- [ ] Security headers added (Vercel default)
- [ ] Rate limiting implemented
- [ ] API authentication considered
- [ ] Monitoring alerts enabled

---

## Quick Reference Commands

```bash
# Push code (auto-deploys)
git push origin main

# Check build locally
npm run build

# Run locally
npm run dev

# Install dependencies
npm install

# View logs locally
tail -f vercel.log

# Test API endpoint
curl https://ab.vercel.app/api/health

# Check response time
curl -w "\nTime: %{time_total}s\n" https://ab.vercel.app

# View recent commits
git log --oneline -10
```

---

**Happy deploying! 🚀**

If you still have issues, check the logs first - they usually tell you exactly what's wrong!
