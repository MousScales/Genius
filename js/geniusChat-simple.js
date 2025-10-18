// Simple Genius Chat Interface - ChatGPT-style chat with Genius branding
class GeniusChat {
    constructor() {
        this.isOpen = false;
        this.currentChatId = null;
        this.chats = [];
        this.currentUser = null;
        this.uploadedFiles = [];
        this.previewModal = null;
        this.assistantId = null;
        
        console.log('Genius Chat initialized');
        this.init();
    }
    
    async init() {
        try {
            console.log('Initializing Genius Chat...');
            
            // Get current user from localStorage
            const currentUserData = localStorage.getItem('currentUser');
            if (!currentUserData) {
                console.log('No user logged in, skipping Genius Chat initialization');
                return;
            }
            
            this.currentUser = JSON.parse(currentUserData);
            console.log('Current user loaded:', this.currentUser.email);
            
            // Create chat interface
            this.createChatInterface();
            
            // Load saved chats
            await this.loadSavedChats();
            
            console.log('Genius Chat initialized successfully');
            
        } catch (error) {
            console.error('Error initializing Genius Chat:', error);
        }
    }
    
    createChatInterface() {
        console.log('Creating chat interface...');
        
        // Create the chat container
        const chatContainer = document.createElement('div');
        chatContainer.id = 'geniusChatContainer';
        chatContainer.innerHTML = `
            <div class="genius-chat-header">
                <h3>Genius Chat</h3>
                <button id="geniusChatCloseBtn" class="genius-chat-close-btn">×</button>
            </div>
            <div class="genius-chat-messages" id="geniusChatMessages">
                <div class="genius-welcome-message">
                    <p>👋 Hi! I'm your Genius AI assistant. How can I help you today?</p>
                </div>
            </div>
            <div class="genius-chat-input-container">
                <div class="genius-chat-input-wrapper">
                    <input type="text" id="geniusChatInput" placeholder="Ask me anything..." class="genius-chat-input">
                    <button id="geniusChatSendBtn" class="genius-chat-send-btn">Send</button>
                </div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #geniusChatContainer {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 350px;
                height: 500px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                display: none;
                flex-direction: column;
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .genius-chat-header {
                background: rgba(255,255,255,0.1);
                padding: 15px;
                border-radius: 15px 15px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: white;
            }
            
            .genius-chat-header h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
            }
            
            .genius-chat-close-btn {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background-color 0.2s;
            }
            
            .genius-chat-close-btn:hover {
                background: rgba(255,255,255,0.2);
            }
            
            .genius-chat-messages {
                flex: 1;
                padding: 15px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .genius-welcome-message {
                background: rgba(255,255,255,0.1);
                padding: 12px 16px;
                border-radius: 18px;
                color: white;
                font-size: 14px;
                line-height: 1.4;
            }
            
            .genius-chat-message {
                display: flex;
                margin-bottom: 10px;
            }
            
            .genius-chat-message.user {
                justify-content: flex-end;
            }
            
            .genius-chat-message.assistant {
                justify-content: flex-start;
            }
            
            .genius-message-content {
                max-width: 80%;
                padding: 12px 16px;
                border-radius: 18px;
                font-size: 14px;
                line-height: 1.4;
                word-wrap: break-word;
            }
            
            .genius-chat-message.user .genius-message-content {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: white;
                backdrop-filter: blur(10px);
            }
            
            .genius-chat-message.assistant .genius-message-content {
                background: none !important;
                border: none !important;
                box-shadow: none !important;
                color: white;
                padding: 0;
            }
            
            .genius-chat-input-container {
                padding: 15px;
                background: rgba(255,255,255,0.1);
                border-radius: 0 0 15px 15px;
            }
            
            .genius-chat-input-wrapper {
                display: flex;
                gap: 10px;
            }
            
            .genius-chat-input {
                flex: 1;
                padding: 12px 16px;
                border: none;
                border-radius: 25px;
                background: rgba(255,255,255,0.9);
                color: #333;
                font-size: 14px;
                outline: none;
            }
            
            .genius-chat-input::placeholder {
                color: #666;
            }
            
            .genius-chat-send-btn {
                padding: 12px 20px;
                border: none;
                border-radius: 25px;
                background: rgba(255,255,255,0.2);
                color: white;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            
            .genius-chat-send-btn:hover {
                background: rgba(255,255,255,0.3);
            }
            
            .genius-chat-send-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(chatContainer);
        
        // Add event listeners
        this.addEventListeners();
        
        console.log('Chat interface created and added to DOM');
    }
    
    addEventListeners() {
        // Close button
        document.getElementById('geniusChatCloseBtn').addEventListener('click', () => {
            this.closeChat();
        });
        
        // Send button
        document.getElementById('geniusChatSendBtn').addEventListener('click', () => {
            this.sendMessage();
        });
        
        // Enter key in input
        document.getElementById('geniusChatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }
    
    openChat() {
        const chatContainer = document.getElementById('geniusChatContainer');
        if (chatContainer) {
            chatContainer.style.display = 'flex';
            this.isOpen = true;
            
            // Focus on input
            setTimeout(() => {
                const input = document.getElementById('geniusChatInput');
                if (input) input.focus();
            }, 100);
        }
    }
    
    closeChat() {
        const chatContainer = document.getElementById('geniusChatContainer');
        if (chatContainer) {
            chatContainer.style.display = 'none';
            this.isOpen = false;
        }
    }
    
    async sendMessage() {
        const input = document.getElementById('geniusChatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Clear input
        input.value = '';
        
        // Add user message
        this.addMessageToChat('user', message);
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Get AI response
            const response = await this.getAIResponse(message);
            
            // Remove typing indicator
            this.hideTypingIndicator();
            
            // Add AI response
            this.addMessageToChat('assistant', response);
            
        } catch (error) {
            console.error('Error getting AI response:', error);
            this.hideTypingIndicator();
            this.addMessageToChat('assistant', 'Sorry, I encountered an error. Please try again.');
        }
    }
    
    addMessageToChat(sender, content) {
        const messagesContainer = document.getElementById('geniusChatMessages');
        if (!messagesContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `genius-chat-message ${sender}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'genius-message-content';
        contentDiv.textContent = content;
        
        messageDiv.appendChild(contentDiv);
        messagesContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    showTypingIndicator() {
        const messagesContainer = document.getElementById('geniusChatMessages');
        if (!messagesContainer) return;
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'genius-chat-message assistant';
        typingDiv.id = 'typingIndicator';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'genius-message-content';
        contentDiv.innerHTML = '<div class="genius-typing-dots">Thinking...</div>';
        
        typingDiv.appendChild(contentDiv);
        messagesContainer.appendChild(typingDiv);
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    async getAIResponse(message) {
        try {
            // Get API key
            const apiKey = window.getOpenAIApiKey?.() || window.APP_CONFIG?.OPENAI_API_KEY;
            if (!apiKey) {
                throw new Error('No API key available');
            }
            
            // Make API call
            const response = await fetch('/api/openai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: 'You are Genius AI, a helpful assistant for students. Be concise and helpful.' },
                        { role: 'user', content: message }
                    ],
                    model: 'gpt-4o-mini',
                    max_tokens: 500,
                    temperature: 0.7
                })
            });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            const data = await response.json();
            return data.choices[0].message.content;
            
        } catch (error) {
            console.error('Error getting AI response:', error);
            throw error;
        }
    }
    
    async loadSavedChats() {
        // This would load saved chats from localStorage or Firebase
        // For now, just log that it's called
        console.log('Loading saved chats...');
    }
}

// Initialize Genius Chat when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.geniusChat = new GeniusChat();
});

// Make it globally available
window.GeniusChat = GeniusChat;
