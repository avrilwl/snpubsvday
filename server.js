const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'dedications.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Initialize dedications file if it doesn't exist
function initializeDedicationsFile() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
    }
}

// Load dedications from file
function loadDedications() {
    try {
        initializeDedicationsFile();
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading dedications:', error);
        return [];
    }
}

// Save dedications to file
function saveDedications(dedications) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(dedications, null, 2));
    } catch (error) {
        console.error('Error saving dedications:', error);
    }
}

// API Routes

// GET all dedications
app.get('/api/dedications', (req, res) => {
    const dedications = loadDedications();
    res.json(dedications);
});

// POST new dedication
app.post('/api/dedications', (req, res) => {
    try {
        const dedication = req.body;
        
        // Validate required fields
        if (!dedication.senderName || !dedication.senderClass || 
            !dedication.recipientName || !dedication.recipientClass || 
            !dedication.message) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const dedications = loadDedications();
        
        // Add timestamp if not present
        if (!dedication.timestamp) {
            dedication.timestamp = new Date().toISOString();
        }
        
        // Add to the beginning of the array (most recent first)
        dedications.unshift(dedication);
        
        saveDedications(dedications);
        res.status(201).json(dedication);
    } catch (error) {
        console.error('Error creating dedication:', error);
        res.status(500).json({ error: 'Failed to create dedication' });
    }
});

// DELETE a dedication by index
app.delete('/api/dedications/:index', (req, res) => {
    try {
        const index = parseInt(req.params.index);
        const dedications = loadDedications();
        
        if (index < 0 || index >= dedications.length) {
            return res.status(404).json({ error: 'Dedication not found' });
        }
        
        dedications.splice(index, 1);
        saveDedications(dedications);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting dedication:', error);
        res.status(500).json({ error: 'Failed to delete dedication' });
    }
});

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Valentine's Day Dedications server running on http://localhost:${PORT}`);
    console.log('Posts are now shared across all devices!');
});
