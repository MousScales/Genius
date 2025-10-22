// Subscription Service
class SubscriptionService {
    constructor() {
        this.db = null;
        this.currentUser = null;
    }

    // Initialize the service
    async init() {
        try {
            // Wait for Firebase to be available
            if (typeof window.firebase !== 'undefined' && window.firebase.firestore) {
                this.db = window.firebase.firestore();
                console.log('✅ Subscription service initialized');
                return true;
            } else {
                console.error('❌ Firebase not available for subscription service');
                return false;
            }
        } catch (error) {
            console.error('❌ Error initializing subscription service:', error);
            return false;
        }
    }

    // Set current user
    setCurrentUser(user) {
        this.currentUser = user;
    }

    // Check if user has active subscription
    async hasActiveSubscription() {
        if (!this.currentUser || !this.db) {
            console.log('⚠️ No user or database available for subscription check');
            return false;
        }

        try {
            const userDoc = await this.db.collection('users').doc(this.currentUser.uid).get();
            
            if (!userDoc.exists) {
                console.log('⚠️ User document not found');
                return false;
            }

            const userData = userDoc.data();
            const subscription = userData.subscription;

            if (!subscription) {
                console.log('⚠️ No subscription data found');
                return false;
            }

            // Check if subscription is active
            const isActive = subscription.status === 'active';
            console.log(`📊 Subscription status: ${subscription.status}, Active: ${isActive}`);
            
            return isActive;
        } catch (error) {
            console.error('❌ Error checking subscription status:', error);
            return false;
        }
    }

    // Get subscription details
    async getSubscriptionDetails() {
        if (!this.currentUser || !this.db) {
            return null;
        }

        try {
            const userDoc = await this.db.collection('users').doc(this.currentUser.uid).get();
            
            if (!userDoc.exists) {
                return null;
            }

            const userData = userDoc.data();
            return userData.subscription || null;
        } catch (error) {
            console.error('❌ Error getting subscription details:', error);
            return null;
        }
    }

    // Redirect to subscription page if no active subscription
    async requireSubscription() {
        const hasActiveSubscription = await this.hasActiveSubscription();
        
        if (!hasActiveSubscription) {
            console.log('🔒 No active subscription, redirecting to subscription page');
            window.location.href = 'subscription.html';
            return false;
        }
        
        return true;
    }

    // Show subscription required modal
    showSubscriptionRequiredModal() {
        // Create modal if it doesn't exist
        let modal = document.getElementById('subscriptionRequiredModal');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'subscriptionRequiredModal';
            modal.innerHTML = `
                <div class="modal-overlay" style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                ">
                    <div class="modal-content" style="
                        background: linear-gradient(145deg, #1a1a1a, #2a2a2a);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 16px;
                        padding: 40px;
                        max-width: 500px;
                        width: 90%;
                        text-align: center;
                        color: white;
                    ">
                        <div style="
                            width: 80px;
                            height: 80px;
                            background: linear-gradient(135deg, #4a9eff, #357abd);
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin: 0 auto 20px;
                        ">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                        </div>
                        <h2 style="font-size: 24px; margin-bottom: 15px; color: #ffffff;">Premium Feature</h2>
                        <p style="color: #cccccc; margin-bottom: 30px; line-height: 1.5;">
                            This feature requires a Genius Premium subscription. Upgrade now to unlock all premium features!
                        </p>
                        <div style="display: flex; gap: 15px; justify-content: center;">
                            <button id="upgradeBtn" style="
                                background: linear-gradient(135deg, #4a9eff, #357abd);
                                color: white;
                                border: none;
                                border-radius: 8px;
                                padding: 12px 24px;
                                font-size: 16px;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.3s ease;
                            ">Upgrade Now</button>
                            <button id="closeModalBtn" style="
                                background: rgba(255, 255, 255, 0.1);
                                color: white;
                                border: 1px solid rgba(255, 255, 255, 0.2);
                                border-radius: 8px;
                                padding: 12px 24px;
                                font-size: 16px;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.3s ease;
                            ">Maybe Later</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
        }

        // Show modal
        modal.style.display = 'flex';

        // Add event listeners
        document.getElementById('upgradeBtn').onclick = () => {
            window.location.href = 'subscription.html';
        };

        document.getElementById('closeModalBtn').onclick = () => {
            modal.style.display = 'none';
        };

        // Close on overlay click
        modal.querySelector('.modal-overlay').onclick = (e) => {
            if (e.target === e.currentTarget) {
                modal.style.display = 'none';
            }
        };
    }

    // Check subscription before performing premium actions
    async checkSubscriptionBeforeAction(actionName = 'this action') {
        const hasActiveSubscription = await this.hasActiveSubscription();
        
        if (!hasActiveSubscription) {
            console.log(`🔒 Subscription required for ${actionName}`);
            this.showSubscriptionRequiredModal();
            return false;
        }
        
        return true;
    }
}

// Create global instance
window.subscriptionService = new SubscriptionService();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    await window.subscriptionService.init();
});
