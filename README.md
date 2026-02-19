# Authentic Media Analyzer

This project is a media analysis tool that checks for sentiment and authenticity (Deepfake detection) using the Google Gemini API.

It has been refactored to allow local execution without Replit dependencies.

## Project Structure

*   **frontend/**: React/Vite application (UI).
*   **backend/**: Python Flask application (API).
*   **shared/**: Types and schemas shared between frontend and backend concepts.

## Prerequisites

1.  **Node.js**: Install from [nodejs.org](https://nodejs.org/).
2.  **Python**: Install from [python.org](https://www.python.org/).
3.  **Gemini API Key**: Get one from [Google AI Studio](https://aistudio.google.com/).

## Setup Instructions

### 1. Backend Setup

Open a terminal and navigate to the `backend` folder:

```bash
cd backend
```

Create a virtual environment (optional but recommended):

```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

**Configuration:**

Open `backend/.env` and paste your Google Gemini API Key:

```env
GEMINI_API_KEY=your_actual_api_key_here
```

Start the server:

```bash
python app.py
```

The backend runs on `http://127.0.0.1:5000`.

### 2. Frontend Setup

Open a **new** terminal window (keep the backend running) and go to the root folder:

```bash
# If you are in the root folder
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will start (usually at `http://localhost:5173`) and will automatically proxy API requests to your running Python backend.

## Troubleshooting Errors

*   **"Cannot find module..."**: Run `npm install` in the root directory.
*   **"Analysis failed"**: Ensure your `GEMINI_API_KEY` is correct in `backend/.env`.
*   **Connection Refused**: Ensure the Python backend is running on port 5000.
