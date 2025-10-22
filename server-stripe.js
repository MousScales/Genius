// Simple Stripe server for subscriptions
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Simple subscription endpoint
app.post('/api/create-checkout-session', (req, res) => {
    try {
        const { priceId, userId, planType } = req.body;
        
        console.log('Creating checkout session:', { priceId, userId, planType });
        
        // For now, return a demo response
        // Later we can integrate with real Stripe
        res.json({
            sessionId: 'cs_demo_' + Date.now(),
            url: '#demo-checkout',
            message: 'Demo mode - subscription simulation'
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Stripe server is running' });
});

app.listen(PORT, () => {
    console.log(`Stripe server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});
