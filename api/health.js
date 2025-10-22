module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Check if Stripe key is available
        const hasStripeKey = !!process.env.STRIPE_SECRET_KEY;
        const stripeKeyLength = process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.length : 0;
        
        res.status(200).json({
            status: 'OK',
            message: 'API endpoint is working',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            stripe: {
                hasKey: hasStripeKey,
                keyLength: stripeKeyLength
            }
        });
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
