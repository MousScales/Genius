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
const STRIPE_PUBLIC_KEY = process.env.STRIPE_PUBLISHABLE_KEY;

if (OPENAI_API_KEY) {
    console.log('OpenAI API Key loaded: YES');
} else {
    console.warn('⚠️ OPENAI_API_KEY not found - OpenAI features will use fallbacks');
}

if (STRIPE_PUBLIC_KEY) {
    console.log('Stripe Public Key loaded: YES');
} else {
    console.warn('⚠️ STRIPE_PUBLIC_KEY not found - Stripe features will use fallbacks');
}
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Set Content Security Policy headers
app.use((req, res, next) => {
    // Allow Chrome DevTools and other development tools
    res.setHeader('Content-Security-Policy', 
        "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; " +
        "connect-src 'self' https://api.openai.com https://api.zerogpt.com https://www.gstatic.com https://firebaseapp.com https://*.firebaseapp.com https://*.googleapis.com https://*.vercel.app https://*.vercel.com https://raw.githubusercontent.com https://github.com https://cdnjs.cloudflare.com localhost:* ws://localhost:* wss://localhost:*; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://apis.google.com https://*.googleapis.com https://*.vercel.app https://*.vercel.com https://cdnjs.cloudflare.com https://unpkg.com https://js.stripe.com https://va.vercel-scripts.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data: blob: https:; " +
        "frame-src 'self' https://js.stripe.com https://*.firebaseapp.com https://*.googleapis.com https://accounts.google.com; " +
        "object-src 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self'"
    );
    next();
});

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
        const { userId, planType, userEmail, couponCode } = req.body;

        if (!userId || !planType || !userEmail) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // Build checkout session parameters
        const sessionParams = {
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
        };

        // Add discount code if provided
        console.log('Received coupon code:', couponCode);
        if (couponCode) {
            try {
                // Check if it's a known promotion code ID
                if (couponCode === 'promo_1SKsg6RyN1JZ733Wy3jB7gPe') {
                    sessionParams.discounts = [{
                        promotion_code: couponCode
                    }];
                    console.log(`✅ Applied discount code: ${couponCode}`);
                } else {
                    // Try to retrieve the promotion code from Stripe by code
                    console.log(`Looking up promotion code by code: ${couponCode}`);
                    const promotionCodes = await stripe.promotionCodes.list({
                        code: couponCode,
                        active: true,
                        limit: 1
                    });

                    if (promotionCodes.data.length > 0) {
                        sessionParams.discounts = [{
                            promotion_code: promotionCodes.data[0].id
                        }];
                        console.log(`✅ Applied discount code: ${couponCode} (ID: ${promotionCodes.data[0].id})`);
                    } else {
                        console.log(`❌ Discount code not found: ${couponCode}`);
                    }
                }
            } catch (discountError) {
                console.error('Error applying discount code:', discountError);
                // Continue without discount if there's an error
            }
        } else {
            console.log('No coupon code provided');
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create(sessionParams);

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
        stripePublicKey: STRIPE_PUBLIC_KEY,
        hasStripe: !!STRIPE_PUBLIC_KEY,
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
app.get('/api/stripe', async (req, res) => {
    try {
        const { action, session_id } = req.query;
        
        if (action === 'get-subscription-details') {
            if (!session_id) {
                return res.status(400).json({ error: 'Session ID is required' });
            }
            
            try {
                // Retrieve the checkout session
                const session = await stripe.checkout.sessions.retrieve(session_id);
                
                if (session.payment_status === 'paid') {
                    // Get subscription details
                    const subscription = await stripe.subscriptions.retrieve(session.subscription);
                    
                    res.json({
                        success: true,
                        subscription: {
                            id: subscription.id,
                            status: subscription.status,
                            current_period_start: subscription.current_period_start,
                            current_period_end: subscription.current_period_end,
                            cancel_at_period_end: subscription.cancel_at_period_end,
                            plan: subscription.items.data[0].price
                        },
                        customer: {
                            email: session.customer_email
                        }
                    });
                } else {
                    res.status(400).json({ error: 'Payment not completed' });
                }
            } catch (stripeError) {
                console.error('Stripe error:', stripeError);
                res.status(500).json({ error: 'Failed to retrieve subscription details' });
            }
            return;
        }
        
        res.status(400).json({ error: 'Invalid action' });
    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

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
            const { userEmail } = req.body;
            
            if (!userEmail) {
                console.log('No email provided for subscription check');
                return res.json({ hasActiveSubscription: false });
            }

            try {
                // First, find customer by email
                const customers = await stripe.customers.list({
                    email: userEmail,
                    limit: 1
                });

                if (customers.data.length === 0) {
                    console.log('No customer found for email:', userEmail);
                    return res.json({ hasActiveSubscription: false });
                }

                const customerId = customers.data[0].id;
                console.log('Found customer:', customerId);

                // Check subscription status with Stripe
                const subscriptions = await stripe.subscriptions.list({
                    customer: customerId,
                    status: 'active',
                    limit: 1
                });

                const hasActiveSubscription = subscriptions.data.length > 0;
                console.log('Subscription check result:', { hasActiveSubscription, count: subscriptions.data.length });
                
                if (hasActiveSubscription) {
                    const subscription = subscriptions.data[0];
                    console.log('Raw subscription data:', {
                        id: subscription.id,
                        current_period_start: subscription.current_period_start,
                        current_period_end: subscription.current_period_end,
                        status: subscription.status
                    });
                }
                
                res.json({ 
                    hasActiveSubscription,
                    subscription: hasActiveSubscription ? {
                        id: subscriptions.data[0].id,
                        status: subscriptions.data[0].status,
                        current_period_start: subscriptions.data[0].current_period_start,
                        current_period_end: subscriptions.data[0].current_period_end,
                        cancel_at_period_end: subscriptions.data[0].cancel_at_period_end,
                        customer: subscriptions.data[0].customer,
                        items: subscriptions.data[0].items
                    } : null
                });
            } catch (stripeError) {
                console.error('Stripe subscription check error:', stripeError.message);
                // If customer doesn't exist or other Stripe error, return false
                res.json({ hasActiveSubscription: false });
            }
        } else if (action === 'create-portal-session') {
            const { customerId } = req.body;
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
