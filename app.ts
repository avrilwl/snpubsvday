// Dedication interface
interface Dedication {
    senderName: string;
    senderClass: string;
    recipientName: string;
    recipientClass: string;
    message: string;
    spotifyUrl?: string;
    songTitle?: string;
    songArtist?: string;
    timestamp: Date;
}

// Initialize dedications array from localStorage
let dedications: Dedication[] = loadDedications();

// DOM Elements
const form = document.getElementById('dedicationForm') as HTMLFormElement;
const senderName = document.getElementById('senderName') as HTMLInputElement;
const senderClass = document.getElementById('senderClass') as HTMLInputElement;
const recipientName = document.getElementById('recipientName') as HTMLInputElement;
const recipientClass = document.getElementById('recipientClass') as HTMLInputElement;
const message = document.getElementById('message') as HTMLTextAreaElement;
const wordCount = document.getElementById('wordCount') as HTMLElement;
const dedicationsList = document.getElementById('dedicationsList') as HTMLElement;
const spotifyUrl = document.getElementById('spotifyUrl') as HTMLInputElement;
const songInputFields = document.getElementById('songInputFields') as HTMLElement;

const MAX_WORDS = 30;

// Event Listeners
form.addEventListener('submit', handleFormSubmit);
message.addEventListener('input', updateWordCount);
spotifyUrl.addEventListener('input', updateSongPreview);

// Word count update
function updateWordCount(): void {
    const words = message.value.trim().split(/\s+/).filter(word => word.length > 0);
    const count = words.length;
    
    wordCount.textContent = count.toString();
    
    const wordCountElement = wordCount.parentElement as HTMLElement;
    if (count > MAX_WORDS) {
        wordCountElement.classList.add('warning');
    } else {
        wordCountElement.classList.remove('warning');
    }
}

