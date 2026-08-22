# Step-by-Step Render Deployment Guide

Follow these steps to deploy your backend to Render:

## Prerequisites

1. **GitHub Account** - Your code should be in a GitHub repository
2. **MongoDB Database** - Either:
   - MongoDB Atlas (cloud) - Recommended
   - Or Render's MongoDB service

## Step 1: Set Up MongoDB (if not already done)

### Option A: MongoDB Atlas (Recommended)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (free tier available)
4. Create a database user (username/password)
5. Whitelist IP addresses:
   - Click "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0) for testing
   - Or add Render's IP ranges later
6. Get your connection string:
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/timetable_db?retryWrites=true&w=majority`

### Option B: Render MongoDB Service
1. In Render dashboard, click "New +" → "MongoDB"
2. Choose a name and plan (free tier available)
3. After creation, copy the "Internal Connection String" or "External Connection String"

## Step 2: Deploy Backend to Render

### Method 1: Using Render Dashboard (Easiest)

1. **Sign Up/Login to Render**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub (recommended)

2. **Create New Web Service**
   - Click "New +" button in dashboard
   - Select "Web Service"
   - Connect your GitHub account if not already connected
   - Select your repository
   - Click "Connect"

3. **Configure the Service**
   - **Name**: `timetable-backend` (or any name you prefer)
   - **Region**: Choose closest to your users
   - **Branch**: `main` or `master` (your main branch)
   - **Root Directory**: `backend` (important!)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free tier is fine for testing

4. **Add Environment Variables**
   Click "Advanced" → "Add Environment Variable" and add:
   
   ```
   Key: MONGO_URI
   Value: your_mongodb_connection_string_here
   ```
   
   ```
   Key: NODE_ENV
   Value: production
   ```
   
   ```
   Key: PORT
   Value: (Leave empty - Render sets this automatically)
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Render will start building and deploying
   - Wait for deployment to complete (usually 2-5 minutes)

6. **Get Your Backend URL**
   - Once deployed, you'll see a URL like: `https://timetable-backend.onrender.com`
   - This is your backend API URL

### Method 2: Using render.yaml (Infrastructure as Code)

1. **Ensure render.yaml is in your repository**
   - The file should be at: `backend/render.yaml`

2. **Create Blueprint**
   - In Render dashboard, click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will detect `render.yaml` automatically
   - Review the configuration
   - Click "Apply"

3. **Set Environment Variables**
   - Go to your service settings
   - Add `MONGO_URI` environment variable
   - Render will use the values from `render.yaml` or you can override them

## Step 3: Verify Deployment

1. **Check Health Endpoint**
   Open in browser or use curl:
   ```
   https://your-app-name.onrender.com/health
   ```
   
   Should return:
   ```json
   {
     "status": "ok",
     "dbConnected": true,
     "timestamp": "2024-..."
   }
   ```

2. **Test API Endpoints**
   ```bash
   # List rooms
   curl https://your-app-name.onrender.com/api/rooms
   
   # Health check
   curl https://your-app-name.onrender.com/health
   ```

## Step 4: Update Frontend

Update your frontend to use the Render backend URL:

```javascript
// In your frontend code
const API_BASE_URL = 'https://your-app-name.onrender.com';
```

## Common Issues & Solutions

### Issue: Build Fails
**Solution**: 
- Check that "Root Directory" is set to `backend`
- Verify `package.json` exists in the backend folder
- Check build logs for specific errors

### Issue: Application Crashes
**Solution**:
- Check logs in Render dashboard
- Verify `MONGO_URI` is set correctly
- Ensure MongoDB allows connections from Render's IPs

### Issue: Database Connection Timeout
**Solution**:
- For MongoDB Atlas: Whitelist Render's IP ranges or use 0.0.0.0/0
- Check connection string format
- Verify database user credentials

### Issue: Port Already in Use
**Solution**:
- Don't set PORT manually - Render sets it automatically
- Ensure your code uses `process.env.PORT || 5000`

## Render Free Tier Limitations

- **Spins down after 15 minutes of inactivity** (first request after spin-down takes ~30 seconds)
- **750 hours/month free** (enough for always-on if you're the only user)
- **512MB RAM**
- **No custom domains on free tier** (but you get a `.onrender.com` subdomain)

## Upgrade to Paid Tier (Optional)

If you need:
- Always-on (no spin-down)
- More resources
- Custom domain
- Better performance

Upgrade to a paid plan starting at $7/month.

## Monitoring

1. **View Logs**: Click on your service → "Logs" tab
2. **Metrics**: View CPU, Memory, and Request metrics
3. **Events**: See deployment history and events

## Updating Your Deployment

Every time you push to your connected branch:
- Render automatically detects changes
- Starts a new build
- Deploys the new version
- Zero-downtime deployment (new version is tested before switching)

## Next Steps

1. ✅ Backend deployed to Render
2. 🔄 Update frontend API URL
3. 🔄 Deploy frontend (can also use Render or Vercel)
4. ✅ Test the full application

## Quick Reference

**Render Dashboard**: https://dashboard.render.com
**Your Service URL**: Check your Render dashboard
**Health Check**: `https://your-app.onrender.com/health`
**API Base**: `https://your-app.onrender.com/api`

---

Need help? Check Render's documentation: https://render.com/docs

