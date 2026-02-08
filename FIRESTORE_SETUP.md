# Cloud Firestore Setup Guide

This application now uses Google Cloud Firestore for persistent data storage. This ensures your dedications are saved even when the app restarts in the cloud.

## Setup Instructions

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (if you don't have one)
3. Enable the Firestore API:
   - Search for "Firestore" in the search bar
   - Click "Cloud Firestore"
   - Click "Create Database"
   - Choose your region (e.g., `us-central1`)
   - Start in "Production mode"

### 2. Set Up Authentication

#### Option A: Local Development (Recommended)

1. **Install Google Cloud SDK:**
   ```bash
   brew install --cask google-cloud-sdk  # macOS
   # or download from https://cloud.google.com/sdk/docs/install
   ```

2. **Authenticate:**
   ```bash
   gcloud auth application-default login
   ```

3. **Run locally:**
   ```bash
   python3 server.py
   ```
   The app will automatically use your authenticated credentials.

#### Option B: Production Deployment (Google Cloud Run/App Engine)

1. **Create a Service Account:**
   - Go to [Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
   - Click "Create Service Account"
   - Name: `dedications-app`
   - Grant these roles:
     - `Cloud Datastore User`
     - `Cloud Datastore Service Agent`

2. **Create a Key:**
   - Click on the service account
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key"
   - Choose "JSON"
   - This downloads a JSON file

3. **Create a Secret in Cloud Run:**
   - Create a new secret with your service account key
   - Grant the Cloud Run service account access to this secret

4. **Update Deployment:**
   - In your Cloud Run deployment, mount the secret as an environment variable
   - Or encode the key and pass it via `GOOGLE_APPLICATION_CREDENTIALS`

### 3. Deploy to Cloud Run

```bash
# Build and deploy
gcloud run deploy dedications-app \
  --source . \
  --region us-central1 \
  --allow-unauthenticated

# Set environment variable for Cloud Run
gcloud run services update dedications-app \
  --update-env-vars GOOGLE_APPLICATION_CREDENTIALS=/secrets/key.json
```

### 4. Local Testing with Emulator

To test Firestore locally without connecting to the cloud:

```bash
# Install Firestore emulator
gcloud components install cloud-firestore-emulator

# Start the emulator
gcloud beta emulators firestore start

# In another terminal, set the environment variable and run the app
export FIRESTORE_EMULATOR_HOST=localhost:8081
python3 server.py
```

## Architecture

The app now uses a **hybrid approach**:

1. **Primary Storage:** Cloud Firestore (when available)
2. **Fallback Storage:** Local JSON file (for local development without credentials)

This means:
- ✅ Works locally without any configuration
- ✅ Works in the cloud with Firestore
- ✅ Automatic fallback if Firestore unavailable
- ✅ No data loss on container restart (Firestore)

## Database Structure

**Collection:** `dedications`

**Document fields:**
```json
{
  "senderName": "John",
  "senderClass": "4C",
  "recipientName": "Jane",
  "recipientClass": "4B",
  "message": "Happy Valentine's Day!",
  "spotifyUrl": "https://open.spotify.com/track/...",
  "songTitle": "Love Song",
  "songArtist": "Artist Name",
  "timestamp": "2026-01-24T10:30:00.000000"
}
```

Documents are automatically sorted by `timestamp` (newest first).

## Health Check

Check if Firestore is connected:

```bash
curl https://your-app.run.app/api/health
```

Response:
```json
{
  "status": "ok",
  "firestore_connected": true
}
```

## Troubleshooting

**"Firebase not initialized" error:**
- Local: Run `gcloud auth application-default login`
- Cloud: Check service account credentials are properly configured

**Data not persisting:**
- Check that Firestore database is created and enabled
- Verify service account has `Cloud Datastore User` role

**Permission denied errors:**
- Ensure service account has proper IAM roles
- Check Firestore security rules allow writes

## Switching Back to Local Storage

If you want to use only local JSON storage (not recommended for production):

Edit [server.py](server.py) and set `db = None` at the top.
