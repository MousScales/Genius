// Onboarding logic with Ghost Text Autocomplete
console.log('Onboarding script loaded');

// Wait for Firebase to be available
let db, collection, addDoc, doc, setDoc;

async function initFirebase() {
    // Wait for Firebase to be available
    while (!window.firebase) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Initialize Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyB-JPtkbuIES5T_m7nkX0Ic1iO_lz0FbTk",
        authDomain: "genius-b5656.firebaseapp.com",
        projectId: "genius-b5656",
        storageBucket: "genius-b5656.firebasestorage.app",
        messagingSenderId: "567988128391",
        appId: "1:567988128391:web:8a48294d736ec4013f8622",
        measurementId: "G-3SEG2XJQMP"
    };
    
    try {
        // Initialize Firebase
        window.firebase.initializeApp(firebaseConfig);
        
        // Wait for Firebase to be fully initialized
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Initialize Firestore with proper error handling
        if (window.firebase.firestore) {
            db = window.firebase.firestore();
            
            // Get Firestore functions safely
            collection = window.firebase.firestore().collection;
            addDoc = window.firebase.firestore().addDoc;
            doc = window.firebase.firestore().doc;
            setDoc = window.firebase.firestore().setDoc;
            
            console.log('Firebase initialized in onboarding');
        } else {
            throw new Error('Firestore not available');
        }
    } catch (error) {
        console.error('Firebase initialization error:', error);
        // Continue without Firebase for now
        db = null;
    }
}

// Initialize Firebase
initFirebase();

// Check if user is logged in via Firebase
let currentUser = null;

// Simple auth check without infinite loops
function checkAuth() {
    if (window.firebase && window.firebase.auth) {
        const user = window.firebase.auth().currentUser;
        if (user) {
            currentUser = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL
            };
            console.log('User authenticated:', currentUser);
            return true;
        }
    }
    return false;
}

// Check auth multiple times to catch Google login
let authCheckCount = 0;
const maxAuthChecks = 10;

function checkAuthWithRetry() {
    authCheckCount++;
    console.log(`Auth check attempt ${authCheckCount}/${maxAuthChecks}`);
    
    if (checkAuth()) {
        console.log('User authenticated successfully');
        return;
    }
    
    if (authCheckCount < maxAuthChecks) {
        setTimeout(checkAuthWithRetry, 1000);
    } else {
        console.log('No user authenticated after multiple attempts, redirecting to login');
        window.location.href = 'login.html';
    }
}

// Start checking for authentication
setTimeout(checkAuthWithRetry, 1000);

// Also set up auth state listener for immediate detection
if (window.firebase && window.firebase.auth) {
    try {
        window.firebase.auth().onAuthStateChanged((user) => {
            console.log('Auth state changed in onboarding:', user);
            if (user) {
                currentUser = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL
                };
                console.log('User authenticated via auth state listener:', currentUser);
            } else {
                console.log('User signed out');
                currentUser = null;
            }
        });
    } catch (error) {
        console.log('Auth state listener not available in onboarding:', error);
    }
}

// Check if user has already completed onboarding
async function checkOnboardingStatus() {
    try {
        // Wait for Firebase to be initialized
        while (!db) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Wait for user authentication (with timeout)
        let authWaitCount = 0;
        while ((!currentUser || !currentUser.uid) && authWaitCount < 20) {
            await new Promise(resolve => setTimeout(resolve, 500));
            authWaitCount++;
        }
        
        if (!currentUser || !currentUser.uid) {
            console.log('No authenticated user after waiting, redirecting to login');
            window.location.href = 'login.html';
            return;
        }
        
        console.log('Checking onboarding status for user:', currentUser.uid);
        
        // Check if user profile exists in Firebase
        const userProfileRef = window.firebase.firestore().collection('users').doc(currentUser.uid);
        const userProfileDoc = await userProfileRef.get();
        
        if (userProfileDoc.exists) {
            const userData = userProfileDoc.data();
            console.log('User profile found:', userData);
            
            // Check if onboarding is marked as complete
            if (userData.onboardingComplete) {
                console.log('User has already completed onboarding, redirecting to dashboard');
                window.location.href = 'dashboard.html';
                return;
            }
            
            // Check if user has basic profile data (name, email, etc.)
            if (userData.name && userData.email && userData.collegeName) {
                console.log('User has existing profile data, redirecting to dashboard');
                // Mark onboarding as complete and redirect
                await userProfileRef.update({
                    onboardingComplete: true,
                    lastLogin: new Date().toISOString()
                });
                window.location.href = 'dashboard.html';
                return;
            }
        }
        
        // Check localStorage for existing profile data
        const existingProfile = localStorage.getItem('userData');
        if (existingProfile) {
            const profileData = JSON.parse(existingProfile);
            if (profileData.name && profileData.email && profileData.collegeName) {
                console.log('User has existing profile data in localStorage, redirecting to dashboard');
                // Save to Firebase and mark onboarding complete (only if user is authenticated)
                if (db && currentUser && currentUser.uid) {
                    try {
                        await window.firebase.firestore().collection('users').doc(currentUser.uid).set({
                            ...profileData,
                            onboardingComplete: true,
                            lastLogin: new Date().toISOString()
                        }, { merge: true });
                    } catch (error) {
                        console.log('Could not save to Firebase, continuing anyway');
                    }
                }
                window.location.href = 'dashboard.html';
                return;
            }
        }
        
        console.log('User needs to complete onboarding');
        
    } catch (error) {
        console.error('Error checking onboarding status:', error);
        // If there's an error, continue with onboarding
    }
}

