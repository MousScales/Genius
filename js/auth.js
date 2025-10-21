// Authentication module using global Firebase SDK

// Wait for Firebase to be available
async function waitForFirebase() {
    while (!window.firebase) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

// Global variables
let currentUser = null;

// Initialize authentication
export async function initializeAuth() {
    await waitForFirebase();
    // Check if user is already logged in
    window.firebase.auth().onAuthStateChanged((user) => {
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
        await waitForFirebase();
        await window.firebase.auth().signInWithEmailAndPassword(email, password);
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
        await waitForFirebase();
        await window.firebase.auth().createUserWithEmailAndPassword(email, password);
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
        await waitForFirebase();
        await window.firebase.auth().signOut();
        
        // Clear localStorage
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userData');
        localStorage.removeItem('genius_chats');
        
        // Clear all user-specific localStorage data
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('profile_') || key.includes('classes_') || key.includes('suggestions_'))) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Redirect to login page
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
        // Even if there's an error, still redirect to login
        window.location.href = 'login.html';
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
