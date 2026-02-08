# Valentine's Day Dedications Website

A modern web application for sharing Valentine's Day dedications with a 30-word limit, Spotify song integration, and real-time sharing across all devices.

## Features

✨ **Core Features:**
- Create dedications with sender/recipient name and class fields
- 30-word message limit with real-time counter
- Spotify song dedication support with automatic metadata extraction
- Delete dedications with confirmation dialog
- Beautiful pink-themed UI with smooth animations
- XSS protection and form validation

🌍 **Multi-Device Sharing:**
- Server-based post storage (no longer limited to localStorage)
- All posts visible on any connected device
- Real-time post updates (auto-refreshes every 3 seconds)
- Access from any device on the network

## Installation & Setup

### Requirements
- Python 3.7+
- Flask and dependencies (`pip3 install -r requirements.txt`)

### Quick Start

1. **Install dependencies:**
   ```bash
   pip3 install -r requirements.txt
   ```

2. **Configure Baserow:**
   - Get your Baserow API token from https://api.baserow.io
   - Set it as environment variable:
     ```bash
     export BASEROW_TOKEN="your_baserow_token_here"
     ```
   - Or update `app.yaml` for deployment

3. **Start the server:**
   ```bash
   cd /Users/avrillee/code
   python3 server.py
   ```

4. **Access the application:**
   - **On your device:** Open `http://localhost:8080` in your browser
   - **From other devices on the network:** Open `http://<your-ip-address>:8080`
     - Find your IP: Run `ipconfig getifaddr en0` on Mac or `ipconfig` on Windows
     - Example: `http://192.168.1.100:8080`

## How It Works

### Frontend (`app-server.js`)
- Automatically loads dedications from the server every 3 seconds
- Submits new dedications via POST request
- Deletes dedications via DELETE request
- Displays real-time updates from all devices

### Backend (`server.py`)
- Flask server that stores dedications in **Baserow database**
- RESTful API endpoints:
  - `GET /api/dedications` - Retrieve all dedications from Baserow
  - `POST /api/dedications` - Create new dedication in Baserow
  - `DELETE /api/dedications/<index>` - Delete dedication from Baserow by index

### Data Storage
- Dedications are stored in **Baserow database** (cloud-based)
- No local JSON file storage
- Configure with `BASEROW_TOKEN` environment variable
- Table ID: `831485` with fields: Sendername, Senderclass, Receipientsname, Receipientclass, Message, Song

## Usage

### From Your Device
1. Open `http://localhost:8080`
2. Fill in the form:
   - Your name and class
   - Recipient's name and class
   - Your 30-word message
   - (Optional) Spotify song URL
3. Click "Submit Dedication"
4. Your post appears immediately on all connected devices

### From Other Devices
1. Find your computer's IP address:
   ```bash
   # Mac
   ipconfig getifaddr en0
   
   # Windows
   ipconfig
   ```

2. On the other device, open your browser and go to:
   ```
   http://<your-ip-address>:8080
   ```

3. You'll see all posts in real-time, and can submit new ones

## Accessing From School Devices

If St. Nick's has a shared network:
1. Start the server on your computer
2. Get your IP address (make sure it's on the school network)
3. Share the link with classmates: `http://<your-ip>:8080`
4. Everyone can see and post dedications!

## API Endpoints

### GET /api/dedications
Returns array of all dedications
```json
[
  {
    "senderName": "Alice",
    "senderClass": "4C",
    "recipientName": "Bob",
    "recipientClass": "4D",
    "message": "You're amazing!",
    "spotifyUrl": "https://...",
    "songTitle": "Love Song",
    "songArtist": "Artist Name",
    "timestamp": "2026-01-22T12:34:56.789Z"
  }
]
```

### POST /api/dedications
Create a new dedication
```json
{
  "senderName": "Alice",
  "senderClass": "4C",
  "recipientName": "Bob",
  "recipientClass": "4D",
  "message": "You're amazing!",
  "spotifyUrl": "https://...",
  "songTitle": "Love Song",
  "songArtist": "Artist Name",
  "timestamp": "2026-01-22T12:34:56.789Z"
}
```

### DELETE /api/dedications/:index
Delete a dedication by its array index

## Stopping the Server

Press `Ctrl+C` in the terminal where the server is running.

## Troubleshooting

**Port already in use?**
- Change the port in `server.py` and access via `http://localhost:8081` (or chosen port)

**Can't access from other devices?**
- Make sure both devices are on the same network
- Check your firewall settings
- Use the correct IP address of the host computer

**Posts not updating?**
- Check browser console for errors (F12)
- Make sure the server is running
- Try refreshing the page manually

**Baserow connection issues?**
- Verify your `BASEROW_TOKEN` environment variable is set correctly
- Check that the token has access to table `831485`
- Ensure internet connectivity to `api.baserow.io`

## Files

- `server.py` - Flask backend server with Baserow integration
- `app-server.js` - Frontend JavaScript (uses server API)
- `index.html` - HTML structure
- `styles.css` - Styling and animations
- `requirements.txt` - Python dependencies (includes `requests` for Baserow API)
- `app.yaml` - Deployment configuration for Google App Engine

## Font

Uses **JetBrains Mono** from Google Fonts for a modern monospace look.

## Color Scheme

- Primary: `#ffb3d9` (light pink)
- Secondary: `#ff9ec9` (soft pink)
- Accent: `#ec407a` (dark pink)
- Light: `#fce4ec` (very light pink)

Enjoy sharing your Valentine's dedications! 💌❤️
