// Stripe payment processing server
// This server handles Stripe checkout sessions and webhooks

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Check if Stripe secret key is provided
if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY environment variable is required');
    console.error('Please create a .env file with your Stripe secret key');
    process.exit(1);
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files

// Product and Price IDs
const PRODUCTS = {
    monthly: 'prod_TGCm88lB9nn5Au',
    yearly: 'prod_TGCntXtCmq13s4'
};

// Get or create price IDs for the products
async function getProductPrices() {
    try {
        // Get prices for monthly product
        const monthlyPrices = await stripe.prices.list({
            product: PRODUCTS.monthly,
            active: true,
            limit: 1
        });
        
        // Get prices for yearly product
        const yearlyPrices = await stripe.prices.list({
            product: PRODUCTS.yearly,
            active: true,
            limit: 1
        });
        
        return {
            monthly: monthlyPrices.data[0]?.id,
            yearly: yearlyPrices.data[0]?.id
        };
    } catch (error) {
        console.error('Error fetching prices:', error);
        throw error;
    }
}

// Create checkout session
app.post('/create-checkout-session', async (req, res) => {
    try {
        const { priceId, userId, planType } = req.body;
        
        if (!priceId || !userId) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        
        // Determine the correct price based on planType
        let finalPriceId = priceId;
        
        // If priceId is a product ID, get the price ID
        if (priceId === PRODUCTS.monthly || priceId === PRODUCTS.yearly) {
            const prices = await getProductPrices();
            finalPriceId = planType === 'yearly' ? prices.yearly : prices.monthly;
        }
        
        if (!finalPriceId) {
            return res.status(400).json({ error: 'Invalid price ID' });
        }
        
        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: finalPriceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${req.headers.origin || 'http://localhost:3000'}/subscription-success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin || 'http://localhost:3000'}/subscription.html`,
            client_reference_id: userId,
            metadata: {
                userId: userId,
                planType: planType || 'monthly'
            }
        });
        
        res.json({ 
            sessionId: session.id,
            url: session.url 
        });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get subscription status
app.post('/get-subscription-status', async (req, res) => {
    try {
        const { customerId } = req.body;
        
        if (!customerId) {
            return res.status(400).json({ error: 'Missing customer ID' });
        }
        
        // Get customer's subscriptions
        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'active',
            limit: 1
        });
        
        if (subscriptions.data.length > 0) {
            const subscription = subscriptions.data[0];
            res.json({
                status: 'active',
                subscription: {
                    id: subscription.id,
                    status: subscription.status,
                    currentPeriodEnd: subscription.current_period_end,
                    planId: subscription.items.data[0].price.id,
                    cancelAtPeriodEnd: subscription.cancel_at_period_end
                }
            });
        } else {
            res.json({
                status: 'inactive',
                subscription: null
            });
        }
    } catch (error) {
        console.error('Error getting subscription status:', error);
        res.status(500).json({ error: error.message });
    }
});

// Webhook endpoint for Stripe events
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    let event;
    
    try {
        if (webhookSecret) {
            event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } else {
            event = req.body;
        }
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            console.log('Checkout session completed:', session.id);
            // You can save subscription info to your database here
            break;
            
        case 'customer.subscription.created':
            const subscription = event.data.object;
            console.log('Subscription created:', subscription.id);
            break;
            
        case 'customer.subscription.updated':
            const updatedSubscription = event.data.object;
            console.log('Subscription updated:', updatedSubscription.id);
            break;
            
        case 'customer.subscription.deleted':
            const deletedSubscription = event.data.object;
            console.log('Subscription deleted:', deletedSubscription.id);
            break;
            
        case 'invoice.payment_succeeded':
            const invoice = event.data.object;
            console.log('Payment succeeded:', invoice.id);
            break;
            
        case 'invoice.payment_failed':
            const failedInvoice = event.data.object;
            console.log('Payment failed:', failedInvoice.id);
            break;
            
        default:
            console.log(`Unhandled event type ${event.type}`);
    }
    
    res.json({received: true});
});

// Create billing portal session
app.post('/create-portal-session', async (req, res) => {
    try {
        const { customerId } = req.body;
        
        if (!customerId) {
            return res.status(400).json({ error: 'Missing customer ID' });
        }
        
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${req.headers.origin || 'http://localhost:3000'}/dashboard.html`,
        });
        
        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating portal session:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Stripe server running on port ${PORT}`);
    console.log(`Server URL: http://localhost:${PORT}`);
});
