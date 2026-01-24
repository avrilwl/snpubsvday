#!/usr/bin/env python3
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

DATA_FILE = 'dedications.json'

def load_dedications():
    """Load dedications from JSON file"""
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r') as f:
                return json.load(f)
        except:
            return []
    return []

def save_dedications(dedications):
    """Save dedications to JSON file"""
    try:
        with open(DATA_FILE, 'w') as f:
            json.dump(dedications, f, indent=2)
    except Exception as e:
        print(f"Error saving dedications: {e}")

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
        
        dedications = load_dedications()
        dedications.insert(0, data)  # Add to beginning (most recent first)
        save_dedications(dedications)
        
        return jsonify(data), 201
    except Exception as e:
        print(f"Error creating dedication: {e}")
        return jsonify({'error': 'Failed to create dedication'}), 500

@app.route('/api/dedications/<int:index>', methods=['DELETE'])
def delete_dedication(index):
    """Delete a dedication by index"""
    try:
        dedications = load_dedications()
        
        if index < 0 or index >= len(dedications):
            return jsonify({'error': 'Dedication not found'}), 404
        
        dedications.pop(index)
        save_dedications(dedications)
        
        return jsonify({'success': True}), 200
    except Exception as e:
        print(f"Error deleting dedication: {e}")
        return jsonify({'error': 'Failed to delete dedication'}), 500

if __name__ == '__main__':
    # Get port from environment variable or default to 8080
    port = int(os.environ.get('PORT', 8080))
    print(f"Valentine's Day Dedications server running on http://0.0.0.0:{port}")
    print("Posts are now shared across all devices!")
    app.run(host='0.0.0.0', port=port, debug=False)
