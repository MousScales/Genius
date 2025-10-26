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
            case 'check-subscription-status':
                return await handleCheckSubscriptionStatus(req, res);
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
                // Map promotion codes to actual promotion code IDs
                const promotionCodeMapping = {
                    'FREEMO': 'promo_1SKsg6RyN1JZ733Wy3jB7gPe' // Map FREEMO promotion code to actual promotion code ID
                };
                
                const actualPromotionCodeId = promotionCodeMapping[couponCode] || couponCode;
                
                // Verify the promotion code exists in Stripe
                const promotionCode = await stripe.promotionCodes.retrieve(actualPromotionCodeId);
                if (promotionCode && promotionCode.active) {
                    sessionData.discounts = [{
                        promotion_code: actualPromotionCodeId
                    }];
                    console.log(`Promotion code ${couponCode} (ID: ${actualPromotionCodeId}) applied to checkout session`);
                } else {
                    console.log(`Invalid promotion code ${couponCode}, proceeding without discount`);
                }
            } catch (promotionCodeError) {
                console.log(`Promotion code ${couponCode} not found or invalid:`, promotionCodeError.message);
                // Continue without promotion code if it's invalid
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

    console.log('Creating portal session for:', { userId, customerId });

    if (!userId || !customerId) {
        console.log('Missing required parameters:', { userId, customerId });
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        // First, verify the customer exists in Stripe
        console.log('Verifying customer exists:', customerId);
        const customer = await stripe.customers.retrieve(customerId);
        console.log('Customer verified:', customer.id);

        // Create portal session
        console.log('Creating billing portal session...');
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${process.env.NODE_ENV === 'production' ? 'https://genius-site.com' : 'http://localhost:3001'}/dashboard`,
        });

        console.log('Portal session created successfully:', portalSession.id);
        res.status(200).json({ url: portalSession.url });
    } catch (error) {
        console.error('Stripe portal error:', error);
        console.error('Error type:', error.type);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        // Provide more specific error messages
        let errorMessage = 'Failed to create portal session';
        let shouldShowFallback = false;
        
        if (error.type === 'StripeInvalidRequestError') {
            if (error.code === 'resource_missing') {
                errorMessage = 'Customer not found in Stripe';
            } else if (error.message.includes('billing portal') || error.message.includes('portal')) {
                errorMessage = 'Billing portal not configured. Please contact support.';
                shouldShowFallback = true;
            }
        }
        
        // If billing portal isn't configured, provide alternative
        if (shouldShowFallback) {
            return res.status(200).json({ 
                error: 'Billing portal not available',
                fallback: true,
                message: 'Please contact support at support@genius-site.com to manage your subscription.',
                email: 'support@genius-site.com'
            });
        }
        
        res.status(500).json({ 
            error: errorMessage, 
            details: error.message,
            type: error.type,
            code: error.code
        });
    }
}

async function handleCheckSubscriptionStatus(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userId, customerId, userEmail } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        let customerIdToCheck = customerId;
        
        // If no customerId provided, try to find customer by email
        if (!customerIdToCheck && userEmail) {
            console.log('Searching for customer by email:', userEmail);
            const customers = await stripe.customers.list({
                email: userEmail,
                limit: 1
            });
            
            if (customers.data.length > 0) {
                customerIdToCheck = customers.data[0].id;
                console.log('Found customer ID:', customerIdToCheck);
            } else {
                console.log('No customer found for email:', userEmail);
                // Return that user has no subscription (which is fine)
                return res.status(200).json({
                    hasActiveSubscription: false,
                    subscription: null,
                    customerId: null
                });
            }
        }
        
        // If still no customerId, return no subscription
        if (!customerIdToCheck) {
            console.log('No customer ID found');
            return res.status(200).json({
                hasActiveSubscription: false,
                subscription: null,
                customerId: null
            });
        }

        // Get customer from Stripe
        const customer = await stripe.customers.retrieve(customerIdToCheck);
        
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Get active subscriptions for this customer
        const subscriptions = await stripe.subscriptions.list({
            customer: customerIdToCheck,
            status: 'active',
            limit: 1
        });

        const hasActiveSubscription = subscriptions.data.length > 0;
        let subscriptionDetails = null;

        if (hasActiveSubscription) {
            const subscription = subscriptions.data[0];
            // Return the full subscription object so dashboard can access items.data
            subscriptionDetails = {
                id: subscription.id,
                status: subscription.status,
                current_period_start: subscription.current_period_start,
                current_period_end: subscription.current_period_end,
                cancel_at_period_end: subscription.cancel_at_period_end,
                customer: subscription.customer,
                items: subscription.items // Include items for plan details
            };
        }

        res.status(200).json({
            hasActiveSubscription,
            subscription: subscriptionDetails,
            customerId: customerIdToCheck
        });

    } catch (error) {
        console.error('Stripe subscription check error:', error);
        res.status(500).json({ error: 'Failed to check subscription status', details: error.message });
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
