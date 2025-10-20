const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config(); // For environment variables

// Load environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in environment variables');
    console.error('Please set OPENAI_API_KEY in your environment variables');
    // Don't exit in production - let Vercel handle it
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
}
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Add logging for debugging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Routes
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'favicon.ico'));
});

// Explicit routes for main HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'signup.html'));
});

app.get('/onboarding', (req, res) => {
    res.sendFile(path.join(__dirname, 'onboarding.html'));
});

// Serve static files with proper MIME types
app.get('/styles.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, 'styles.css'));
});

app.get('/firebase-init.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'firebase-init.js'));
});

app.get('/firebase-config.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'firebase-config.js'));
});

app.get('/firebase-service.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'firebase-service.js'));
});

// Serve JavaScript files from js/ directory
app.get('/js/:filename', (req, res) => {
    const filename = req.params.filename;
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'js', filename));
});

// Serve onboarding.js from root
app.get('/onboarding.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'onboarding.js'));
});

// Serve assets directory
app.get('/assets/:filename', (req, res) => {
    const filename = req.params.filename;
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.svg') contentType = 'image/svg+xml';
    
    res.setHeader('Content-Type', contentType);
    res.sendFile(path.join(__dirname, 'assets', filename));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/onboarding', (req, res) => {
    res.sendFile(path.join(__dirname, 'onboarding.html'));
});

// API routes for backend functionality
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Genius server is running' });
});

// OpenAI API endpoint
app.post('/api/openai', async (req, res) => {
    try {
        const { messages, model = 'gpt-4o-mini', max_tokens = 1000, temperature = 0.7 } = req.body;
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model,
                messages,
                max_tokens,
                temperature
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json({ error: errorData.error?.message || 'OpenAI API error' });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('OpenAI API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ZeroGPT API endpoint
app.post('/api/zerogpt', async (req, res) => {
    try {
        const { text } = req.body;
        
        const response = await fetch('https://api.zerogpt.com/api/detect/detectText', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            body: JSON.stringify({ input_text: text })
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: 'ZeroGPT API error' });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('ZeroGPT API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Environment configuration endpoint
app.get('/api/env', (req, res) => {
    res.json({
        openaiApiKey: OPENAI_API_KEY,
        hasOpenAI: !!OPENAI_API_KEY,
        hasFirebase: true,
        hasAzure: false,
        nodeEnv: NODE_ENV,
        firebaseApiKey: process.env.FIREBASE_API_KEY || "AIzaSyB-JPtkbuIES5T_m7nkX0Ic1iO_lz0FbTk",
        firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN || "genius-b5656.firebaseapp.com",
        firebaseProjectId: process.env.FIREBASE_PROJECT_ID || "genius-b5656",
        firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET || "genius-b5656.firebasestorage.app",
        firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "567988128391",
        firebaseAppId: process.env.FIREBASE_APP_ID || "1:567988128391:web:8a48294d736ec4013f8622",
        firebaseMeasurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-3SEG2XJQMP"
    });
});

// Catch-all route for any other requests
app.get('*', (req, res) => {
    console.log(`404 - File not found: ${req.url}`);
    res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>404 - Page Not Found</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                h1 { color: #ff6b6b; }
                a { color: #4a9eff; text-decoration: none; }
            </style>
        </head>
        <body>
            <h1>404 - Page Not Found</h1>
            <p>The requested page "${req.url}" could not be found.</p>
            <p><a href="/">Go to Home</a> | <a href="/dashboard">Go to Dashboard</a></p>
        </body>
        </html>
    `);
});

// Start server only if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`🚀 Genius server running on http://localhost:${PORT}`);
        console.log(`📱 Dashboard: http://localhost:${PORT}/dashboard`);
        console.log(`🔐 Login: http://localhost:${PORT}/login`);
        console.log(`⚙️  Onboarding: http://localhost:${PORT}/onboarding`);
    });
}

module.exports = app;
