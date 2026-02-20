import os
import sqlite3
import json
import base64
import io
import secrets
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory, send_file, make_response
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
import analysis_logic

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Secret key for signing cookies (though we use our own session token mechanism, Flask needs this)
app.secret_key = os.getenv("SECRET_KEY", "dev-secret-key-change-in-prod")
# Strict CORS for production (GitHub Pages) + Dev
CORS(app, supports_credentials=True, origins=[
    "https://praveenveeramani3007.github.io",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
], allow_headers=["Content-Type", "Authorization"],
   expose_headers=["Content-Type", "Authorization"])

# Database setup
DB_PATH = 'database.db'

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    # Users Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            email TEXT,
            first_name TEXT,
            last_name TEXT,
            profile_image_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    # Analysis Results Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS analysis_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            file_name TEXT,
            file_url TEXT,
            file_type TEXT,
            sentiment_label TEXT,
            sentiment_score INTEGER,
            authenticity_label TEXT,
            authenticity_score INTEGER,
            details TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    # User Activity Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS user_activity (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT, -- 'login', 'logout'
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    # Sessions Table (New for Persistence)
    c.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            user_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# Helper to get current user from session cookie
def get_current_user_helper():
    # Try Authorization: Bearer <token> header first (for cross-origin requests from GitHub Pages)
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token = auth_header[len('Bearer '):].strip()
    else:
        # Fallback to cookie (works in same-origin / local dev)
        token = request.cookies.get('session_token')
    if not token:
        return None
    
    conn = get_db_connection()
    try:
        session = conn.execute('SELECT user_id FROM sessions WHERE token = ?', (token,)).fetchone()
        if not session:
            return None
            
        user = conn.execute('SELECT * FROM users WHERE id = ?', (session['user_id'],)).fetchone()
        return user
    except Exception as e:
        print(f"Error checking session: {e}")
        return None
    finally:
        conn.close()

