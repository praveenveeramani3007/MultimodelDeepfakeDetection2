# Deployment Guide

Follow these steps to get your "real working link".

## Phase 1: Deploy Backend (Render)

1.  **Sign Up/Login:** Go to [render.com](https://render.com) and log in with your GitHub account.
2.  **New Web Service:** Click "New +" and select "Web Service".
3.  **Connect Repo:** Select your repository: `praveenveeramani3007/MultimodelDeepfakeDetection2`.
4.  **Configure Settings:**
    *   **Name:** `authentic-media-backend` (or similar)
    *   **Root Directory:** `backend`
    *   **Environment:** `Python 3`
    *   **Build Command:** `pip install -r requirements.txt`
    *   **Start Command:** `gunicorn app:app`
5.  **Environment Variables:** Scroll down to "Environment Variables" and add:
    *   `PYTHON_VERSION`: `3.9.0` (or your local version)
    *   `SECRET_KEY`: (Generate a random string)
6.  **Deploy:** Click "Create Web Service".
7.  **Copy URL:** Once deployed, copy the URL (e.g., `https://authentic-media-backend.onrender.com`).

## Phase 2: Connect Frontend to Backend

1.  **Edit `frontend/vercel.json`:**
    *   Go to your GitHub repository.
    *   Navigate to `frontend/vercel.json`.
    *   Edit the file and replace `<YOUR_RENDER_BACKEND_URL>` with the URL you copied in Phase 1 (e.g., `https://authentic-media-backend.onrender.com`).
    *   **Important:** Do NOT include a trailing slash `/` after `.com`.
    *   Commit the change.

## Phase 3: Deploy Frontend (Vercel)

1.  **Sign Up/Login:** Go to [vercel.com](https://vercel.com) and log in with GitHub.
2.  **Add New Project:** Click "Add New..." -> "Project".
3.  **Import Repo:** Import `praveenveeramani3007/MultimodelDeepfakeDetection2`.
4.  **Configure Project:**
    *   **Framework Preset:** Vite
    *   **Root Directory:** Click "Edit" and select `frontend`.
5.  **Deploy:** Click "Deploy".

## Success!
Vercel will give you a live link (e.g., `https://authentic-media-analyzer.vercel.app`).
- When you open it, the React app loads.
- Any API calls (login, upload) will be proxied by Vercel to your Render backend.