// Check onboarding status when page loads (wait for auth first)
setTimeout(() => {
    checkOnboardingStatus();
}, 2000);
let currentStep = 1;
let onboardingData = {};
let universityCache = [];
let cacheLoaded = false;

// Common majors list
const commonMajors = [
    "Computer Science", "Engineering", "Business Administration", "Biology", 
    "Psychology", "Economics", "Mathematics", "English", "History", 
    "Political Science", "Chemistry", "Physics", "Nursing", "Communications",
    "Art", "Music", "Education", "Sociology", "Philosophy", "Medicine",
    "Law", "Architecture", "Marketing", "Finance", "Accounting",
    "Mechanical Engineering", "Electrical Engineering", "Civil Engineering",
    "Data Science", "Information Technology", "Graphic Design", "Film Studies",
    "Journalism", "Environmental Science", "Public Health", "Other"
];

// Academic levels
const academicLevels = [
    "High School Freshman",
    "High School Sophomore", 
    "High School Junior",
    "High School Senior",
    "College Freshman",
    "College Sophomore",
    "College Junior",
    "College Senior",
    "Graduate Student - Masters",
    "Graduate Student - PhD",
    "Post-Doctoral",
    "Other"
];

// Load all universities from GitHub API on page load
async function loadUniversitiesDatabase() {
    try {
        console.log('Loading universities database...');
        const response = await fetch('https://raw.githubusercontent.com/Hipo/university-domains-list/master/world_universities_and_domains.json');
        
        if (!response.ok) {
            throw new Error('Failed to load universities');
        }
        
        const allUniversities = await response.json();
        
        // Filter for US universities and cache them
        universityCache = allUniversities
            .filter(uni => uni.country === 'United States')
            .map(uni => uni.name)
            .sort();
        
        cacheLoaded = true;
        console.log(`Loaded ${universityCache.length} US universities`);
    } catch (error) {
        console.error('Error loading universities:', error);
        // Fallback to common universities
        universityCache = [
            "Harvard University", "Stanford University", "Massachusetts Institute of Technology",
            "Yale University", "Princeton University", "Columbia University", "Duke University",
            "Northwestern University", "Johns Hopkins University", "Cornell University",
            "University of California, Berkeley", "University of California, Los Angeles",
            "University of Southern California", "Carnegie Mellon University", "Emory University",
            "University of Michigan", "University of Virginia", "Georgetown University",
            "New York University", "Georgia Institute of Technology", "University of Texas at Austin",
            "University of Washington", "Boston University", "University of Florida",
            "University of North Carolina at Chapel Hill", "University of Wisconsin-Madison",
            "University of Illinois at Urbana-Champaign", "Pennsylvania State University",
            "Ohio State University", "University of Miami", "Northeastern University",
            "Tufts University", "University of Connecticut", "Purdue University"
        ].sort();
        cacheLoaded = true;
        console.log('Using fallback university list');
    }
}

// Start loading the database immediately
loadUniversitiesDatabase();

// Setup ghost text autocomplete for university
const collegeInput = document.getElementById('collegeName');
const collegeGhost = document.getElementById('collegeGhost');
setupGhostAutocomplete(collegeInput, collegeGhost, () => universityCache);

// Setup ghost text autocomplete for major
const majorInput = document.getElementById('major');
const majorGhost = document.getElementById('majorGhost');
setupGhostAutocomplete(majorInput, majorGhost, () => commonMajors);

// Setup ghost text autocomplete for level
const levelInput = document.getElementById('academicLevel');
const levelGhost = document.getElementById('levelGhost');
setupGhostAutocomplete(levelInput, levelGhost, () => academicLevels);

