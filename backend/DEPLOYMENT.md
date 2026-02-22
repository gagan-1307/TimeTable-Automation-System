# Backend Deployment Guide

This guide covers deploying the Timetable Management System backend to various platforms.

## Prerequisites

- Node.js 18+ installed
- MongoDB database (local or cloud like MongoDB Atlas)
- Environment variables configured

## Required Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string_here
```

### MongoDB Connection String Formats

- **Local MongoDB**: `mongodb://localhost:27017/timetable_db`
- **MongoDB Atlas**: `mongodb+srv://username:password@cluster.mongodb.net/database_name`

## Deployment Options

### 1. Railway

1. Sign up at [Railway](https://railway.app)
2. Create a new project
3. Connect your GitHub repository
4. Add a new service and select your backend folder
5. Add environment variables:
   - `MONGO_URI`: Your MongoDB connection string
   - `PORT`: Will be automatically set by Railway
6. Deploy!

Railway will automatically detect the `railway.json` configuration file.

### 2. Render

1. Sign up at [Render](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
5. Add environment variables:
   - `MONGO_URI`: Your MongoDB connection string
   - `NODE_ENV`: `production`
6. Deploy!

Alternatively, use the `render.yaml` file for infrastructure as code.

### 3. Heroku

1. Install Heroku CLI: `npm install -g heroku`
2. Login: `heroku login`
3. Create app: `heroku create your-app-name`
4. Set environment variables:
   ```bash
   heroku config:set MONGO_URI=your_mongodb_connection_string
   ```
5. Deploy: `git push heroku main`

The `Procfile` will be automatically detected.

### 4. Docker Deployment

#### Build the Docker image:
```bash
docker build -t timetable-backend .
```

#### Run the container:
```bash
docker run -p 5000:5000 \
  -e MONGO_URI=your_mongodb_connection_string \
  -e PORT=5000 \
  timetable-backend
```

#### Docker Compose (optional):
Create a `docker-compose.yml`:
```yaml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "5000:5000"
    environment:
      - MONGO_URI=your_mongodb_connection_string
      - PORT=5000
    restart: unless-stopped
```

### 5. Vercel (Serverless)

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Configure environment variables in Vercel dashboard
4. Note: You may need to adapt the code for serverless functions

### 6. DigitalOcean App Platform

1. Sign up at [DigitalOcean](https://www.digitalocean.com)
2. Create a new App
3. Connect your repository
4. Configure build and start commands
5. Add environment variables
6. Deploy!

## Health Check

The backend includes a health check endpoint:
- **GET** `/health` - Returns server status and database connection status

## Post-Deployment

1. **Seed Initial Users** (if needed):
   ```bash
   npm run seed
   ```
   Or run the seed script manually after deployment.

2. **Test the API**:
   - Health check: `GET https://your-domain.com/health`
   - List rooms: `GET https://your-domain.com/api/rooms`

3. **Update Frontend**:
   Update your frontend API base URL to point to the deployed backend URL.

## Troubleshooting

### MongoDB Connection Issues
- Ensure your MongoDB URI is correct
- For MongoDB Atlas, whitelist all IPs (0.0.0.0/0) or add your server's IP
- Check firewall settings

### Port Issues
- Most platforms automatically set the PORT environment variable
- Ensure your app listens on `0.0.0.0` (not just `localhost`)

### Build Failures
- Ensure Node.js version is 18+
- Check that all dependencies are in `dependencies` (not `devDependencies`)
- Verify package.json is valid

## Security Notes

- Never commit `.env` files to version control
- Use strong MongoDB credentials
- Consider implementing JWT authentication (currently using basic auth)
- Enable HTTPS in production
- Set up CORS properly for your frontend domain

