const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const { action } = req.query;

        switch (action) {
            case 'create-checkout-session':
                return await handleCreateCheckoutSession(req, res);
            case 'get-subscription-details':
                return await handleGetSubscriptionDetails(req, res);
            case 'create-portal-session':
                return await handleCreatePortalSession(req, res);
            case 'health':
                return await handleHealthCheck(req, res);
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

async function handleCreateCheckoutSession(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userId, planType, userEmail, couponCode } = req.body;

    if (!userId || !planType || !userEmail) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        // Prepare checkout session data
        const sessionData = {
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

        // Add coupon if provided
        if (couponCode) {
            try {
                // Verify the coupon exists in Stripe
                const coupon = await stripe.coupons.retrieve(couponCode);
                if (coupon && coupon.valid) {
                    sessionData.discounts = [{
                        coupon: couponCode
                    }];
                    console.log(`Coupon ${couponCode} applied to checkout session`);
                } else {
                    console.log(`Invalid coupon ${couponCode}, proceeding without discount`);
                }
            } catch (couponError) {
                console.log(`Coupon ${couponCode} not found or invalid:`, couponError.message);
                // Continue without coupon if it's invalid
            }
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create(sessionData);

        res.status(200).json({ sessionId: session.id });
    } catch (error) {
        console.error('Stripe checkout error:', error);
        res.status(500).json({ error: 'Failed to create checkout session', details: error.message });
    }
}

async function handleGetSubscriptionDetails(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { session_id } = req.query;

    if (!session_id) {
        return res.status(400).json({ error: 'Session ID is required' });
    }

    try {
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
        console.error('Stripe subscription error:', error);
        res.status(500).json({ error: 'Failed to get subscription details', details: error.message });
    }
}

async function handleCreatePortalSession(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userId, customerId } = req.body;

    if (!userId || !customerId) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        // Create portal session
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${process.env.NODE_ENV === 'production' ? 'https://genius-site.com' : 'http://localhost:3001'}/dashboard`,
        });

        res.status(200).json({ url: portalSession.url });
    } catch (error) {
        console.error('Stripe portal error:', error);
        res.status(500).json({ error: 'Failed to create portal session', details: error.message });
    }
}

async function handleHealthCheck(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Check if Stripe key is available
        const hasStripeKey = !!process.env.STRIPE_SECRET_KEY;
        const stripeKeyLength = process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.length : 0;
        
        res.status(200).json({
            status: 'OK',
            message: 'Stripe API is working',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            stripe: {
                hasKey: hasStripeKey,
                keyLength: stripeKeyLength,
                keyPrefix: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 7) : 'none'
            }
        });
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({ error: 'Health check failed', details: error.message });
    }
}