// Generic ghost text setup function
function setupGhostAutocomplete(inputElement, ghostElement, getDataFunction) {
    let currentSuggestion = '';
    
    inputElement.addEventListener('input', function() {
        const value = this.value;
        const searchQuery = value.toLowerCase();
        
        if (searchQuery.length === 0) {
            ghostElement.value = '';
            currentSuggestion = '';
            return;
        }
        
        const data = getDataFunction();
        
        // Find first match that starts with the search query
        const match = data.find(item => item.toLowerCase().startsWith(searchQuery));
        
        if (match) {
            currentSuggestion = match;
            // Show the full suggestion in ghost text
            ghostElement.value = match;
        } else {
            ghostElement.value = '';
            currentSuggestion = '';
        }
    });
    
    // Accept suggestion on Tab or Enter
    inputElement.addEventListener('keydown', function(e) {
        if ((e.key === 'Tab' || e.key === 'Enter') && currentSuggestion) {
            e.preventDefault();
            this.value = currentSuggestion;
            ghostElement.value = currentSuggestion;
            currentSuggestion = '';
            
            // Trigger input event to clear ghost
            setTimeout(() => {
                ghostElement.value = '';
            }, 10);
        }
    });
    
    // Clear ghost text when input loses focus
    inputElement.addEventListener('blur', function() {
        setTimeout(() => {
            if (this.value !== currentSuggestion) {
                ghostElement.value = '';
            }
        }, 100);
    });
}

// Step navigation
document.getElementById('nextBtn1').addEventListener('click', () => {
    const name = document.getElementById('userName').value.trim();
    if (!name) {
        alert('Please enter your name');
        return;
    }
    onboardingData.name = name;
    goToStep(2);
});

document.getElementById('backBtn2').addEventListener('click', () => goToStep(1));
document.getElementById('nextBtn2').addEventListener('click', () => {
    const college = document.getElementById('collegeName').value.trim();
    const major = document.getElementById('major').value;
    if (!college || !major) {
        alert('Please fill in both university and major');
        return;
    }
    onboardingData.college = college;
    onboardingData.major = major;
    goToStep(3);
});

document.getElementById('backBtn3').addEventListener('click', () => goToStep(2));
document.getElementById('nextBtn3').addEventListener('click', async () => {
    const level = document.getElementById('academicLevel').value.trim();
    const year = document.getElementById('graduationYear').value;
    if (!level || !year) {
        alert('Please fill in all fields');
        return;
    }
    onboardingData.level = level;
    onboardingData.year = year;
    
    await completeOnboarding();
});

function goToStep(step) {
    currentStep = step;
    for (let i = 1; i <= 3; i++) {
        const stepElement = document.getElementById(`step${i}`);
        if (stepElement) {
            stepElement.style.display = i === step ? 'block' : 'none';
        }
    }
    updateProgress();
}

function updateProgress() {
    const progress = (currentStep / 3) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('progressText').textContent = `Step ${currentStep} of 3`;
}

async function completeOnboarding() {
    console.log('Starting onboarding completion...');
    console.log('User:', currentUser);
    console.log('Onboarding data:', onboardingData);
    
    // Check if user is authenticated
    if (!currentUser || !currentUser.uid) {
        console.log('No authenticated user, redirecting to login');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        // Save to Firestore if available
        if (db && doc && setDoc) {
            console.log('Attempting to save to Firestore...');
            const userRef = doc(db, 'users', currentUser.uid);
            await setDoc(userRef, {
                userId: currentUser.uid,
                email: currentUser.email,
                name: onboardingData.name,
                collegeName: onboardingData.college,
                major: onboardingData.major,
                level: onboardingData.level,
                year: onboardingData.year,
                // API keys are now handled globally, not per user
                onboardingComplete: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }, { merge: true });
            
            console.log('Profile saved to Firestore for user:', currentUser.uid);
        } else {
            console.log('Firebase not available, saving to localStorage only');
        }
        
        // Also save to localStorage as backup
        const profileData = {
            name: onboardingData.name,
            collegeName: onboardingData.college,
            major: onboardingData.major,
            level: onboardingData.level,
            year: onboardingData.year,
            onboardingComplete: true,
            // API keys are now handled globally, not per user
        };
        localStorage.setItem(`profile_${currentUser.uid}`, JSON.stringify(profileData));
        localStorage.setItem('userData', JSON.stringify(profileData));
        
        // Mark as completed
        localStorage.setItem(`onboarding_${currentUser.uid}`, 'true');
        console.log('Onboarding completed successfully!');
        
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('Error saving profile to Firestore:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        console.log('Firebase not available, continuing with local storage only');
        
        // Save locally and continue anyway
        const profileData = {
            name: onboardingData.name,
            collegeName: onboardingData.college,
            major: onboardingData.major,
            level: onboardingData.level,
            year: onboardingData.year,
            onboardingComplete: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        localStorage.setItem(`profile_${currentUser.uid}`, JSON.stringify(profileData));
        localStorage.setItem('userData', JSON.stringify(profileData));
        localStorage.setItem(`onboarding_${currentUser.uid}`, 'true');
        
        console.log('Profile saved locally as backup');
        console.log('Onboarding completed successfully!');
        
        window.location.href = 'dashboard.html';
    }
}
