// Subscription Service
// Handles subscription status checks and management

class SubscriptionService {
    constructor() {
        this.subscriptionKey = 'subscription';
    }

    // Check if user has an active subscription
    hasActiveSubscription() {
        try {
            const subscription = localStorage.getItem(this.subscriptionKey);
            if (!subscription) {
                return false;
            }

            const subData = JSON.parse(subscription);
            
            // Check if subscription is active and not expired
            if (subData.status === 'active' && new Date(subData.endDate) > new Date()) {
                return true;
            }

            // If expired, remove from localStorage
            if (subData.status === 'active' && new Date(subData.endDate) <= new Date()) {
                this.clearSubscription();
                return false;
            }

            return false;
        } catch (error) {
            console.error('Error checking subscription status:', error);
            return false;
        }
    }

    // Get subscription details
    getSubscription() {
        try {
            const subscription = localStorage.getItem(this.subscriptionKey);
            if (!subscription) {
                return null;
            }

            return JSON.parse(subscription);
        } catch (error) {
            console.error('Error getting subscription:', error);
            return null;
        }
    }

    // Set subscription data
    setSubscription(subscriptionData) {
        try {
            localStorage.setItem(this.subscriptionKey, JSON.stringify(subscriptionData));
            return true;
        } catch (error) {
            console.error('Error setting subscription:', error);
            return false;
        }
    }

    // Clear subscription data
    clearSubscription() {
        try {
            localStorage.removeItem(this.subscriptionKey);
            return true;
        } catch (error) {
            console.error('Error clearing subscription:', error);
            return false;
        }
    }

    // Check if user needs to subscribe
    needsSubscription() {
        return !this.hasActiveSubscription();
    }

    // Redirect to subscription page if needed
    redirectToSubscription() {
        if (this.needsSubscription()) {
            window.location.href = 'subscription.html';
            return true;
        }
        return false;
    }

    // Get subscription plan type
    getPlanType() {
        const subscription = this.getSubscription();
        return subscription ? subscription.plan : null;
    }

    // Check if user is on yearly plan
    isYearlyPlan() {
        return this.getPlanType() === 'yearly';
    }

    // Check if user is on monthly plan
    isMonthlyPlan() {
        return this.getPlanType() === 'monthly';
    }

    // Get days until subscription expires
    getDaysUntilExpiry() {
        const subscription = this.getSubscription();
        if (!subscription || subscription.status !== 'active') {
            return 0;
        }

        const endDate = new Date(subscription.endDate);
        const now = new Date();
        const diffTime = endDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return Math.max(0, diffDays);
    }

    // Check if subscription is expiring soon (within 7 days)
    isExpiringSoon() {
        return this.getDaysUntilExpiry() <= 7 && this.getDaysUntilExpiry() > 0;
    }

    // Simulate subscription creation (for demo purposes)
    createSubscription(planType) {
        const subscriptionData = {
            plan: planType,
            status: 'active',
            startDate: new Date().toISOString(),
            endDate: planType === 'monthly' 
                ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            stripeCustomerId: 'cus_demo_' + Date.now(),
            stripeSubscriptionId: 'sub_demo_' + Date.now()
        };

        return this.setSubscription(subscriptionData);
    }

    // Simulate subscription cancellation
    cancelSubscription() {
        const subscription = this.getSubscription();
        if (subscription) {
            subscription.status = 'cancelled';
            subscription.cancelledAt = new Date().toISOString();
            return this.setSubscription(subscription);
        }
        return false;
    }

    // Get subscription status for display
    getStatusDisplay() {
        const subscription = this.getSubscription();
        if (!subscription) {
            return 'No subscription';
        }

        if (subscription.status === 'active') {
            const daysLeft = this.getDaysUntilExpiry();
            if (daysLeft > 0) {
                return `Active (${daysLeft} days left)`;
            } else {
                return 'Expired';
            }
        }

        return subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1);
    }
}

// Create global instance
window.subscriptionService = new SubscriptionService();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SubscriptionService;
}
