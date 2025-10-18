// Authentication module
import { authService } from './firebase-service.js';

// Global variables
let currentUser = null;

// Initialize authentication
export function initializeAuth() {
    // Check if user is already logged in
    authService.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            window.dispatchEvent(new CustomEvent('userAuthenticated', { detail: { user } }));
        } else {
            currentUser = null;
            window.dispatchEvent(new CustomEvent('userLoggedOut'));
        }
    });
}

// Handle login
export async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }

    try {
        await authService.signIn(email, password);
        // Auth state change will handle showing main app
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}

// Handle signup
export async function handleSignup() {
    console.log('Signup button clicked!');
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    console.log('Email:', email, 'Password length:', password.length);

    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }

    if (password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
    }

    try {
        console.log('Attempting to sign up...');
        await authService.signUp(email, password);
        console.log('Signup successful, showing onboarding');
        // Show onboarding instead of main app
        window.dispatchEvent(new CustomEvent('showOnboarding'));
    } catch (error) {
        console.error('Signup error:', error);
        alert('Signup failed: ' + error.message);
    }
}

// Handle guest login
export function handleGuestLogin() {
    currentUser = { uid: 'guest', email: 'guest@example.com' };
    window.dispatchEvent(new CustomEvent('userAuthenticated', { detail: { user: currentUser } }));
}

// Handle logout
export async function handleLogout() {
    try {
        await authService.signOut();
        // Auth state change will handle showing login page
    } catch (error) {
        alert('Logout failed: ' + error.message);
    }
}

// Get current user
export function getCurrentUser() {
    // Try to get from localStorage if not in memory
    if (!currentUser) {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            currentUser = JSON.parse(storedUser);
        }
    }
    return currentUser;
}

// Setup login event listeners
export function setupLoginListeners() {
    console.log('Setting up login listeners...');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const guestBtn = document.getElementById('guestBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    console.log('Found buttons:', { loginBtn, signupBtn, guestBtn, logoutBtn });

    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
        console.log('Login button listener added');
    }

    if (signupBtn) {
        signupBtn.addEventListener('click', handleSignup);
        console.log('Signup button listener added');
    }

    if (guestBtn) {
        guestBtn.addEventListener('click', handleGuestLogin);
        console.log('Guest button listener added');
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
        console.log('Logout button listener added');
    }
}
