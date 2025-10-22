// Stripe server for subscriptions
const express = require('express');
const cors = require('cors');
const stripe = require('stripe');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Stripe with your secret key
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Real Stripe checkout session endpoint
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { priceId, userId, planType } = req.body;
        
        console.log('Creating real Stripe checkout session:', { priceId, userId, planType });
        
        // Your product IDs
        const PRODUCTS = {
            monthly: 'prod_TGCm88lB9nn5Au',
            yearly: 'prod_TGCntXtCmq13s4'
        };

        // Get the correct price ID based on plan type
        let finalPriceId = priceId;
        
        // If we received a product ID, get the price ID
        if (priceId === PRODUCTS.monthly || priceId === PRODUCTS.yearly) {
            const prices = await stripeClient.prices.list({
                product: priceId,
                active: true,
                limit: 1
            });
            
            if (prices.data.length === 0) {
                throw new Error(`No active price found for product ${priceId}`);
            }
            
            finalPriceId = prices.data[0].id;
        }
        
        // Create the actual Stripe checkout session
        const origin = req.headers.origin || `http://localhost:${PORT}`;
        
        const session = await stripeClient.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: finalPriceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${origin}/subscription-success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/subscription.html`,
            client_reference_id: userId,
            metadata: {
                userId: userId,
                planType: planType || 'monthly'
            }
        });
        
        console.log('Stripe checkout session created:', session.id);
        
        res.json({
            sessionId: session.id,
            url: session.url
        });
        
    } catch (error) {
        console.error('Error creating Stripe checkout session:', error);
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
