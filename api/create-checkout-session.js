// Vercel serverless function for Stripe checkout
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

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
            const prices = await stripe.prices.list({
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
        const origin = req.headers.origin || 'https://genius-site.com';
        
        const session = await stripe.checkout.sessions.create({
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
}
