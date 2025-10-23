const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config(); // For environment variables

// Initialize Stripe after loading environment variables
let stripe = null;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (STRIPE_SECRET_KEY) {
    try {
        stripe = require('stripe')(STRIPE_SECRET_KEY);
        console.log('Stripe Secret Key loaded: YES');
    } catch (error) {
        console.error('Error initializing Stripe:', error.message);
        stripe = null;
    }
} else {
    console.log('Stripe Secret Key not found - Stripe features will use fallbacks');
}

// Load environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (OPENAI_API_KEY) {
    console.log('OpenAI API Key loaded: YES');
} else {
    console.warn('⚠️ OPENAI_API_KEY not found - OpenAI features will use fallbacks');
}
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
// Note: express.static('.') removed to prevent conflicts with custom routes

// Add logging for debugging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Routes
app.get('/favicon.ico', (req, res) => {
    res.setHeader('Content-Type', 'image/x-icon');
    res.sendFile(path.join(__dirname, 'favicon.ico'));
});

app.get('/favicon-16x16.png', (req, res) => {
    res.setHeader('Content-Type', 'image/png');
    res.sendFile(path.join(__dirname, 'favicon-16x16.png'));
});

app.get('/favicon-32x32.png', (req, res) => {
    res.setHeader('Content-Type', 'image/png');
    res.sendFile(path.join(__dirname, 'favicon-32x32.png'));
});

app.get('/icon-192.png', (req, res) => {
    res.setHeader('Content-Type', 'image/png');
    res.sendFile(path.join(__dirname, 'icon-192.png'));
});

app.get('/icon-512.png', (req, res) => {
    res.setHeader('Content-Type', 'image/png');
    res.sendFile(path.join(__dirname, 'icon-512.png'));
});

app.get('/apple-touch-icon.png', (req, res) => {
    res.setHeader('Content-Type', 'image/png');
    res.sendFile(path.join(__dirname, 'apple-touch-icon.png'));
});

// Explicit routes for main HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'indexsite.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'signup.html'));
});

app.get('/signup.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'signup.html'));
});

app.get('/onboarding', (req, res) => {
    res.sendFile(path.join(__dirname, 'onboarding.html'));
});

app.get('/onboarding.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'onboarding.html'));
});

app.get('/subscription', (req, res) => {
    res.sendFile(path.join(__dirname, 'subscription.html'));
});

app.get('/subscription.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'subscription.html'));
});

app.get('/subscription-success', (req, res) => {
    res.sendFile(path.join(__dirname, 'subscription-success.html'));
});

// Serve static files with proper MIME types
app.get('/styles.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, 'styles.css'));
});

