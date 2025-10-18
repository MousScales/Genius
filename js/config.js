// Genius App Configuration
// Load configuration from environment variables or use defaults

// Function to get environment variable from server
async function getEnvConfig() {
    try {
        const response = await fetch('/api/env');
        const config = await response.json();
        return config;
    } catch (error) {
        console.warn('Could not load environment config, using defaults');
        return {};
    }
}

// Initialize configuration
window.APP_CONFIG = {
    // OpenAI API Configuration - Will be loaded from environment
    OPENAI_API_KEY: null,
    
    // Azure OpenAI Configuration (if using Azure instead of OpenAI)
    AZURE_OPENAI_ENDPOINT: "https://your-deployment.openai.azure.com/",
    AZURE_OPENAI_API_KEY: "your-azure-api-key-here",
    AZURE_OPENAI_DEPLOYMENT: "gpt-4o-mini",
    
    // Other API configurations
    GENIUS_CHAT_API_KEY: null
};

// Load environment configuration when page loads
document.addEventListener('DOMContentLoaded', async () => {
    const envConfig = await getEnvConfig();
    if (envConfig.openaiApiKey) {
        window.APP_CONFIG.OPENAI_API_KEY = envConfig.openaiApiKey;
        window.APP_CONFIG.GENIUS_CHAT_API_KEY = envConfig.openaiApiKey;
    }
    
    // Set Firebase config globally for firebase-service.js
    window.FIREBASE_API_KEY = envConfig.firebaseApiKey;
    window.FIREBASE_AUTH_DOMAIN = envConfig.firebaseAuthDomain;
    window.FIREBASE_PROJECT_ID = envConfig.firebaseProjectId;
    window.FIREBASE_STORAGE_BUCKET = envConfig.firebaseStorageBucket;
    window.FIREBASE_MESSAGING_SENDER_ID = envConfig.firebaseMessagingSenderId;
    window.FIREBASE_APP_ID = envConfig.firebaseAppId;
    window.FIREBASE_MEASUREMENT_ID = envConfig.firebaseMeasurementId;
    
    console.log('Firebase config loaded:', {
        apiKey: !!window.FIREBASE_API_KEY,
        authDomain: !!window.FIREBASE_AUTH_DOMAIN,
        projectId: !!window.FIREBASE_PROJECT_ID
    });
});

// Function to get OpenAI API key with fallbacks
window.getOpenAIApiKey = function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    return currentUser.openaiApiKey || 
           userData.openaiApiKey || 
           window.geniusChatApiKey || 
           window.APP_CONFIG.OPENAI_API_KEY || 
           null;
};

// Function to get Azure OpenAI configuration
window.getAzureOpenAIConfig = function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    return {
        endpoint: currentUser.azureEndpoint || window.APP_CONFIG.AZURE_OPENAI_ENDPOINT,
        apiKey: currentUser.azureApiKey || window.APP_CONFIG.AZURE_OPENAI_API_KEY,
        deploymentName: currentUser.azureDeploymentName || window.APP_CONFIG.AZURE_OPENAI_DEPLOYMENT
    };
};

console.log('Genius App Configuration loaded');
