// Main app module
import { initializeAuth, setupLoginListeners } from './auth.js';
import { showOnboarding } from './onboarding.js';
import { setupLivePreview } from './classForm.js';

// Initialize the app
export function initializeApp() {
    console.log('Initializing app...');
    
    try {
        // Initialize authentication
        console.log('Initializing auth...');
        initializeAuth();
        
        // Setup login event listeners
        console.log('Setting up login listeners...');
        setupLoginListeners();
        
        // Setup event listeners for app state changes
        console.log('Setting up app event listeners...');
        setupAppEventListeners();
        
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

// Setup app event listeners
function setupAppEventListeners() {
    // Handle user authentication
    window.addEventListener('userAuthenticated', (event) => {
        console.log('User authenticated:', event.detail.user);
        showMainApp();
    });
    
    // Handle user logout
    window.addEventListener('userLoggedOut', () => {
        console.log('User logged out');
        showLoginPage();
    });
    
    // Handle onboarding completion
    window.addEventListener('onboardingCompleted', () => {
        console.log('Onboarding completed');
        showMainApp();
    });
    
    // Handle show onboarding
    window.addEventListener('showOnboarding', () => {
        console.log('Showing onboarding');
        showOnboarding();
    });
}

// Show login page
function showLoginPage() {
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('onboardingPage').style.display = 'none';
    document.getElementById('mainApp').style.display = 'none';
}

// Show main app
function showMainApp() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('onboardingPage').style.display = 'none';
    document.getElementById('mainApp').style.display = 'flex';
    
    // Setup the class creation functionality
    setTimeout(setupLivePreview, 500);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});
