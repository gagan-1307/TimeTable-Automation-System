# Deployment Guide for Render

This guide will help you deploy the Timetable application on Render.

## Prerequisites

1. A Render account (sign up at https://render.com)
2. A MongoDB database (MongoDB Atlas recommended for cloud hosting)
3. Your MongoDB connection string

## Environment Variables

You need to set the following environment variables in Render:

- `MONGO_URI`: Your MongoDB connection string
  - Example: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`
- `PORT`: Automatically set by Render (no need to configure)
- `NODE_ENV`: Set to `production` (optional, but recommended)

## Deployment Steps

### Option 1: Using render.yaml (Recommended)

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. In Render dashboard, click "New" → "Blueprint"
3. Connect your repository
4. Render will automatically detect the `render.yaml` file
5. Review the configuration and click "Apply"
6. Set the `MONGO_URI` environment variable in the service settings
7. Deploy!

### Option 2: Manual Deployment

1. Push your code to a Git repository
2. In Render dashboard, click "New" → "Web Service"
3. Connect your repository
4. Configure the service:
   - **Name**: timetable-backend (or your preferred name)
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Root Directory**: Leave empty (or set to `backend` if you prefer)
5. Add environment variables:
   - `MONGO_URI`: Your MongoDB connection string
   - `NODE_ENV`: `production`
6. Click "Create Web Service"
7. Wait for deployment to complete

## Post-Deployment

1. Your backend will be available at: `https://your-service-name.onrender.com`
2. Test the health endpoint: `https://your-service-name.onrender.com/health`
3. Update your frontend API URL to point to the Render URL

## Notes

- Render provides a free tier with some limitations (services spin down after 15 minutes of inactivity)
- For production, consider upgrading to a paid plan
- Make sure your MongoDB database allows connections from Render's IP addresses (MongoDB Atlas: Network Access settings)

## Troubleshooting

- **Build fails**: Check that all dependencies are listed in `package.json`
- **Connection refused**: Ensure MongoDB allows connections from Render
- **Environment variables**: Double-check that `MONGO_URI` is set correctly
- **Port issues**: The server is configured to use Render's PORT environment variable automatically

