#!/usr/bin/env python3
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import os
from datetime import datetime
import json

app = Flask(__name__)
CORS(app)

# Initialize Firebase
db = None

def init_firebase():
    """Initialize Firebase Admin SDK"""
    global db
    
    # Check if running on Google Cloud (Cloud Run, App Engine, etc.)
    if os.environ.get('FIRESTORE_EMULATOR_HOST'):
        # Use local Firestore emulator for development
        firebase_admin.initialize_app()
    elif os.path.exists('serviceAccountKey.json'):
        # Use service account key file (local development)
        cred = credentials.Certificate('serviceAccountKey.json')
        firebase_admin.initialize_app(cred)
    else:
        # On Google Cloud, use Application Default Credentials
        firebase_admin.initialize_app()
    
    db = firestore.client()
    print("✅ Firebase Firestore initialized successfully")

# Initialize Firebase on startup
try:
    init_firebase()
except Exception as e:
    print(f"⚠️  Warning: Firebase not initialized. Using local file storage as fallback.")
    print(f"   Error: {e}")
    db = None

DEDICATIONS_COLLECTION = 'dedications'
DATA_FILE = 'dedications.json'

def load_dedications():
    """Load dedications from Firestore or fallback to JSON file"""
    global db
    
    # Try Firestore first
    if db:
        try:
            docs = db.collection(DEDICATIONS_COLLECTION).order_by('timestamp', direction=firestore.Query.DESCENDING).stream()
            dedications = []
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id  # Store document ID for updates/deletes
                dedications.append(data)
            return dedications
        except Exception as e:
            print(f"Error loading from Firestore: {e}")
            return load_dedications_local()
    else:
        # Fallback to local JSON file
        return load_dedications_local()

def load_dedications_local():
    """Load dedications from local JSON file"""
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r') as f:
                return json.load(f)
        except:
            return []
    return []

def save_dedications(dedications):
    """Save dedications to Firestore or fallback to JSON file"""
    global db
    
    if db:
        try:
            # Save to Firestore
            for dedication in dedications:
                doc_id = dedication.get('id') or dedication.get('timestamp')
                db.collection(DEDICATIONS_COLLECTION).document(str(doc_id)).set(dedication)
            return True
        except Exception as e:
            print(f"Error saving to Firestore: {e}")
            return save_dedications_local(dedications)
    else:
        # Fallback to local JSON file
        return save_dedications_local(dedications)

def save_dedications_local(dedications):
    """Save dedications to local JSON file"""
    try:
        with open(DATA_FILE, 'w') as f:
            json.dump(dedications, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving dedications: {e}")
        return False

def add_dedication_firestore(data):
    """Add a dedication to Firestore"""
    if db:
        try:
            db.collection(DEDICATIONS_COLLECTION).add(data)
            return True
        except Exception as e:
            print(f"Error adding to Firestore: {e}")
            return False
    return False

def delete_dedication_firestore(doc_id):
    """Delete a dedication from Firestore"""
    if db:
        try:
            db.collection(DEDICATIONS_COLLECTION).document(doc_id).delete()
            return True
        except Exception as e:
            print(f"Error deleting from Firestore: {e}")
            return False
    return False

# Serve static files
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/styles.css')
def styles():
    return send_from_directory('.', 'styles.css', mimetype='text/css')

@app.route('/app-server.js')
def app_js():
    return send_from_directory('.', 'app-server.js', mimetype='application/javascript')

# API Routes
@app.route('/api/dedications', methods=['GET'])
def get_dedications():
    """Get all dedications"""
    dedications = load_dedications()
    # Remove 'id' field before sending to client (or keep it - depends on needs)
    return jsonify(dedications)

@app.route('/api/dedications', methods=['POST'])
def create_dedication():
    """Create a new dedication"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['senderName', 'senderClass', 'recipientName', 'recipientClass', 'message']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Ensure timestamp exists
        if 'timestamp' not in data:
            data['timestamp'] = datetime.now().isoformat()
        
        # Try to save to Firestore first
        if db and add_dedication_firestore(data):
            return jsonify(data), 201
        
        # Fallback to local file storage
        dedications = load_dedications_local()
        dedications.insert(0, data)
        if save_dedications_local(dedications):
            return jsonify(data), 201
        
        return jsonify({'error': 'Failed to save dedication'}), 500
    except Exception as e:
        print(f"Error creating dedication: {e}")
        return jsonify({'error': 'Failed to create dedication'}), 500

@app.route('/api/dedications/<string:index_or_id>', methods=['DELETE'])
def delete_dedication(index_or_id):
    """Delete a dedication by index or document ID"""
    try:
        # Try to delete from Firestore first (assuming it's a doc ID)
        if db and delete_dedication_firestore(index_or_id):
            return jsonify({'success': True}), 200
        
        # Fallback to local file storage (by index)
        try:
            index = int(index_or_id)
            dedications = load_dedications_local()
            
            if index < 0 or index >= len(dedications):
                return jsonify({'error': 'Dedication not found'}), 404
            
            dedications.pop(index)
            save_dedications_local(dedications)
            return jsonify({'success': True}), 200
        except ValueError:
            return jsonify({'error': 'Invalid dedication ID'}), 400
    except Exception as e:
        print(f"Error deleting dedication: {e}")
        return jsonify({'error': 'Failed to delete dedication'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'firestore_connected': db is not None
    }), 200

if __name__ == '__main__':
    # Get port from environment variable or default to 8080
    port = int(os.environ.get('PORT', 8080))
    print(f"Valentine's Day Dedications server running on http://0.0.0.0:{port}")
    print("Posts are now shared across all devices!")
    app.run(host='0.0.0.0', port=port, debug=False)

