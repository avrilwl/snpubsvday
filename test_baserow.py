#!/usr/bin/env python3
"""
Test script to verify the Baserow integration works.
This tests the server.py functionality without actually connecting to Baserow.
"""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Mock the requests module to test without actual Baserow connection
import unittest
from unittest.mock import Mock, patch
import json
from datetime import datetime

# Import the functions we want to test
from server import load_dedications, save_dedication, app

class TestBaserowIntegration(unittest.TestCase):
    
    def setUp(self):
        """Set up test fixtures"""
        self.app = app.test_client()
        self.app.testing = True
        
    @patch('server.requests.get')
    def test_load_dedications_success(self, mock_get):
        """Test loading dedications from Baserow with mock data"""
        # Mock response from Baserow
        mock_response = Mock()
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = {
            "results": [
                {
                    "id": 1,
                    "Sendername": "John",
                    "Senderclass": "4A",
                    "Receipientsname": "Jane",
                    "Receipientclass": "4B",
                    "Message": "Test message",
                    "Song": "https://open.spotify.com/track/abc123",
                    "created_on": "2026-02-08T10:00:00Z"
                },
                {
                    "id": 2,
                    "Sendername": "Alice",
                    "Senderclass": "5A",
                    "Receipientsname": "Bob",
                    "Receipientclass": "5B",
                    "Message": "Another test",
                    "Song": "",
                    "created_on": "2026-02-08T09:00:00Z"
                }
            ]
        }
        mock_get.return_value = mock_response
        
        # Call the function
        dedications = load_dedications()
        
        # Verify results
        self.assertEqual(len(dedications), 2)
        
        # Check first dedication
        self.assertEqual(dedications[0]["senderName"], "John")
        self.assertEqual(dedications[0]["senderClass"], "4A")
        self.assertEqual(dedications[0]["recipientName"], "Jane")
        self.assertEqual(dedications[0]["recipientClass"], "4B")
        self.assertEqual(dedications[0]["message"], "Test message")
        self.assertEqual(dedications[0]["spotifyUrl"], "https://open.spotify.com/track/abc123")
        self.assertIsNone(dedications[0]["songTitle"])
        self.assertIsNone(dedications[0]["songArtist"])
        self.assertEqual(dedications[0]["id"], 1)
        
        # Check second dedication (no song URL)
        self.assertEqual(dedications[1]["senderName"], "Alice")
        self.assertNotIn("spotifyUrl", dedications[1])  # No spotifyUrl field when no song
        
        # Verify sorting (newest first)
        self.assertGreater(dedications[0]["timestamp"], dedications[1]["timestamp"])
    
    @patch('server.requests.get')
    def test_load_dedications_error(self, mock_get):
        """Test loading dedications when Baserow returns error"""
        mock_response = Mock()
        mock_response.raise_for_status.side_effect = Exception("API error")
        mock_get.return_value = mock_response
        
        dedications = load_dedications()
        self.assertEqual(dedications, [])
    
    @patch('server.requests.post')
    def test_save_dedication(self, mock_post):
        """Test saving a dedication to Baserow"""
        # Mock response
        mock_response = Mock()
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = {"id": 123}
        mock_post.return_value = mock_response
        
        dedication_data = {
            "senderName": "Test",
            "senderClass": "4A",
            "recipientName": "Friend",
            "recipientClass": "4B",
            "message": "Hello!",
            "timestamp": "2026-02-08T10:00:00Z"
        }
        
        result = save_dedication(dedication_data)
        
        # Verify the request was made correctly
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        
        # Check URL
        self.assertIn("https://api.baserow.io/api/database/rows/table/831485/?user_field_names=true", args[0])
        
        # Check headers - using the token from app.yaml
        self.assertEqual(kwargs["headers"]["Authorization"], "Token lx3pu0Jovlbaujjilm270IeMxdPbZTr4")
        
        # Check data
        data = kwargs["json"]
        self.assertEqual(data["Sendername"], "Test")
        self.assertEqual(data["Senderclass"], "4A")
        self.assertEqual(data["Receipientsname"], "Friend")
        self.assertEqual(data["Receipientclass"], "4B")
        self.assertEqual(data["Message"], "Hello!")
        self.assertEqual(data["Song"], "")  # Empty string when no spotifyUrl
        
        # Verify result
        self.assertEqual(result, {"id": 123})
    
    @patch('server.requests.post')
    def test_save_dedication_with_spotify(self, mock_post):
        """Test saving a dedication with Spotify URL"""
        mock_response = Mock()
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = {"id": 124}
        mock_post.return_value = mock_response
        
        dedication_data = {
            "senderName": "Test",
            "senderClass": "4A",
            "recipientName": "Friend",
            "recipientClass": "4B",
            "message": "Hello!",
            "spotifyUrl": "https://open.spotify.com/track/abc123",
            "songTitle": "Test Song",
            "songArtist": "Test Artist",
            "timestamp": "2026-02-08T10:00:00Z"
        }
        
        result = save_dedication(dedication_data)
        
        # Verify the request data
        args, kwargs = mock_post.call_args
        data = kwargs["json"]
        
        self.assertEqual(data["Song"], "https://open.spotify.com/track/abc123")
        # Note: songTitle and songArtist are not saved to Baserow
    
    def test_api_endpoints(self):
        """Test Flask API endpoints"""
        # Test health endpoint
        response = self.app.get('/api/health')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data["storage"], "baserow")
        
        # Test GET dedications endpoint (will fail without mock, but we test it returns something)
        with patch('server.load_dedications') as mock_load:
            mock_load.return_value = []
            response = self.app.get('/api/dedications')
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.data)
            self.assertEqual(data, [])
        
        # Test POST dedication endpoint validation
        response = self.app.post('/api/dedications', 
                                json={},  # Empty data
                                content_type='application/json')
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn("error", data)
        self.assertIn("Missing required field", data["error"])

if __name__ == '__main__':
    # Run tests
    unittest.main(verbosity=2)