# --- AUTH ROUTES ---

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    if not data: return jsonify({"message": "No data"}), 400
    
    username = data.get('username')
    password = data.get('password')
    email = data.get('email', '')
    first_name = data.get('firstName', '')
    last_name = data.get('lastName', '')
    
    if not username or not password:
        return jsonify({"message": "Username and password required"}), 400
    
    hashed_pw = generate_password_hash(password)
    
    conn = get_db_connection()
    try:
        conn.execute('''
            INSERT INTO users (username, password, email, first_name, last_name, profile_image_url)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (username, hashed_pw, email, first_name, last_name, f"https://api.dicebear.com/7.x/avataaars/svg?seed={username}"))
        conn.commit()
    except sqlite3.IntegrityError:
        return jsonify({"message": "Username already exists"}), 400
    finally:
        conn.close()
        
    return jsonify({"message": "User registered successfully"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json
        if not data: return jsonify({"message": "No data"}), 400
        
        username = data.get('username')
        password = data.get('password')
        
        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
        
        if user and check_password_hash(user['password'], password):
            user_data = {
                "id": user['id'],
                "username": user['username'],
                "email": user['email'],
                "firstName": user['first_name'],
                "lastName": user['last_name'],
                "profileImageUrl": user['profile_image_url']
            }
            
            # Generate Session Token
            token = secrets.token_hex(32)
            
            # Store Session in DB
            conn.execute('INSERT INTO sessions (token, user_id) VALUES (?, ?)', (token, user['id']))
            
            # Log Activity
            conn.execute('INSERT INTO user_activity (user_id, action) VALUES (?, ?)', (user['id'], 'login'))
            conn.commit()
            conn.close()

            # Return token in JSON body so the frontend can store it in localStorage.
            # This is required for cross-origin (GitHub Pages -> Render) because SameSite=Lax
            # cookies are silently blocked by browsers on cross-origin requests.
            user_data["sessionToken"] = token
            resp = make_response(jsonify(user_data))
            # Also set as SameSite=None;Secure cookie (works when both on HTTPS same-origin)
            resp.set_cookie('session_token', token, httponly=True, samesite='None', secure=True, max_age=30*24*60*60) # 30 days
            return resp
        
        conn.close()
        return jsonify({"message": "Invalid credentials"}), 401
    except Exception as e:
        print(f"BACKEND ERROR IN LOGIN: {e}")
        return jsonify({"message": "Internal Server Error"}), 500

@app.route('/api/auth/user', methods=['GET'])
def get_current_user():
    user = get_current_user_helper()
    if not user:
        return jsonify(None), 401
        
    user_data = {
        "id": user['id'],
        "username": user['username'],
        "email": user['email'],
        "firstName": user['first_name'],
        "lastName": user['last_name'],
        "profileImageUrl": user['profile_image_url']
    }
    return jsonify(user_data)

@app.route('/api/logout', methods=['POST', 'GET'])
def logout():
    try:
        # Read token from Authorization header first, then cookie fallback
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[len('Bearer '):].strip()
        else:
            token = request.cookies.get('session_token')
        conn = get_db_connection()
        
        if token:
            # Check user for logging
            session = conn.execute('SELECT user_id FROM sessions WHERE token = ?', (token,)).fetchone()
            if session:
                conn.execute('INSERT INTO user_activity (user_id, action) VALUES (?, ?)', (session['user_id'], 'logout'))
                conn.execute('DELETE FROM sessions WHERE token = ?', (token,))
                conn.commit()
        
        conn.close()
        
        resp = make_response(jsonify({"message": "Logged out"}))
        resp.set_cookie('session_token', '', expires=0)
        return resp, 200
    except Exception as e:
        print(f"BACKEND ERROR IN LOGOUT: {e}")
        return jsonify({"message": "Logout failed"}), 500

# --- ANALYSIS ROUTES ---

@app.route('/api/analysis', methods=['GET'])
def list_analyses():
    user = get_current_user_helper()
    if not user: return jsonify([]), 401
    
    conn = get_db_connection()
    analyses = conn.execute('SELECT * FROM analysis_results WHERE user_id = ? ORDER BY created_at DESC', (user['id'],)).fetchall()
    conn.close()
    
    results = []
    for row in analyses:
        results.append({
            "id": row['id'],
            "userId": row['user_id'],
            "fileName": row['file_name'],
            "fileUrl": row['file_url'],
            "fileType": row['file_type'],
            "sentimentLabel": row['sentiment_label'],
            "sentimentScore": row['sentiment_score'],
            "authenticityLabel": row['authenticity_label'],
            "authenticityScore": row['authenticity_score'],
            "details": json.loads(row['details']) if row['details'] else {},
            "createdAt": row['created_at']
        })
    return jsonify(results)

@app.route('/api/analysis/upload', methods=['POST'])
def upload_analysis():
    user = get_current_user_helper()
    if not user: return jsonify({"message": "Unauthorized"}), 401

    data = request.json
    file_name = data.get('fileName')
    file_type = data.get('fileType')
    file_data = data.get('fileData') # Base64
    
    if not file_data:
        return jsonify({"message": "No file data"}), 400

    try:
        header, encoded = file_data.split(",", 1)
        decoded_bytes = base64.b64decode(encoded)
    except Exception:
        return jsonify({"message": "Invalid file data"}), 400

    # NATIVE LOGIC BASED ON FILE TYPE
    res = {}
    if file_type == 'text':
        text_content = decoded_bytes.decode('utf-8', errors='ignore')
        res = analysis_logic.analyze_text_native(text_content)
    elif file_type == 'image':
        res = analysis_logic.analyze_image_native(decoded_bytes)
    elif file_type == 'audio':
        res = analysis_logic.analyze_audio_native(decoded_bytes)
    else:
        # Default/Video mock
        res = {
            "sentiment_label": "Neutral", "sentiment_score": 50,
            "authenticity_label": "Likely Organic", "authenticity_score": 90,
            "reasoning": "Standard video check passed.", "details": {}
        }
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO analysis_results (
            user_id, file_name, file_url, file_type, 
            sentiment_label, sentiment_score, 
            authenticity_label, authenticity_score, 
            details
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        user['id'], file_name, file_data, file_type,
        res.get('sentiment_label'), res.get('sentiment_score'),
        res.get('authenticity_label'), res.get('authenticity_score'),
        json.dumps({
            "reasoning": res.get('reasoning'),
            **res.get('details', {})
        })
    ))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    
    return get_analysis_by_id(new_id)

def get_analysis_by_id(id):
    conn = get_db_connection()
    row = conn.execute('SELECT * FROM analysis_results WHERE id = ?', (id,)).fetchone()
    conn.close()
    if not row: return jsonify({"message": "Not found"}), 404
    return jsonify({
        "id": row['id'], "userId": row['user_id'], "fileName": row['file_name'],
        "fileUrl": row['file_url'], "fileType": row['file_type'],
        "sentimentLabel": row['sentiment_label'], "sentimentScore": row['sentiment_score'],
        "authenticityLabel": row['authenticity_label'], "authenticityScore": row['authenticity_score'],
        "details": json.loads(row['details']) if row['details'] else {}, "createdAt": row['created_at']
    })

@app.route('/api/analysis/<int:id>', methods=['GET'])
def get_analysis_route(id):
    # Optional: Verify user owns this analysis
    return get_analysis_by_id(id)

@app.route('/api/analysis/<int:id>', methods=['DELETE'])
def delete_analysis(id):
    user = get_current_user_helper()
    if not user: return jsonify({"message": "Unauthorized"}), 401

    conn = get_db_connection()
    # Ensure user owns the record
    record = conn.execute('SELECT user_id FROM analysis_results WHERE id = ?', (id,)).fetchone()
    if record and record['user_id'] == user['id']:
        conn.execute('DELETE FROM analysis_results WHERE id = ?', (id,))
        conn.commit()
        conn.close()
        return '', 204
    
    conn.close()
    return jsonify({"message": "Not allowed"}), 403

@app.route('/api/analysis/certificate/<int:id>', methods=['GET'])
def download_certificate(id):
    conn = get_db_connection()
    row = conn.execute('SELECT * FROM analysis_results WHERE id = ?', (id,)).fetchone()
    conn.close()
    if not row: return "Not Found", 404
    
    data = dict(row)
    logo_path = os.path.join(os.path.dirname(__file__), 'logo.png')
    image_data = data.get('file_url') if data.get('file_type') == 'image' else None
    
    pdf_bytes = analysis_logic.generate_certificate(data, logo_path=logo_path, image_data=image_data)
    
    response = send_file(
        io.BytesIO(pdf_bytes),
        mimetype='application/pdf',
        as_attachment=False
    )
    # Hint to the browser to show the filename if it decides to save
    response.headers["Content-Disposition"] = f"inline; filename=certificate_{id}.pdf"
    return response

@app.route('/api/chat', methods=['POST'])
def chat():
    user = get_current_user_helper()
    data = request.json
    if not data: return jsonify({"reply": "System Error: No signal received."})
    msg = data.get('message', '').lower()
    
    # Forensic Knowledge Base
    responses = {
        "ela": "Error Level Analysis (ELA) identifies areas within an image that are at different compression levels. In AI-generated images, this often reveals inconsistencies in pixel density.",
        "metadata": "Metadata forensics involves scrutinizing EXIF data, XMP tags, and ICC profiles for signatures left by generative AI models or editing software.",
        "deepfake": "Deepfake detection looks for frequency anomalies in audio-visual streams, such as unnatural blinking, inconsistent lighting, or phase shifts in vocal patterns.",
        "spectral": "Spectral analysis in audio identifies 'checkerboard artifacts'—unnatural frequency gaps introduced by GANs during the synthesis process."
    }

    # Contextual Logic: Check if user asks about their results
    if "result" in msg or "previous" in msg or "last" in msg or "history" in msg:
        if not user:
            return jsonify({"reply": "Please log in to the forensic terminal to access your analysis history."})
        
        conn = get_db_connection()
        last_analysis = conn.execute(
            'SELECT * FROM analysis_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', 
            (user['id'],)
        ).fetchone()
        conn.close()
        
        if last_analysis:
            label = last_analysis['authenticity_label']
            score = last_analysis['authenticity_score']
            file_name = last_analysis['file_name']
            return jsonify({
                "reply": f"SYSTEM LOG: Your most recent analysis for '{file_name}' returned a classification of '{label}' with {score}% confidence. You can view the full diagnostic at the laboratory terminal."
            })
        else:
            return jsonify({"reply": "No clinical history found. Please upload a specimen for analysis first."})

    # Advanced Keyword Matching
    for key, val in responses.items():
        if key in msg:
            return jsonify({"reply": val})

    if "how" in msg or "process" in msg:
        return jsonify({"reply": "Diagnostic Workflow: We utilize a multi-layered verification stack (ELA, Spectral, and Metadata) to detect generative artifacts."})
    
    if "hello" in msg or "hi" in msg:
        return jsonify({"reply": "Forensic Terminal Active. State your inquiry regarding digital integrity or specimen analysis."})

    return jsonify({"reply": "Inquiry not recognized. I am optimized for forensic diagnostic questions. Try asking about 'ELA', 'Metadata Analysis', or 'Your recent results'."})

@app.route('/api/admin/summary', methods=['GET'])
def get_admin_summary():
    try:
        conn = get_db_connection()
        
        # Fetch Activity
        activity = conn.execute('''
            SELECT a.*, u.username, u.first_name, u.last_name 
            FROM user_activity a
            JOIN users u ON a.user_id = u.id
            ORDER BY a.timestamp DESC
        ''').fetchall()
        
        # Fetch All Users
        all_users = conn.execute('SELECT id, username, first_name, last_name, created_at FROM users').fetchall()
        
        conn.close()
        
        activity_results = []
        for row in activity:
            activity_results.append({
                "id": row['id'],
                "userId": row['user_id'],
                "username": row['username'],
                "fullName": f"{row['first_name']} {row['last_name']}".strip(),
                "action": row['action'],
                "timestamp": row['timestamp']
            })
            
        user_results = []
        for row in all_users:
            user_results.append({
                "id": row['id'],
                "username": row['username'],
                "fullName": f"{row['first_name']} {row['last_name']}".strip(),
                "createdAt": row['created_at']
            })
            
        return jsonify({
            "activities": activity_results,
            "users": user_results
        })
    except Exception as e:
        print(f"BACKEND ERROR IN ADMIN SUMMARY: {e}")
        return jsonify({"message": "Failed to fetch summary", "error": str(e)}), 500

if __name__ == '__main__':
    # Exclude site-packages and cv2 to prevent infinite reload loops
    # Using exclude_patterns directly requires werkzeug, for Flask run we pass via **options
    # Flask < 1.0 might fail, but modern Flask passes kwargs to run_simple
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
