# Stripe Subscription Setup Guide

## Overview
This guide explains how to set up and use the Stripe subscription system in the Genius app.

## What's Been Implemented

### 1. Subscription Page (`subscription.html`)
- Monthly subscription: $9.99/month
- Yearly subscription: $99.99/year (17% savings)
- Integrated with Stripe Checkout
- Beautiful UI with product comparisons
- Automatic redirection after onboarding

### 2. Subscription Service (`js/subscription-service.js`)
- Manages subscription state
- Checks subscription validity
- Handles subscription expiration
- Provides subscription status information

### 3. Stripe Server (`stripe-server.js`)
- Handles Stripe checkout sessions
- Processes subscription webhooks
- Creates billing portal sessions
- Manages customer subscriptions

### 4. Dashboard Integration
- Subscription status display in settings modal
- Automatic redirect if subscription is missing
- Manage subscription button (links to Stripe billing portal)
- Real-time subscription status updates

### 5. Success Page (`subscription-success.html`)
- Displays subscription confirmation
- Shows subscription details
- Redirects to dashboard after completion

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

This will install all required packages including:
- `stripe` - Stripe Node.js library
- `express` - Web server
- `cors` - Cross-origin resource sharing

### 2. Start the Stripe Server
```bash
npm run stripe
```

The Stripe server will run on `http://localhost:3001`

### 3. Start the Main Server
In a separate terminal:
```bash
npm start
```

The main app will run on `http://localhost:3000`

## Configuration

### Stripe Keys
Create a `.env` file in the root directory with your Stripe keys:
```env
STRIPE_SECRET_KEY=sk_live_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

⚠️ **Never commit your `.env` file to version control!**

### Product IDs (Already Configured)
- **Monthly**: `prod_TGCm88lB9nn5Au`
- **Yearly**: `prod_TGCntXtCmq13s4`

## How It Works

### User Flow
1. User signs up and completes onboarding
2. User is redirected to subscription page
3. User selects monthly or yearly plan
4. User is redirected to Stripe Checkout
5. After successful payment, user is redirected to success page
6. User can access the dashboard and app features

### Subscription Enforcement
- Dashboard checks for active subscription on load
- If no active subscription, user is redirected to subscription page
- Subscription status is stored in localStorage
- Subscription service validates expiration dates

### Subscription Management
- Users can view subscription status in settings
- "Manage Subscription" button opens Stripe billing portal
- Users can update payment methods, cancel, or change plans
- Billing portal is fully managed by Stripe

## Testing

### Test Mode (Demo)
If the Stripe server is not running, the app will automatically fall back to demo mode:
- Simulates successful subscription
- Creates test subscription data
- Allows full access to the app

### Live Mode
With the Stripe server running:
1. Select a plan on the subscription page
2. You'll be redirected to actual Stripe Checkout
3. Use Stripe test cards for testing:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Requires authentication: `4000 0025 0000 3155`

## Webhooks (Optional)

To receive real-time subscription updates:

1. Install Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3001/webhook
   ```

2. Copy the webhook signing secret

3. Add to `stripe-server.js`:
   ```javascript
   const webhookSecret = 'whsec_...';
   ```

## Production Deployment

### Environment Variables
When deploying to production, set these environment variables:
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Your webhook signing secret

### Update URLs
In `subscription.html` and `dashboard.html`, update the server URL:
```javascript
const serverUrl = window.location.origin; // Use your production domain
```

### Vercel Deployment
1. The Stripe server endpoint can be deployed as Vercel serverless functions
2. Create `/api/create-checkout-session.js` in Vercel format
3. Update client-side code to use `/api/` endpoints

## Features

### ✅ Implemented
- [x] Subscription page with pricing tiers
- [x] Stripe Checkout integration
- [x] Subscription validation
- [x] Dashboard subscription checks
- [x] Settings modal integration
- [x] Billing portal access
- [x] Success page with confirmation
- [x] Automatic subscription enforcement

### 🚀 Future Enhancements
- [ ] Email notifications for subscription events
- [ ] Free trial period
- [ ] Promo code support
- [ ] Team/family plans
- [ ] Usage analytics
- [ ] Subscription analytics dashboard

## Troubleshooting

### "Failed to create checkout session"
- Ensure Stripe server is running (`npm run stripe`)
- Check that product IDs exist in your Stripe dashboard
- Verify API keys are correct

### "No subscription information found"
- Clear localStorage and try again
- Ensure subscription was completed successfully
- Check browser console for errors

### Subscription not enforced
- Verify `subscription-service.js` is loaded
- Check that dashboard initialization includes subscription check
- Ensure localStorage has subscription data

## Support

For issues or questions about the subscription system:
1. Check Stripe dashboard for payment logs
2. Review browser console for errors
3. Check Stripe server logs for backend issues
4. Verify webhook events are being received

## Security Notes

⚠️ **Important**:
- Never expose secret keys in client-side code
- Always validate subscriptions on the backend
- Use webhook signatures to verify Stripe events
- Store subscription data securely in your database

## License
This subscription system is part of the Genius app. All rights reserved.
