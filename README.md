# Valentine's Day Dedications

A beautiful TypeScript web application for sharing heartfelt Valentine's Day messages and song dedications. Users can create dedications with a 30-word limit and must include sender/recipient names and classes.

## Features

- ✨ Create Valentine's Day message and song dedications
- 📝 30-word limit with real-time word counter
- 👤 Required fields: Sender name, sender class, recipient name, recipient class
- 💾 Persistent storage using localStorage
- 🎨 Responsive design that works on desktop and mobile
- ✅ Form validation with error messages
- 💌 Beautiful UI with gradient backgrounds and smooth animations

## Project Structure

```
valentine-dedications/
├── index.html          # Main HTML file with form and dedications display
├── styles.css          # Complete styling and responsive design
├── app.ts              # TypeScript source code
├── app.js              # Compiled JavaScript
├── package.json        # Project metadata
├── tsconfig.json       # TypeScript configuration
└── README.md           # This file
```

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- No server or Node.js required

### Running the Project

1. **Open in browser directly:**
   - Navigate to the `index.html` file and open it in your web browser

2. **Using Python (if available):**
   ```bash
   python3 -m http.server 3000
   ```
   Then visit `http://localhost:3000` in your browser

3. **Using any local server:**
   - Use your preferred local server (Live Server in VS Code, http-server, etc.)

## Usage

1. **Fill in the form:**
   - Enter your name and class
   - Enter recipient's name and class
   - Write your message or song dedication (max 30 words)

2. **Submit:**
   - Click "Submit Dedication" button
   - Your dedication will appear in the list below

3. **View Dedications:**
   - All submitted dedications are displayed with timestamps
   - Dedications are saved to browser's localStorage and persist between sessions

## Form Validation

- All fields are required
- Message must not exceed 30 words
- Error messages display inline for easy correction
- Word counter updates in real-time

## Technical Details

- **Built with:** TypeScript, HTML5, CSS3
- **Storage:** Browser localStorage
- **Responsive:** Mobile-first design
- **Security:** HTML escaping to prevent XSS attacks
- **Accessibility:** Semantic HTML and proper form labels

## Browser Support

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Features Explained

### Word Limit (30 words)
The application enforces a 30-word maximum for each dedication message. The word counter updates in real-time as you type.

### Required Fields
- **Sender Name:** Your name
- **Sender Class:** Your class/grade (e.g., Grade 10A)
- **Recipient Name:** Recipient's name
- **Recipient Class:** Recipient's class/grade

### Data Persistence
All dedications are saved to the browser's localStorage, allowing them to persist even after closing and reopening the browser.

## Development

To modify the TypeScript code:

1. Edit `app.ts`
2. Compile to JavaScript: `tsc app.ts`
3. The compiled `app.js` will be updated

Or simply edit `app.js` directly if not using TypeScript compilation.

## License

ISC - Feel free to use and modify

## Author

Created for Valentine's Day 💌

---

**Enjoy sharing your love and appreciation with Valentine's Day dedications!** 💕
