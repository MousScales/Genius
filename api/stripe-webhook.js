const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID || 'genius-b5656'
    });
}

const db = admin.firestore();

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Stripe-Signature');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).json({ error: 'Invalid signature' });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(event.data.object);
                break;
            case 'customer.subscription.created':
                await handleSubscriptionCreated(event.data.object);
                break;
            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object);
                break;
            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object);
                break;
            case 'invoice.payment_succeeded':
                await handlePaymentSucceeded(event.data.object);
                break;
            case 'invoice.payment_failed':
                await handlePaymentFailed(event.data.object);
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
}

async function handleCheckoutSessionCompleted(session) {
    console.log('Checkout session completed:', session.id);
    
    const userId = session.metadata?.userId;
    if (!userId) {
        console.error('No userId in session metadata');
        return;
    }

    // Update user subscription status
    await db.collection('users').doc(userId).update({
        'subscription.status': 'active',
        'subscription.subscriptionId': session.subscription,
        'subscription.customerId': session.customer,
        'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp()
    });
}

async function handleSubscriptionCreated(subscription) {
    console.log('Subscription created:', subscription.id);
    
    // Find user by customer ID
    const userQuery = await db.collection('users')
        .where('subscription.customerId', '==', subscription.customer)
        .limit(1)
        .get();

    if (userQuery.empty) {
        console.error('No user found for customer:', subscription.customer);
        return;
    }

    const userDoc = userQuery.docs[0];
    await userDoc.ref.update({
        'subscription.status': subscription.status,
        'subscription.subscriptionId': subscription.id,
        'subscription.currentPeriodStart': new Date(subscription.current_period_start * 1000),
        'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
        'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp()
    });
}

async function handleSubscriptionUpdated(subscription) {
    console.log('Subscription updated:', subscription.id);
    
    // Find user by subscription ID
    const userQuery = await db.collection('users')
        .where('subscription.subscriptionId', '==', subscription.id)
        .limit(1)
        .get();

    if (userQuery.empty) {
        console.error('No user found for subscription:', subscription.id);
        return;
    }

    const userDoc = userQuery.docs[0];
    await userDoc.ref.update({
        'subscription.status': subscription.status,
        'subscription.currentPeriodStart': new Date(subscription.current_period_start * 1000),
        'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
        'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp()
    });
}

async function handleSubscriptionDeleted(subscription) {
    console.log('Subscription deleted:', subscription.id);
    
    // Find user by subscription ID
    const userQuery = await db.collection('users')
        .where('subscription.subscriptionId', '==', subscription.id)
        .limit(1)
        .get();

    if (userQuery.empty) {
        console.error('No user found for subscription:', subscription.id);
        return;
    }

    const userDoc = userQuery.docs[0];
    await userDoc.ref.update({
        'subscription.status': 'cancelled',
        'subscription.cancelledAt': admin.firestore.FieldValue.serverTimestamp(),
        'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp()
    });
}

async function handlePaymentSucceeded(invoice) {
    console.log('Payment succeeded for invoice:', invoice.id);
    
    // Find user by customer ID
    const userQuery = await db.collection('users')
        .where('subscription.customerId', '==', invoice.customer)
        .limit(1)
        .get();

    if (userQuery.empty) {
        console.error('No user found for customer:', invoice.customer);
        return;
    }

    const userDoc = userQuery.docs[0];
    await userDoc.ref.update({
        'subscription.status': 'active',
        'subscription.lastPaymentAt': admin.firestore.FieldValue.serverTimestamp(),
        'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp()
    });
}

async function handlePaymentFailed(invoice) {
    console.log('Payment failed for invoice:', invoice.id);
    
    // Find user by customer ID
    const userQuery = await db.collection('users')
        .where('subscription.customerId', '==', invoice.customer)
        .limit(1)
        .get();

    if (userQuery.empty) {
        console.error('No user found for customer:', invoice.customer);
        return;
    }

    const userDoc = userQuery.docs[0];
    await userDoc.ref.update({
        'subscription.status': 'past_due',
        'subscription.lastPaymentFailedAt': admin.firestore.FieldValue.serverTimestamp(),
        'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp()
    });
}
