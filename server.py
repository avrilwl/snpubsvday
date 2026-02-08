#!/usr/bin/env python3
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from datetime import datetime
import json
import requests

app = Flask(__name__)
CORS(app)

print("✅ Valentine's Day Dedications - Using Baserow Database")

# Baserow API Configuration
BASEROW_API_URL = "https://api.baserow.io/api/database/rows/table/831485"
BASEROW_TOKEN = os.environ.get("BASEROW_TOKEN", "dedi")  # Get token from environment variable
HEADERS = {
    "Authorization": f"Token {BASEROW_TOKEN}",
    "Content-Type": "application/json"
}

def load_dedications():
    """Load dedications from Baserow"""
    try:
        response = requests.get(
            f"{BASEROW_API_URL}/?user_field_names=true",
            headers=HEADERS
        )
        response.raise_for_status()
        data = response.json()
        
        # Convert Baserow format to our app format
        dedications = []
        for row in data.get("results", []):
            # Handle field name mapping
            dedication = {
                "id": row.get("id"),  # Store Baserow row ID for deletion
                "senderName": row.get("Sendername", ""),
                "senderClass": row.get("Senderclass", ""),
                "recipientName": row.get("Receipientsname", ""),  # Note: typo in Baserow field name
                "recipientClass": row.get("Receipientclass", ""),  # Note: typo in Baserow field name
                "message": row.get("Message", ""),
                # Use Timestamp field from Baserow if available, otherwise use created_on
                "timestamp": row.get("Timestamp") or row.get("created_on", datetime.now().isoformat())
            }
            
            # Handle song URL if present
            song_url = row.get("Song")
            # Check if song_url exists and is not empty/default
            if song_url and song_url.strip() and song_url != "https://baserow.io":
                dedication["spotifyUrl"] = song_url
                # Use the new Baserow fields for song title and artist
                dedication["songTitle"] = row.get("Songtitle") or None
                dedication["songArtist"] = row.get("Artistname") or None
            
            dedications.append(dedication)
        
        # Sort by timestamp (newest first)
        dedications.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return dedications
    except Exception as e:
        print(f"Error loading dedications from Baserow: {e}")
        return []

def save_dedication(dedication_data):
    """Save a dedication to Baserow"""
    try:
        # Map our app fields to Baserow fields
        # Include ALL fields as shown in the Baserow API example
        baserow_data = {
            "Sendername": dedication_data.get("senderName", ""),
            "Senderclass": dedication_data.get("senderClass", ""),
            "Receipientsname": dedication_data.get("recipientName", ""),  # Note: typo in Baserow field name
            "Receipientclass": dedication_data.get("recipientClass", ""),  # Note: typo in Baserow field name
            "Message": dedication_data.get("message", ""),
            "Song": dedication_data.get("spotifyUrl", "https://baserow.io"),  # Default value as per example
            "Artistname": dedication_data.get("songArtist", ""),  # Empty string if not provided
            "Songtitle": dedication_data.get("songTitle", ""),  # Empty string if not provided
            "Timestamp": dedication_data.get("timestamp", "")  # Empty string if not provided
        }
        
        response = requests.post(
            f"{BASEROW_API_URL}/?user_field_names=true",
            headers=HEADERS,
            json=baserow_data
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error saving dedication to Baserow: {e}")
        raise

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
        
        # Save to Baserow
        saved_data = save_dedication(data)
        
        # Return the saved data with our app format
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
        
        # Get the Baserow row ID from the dedication at this index
        row_id = dedications[index].get("id")
        if not row_id:
            return jsonify({'error': 'Dedication ID not found'}), 404
        
        # Delete from Baserow
        delete_url = f"{BASEROW_API_URL}/{row_id}/"
        response = requests.delete(delete_url, headers=HEADERS)
        response.raise_for_status()
        
        return jsonify({'success': True}), 200
    except Exception as e:
        print(f"Error deleting dedication: {e}")
        return jsonify({'error': 'Failed to delete dedication'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'storage': 'baserow'
    }), 200

if __name__ == '__main__':
    # Get port from environment variable or default to 8080
    port = int(os.environ.get('PORT', 8080))
    print(f"Valentine's Day Dedications server running on http://0.0.0.0:{port}")
    print("Posts are now shared across all devices!")
    app.run(host='0.0.0.0', port=port, debug=False)

