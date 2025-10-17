# 🔧 Set Environment Variables on Vercel

## Step-by-Step Guide

### For Backend Project:

1. **Go to Backend Settings:**
   https://vercel.com/atharvs-projects-bda4da03/backend/settings

2. **Navigate to:** Settings → Environment Variables

3. **Remove old ones** (if any exist)

4. **Add these environment variables:**

#### Variable 1: MONGODB_URI
```
Name: MONGODB_URI
Value: mongodb+srv://atharvgarg877_db_user:atharv@cluster0.fof7sfp.mongodb.net/test?retryWrites=true&w=majority
Environments: Production, Preview, Development
```

#### Variable 2: GEMINI_API_KEY
```
Name: GEMINI_API_KEY
Value: AIzaSyBILS4noR786cP5277mse8RN9_FpwbxgY8
Environments: Production, Preview, Development
```

#### Variable 3: NODE_ENV
```
Name: NODE_ENV
Value: production
Environments: Production, Preview, Development
```

5. **Save each one** after entering

6. **Redeploy:**
   ```bash
   cd /Users/dev/Downloads/ab/backend
   npx vercel --prod --force
   ```

### For Frontend Project (Optional):

If you want to set the backend URL as env var:

1. **Go to Frontend Settings:**
   https://vercel.com/atharvs-projects-bda4da03/fronted/settings

2. **Add environment variable:**
```
Name: VITE_API_URL
Value: https://backend-2ptx354n3-atharvs-projects-bda4da03.vercel.app
Environments: Production
```

3. **Redeploy:**
   ```bash
   cd /Users/dev/Downloads/ab/frontend
   npx vercel --prod --force
   ```

---

**⚠️ Important:** After adding env vars and redeploying, **also disable Deployment Protection** (see DISABLE_DEPLOYMENT_PROTECTION.md) for the backend to be accessible.

**Test after deployment:**
```bash
curl https://backend-2ptx354n3-atharvs-projects-bda4da03.vercel.app/
```

Should return JSON with database status.