// Update song preview from Spotify URL
function updateSongPreview(): void {
    const url = spotifyUrl.value.trim();
    
    if (!url) {
        songInputFields.style.display = 'none';
        return;
    }

    // Extract track ID from Spotify URL
    const trackMatch = url.match(/track\/([a-zA-Z0-9]+)/);
    
    if (trackMatch && trackMatch[1]) {
        const trackId = trackMatch[1];
        
        // Use Spotify oEmbed API to get track metadata
        fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`)
            .then(response => response.json())
            .then(data => {
                let songTitleText = 'Unknown Title';
                let songArtistText = 'Unknown Artist';
                
                console.log('Raw Spotify response:', data);
                
                // Method 1: Try to extract from title field (format: "Song Title by Artist Name")
                if (data.title) {
                    const titleParts = data.title.split(' by ');
                    if (titleParts.length > 1) {
                        songTitleText = titleParts[0].trim();
                        songArtistText = titleParts[1].trim();
                        console.log('Method 1 (title split by): title="' + songTitleText + '", artist="' + songArtistText + '"');
                    } else {
                        // Try splitting by dash if "by" doesn't work
                        const dashParts = data.title.split(/\s*[\-–—]\s*/);
                        if (dashParts.length > 1) {
                            songTitleText = dashParts[0].trim();
                            songArtistText = dashParts[1].trim();
                            console.log('Method 2 (title split by dash): title="' + songTitleText + '", artist="' + songArtistText + '"');
                        } else {
                            songTitleText = data.title.trim();
                            console.log('Method 2 (no separator): title="' + songTitleText + '"');
                        }
                    }
                }
                
                // Method 3: Try author_name field
                if (songArtistText === 'Unknown Artist' && data.author_name && data.author_name.trim()) {
                    songArtistText = data.author_name.trim();
                    console.log('Method 3 (author_name): artist="' + songArtistText + '"');
                }
                
                // Method 4: Parse HTML - look for title attribute in iframe
                if (data.html && data.html.length > 0) {
                    console.log('HTML content:', data.html);
                    
                    // Look for title attribute in iframe tags
                    const titleMatch = data.html.match(/title=["']([^"']+)["']/);
                    if (titleMatch && titleMatch[1]) {
                        const titleAttr = titleMatch[1];
                        console.log('Found title attribute:', titleAttr);
                        
                        // Parse title attribute (usually "Song Title by Artist Name on Spotify")
                        const parts = titleAttr.split(' by ');
                        if (parts.length > 1) {
                            if (songTitleText === 'Unknown Title') {
                                songTitleText = parts[0].trim();
                            }
                            const artistPart = parts[1].split(' on Spotify')[0].trim();
                            if (artistPart && artistPart !== 'Spotify') {
                                songArtistText = artistPart;
                                console.log('Method 4 (HTML title attr): title="' + songTitleText + '", artist="' + songArtistText + '"');
                            }
                        }
                    }
                }
                
                // Update input fields
                const songTitleInput = document.getElementById('songTitle') as HTMLInputElement;
                const songArtistInput = document.getElementById('songArtist') as HTMLInputElement;
                
                if (songTitleInput) songTitleInput.value = songTitleText;
                if (songArtistInput) songArtistInput.value = songArtistText;
                
                // Show the input fields
                songInputFields.style.display = 'grid';
                
                console.log('Final result:', { 
                    title: songTitleText, 
                    artist: songArtistText
                });
            })
            .catch(error => {
                console.error('Error fetching Spotify metadata:', error);
                // Show input fields anyway so user can enter manually
                songInputFields.style.display = 'grid';
            });
    } else {
        songInputFields.style.display = 'none';
    }
}

// Form validation
function validateForm(): boolean {
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
function showError(elementId: string, message: string): void {
    const errorElement = document.getElementById(elementId) as HTMLElement;
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}

// Clear all error messages
function clearAllErrors(): void {
    const errorElements = document.querySelectorAll('.error');
    errorElements.forEach(element => {
        element.classList.remove('show');
        element.textContent = '';
    });
}

// Handle form submission
function handleFormSubmit(e: Event): void {
    e.preventDefault();

    if (!validateForm()) {
        return;
    }

    const newDedication: Dedication = {
        senderName: senderName.value.trim(),
        senderClass: senderClass.value.trim(),
        recipientName: recipientName.value.trim(),
        recipientClass: recipientClass.value.trim(),
        message: message.value.trim(),
        spotifyUrl: spotifyUrl.value.trim() || undefined,
        songTitle: (document.getElementById('songTitle') as HTMLInputElement)?.value || undefined,
        songArtist: (document.getElementById('songArtist') as HTMLInputElement)?.value || undefined,
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
    songInputFields.style.display = 'none';

    // Re-render dedications list
    renderDedications();
}

// Render all dedications
function renderDedications(): void {
    if (dedications.length === 0) {
        dedicationsList.innerHTML = '<p class="no-dedications">No dedications yet. Be the first to share!</p>';
        return;
    }

    dedicationsList.innerHTML = dedications
        .map((dedication, index) => createDedicationCard(dedication, index))
        .join('');
}

// Create a dedication card HTML
function createDedicationCard(dedication: Dedication, index: number): string {
    const formattedTime = formatDate(dedication.timestamp);
    const spotifySection = dedication.spotifyUrl ? `
        <div class="dedication-song">
            🎵 <a href="${escapeHtml(dedication.spotifyUrl)}" target="_blank" rel="noopener noreferrer"><strong>${escapeHtml(dedication.songTitle || 'Unknown Title')}</strong> - ${escapeHtml(dedication.songArtist || 'Unknown Artist')}</a>
        </div>
    ` : '';
    
    return `
        <div class="dedication-card">
            <div class="dedication-header">
                <h3>💌 ${escapeHtml(dedication.recipientName)}</h3>
                <button class="delete-btn" onclick="deleteDedication(${index})" title="Delete dedication">✕</button>
            </div>
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
function formatDate(date: Date): string {
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
function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// localStorage functions
function saveDedications(data: Dedication[]): void {
    localStorage.setItem('valentineDedications', JSON.stringify(data));
}

function loadDedications(): Dedication[] {
    try {
        const data = localStorage.getItem('valentineDedications');
        if (!data) {
            return [];
        }
        const parsed = JSON.parse(data);
        // Convert string timestamps back to Date objects
        return parsed.map((d: any) => ({
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

// Delete dedication function
function deleteDedication(index: number): void {
    if (confirm('Are you sure you want to delete this dedication?')) {
        dedications.splice(index, 1);
        saveDedications(dedications);
        renderDedications();
    }
}
