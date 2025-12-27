# Zashly.com - Deployment Guide for Render.com

This guide will walk you through deploying Zashly.com to Render.com, including both the backend (Node.js/Express) and frontend (React/Vite) components.

## Prerequisites

1. A GitHub account with access to the [Zashly.com repository](https://github.com/zaidquazi/Zashly.com)
2. A Render.com account (free tier is sufficient)
3. A MongoDB Atlas database (free tier available)
4. A Stream Chat account (for chat functionality)

## Step 1: Prepare Your Environment Variables

1. Create a `.env` file in the `backend` directory based on `.env.example`
2. Fill in all required values:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A strong secret key for JWT token signing
   - `STREAM_API_KEY` and `STREAM_API_SECRET`: From your Stream Chat dashboard
   - `FRONTEND_ORIGIN`: The URL where your frontend will be hosted (e.g., `https://zashly.onrender.com`)

## Step 2: Deploy Backend to Render

1. Log in to your [Render.com](https://render.com) dashboard
2. Click "New" and select "Web Service"
3. Connect your GitHub account and select the `Zashly.com` repository
4. Configure the backend service:
   - **Name**: `zashly-backend` (or your preferred name)
   - **Region**: Choose the closest to your users
   - **Branch**: `main` (or your production branch)
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
   - **Plan**: Free

5. Add the following environment variables in the "Environment Variables" section:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Your JWT secret
   - `STREAM_API_KEY`: Your Stream Chat API key
   - `STREAM_API_SECRET`: Your Stream Chat API secret
   - `FRONTEND_ORIGIN`: `https://zashly.onrender.com` (update after frontend deployment)

6. Click "Create Web Service"

## Step 3: Deploy Frontend to Render

1. In the Render dashboard, click "New" and select "Static Site"
2. Connect your GitHub account and select the `Zashly.com` repository
3. Configure the frontend service:
   - **Name**: `zashly-frontend` (or your preferred name)
   - **Branch**: `main` (or your production branch)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Environment Variables**:
     - `VITE_API_URL`: `https://zashly-backend.onrender.com` (update with your backend URL)
     - `VITE_STREAM_CHAT_API_KEY`: (same as STREAM_API_KEY from backend)

4. Click "Create Static Site"

## Step 4: Update Backend CORS Settings

After deploying the frontend, update the `FRONTEND_ORIGIN` environment variable in your backend service to match your frontend URL (e.g., `https://zashly.onrender.com`).

## Step 5: Verify Deployment

1. Visit your frontend URL (e.g., `https://zashly.onrender.com`)
2. Test the application functionality:
   - User registration/login
   - Real-time chat features
   - Any other core features

## Troubleshooting

1. **Build Failures**:
   - Check the build logs in the Render dashboard
   - Ensure all environment variables are set correctly
   - Verify Node.js version compatibility

2. **Connection Issues**:
   - Check CORS settings in the backend
   - Verify database connection strings
   - Ensure all API endpoints are correct

3. **Environment Variables**:
   - Double-check all environment variables in the Render dashboard
   - Ensure no trailing spaces in values

## Maintenance

- **Updates**: Push changes to the connected GitHub branch to trigger automatic deployments
- **Logs**: Monitor application logs in the Render dashboard
- **Scaling**: Upgrade your plan if you need more resources

## Support

For issues not covered in this guide, please refer to:
- [Render Documentation](https://render.com/docs)
- [Node.js on Render](https://render.com/docs/deploy-node-express-app)
- [Static Sites on Render](https://render.com/docs/static-sites)
