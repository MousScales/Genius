// Onboarding module
import { getCurrentUser } from './auth.js';

// Global variables
let currentStep = 1;
let onboardingData = {};

// Initialize onboarding
export function initializeOnboarding() {
    currentStep = 1;
    onboardingData = {};
    updateProgress();
}

// Show onboarding
export function showOnboarding() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('onboardingPage').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
    initializeOnboarding();
}

// Next step
export function nextStep() {
    if (validateCurrentStep()) {
        saveCurrentStepData();
        if (currentStep < 4) {
            currentStep++;
            showStep(currentStep);
            updateProgress();
        }
    }
}

// Previous step
export function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
        updateProgress();
    }
}

// Show specific step
export function showStep(step) {
    // Hide all steps
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`step${i}`).style.display = 'none';
    }
    
    // Show current step
    document.getElementById(`step${step}`).style.display = 'block';
}

// Update progress bar
export function updateProgress() {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    const percentage = (currentStep / 4) * 100;
    progressFill.style.width = `${percentage}%`;
    progressText.textContent = `Step ${currentStep} of 4`;
}

// Validate current step
export function validateCurrentStep() {
    switch (currentStep) {
        case 1:
            const userName = document.getElementById('userName').value;
            if (!userName.trim()) {
                alert('Please enter your name');
                return false;
            }
            break;
        case 2:
            const collegeName = document.getElementById('collegeName').value;
            const major = document.getElementById('major').value;
            if (!collegeName.trim() || !major.trim()) {
                alert('Please fill in both college name and major');
                return false;
            }
            break;
        case 3:
            const academicLevel = document.getElementById('academicLevel').value;
            const graduationYear = document.getElementById('graduationYear').value;
            if (!academicLevel || !graduationYear) {
                alert('Please select your academic level and graduation year');
                return false;
            }
            break;
        case 4:
            // Azure configuration is optional, no validation needed
            break;
    }
    return true;
}

// Save current step data
export function saveCurrentStepData() {
    switch (currentStep) {
        case 1:
            onboardingData.name = document.getElementById('userName').value;
            break;
        case 2:
            onboardingData.collegeName = document.getElementById('collegeName').value;
            onboardingData.major = document.getElementById('major').value;
            break;
        case 3:
            onboardingData.academicLevel = document.getElementById('academicLevel').value;
            onboardingData.graduationYear = document.getElementById('graduationYear').value;
            break;
        case 4:
            onboardingData.azureEndpoint = document.getElementById('azureEndpoint').value;
            onboardingData.azureApiKey = document.getElementById('azureApiKey').value;
            onboardingData.azureDeploymentName = document.getElementById('azureDeploymentName').value;
            break;
    }
}

// Complete onboarding
export async function completeOnboarding() {
    if (validateCurrentStep()) {
        saveCurrentStepData();
        
        try {
            // Save user profile
            await saveUserProfile();
            window.dispatchEvent(new CustomEvent('onboardingCompleted'));
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Error saving profile. Please try again.');
        }
    }
}

// Save user profile
export async function saveUserProfile() {
    const user = getCurrentUser();
    if (!user) {
        console.error('No user logged in');
        throw new Error('No user logged in');
    }
    
    const profileData = {
        ...onboardingData,
        email: user.email
    };
    
    try {
        // Import userService dynamically
        const { userService } = await import('./firebase-service.js');
        
        // Save to Firebase
        await userService.saveProfile(user.uid, profileData);
        console.log('Profile saved to Firebase for user:', user.uid);
        
        // Also save to localStorage as backup
        localStorage.setItem('userProfile', JSON.stringify({
            ...profileData,
            userId: user.uid
        }));
        
        // Update currentUser with Azure config
        const updatedUser = {
            ...user,
            ...onboardingData
        };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        console.log('Profile saved to localStorage');
        
    } catch (error) {
        console.error('Error saving profile to Firebase:', error);
        
        // Save to localStorage as fallback
        localStorage.setItem('userProfile', JSON.stringify({
            ...profileData,
            userId: user.uid
        }));
        console.log('Profile saved to localStorage only');
        
        throw error;
    }
}

// Make functions globally available
window.nextStep = nextStep;
window.prevStep = prevStep;
window.completeOnboarding = completeOnboarding;
