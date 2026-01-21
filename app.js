// Initialize dedications array from localStorage
let dedications = loadDedications();

// DOM Elements
const form = document.getElementById('dedicationForm');
const senderName = document.getElementById('senderName');
const senderClass = document.getElementById('senderClass');
const recipientName = document.getElementById('recipientName');
const recipientClass = document.getElementById('recipientClass');
const message = document.getElementById('message');
const wordCount = document.getElementById('wordCount');
const dedicationsList = document.getElementById('dedicationsList');
const spotifyUrl = document.getElementById('spotifyUrl');
const songPreview = document.getElementById('songPreview');
const songTitle = document.getElementById('songTitle');
const songArtist = document.getElementById('songArtist');

const MAX_WORDS = 30;

// Event Listeners
form.addEventListener('submit', handleFormSubmit);
message.addEventListener('input', updateWordCount);
spotifyUrl.addEventListener('input', updateSongPreview);

// Word count update
function updateWordCount() {
    const words = message.value.trim().split(/\s+/).filter(word => word.length > 0);
    const count = words.length;
    
    wordCount.textContent = count.toString();
    
    const wordCountElement = wordCount.parentElement;
    if (count > MAX_WORDS) {
        wordCountElement.classList.add('warning');
    } else {
        wordCountElement.classList.remove('warning');
    }
}

// Update song preview from Spotify URL
function updateSongPreview() {
    const url = spotifyUrl.value.trim();
    
    if (!url) {
        songPreview.style.display = 'none';
        return;
    }

    // Extract track ID from Spotify URL
    const trackMatch = url.match(/track\/([a-zA-Z0-9]+)/);
    
    if (trackMatch && trackMatch[1]) {
        const trackId = trackMatch[1];
        // Fetch Spotify metadata using public APIs would require authentication
        // For now, we'll extract and display the URL or show a generic preview
        
        // Parse URL to show basic info
        songTitle.textContent = 'Spotify Song Selected';
        songArtist.textContent = 'Click the link above to preview';
        songPreview.style.display = 'block';
    } else {
        songPreview.style.display = 'none';
    }
}

// Form validation
function validateForm() {
    let isValid = true;

    // Clear all previous errors
    clearAllErrors();

    // Validate sender name
    if (!senderName.value.trim()) {
        showError('senderNameError', 'Sender name is required');
        isValid = false;
    }

    // Validate sender class
    if (!senderClass.value.trim()) {
        showError('senderClassError', 'Sender class is required');
        isValid = false;
    }

    // Validate recipient name
    if (!recipientName.value.trim()) {
        showError('recipientNameError', 'Recipient name is required');
        isValid = false;
    }

    // Validate recipient class
    if (!recipientClass.value.trim()) {
        showError('recipientClassError', 'Recipient class is required');
        isValid = false;
    }

    // Validate message
    const words = message.value.trim().split(/\s+/).filter(word => word.length > 0);
    if (!message.value.trim()) {
        showError('messageError', 'Message is required');
        isValid = false;
    } else if (words.length > MAX_WORDS) {
        showError('messageError', `Message exceeds ${MAX_WORDS} words (current: ${words.length})`);
        isValid = false;
    } else if (words.length === 0) {
        showError('messageError', 'Message cannot be empty');
        isValid = false;
    }

    return isValid;
}

// Show error message
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}

// Clear all error messages
function clearAllErrors() {
    const errorElements = document.querySelectorAll('.error');
    errorElements.forEach(element => {
        element.classList.remove('show');
        element.textContent = '';
    });
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
        return;
    }

    const newDedication = {
        senderName: senderName.value.trim(),
        senderClass: senderClass.value.trim(),
        recipientName: recipientName.value.trim(),
        recipientClass: recipientClass.value.trim(),
        message: message.value.trim(),
        spotifyUrl: spotifyUrl.value.trim() || undefined,
        songTitle: songTitle.textContent || undefined,
        songArtist: songArtist.textContent || undefined,
        timestamp: new Date()
    };

    // Add to dedications array
    dedications.unshift(newDedication);

    // Save to localStorage
    saveDedications(dedications);

    // Reset form
    form.reset();
    updateWordCount();
    clearAllErrors();

    // Re-render dedications list
    renderDedications();
}

// Render all dedications
function renderDedications() {
    if (dedications.length === 0) {
        dedicationsList.innerHTML = '<p class="no-dedications">No dedications yet. Be the first to share!</p>';
        return;
    }

    dedicationsList.innerHTML = dedications
        .map((dedication, index) => createDedicationCard(dedication, index))
        .join('');
}

// Create a dedication card HTML
function createDedicationCard(dedication, index) {
    const formattedTime = formatDate(dedication.timestamp);
    const spotifySection = dedication.spotifyUrl ? `
        <div class="dedication-song">
            🎵 <strong>Song Dedication:</strong> <a href="${escapeHtml(dedication.spotifyUrl)}" target="_blank" rel="noopener noreferrer">Listen on Spotify</a>
        </div>
    ` : '';
    
    return `
        <div class="dedication-card">
            <h3>💌 ${escapeHtml(dedication.recipientName)}</h3>
            <div class="dedication-meta">
                <span>📝 From: <strong>${escapeHtml(dedication.senderName)}</strong> (${escapeHtml(dedication.senderClass)})</span>
                <span>💝 To: <strong>${escapeHtml(dedication.recipientName)}</strong> (${escapeHtml(dedication.recipientClass)})</span>
            </div>
            <p class="dedication-message">"${escapeHtml(dedication.message)}"</p>
            ${spotifySection}
            <small style="color: #95a5a6; margin-top: 10px; display: block;">${formattedTime}</small>
        </div>
    `;
}

// Format date for display
function formatDate(date) {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
        return 'just now';
    } else if (minutes < 60) {
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (days < 7) {
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// localStorage functions
function saveDedications(data) {
    localStorage.setItem('valentineDedications', JSON.stringify(data));
}

function loadDedications() {
    try {
        const data = localStorage.getItem('valentineDedications');
        if (!data) {
            return [];
        }
        const parsed = JSON.parse(data);
        // Convert string timestamps back to Date objects
        return parsed.map((d) => ({
            ...d,
            timestamp: new Date(d.timestamp)
        }));
    } catch (error) {
        console.error('Error loading dedications:', error);
        return [];
    }
}

// Initial render
renderDedications();
