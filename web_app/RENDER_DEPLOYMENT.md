# Frontend Deployment Guide for Render

Follow these steps to deploy your frontend to Render:

## Prerequisites

1. **GitHub Account** - Your code should be in a GitHub repository
2. **Backend Deployed** - Your backend should already be deployed on Render (or another service)
3. **Backend URL** - Know your backend API URL (e.g., `https://timetable-nitkkr.onrender.com`)

## Step 1: Deploy Frontend to Render

### Method 1: Using Render Dashboard (Easiest)

1. **Sign Up/Login to Render**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub (recommended)

2. **Create New Static Site**
   - Click "New +" button in dashboard
   - Select "Static Site"
   - Connect your GitHub account if not already connected
   - Select your repository
   - Click "Connect"

3. **Configure the Static Site**
   - **Name**: `timetable-frontend` (or any name you prefer)
   - **Branch**: `main` or `master` (your main branch)
   - **Root Directory**: `web_app` (important!)
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Instance Type**: Free tier is fine for testing

4. **Add Environment Variables**
   Click "Environment" → "Add Environment Variable" and add:
   
   ```
   Key: VITE_API_BASE_URL
   Value: https://timetable-nitkkr.onrender.com
   ```
   
   **Important**: Replace `https://timetable-nitkkr.onrender.com` with your actual backend URL.

5. **Deploy**
   - Click "Create Static Site"
   - Render will start building and deploying
   - Wait for deployment to complete (usually 2-5 minutes)

6. **Get Your Frontend URL**
   - Once deployed, you'll see a URL like: `https://timetable-frontend.onrender.com`
   - This is your frontend application URL

### Method 2: Using render.yaml (Infrastructure as Code)

1. **Ensure render.yaml is in your repository**
   - The file should be at: `web_app/render.yaml`

2. **Create Blueprint**
   - In Render dashboard, click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will detect `render.yaml` automatically
   - Review the configuration
   - Click "Apply"

3. **Set Environment Variables**
   - Go to your service settings
   - Add `VITE_API_BASE_URL` environment variable with your backend URL
   - Example: `https://timetable-nitkkr.onrender.com`

## Step 2: Verify Deployment

1. **Open Your Frontend URL**
   - Navigate to your frontend URL in a browser
   - Example: `https://timetable-frontend.onrender.com`

2. **Test the Application**
   - Check if the page loads correctly
   - Test login functionality
   - Verify API calls are working (check browser console for errors)

3. **Check Browser Console**
   - Open browser DevTools (F12)
   - Check Console tab for any errors
   - Verify API calls are going to the correct backend URL

## Environment Variables

### Required Environment Variables

- **VITE_API_BASE_URL**: Your backend API URL
  - Example: `https://timetable-nitkkr.onrender.com`
  - This is used during build time by Vite
  - If not set, defaults to `https://timetable-nitkkr.onrender.com`

### How Vite Environment Variables Work

- Vite uses `VITE_` prefix for environment variables
- These variables are embedded at **build time** (not runtime)
- To change the API URL, you need to:
  1. Update the environment variable in Render
  2. Trigger a new build (push to GitHub or manually redeploy)

## Common Issues & Solutions

### Issue: Build Fails
**Solution**: 
- Check that "Root Directory" is set to `web_app`
- Verify `package.json` exists in the web_app folder
- Check build logs for specific errors
- Ensure Node.js version is compatible (Render uses Node 18+ by default)

### Issue: Blank Page After Deployment
**Solution**:
- Check browser console for errors
- Verify `dist` folder is being published correctly
- Check that `index.html` exists in the `dist` folder
- Verify all asset paths are correct

### Issue: API Calls Failing (CORS)
**Solution**:
- Ensure your backend has CORS configured to allow requests from your frontend domain
- Check backend CORS settings to include your frontend URL
- Example: `https://timetable-frontend.onrender.com`

### Issue: Environment Variable Not Working
**Solution**:
- Vite environment variables must start with `VITE_`
- Variables are embedded at build time, so you need to rebuild after changing them
- Check that the variable is set in Render dashboard
- Verify the variable name matches exactly (case-sensitive)

### Issue: 404 Errors on Refresh
**Solution**:
- This is normal for Single Page Applications (SPAs)
- Render static sites handle this automatically
- If issues persist, check that all routes are handled by your React app

## Render Free Tier Limitations

- **Spins down after 15 minutes of inactivity** (first request after spin-down takes ~30 seconds)
- **750 hours/month free** (enough for always-on if you're the only user)
- **100GB bandwidth/month**
- **No custom domains on free tier** (but you get a `.onrender.com` subdomain)

## Updating Your Deployment

Every time you push to your connected branch:
- Render automatically detects changes
- Starts a new build
- Deploys the new version
- Zero-downtime deployment

**Note**: If you change environment variables, you may need to manually trigger a rebuild:
1. Go to your service in Render dashboard
2. Click "Manual Deploy" → "Deploy latest commit"

## Connecting Frontend and Backend

### Update Backend CORS (if needed)

Make sure your backend allows requests from your frontend domain. In your backend code, ensure CORS is configured:

```javascript
// Example CORS configuration
const corsOptions = {
  origin: [
    'https://timetable-frontend.onrender.com',
    'http://localhost:5173', // for local development
  ],
  credentials: true,
};
```

### Update Frontend API URL

If your backend URL changes:
1. Update `VITE_API_BASE_URL` in Render dashboard
2. Trigger a new build (push to GitHub or manual deploy)

## Production Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] `VITE_API_BASE_URL` environment variable set correctly
- [ ] Backend CORS configured to allow frontend domain
- [ ] Tested login functionality
- [ ] Tested all API endpoints from frontend
- [ ] Checked browser console for errors
- [ ] Verified all features work in production

## Quick Reference

**Render Dashboard**: https://dashboard.render.com
**Your Frontend URL**: Check your Render dashboard
**Your Backend URL**: `https://timetable-nitkkr.onrender.com` (or your actual backend URL)
**Build Command**: `npm install && npm run build`
**Publish Directory**: `dist`

---

Need help? Check Render's documentation: https://render.com/docs/static-sites