app.get('/stylessite.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, 'stylessite.css'));
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
        if (!OPENAI_API_KEY) {
            // Return a fallback response instead of error
            return res.json({
                choices: [{
                    message: {
                        content: "I'm sorry, but the AI service is currently unavailable. Please try again later or contact support if the issue persists.",
                        role: "assistant"
                    }
                }],
                usage: {
                    prompt_tokens: 0,
                    completion_tokens: 0,
                    total_tokens: 0
                }
            });
        }

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
            console.error('OpenAI API error:', errorData);
            // Return fallback response instead of error
            return res.json({
                choices: [{
                    message: {
                        content: "I'm experiencing technical difficulties. Please try again in a moment.",
                        role: "assistant"
                    }
                }],
                usage: {
                    prompt_tokens: 0,
                    completion_tokens: 0,
                    total_tokens: 0
                }
            });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('OpenAI API error:', error);
        // Return fallback response instead of error
        res.json({
            choices: [{
                message: {
                    content: "I'm sorry, but I'm having trouble processing your request right now. Please try again later.",
                    role: "assistant"
                }
            }],
            usage: {
                prompt_tokens: 0,
                completion_tokens: 0,
                total_tokens: 0
            }
        });
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

// Stripe API endpoints
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { userId, planType, userEmail } = req.body;

        if (!userId || !planType || !userEmail) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // Create checkout session with price data
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Genius ${planType === 'monthly' ? 'Monthly' : 'Yearly'} Plan`,
                            description: `Genius AI Study Assistant - ${planType === 'monthly' ? 'Monthly' : 'Yearly'} subscription`,
                        },
                        recurring: {
                            interval: planType === 'monthly' ? 'month' : 'year',
                        },
                        unit_amount: planType === 'monthly' ? 1500 : 12000, // $15 and $120 in cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.NODE_ENV === 'production' ? 'https://genius-site.com' : 'http://localhost:3001'}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NODE_ENV === 'production' ? 'https://genius-site.com' : 'http://localhost:3001'}/subscription.html`,
            customer_email: userEmail,
            metadata: {
                userId: userId,
                planType: planType,
            },
        });

        res.status(200).json({ sessionId: session.id });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/get-subscription-details', async (req, res) => {
    try {
        const { session_id } = req.query;

        if (!session_id) {
            return res.status(400).json({ error: 'Session ID is required' });
        }

        // Retrieve the checkout session
        const session = await stripe.checkout.sessions.retrieve(session_id, {
            expand: ['subscription', 'customer']
        });

        if (!session.subscription) {
            return res.status(400).json({ error: 'No subscription found for this session' });
        }

        // Get subscription details
        const subscription = session.subscription;
        const customer = session.customer;

        // Determine plan type from subscription
        let planType = 'monthly';
        if (subscription.items.data[0].price.recurring.interval === 'year') {
            planType = 'yearly';
        }

        const subscriptionData = {
            subscriptionId: subscription.id,
            customerId: customer.id,
            planType: planType,
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        };

        res.status(200).json(subscriptionData);
    } catch (error) {
        console.error('Error getting subscription details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create Stripe customer portal session
app.post('/api/create-portal-session', async (req, res) => {
    try {
        const { userId, customerId } = req.body;

        if (!userId || !customerId) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // Create portal session
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${process.env.NODE_ENV === 'production' ? 'https://genius-site.com' : 'http://localhost:3001'}/dashboard`,
        });

        res.status(200).json({ url: portalSession.url });
    } catch (error) {
        console.error('Error creating portal session:', error);
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

// Stripe API endpoint
app.post('/api/stripe', async (req, res) => {
    try {
        const { action } = req.query;
        const { userId, customerId } = req.body;

        // Check if Stripe is available
        if (!stripe) {
            console.log('Stripe not available, returning fallback response');
            if (action === 'check-subscription-status') {
                return res.json({ hasActiveSubscription: false });
            } else if (action === 'create-portal-session') {
                return res.json({ 
                    url: 'https://billing.stripe.com/p/login/test_customer_portal',
                    error: 'Stripe service not available - using fallback'
                });
            } else {
                return res.status(400).json({ error: 'Invalid action' });
            }
        }

        if (action === 'check-subscription-status') {
            if (!customerId) {
                return res.json({ hasActiveSubscription: false });
            }

            try {
                // Check subscription status with Stripe
                const subscriptions = await stripe.subscriptions.list({
                    customer: customerId,
                    status: 'active',
                    limit: 1
                });

                const hasActiveSubscription = subscriptions.data.length > 0;
                console.log('Subscription check result:', { hasActiveSubscription, count: subscriptions.data.length });
                
                res.json({ 
                    hasActiveSubscription,
                    subscription: hasActiveSubscription ? subscriptions.data[0] : null
                });
            } catch (stripeError) {
                console.error('Stripe subscription check error:', stripeError.message);
                // If customer doesn't exist or other Stripe error, return false
                res.json({ hasActiveSubscription: false });
            }
        } else if (action === 'create-portal-session') {
            if (!customerId) {
                return res.status(400).json({ error: 'Customer ID required' });
            }

            try {
                // Create Stripe customer portal session
                const portalSession = await stripe.billingPortal.sessions.create({
                    customer: customerId,
                    return_url: `${req.protocol}://${req.get('host')}/dashboard.html`,
                });

                console.log('Portal session created:', portalSession.url);
                res.json({ 
                    url: portalSession.url 
                });
            } catch (stripeError) {
                console.error('Stripe portal session error:', stripeError.message);
                res.json({ 
                    url: 'https://billing.stripe.com/p/login/test_customer_portal',
                    error: 'Failed to create portal session - using fallback'
                });
            }
        } else {
            res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        console.error('Stripe API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
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
