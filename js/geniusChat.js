// Genius Chat Interface - ChatGPT-style chat with Genius branding
class GeniusChat {
    constructor() {
        this.isOpen = false;
        this.currentChatId = null;
        this.chats = [];
        this.currentUser = null;
        this.uploadedFiles = [];
        this.previewModal = null;
        this.assistantId = null;
        this.threadId = null;
        this.uploadedFileIds = [];
        this.init();
    }

    async init() {
        console.log('Initializing Genius Chat...');
        
        // Get current user from Firebase auth state
        this.currentUser = null;
        
        // Create chat interface
        this.createChatInterface();
        this.setupEventListeners();
        
        // Wait for user to be set before loading chats
        this.waitForUserAndLoadChats();
        
        console.log('Genius Chat initialized successfully');
    }

    async waitForUserAndLoadChats() {
        // Wait for currentUser to be set
        const checkUser = () => {
            if (this.currentUser && this.currentUser.uid) {
                this.loadSavedChats();
            } else {
                setTimeout(checkUser, 100);
            }
        };
        checkUser();
    }

    setCurrentUser(user) {
        this.currentUser = user;
        if (user && user.uid) {
            this.loadSavedChats();
        }
    }

    createChatInterface() {
        console.log('Creating chat interface...');
        
        // Create main chat container
        const chatContainer = document.createElement('div');
        chatContainer.className = 'genius-chat-overlay';
        chatContainer.id = 'geniusChatOverlay';
        chatContainer.innerHTML = `
            <div class="genius-chat-modal">
                    <div class="genius-chat-header">
                        <div class="genius-chat-header-left">
                            <div class="genius-logo">
                                <img src="assets/darkgenius.png" alt="Genius AI" class="genius-logo-image">
                                <span class="genius-logo-text">Genius AI</span>
                            </div>
                        </div>
                        <div class="genius-chat-header-right">
                            <div class="genius-chat-shortcut" id="escapeToCloseBtn">Press ESC to close</div>
                        </div>
                    </div>
                
                <div class="genius-chat-body">
                    <div class="genius-chat-sidebar">
                        <div class="genius-chat-sidebar-header">
                            <button class="genius-chat-new-chat-btn" id="sidebarNewChatBtn">
                                New Chat
                            </button>
                        </div>
                        <div class="genius-chat-history" id="chatHistory">
                            <!-- Chat history will be populated here -->
                        </div>
                    </div>
                    
                    <div class="genius-chat-main">
                        <div class="genius-chat-messages" id="chatMessages">
                            <div class="genius-chat-welcome">
                                <div class="genius-welcome-icon">
                                    <img src="assets/darkgenius.png" alt="Genius AI" class="genius-welcome-logo">
                                </div>
                                <h2>Welcome to Genius AI</h2>
                                <p>I'm here to help you with your studies, answer questions, and provide insights. What would you like to know?</p>
                                <div class="genius-suggestions">
                                    <div class="suggestion-chip" data-suggestion="Help me understand calculus concepts">
                                        Help me understand calculus concepts
                                    </div>
                                    <div class="suggestion-chip" data-suggestion="Explain this topic in simple terms">
                                        Explain this topic in simple terms
                                    </div>
                                    <div class="suggestion-chip" data-suggestion="Create a study plan for my exam">
                                        Create a study plan for my exam
                                    </div>
                                    <div class="suggestion-chip" data-suggestion="Summarize my notes">
                                        Summarize my notes
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="genius-chat-input-container">
                            <div class="genius-chat-files-floating" id="uploadedFilesContainer" style="display: none;">
                                <!-- Uploaded files will be displayed here -->
                            </div>
                            <div class="genius-chat-input-wrapper">
                                <button class="genius-chat-attach-btn" id="attachFileBtn" title="Attach files">
                                    <span class="attach-icon">+</span>
                                </button>
                                <input type="file" id="fileInput" multiple style="display: none;" accept="image/*,application/pdf,.txt,.doc,.docx,.csv,.xlsx,.pptx">
                                <textarea 
                                    class="genius-chat-input" 
                                    id="chatInput" 
                                    placeholder="Message Genius AI..."
                                    rows="1"
                                ></textarea>
                                <button class="genius-chat-send-btn" id="sendBtn" disabled>
                                    <span class="send-icon">→</span>
                                </button>
                            </div>
                            <div class="genius-chat-footer">
                                <p>Genius AI can make mistakes. Consider checking important information.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(chatContainer);
        console.log('Chat interface created and added to DOM');
    }

    setupEventListeners() {
        // Escape to close button
        document.getElementById('escapeToCloseBtn').addEventListener('click', () => {
            this.closeChat();
        });

        // New chat button (sidebar only)
        document.getElementById('sidebarNewChatBtn').addEventListener('click', () => {
            this.startNewChat();
        });

        // Send message
        const sendBtn = document.getElementById('sendBtn');
        const chatInput = document.getElementById('chatInput');

        sendBtn.addEventListener('click', () => {
            this.sendMessage();
        });

        // File attachment
        const attachBtn = document.getElementById('attachFileBtn');
        const fileInput = document.getElementById('fileInput');

        attachBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files);
        });





        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea
        chatInput.addEventListener('input', () => {
            this.autoResizeTextarea(chatInput);
            this.updateSendButton();
        });

        // Suggestion chips
        document.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const suggestion = chip.dataset.suggestion;
                chatInput.value = suggestion;
                this.autoResizeTextarea(chatInput);
                this.updateSendButton();
                this.sendMessage();
            });
        });

        // Click outside to close
        document.getElementById('geniusChatOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'geniusChatOverlay') {
                this.closeChat();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+/ or Cmd+/ to open chat
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                this.openChat();
            }
            
            // Escape to close chat
            if (e.key === 'Escape' && this.isOpen) {
                this.closeChat();
            }
        });
    }

    openChat() {
        const overlay = document.getElementById('geniusChatOverlay');
        if (!overlay) {
            console.error('Chat overlay not found!');
            return;
        }
        
        overlay.style.display = 'block';
        document.body.style.overflow = 'hidden';
        this.isOpen = true;
        
        // Trigger smooth transition
        setTimeout(() => {
            overlay.classList.add('show');
        }, 10);
        
        console.log('Chat opened successfully');
        
        // Focus on input
        setTimeout(() => {
            const input = document.getElementById('chatInput');
            if (input) {
                input.focus();
            }
        }, 100);
    }

    closeChat() {
        const overlay = document.getElementById('geniusChatOverlay');
        overlay.classList.remove('show');
        
        // Wait for transition to complete before hiding
        setTimeout(() => {
            overlay.style.display = 'none';
            document.body.style.overflow = '';
            this.isOpen = false;
        }, 300);
    }

    startNewChat() {
        // Create a new chat ID
        this.currentChatId = 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Create new chat object with empty messages array
        const newChat = {
            id: this.currentChatId,
            title: 'New Chat',
            messages: [],
            createdAt: new Date().toISOString()
        };
        
        // Add to chats array
        this.chats.push(newChat);
        
        // Clear current session data
        this.uploadedFiles = [];
        this.uploadedFileIds = [];
        this.assistantId = null;
        this.threadId = null;
        
        // Clear UI and update
        this.clearMessages();
        this.updateSidebar();
        this.updateFileDisplay();
        document.getElementById('chatInput').focus();
        
        console.log('Started new chat with ID:', this.currentChatId);
    }

    clearMessages() {
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.innerHTML = `
            <div class="genius-chat-welcome">
                <div class="genius-welcome-icon">
                    <img src="assets/darkgenius.png" alt="Genius AI" class="genius-welcome-logo">
                </div>
                <h2>Welcome to Genius AI</h2>
                <p>I'm here to help you with your studies, answer questions, and provide insights. What would you like to know?</p>
                <div class="genius-suggestions">
                    <div class="suggestion-chip" data-suggestion="Help me understand calculus concepts">
                        Help me understand calculus concepts
                    </div>
                    <div class="suggestion-chip" data-suggestion="Explain this topic in simple terms">
                        Explain this topic in simple terms
                    </div>
                    <div class="suggestion-chip" data-suggestion="Create a study plan for my exam">
                        Create a study plan for my exam
                    </div>
                    <div class="suggestion-chip" data-suggestion="Summarize my notes">
                        Summarize my notes
                    </div>
                </div>
            </div>
        `;

        // Re-attach suggestion chip listeners
        document.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const suggestion = chip.dataset.suggestion;
                document.getElementById('chatInput').value = suggestion;
                this.autoResizeTextarea(document.getElementById('chatInput'));
                this.updateSendButton();
                this.sendMessage();
            });
        });
    }

    async sendMessage() {
        console.log('💬 [SEND] Starting message send process...');
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        console.log('📝 [SEND] Message content:', message);
        console.log('📎 [SEND] Attached files:', this.uploadedFiles.length);
        console.log('📎 [SEND] File details:', this.uploadedFiles.map(f => ({ name: f.name, type: f.type, size: f.size })));
        
        if (!message) {
            console.log('⚠️ [SEND] Empty message, aborting');
            return;
        }

        // Create new chat if needed
        if (!this.currentChatId) {
            this.currentChatId = 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            this.chats.push({
                id: this.currentChatId,
                title: message.length > 50 ? message.substring(0, 50) + '...' : message,
                messages: [],
                createdAt: new Date().toISOString()
            });
        }

        // Add user message with file attachments indicator
        this.addMessage('user', message, this.uploadedFiles);
        
        // Clear input and reset
        input.value = '';
        input.style.height = 'auto';
        this.updateSendButton();
        
        // Keep focus on input
        setTimeout(() => {
            input.focus();
        }, 100);

        // Store files for AI processing before clearing UI
        const filesForAI = [...this.uploadedFiles];
        
        // Clear uploaded files from UI immediately
        if (this.uploadedFiles.length > 0) {
            console.log('🧹 [SEND] Clearing files from UI immediately...');
            this.uploadedFiles = []; // Clear from memory
            this.uploadedFileIds = []; // Clear file IDs
            this.updateFileDisplay(); // Clear visual display
        }

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Temporarily restore files for AI processing
            const originalFiles = this.uploadedFiles;
            const originalFileIds = this.uploadedFileIds;
            this.uploadedFiles = filesForAI;
            this.uploadedFileIds = filesForAI.map(f => f.openaiFileId).filter(id => id);
            
            // Get AI response with streaming (this will display to user immediately)
            console.log('🤖 [SEND] Getting AI response with streaming...');
            await this.getAIResponseStream(message);
            
            // Restore original state (already cleared)
            this.uploadedFiles = originalFiles;
            this.uploadedFileIds = originalFileIds;
            
            // Save to storage AFTER user sees the response (non-blocking)
            console.log('💾 [SEND] Saving chat to storage (background)...');
            setTimeout(() => {
                this.saveCurrentChat();
                this.updateSidebar();
            }, 100); // Small delay to ensure UI is updated first
            
        } catch (error) {
            console.error('Error getting AI response:', error);
            this.hideTypingIndicator();
            
            // Show error message with helpful guidance
            let errorMessage = `Sorry, I encountered an error: ${error.message}`;
            
            if (error.message.includes('API key')) {
                errorMessage = `🔑 **API Key Required**\n\n${error.message}\n\nOnce you add your API key, you'll be able to chat with me!`;
            } else if (error.message.includes('Rate limit')) {
                errorMessage = `⏰ **Rate Limit Exceeded**\n\n${error.message}\n\nPlease wait a moment and try again.`;
            } else if (error.message.includes('Invalid')) {
                errorMessage = `❌ **Invalid API Key**\n\n${error.message}\n\nPlease check your API key in Settings.`;
            }
            
            this.addMessage('assistant', errorMessage);
        }
    }

    addMessage(role, content, attachedFiles = []) {
        const messagesContainer = document.getElementById('chatMessages');
        
        // Remove welcome message if it exists
        const welcome = messagesContainer.querySelector('.genius-chat-welcome');
        if (welcome) {
            welcome.remove();
        }

        if (role === 'user') {
            // Add file attachments as floating div above message if files are attached
            if (attachedFiles && attachedFiles.length > 0) {
                const attachmentsDiv = document.createElement('div');
                attachmentsDiv.className = 'genius-message-attachments-floating';
                attachmentsDiv.innerHTML = `
                    <div class="genius-message-attachments-list">
                        ${attachedFiles.map(file => `
                            <div class="genius-message-attachment-item">
                                <span class="genius-message-attachment-icon">${this.getFileIcon(file.type)}</span>
                                <span class="genius-message-attachment-name">${file.name}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
                messagesContainer.appendChild(attachmentsDiv);
            }
            
            // User messages in chat bubble (without file attachments inside)
            const messageDiv = document.createElement('div');
            messageDiv.className = 'genius-chat-message user';
            messageDiv.innerHTML = `
                <div class="genius-message-content">
                    <div class="genius-message-text">${this.formatMessage(content)}</div>
                </div>
            `;
            messagesContainer.appendChild(messageDiv);
        } else {
            // AI responses as plain text without chat bubble
            const messageDiv = document.createElement('div');
            messageDiv.className = 'genius-ai-response';
            messageDiv.innerHTML = `
                <div class="genius-ai-content">
                    <div class="genius-ai-text">${this.formatMessage(content)}</div>
                    <div class="genius-ai-actions">
                        <button class="genius-ai-action" onclick="navigator.clipboard.writeText('${content.replace(/'/g, "\\'")}')" title="Copy">
                            📋
                        </button>
                    </div>
                </div>
            `;
            messagesContainer.appendChild(messageDiv);
        }

        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Add to current chat
        if (this.currentChatId) {
            const currentChat = this.chats.find(chat => chat.id === this.currentChatId);
            if (currentChat) {
                currentChat.messages.push({ role, content, timestamp: new Date().toISOString() });
                
                // Update chat title if this is the first user message
                if (role === 'user' && currentChat.title === 'New Chat') {
                    currentChat.title = content.length > 50 ? content.substring(0, 50) + '...' : content;
                }
            }
        }
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatMessages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'genius-typing-simple';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `
            <div class="genius-typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }




    async getAIResponseStream(message) {
        console.log('🔄 [STREAM] Starting AI response stream...');
        console.log('📊 [STREAM] Uploaded files count:', this.uploadedFiles.length);
        
        // Use global API key for all users
        const apiKey = window.getOpenAIApiKey() || window.APP_CONFIG.OPENAI_API_KEY;
        
        if (!apiKey) {
            throw new Error('OpenAI API key not found. Please contact support.');
        }

        // Use streaming for regular responses, fallback to assistants for files
        if (this.uploadedFiles.length > 0) {
            console.log('📎 [STREAM] Files detected, using Assistant API...');
            return await this.getAssistantResponse(message);
        } else {
            console.log('💬 [STREAM] No files, using streaming response...');
            return await this.getStreamingResponse(message);
        }
    }

    async getAIResponse(message) {
        // Use global API key for all users
        const apiKey = window.getOpenAIApiKey() || window.APP_CONFIG.OPENAI_API_KEY;
        
        if (!apiKey) {
            throw new Error('OpenAI API key not found. Please contact support.');
        }

        // Use Assistants API if files are uploaded, otherwise use regular chat completions
        if (this.uploadedFiles.length > 0) {
            return await this.getAssistantResponse(message);
        } else {
            return await this.getRegularResponse(message);
        }
    }

    async getRegularResponse(message) {
        // Use global API key for all users
        const apiKey = window.getOpenAIApiKey() || window.APP_CONFIG.OPENAI_API_KEY;
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: `You are Genius AI, a helpful study assistant designed to help students with their academic work. You are knowledgeable, encouraging, and educational. 

Your capabilities include:
- Explaining complex concepts in simple terms
- Helping with homework and assignments
- Creating study plans and schedules
- Providing study tips and techniques
- Answering questions about various subjects
- Helping with research and writing
- Offering motivation and encouragement

Always be friendly, supportive, and educational in your responses. If you don't know something, admit it and suggest how the student might find the answer.`
                    },
                    ...this.getCurrentChatMessages(),
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: 1500,
                temperature: 0.7,
                stream: false
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (response.status === 401) {
                throw new Error('Invalid OpenAI API key. Please check your API key in profile settings.');
            } else if (response.status === 429) {
                throw new Error('Rate limit exceeded. Please try again in a moment.');
            } else {
                throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
            }
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async getStreamingResponse(message) {
        // Use global API key for all users
        const apiKey = window.getOpenAIApiKey() || window.APP_CONFIG.OPENAI_API_KEY;
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: `You are Genius AI, a helpful study assistant designed to help students with their academic work. You are knowledgeable, encouraging, and educational. 

Your capabilities include:
- Explaining complex concepts in simple terms
- Helping with homework and assignments
- Creating study plans and schedules
- Providing study tips and techniques
- Answering questions about various subjects
- Helping with research and writing
- Offering motivation and encouragement

Always be friendly, supportive, and educational in your responses. Use emojis, headers, bullet points, and line breaks to make your responses engaging and easy to read. Format your responses like ChatGPT with proper markdown formatting. If you don't know something, admit it and suggest how the student might find the answer.`
                    },
                    ...this.getCurrentChatMessages(),
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: 2000,
                temperature: 0.7,
                stream: true
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (response.status === 401) {
                throw new Error('Invalid OpenAI API key. Please check your API key in profile settings.');
            } else if (response.status === 429) {
                throw new Error('Rate limit exceeded. Please try again in a moment.');
            } else {
                throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
            }
        }

        // Remove typing indicator
        this.hideTypingIndicator();

        // Create AI response container
        const messagesContainer = document.getElementById('chatMessages');
        const welcome = messagesContainer.querySelector('.genius-chat-welcome');
        if (welcome) {
            welcome.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = 'genius-ai-response';
        messageDiv.innerHTML = `
            <div class="genius-ai-content">
                <div class="genius-ai-text" id="streamingText"></div>
                <div class="genius-ai-actions" style="opacity: 0;">
                    <button class="genius-ai-action" id="copyBtn" title="Copy">📋</button>
                </div>
            </div>
        `;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        const textElement = document.getElementById('streamingText');
        let fullResponse = '';

        // Setup copy button
        const copyBtn = document.getElementById('copyBtn');
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(fullResponse);
        });

        // Read the stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content;
                            if (content) {
                                fullResponse += content;
                                textElement.innerHTML = this.formatMessage(fullResponse);
                                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                            }
                        } catch (e) {
                            // Ignore parsing errors for incomplete chunks
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }

        // Show copy button after streaming is complete
        const actions = messageDiv.querySelector('.genius-ai-actions');
        actions.style.opacity = '1';

        // Add to current chat
        if (this.currentChatId) {
            const currentChat = this.chats.find(chat => chat.id === this.currentChatId);
            if (currentChat) {
                currentChat.messages.push({ role: 'assistant', content: fullResponse, timestamp: new Date().toISOString() });
            }
        }

        return fullResponse;
    }

    async getAssistantResponse(message) {
        console.log('🚀 [ASSISTANT] Starting file content extraction like flashcards/study guides...');
        console.log('📁 [ASSISTANT] Files to process:', this.uploadedFiles.length);
        console.log('📁 [ASSISTANT] File details:', this.uploadedFiles.map(f => ({ name: f.name, type: f.type, size: f.size })));
        
        // Use global API key for all users
        const apiKey = window.getOpenAIApiKey() || window.APP_CONFIG.OPENAI_API_KEY;
        
        try {
            // Use global CSharpFlashcardService if available, otherwise create a simple version
            let flashcardService;
            if (window.CSharpFlashcardService) {
                flashcardService = new window.CSharpFlashcardService();
            } else {
                // Simple fallback for file processing
                flashcardService = {
                    generateFlashcardsWithAssistants: async (file, count, showThinking = true) => {
                        // Simple text extraction fallback
                        if (file.type.startsWith('text/')) {
                            const text = await file.text();
                            return [{
                                question: `What is the main content of ${file.name}?`,
                                answer: text.substring(0, 200) + '...'
                            }];
                        }
                        return [];
                    }
                };
            }
            
            // Set the API key for the flashcard service
            flashcardService.azureConfig = {
                apiKey: apiKey,
                endpoint: 'https://api.openai.com/v1'
            };
            
            console.log('📖 [ASSISTANT] Extracting content from files using flashcard service...');
            
            let allFileContent = '';
            
            // Process each file to extract actual content
            for (let i = 0; i < this.uploadedFiles.length; i++) {
                const fileData = this.uploadedFiles[i];
                console.log(`📄 [ASSISTANT] Processing file ${i + 1}/${this.uploadedFiles.length}:`, fileData.name);
                
                try {
                    // Use the same method that works for flashcards to extract actual content
                    // BUT don't show the thinking effect - we'll handle that ourselves
                    const extractedContent = await flashcardService.generateFlashcardsWithAssistants(fileData.file, 5, false);
                    
                    if (extractedContent && Array.isArray(extractedContent) && extractedContent.length > 0) {
                        // Extract the actual content from the flashcards
                        let contentText = '';
                        contentText += `\n\n--- CONTENT FROM FILE: ${fileData.name} ---\n\n`;
                        
                        extractedContent.forEach((card, index) => {
                            contentText += `Key Point ${index + 1}:\n`;
                            contentText += `Question: ${card.question}\n`;
                            contentText += `Answer: ${card.answer}\n\n`;
                        });
                        
                        allFileContent += contentText;
                        console.log(`✅ [ASSISTANT] Extracted content from ${fileData.name}:`, contentText.length, 'characters');
                    } else {
                        console.warn(`⚠️ [ASSISTANT] No content extracted from ${fileData.name}`);
                        allFileContent += `\n\n--- FILE: ${fileData.name} ---\nContent could not be extracted from this file.\n\n`;
                    }
                    
                } catch (error) {
                    console.warn(`❌ [ASSISTANT] Error processing ${fileData.name}:`, error);
                    allFileContent += `\n\n--- FILE: ${fileData.name} ---\nError processing this file: ${error.message}\n\n`;
                }
            }
            
            console.log('📚 [ASSISTANT] Total extracted content length:', allFileContent.length);
            
            // Now use the extracted content to generate a response
            const enhancedMessage = `${message}\n\nHere is the content from the uploaded files:\n${allFileContent}`;
            
            console.log('🤖 [ASSISTANT] Generating AI response with extracted content...');
            
            // Use regular chat completion with the extracted content
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [
                        {
                            role: 'system',
                            content: `You are Genius AI, a helpful study assistant. The user has uploaded files and asked a question. You have access to the actual content extracted from those files. 

IMPORTANT: 
- Use the file content provided to answer the user's question accurately
- Reference specific information from the files when relevant
- If the user asks about something not in the files, say so clearly
- Be helpful and educational in your response
- Format your response with proper markdown formatting for readability
- Remember the conversation context and previous messages in this chat
- If the user refers to something from earlier in the conversation, use that context to provide better answers`
                        },
                        ...this.getCurrentChatMessages(),
                        {
                            role: 'user',
                            content: enhancedMessage
                        }
                    ],
                    max_tokens: 2000,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (response.status === 401) {
                    throw new Error('Invalid OpenAI API key. Please check your API key in profile settings.');
                } else if (response.status === 429) {
                    throw new Error('Rate limit exceeded. Please try again in a moment.');
                } else {
                    throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
                }
            }

            const data = await response.json();
            const aiResponse = data.choices[0].message.content;
            
            console.log('✅ [ASSISTANT] AI response generated with file content');
            
            // Hide typing indicator before showing response
            this.hideTypingIndicator();
            
            // Display response with typing animation
            this.displayTypingResponse(aiResponse);
            
            return aiResponse;

        } catch (error) {
            console.error('❌ [ASSISTANT] Error processing files:', error);
            // Hide typing indicator on error
            this.hideTypingIndicator();
            // Fallback to regular response
            return await this.getRegularResponse(message);
        }
    }


    displayTypingResponse(response) {
        // Create AI response container
        const messagesContainer = document.getElementById('chatMessages');
        const welcome = messagesContainer.querySelector('.genius-chat-welcome');
        if (welcome) {
            welcome.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = 'genius-ai-response';
        messageDiv.innerHTML = `
            <div class="genius-ai-content">
                <div class="genius-ai-text" id="typingText"></div>
                <div class="genius-ai-actions" style="opacity: 0;">
                    <button class="genius-ai-action" id="copyBtn" title="Copy">📋</button>
                </div>
            </div>
        `;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        const textElement = document.getElementById('typingText');
        let currentText = '';
        let index = 0;

        // Setup copy button
        const copyBtn = document.getElementById('copyBtn');
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(response);
        });

        // Type out the response character by character
        const typeWriter = () => {
            if (index < response.length) {
                currentText += response[index];
                textElement.innerHTML = this.formatMessage(currentText);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                index++;
                
                // Variable speed - faster for spaces, slower for punctuation
                const char = response[index - 1];
                let delay = 20; // Base delay
                if (char === ' ') delay = 10;
                if (char === '.' || char === '!' || char === '?') delay = 100;
                if (char === '\n') delay = 50;
                
                setTimeout(typeWriter, delay);
            } else {
                // Show copy button after typing is complete
                const actions = messageDiv.querySelector('.genius-ai-actions');
                actions.style.opacity = '1';
            }
        };

        // Start typing
        typeWriter();
    }

    getCurrentChatMessages() {
        if (!this.currentChatId) {
            return [];
        }
        
        const currentChat = this.chats.find(chat => chat.id === this.currentChatId);
        if (!currentChat || !currentChat.messages) {
            return [];
        }
        
        // Return the last 10 messages to maintain context without overwhelming the API
        return currentChat.messages.slice(-10);
    }

    displayMessage(role, content, attachedFiles = []) {
        const messagesContainer = document.getElementById('chatMessages');
        
        // Remove welcome message if it exists
        const welcome = messagesContainer.querySelector('.genius-chat-welcome');
        if (welcome) {
            welcome.remove();
        }

        if (role === 'user') {
            // Add file attachments as floating div above message if files are attached
            if (attachedFiles && attachedFiles.length > 0) {
                const attachmentsDiv = document.createElement('div');
                attachmentsDiv.className = 'genius-message-attachments-floating';
                attachmentsDiv.innerHTML = `
                    <div class="genius-message-attachments-list">
                        ${attachedFiles.map(file => `
                            <div class="genius-message-attachment-item">
                                <span class="genius-message-attachment-icon">${this.getFileIcon(file.type)}</span>
                                <span class="genius-message-attachment-name">${file.name}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
                messagesContainer.appendChild(attachmentsDiv);
            }
            
            // User messages in chat bubble (without file attachments inside)
            const messageDiv = document.createElement('div');
            messageDiv.className = 'genius-chat-message user';
            messageDiv.innerHTML = `
                <div class="genius-message-content">
                    <div class="genius-message-text">${this.formatMessage(content)}</div>
                </div>
            `;
            messagesContainer.appendChild(messageDiv);
        } else {
            // AI responses as plain text without chat bubble
            const messageDiv = document.createElement('div');
            messageDiv.className = 'genius-ai-response';
            messageDiv.innerHTML = `
                <div class="genius-ai-content">
                    <div class="genius-ai-text">${this.formatMessage(content)}</div>
                    <div class="genius-ai-actions">
                        <button class="genius-ai-action" onclick="navigator.clipboard.writeText('${content.replace(/'/g, "\\'")}')" title="Copy">
                            📋
                        </button>
                    </div>
                </div>
            `;
            messagesContainer.appendChild(messageDiv);
        }

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    formatMessage(content) {
        // Enhanced markdown formatting like ChatGPT
        let formatted = content
            // Headers
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // Bold and italic
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Code blocks
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            // Lists
            .replace(/^\* (.*$)/gim, '<li>$1</li>')
            .replace(/^- (.*$)/gim, '<li>$1</li>')
            .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
            // Line breaks
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');

        // Wrap list items in ul tags
        formatted = formatted.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
        
        // Wrap paragraphs
        if (!formatted.startsWith('<h') && !formatted.startsWith('<ul') && !formatted.startsWith('<pre')) {
            formatted = '<p>' + formatted + '</p>';
        }

        return formatted;
    }

    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        const newHeight = Math.min(textarea.scrollHeight, 200);
        textarea.style.height = newHeight + 'px';
        
        // Ensure minimum height
        if (newHeight < 40) {
            textarea.style.height = '40px';
        }
    }

    updateSendButton() {
        const input = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendBtn');
        sendBtn.disabled = !input.value.trim();
    }

    async loadSavedChats() {
        try {
            console.log('Loading saved chats from Firebase...');
            
            // Load from Firebase
            if (this.currentUser && this.currentUser.uid) {
                const db = window.firebase.firestore();
                const chatsRef = db.collection('users').doc(this.currentUser.uid).collection('chats');
                const querySnapshot = await chatsRef.orderBy('createdAt', 'desc').get();
                
                this.chats = [];
                querySnapshot.forEach((doc) => {
                    this.chats.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                
                console.log('Loaded genius chats from Firebase:', this.chats.length);
            } else {
                console.log('No current user, starting with empty chats');
                this.chats = [];
            }
            
            this.updateSidebar();
        } catch (error) {
            console.error('Error loading genius chats from Firebase:', error);
            this.chats = [];
            this.updateSidebar();
        }
    }

    async saveCurrentChat() {
        try {
            console.log('Saving chats to Firebase...');
            
            if (this.currentUser && this.currentUser.uid && this.currentChatId) {
                const db = window.firebase.firestore();
                const currentChat = this.chats.find(chat => chat.id === this.currentChatId);
                
                if (currentChat) {
                    await db.collection('users').doc(this.currentUser.uid).collection('chats').doc(this.currentChatId).set({
                        ...currentChat,
                        updatedAt: new Date()
                    }, { merge: true });
                    console.log('Chat saved to Firebase');
                }
            }
        } catch (error) {
            console.error('Error saving genius chats to Firebase:', error);
        }
    }

    updateSidebar() {
        const historyContainer = document.getElementById('chatHistory');
        historyContainer.innerHTML = '';

        // Sort chats by creation date (newest first)
        const sortedChats = [...this.chats].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        sortedChats.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = `genius-chat-item ${chat.id === this.currentChatId ? 'active' : ''}`;
            chatItem.innerHTML = `
                <div class="genius-chat-item-content">
                    <div class="genius-chat-item-title">${chat.title}</div>
                    <div class="genius-chat-item-date">${new Date(chat.createdAt).toLocaleDateString()}</div>
                </div>
                <button class="genius-chat-item-delete" onclick="geniusChat.deleteChat('${chat.id}')" title="Delete Chat">
                    ✕
                </button>
            `;
            
            chatItem.addEventListener('click', () => {
                this.loadChat(chat.id);
            });
            
            historyContainer.appendChild(chatItem);
        });
    }

    loadChat(chatId) {
        const chat = this.chats.find(c => c.id === chatId);
        if (!chat) return;

        this.currentChatId = chatId;
        this.clearMessages();

        // Add messages to the chat (without adding to the messages array again)
        chat.messages.forEach(msg => {
            this.displayMessage(msg.role, msg.content);
        });

        this.updateSidebar();
        console.log('Loaded chat:', chatId, 'with', chat.messages.length, 'messages');
    }

    async deleteChat(chatId) {
        if (confirm('Are you sure you want to delete this chat?')) {
            try {
                // Delete from Firebase
                if (this.currentUser && this.currentUser.uid) {
                    const db = window.firebase.firestore();
                    await db.collection('users').doc(this.currentUser.uid).collection('chats').doc(chatId).delete();
                }
                
                // Remove from local array
                this.chats = this.chats.filter(chat => chat.id !== chatId);
                if (this.currentChatId === chatId) {
                    this.startNewChat();
                }
                this.updateSidebar();
            } catch (error) {
                console.error('Error deleting chat from Firebase:', error);
                alert('Error deleting chat. Please try again.');
            }
        }
    }

    handleFileUpload(files) {
        Array.from(files).forEach(file => {
            // Check file size (limit to 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert(`File "${file.name}" is too large. Please select files smaller than 10MB.`);
                return;
            }

            // Add file to uploaded files
            const fileId = 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            this.uploadedFiles.push({
                id: fileId,
                name: file.name,
                size: file.size,
                type: file.type,
                file: file,
                openaiFileId: null
            });
        });

        this.updateFileDisplay();
    }

    updateFileDisplay() {
        const container = document.getElementById('uploadedFilesContainer');
        
        if (this.uploadedFiles.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'flex';
        container.innerHTML = '';

        this.uploadedFiles.forEach(fileData => {
            const fileDiv = document.createElement('div');
            fileDiv.className = 'genius-chat-file-item';
            fileDiv.innerHTML = `
                <div class="genius-file-info" onclick="geniusChat.previewFile('${fileData.id}')">
                    <span class="genius-file-icon">${this.getFileIcon(fileData.type)}</span>
                    <div class="genius-file-details">
                        <div class="genius-file-name" title="${fileData.name}">${fileData.name}</div>
                        <div class="genius-file-size">${this.formatFileSize(fileData.size)}</div>
                    </div>
                </div>
                <button class="genius-file-remove" onclick="geniusChat.removeFile('${fileData.id}')" title="Remove file">
                    ✕
                </button>
            `;
            container.appendChild(fileDiv);
        });
    }

    async clearAllFiles() {
        // Clear local file arrays (no need to delete from OpenAI since we're not using the old assistant API)
        this.uploadedFiles = [];
        this.uploadedFileIds = [];
        this.updateFileDisplay();
    }

    async removeFile(fileId) {
        // Simply remove from local array (no need to delete from OpenAI)
        this.uploadedFiles = this.uploadedFiles.filter(file => file.id !== fileId);
        this.updateFileDisplay();
    }

    getFileIcon(fileType) {
        if (fileType.startsWith('image/')) return '🖼️';
        if (fileType.startsWith('video/')) return '🎥';
        if (fileType.startsWith('audio/')) return '🎵';
        if (fileType.includes('pdf')) return '📄';
        if (fileType.includes('word') || fileType.includes('document')) return '📝';
        if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
        if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📽️';
        if (fileType.includes('text')) return '📄';
        if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return '📦';
        return '📎';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    previewFile(fileId) {
        const fileData = this.uploadedFiles.find(file => file.id === fileId);
        if (!fileData) return;

        this.createPreviewModal(fileData);
    }

    createPreviewModal(fileData) {
        // Remove existing modal if any
        if (this.previewModal) {
            this.previewModal.remove();
        }

        // Create modal
        this.previewModal = document.createElement('div');
        this.previewModal.className = 'genius-file-preview-modal';
        this.previewModal.innerHTML = `
            <div class="genius-file-preview-overlay" onclick="geniusChat.closePreview()"></div>
            <div class="genius-file-preview-container">
                <div class="genius-file-preview-header">
                    <div class="genius-file-preview-title">
                        <span class="genius-file-preview-icon">${this.getFileIcon(fileData.type)}</span>
                        <div class="genius-file-preview-info">
                            <div class="genius-file-preview-name">${fileData.name}</div>
                            <div class="genius-file-preview-details">${this.formatFileSize(fileData.size)} • ${fileData.type || 'Unknown type'}</div>
                        </div>
                    </div>
                    <button class="genius-file-preview-close" onclick="geniusChat.closePreview()">✕</button>
                </div>
                <div class="genius-file-preview-content" id="previewContent">
                    ${this.generatePreviewContent(fileData)}
                </div>
            </div>
        `;

        document.body.appendChild(this.previewModal);

        // Load text preview if it's a text file
        if (fileData.type.includes('text/')) {
            this.loadTextPreview(fileData);
        }

        // Add escape key listener
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closePreview();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    generatePreviewContent(fileData) {
        const file = fileData.file;
        const fileType = fileData.type;

        if (fileType.startsWith('image/')) {
            return `<img src="${URL.createObjectURL(file)}" alt="${fileData.name}" class="genius-preview-image">`;
        } else if (fileType.startsWith('video/')) {
            return `<video controls class="genius-preview-video"><source src="${URL.createObjectURL(file)}" type="${fileType}"></video>`;
        } else if (fileType.startsWith('audio/')) {
            return `<audio controls class="genius-preview-audio"><source src="${URL.createObjectURL(file)}" type="${fileType}"></audio>`;
        } else if (fileType.includes('pdf')) {
            return `<iframe src="${URL.createObjectURL(file)}" class="genius-preview-pdf"></iframe>`;
        } else if (fileType.includes('text/')) {
            return `<div class="genius-preview-text" id="textPreview">Loading...</div>`;
        } else {
            return `
                <div class="genius-preview-unsupported">
                    <div class="genius-preview-icon-large">${this.getFileIcon(fileType)}</div>
                    <h3>Preview not available</h3>
                    <p>This file type cannot be previewed in the browser.</p>
                    <div class="genius-preview-actions">
                        <button class="genius-preview-download" onclick="geniusChat.downloadFile('${fileData.id}')">Download File</button>
                    </div>
                </div>
            `;
        }
    }

    async loadTextPreview(fileData) {
        const textPreview = document.getElementById('textPreview');
        if (!textPreview) return;

        try {
            const text = await fileData.file.text();
            textPreview.innerHTML = `<pre>${this.escapeHtml(text)}</pre>`;
        } catch (error) {
            textPreview.innerHTML = '<p>Error loading text content</p>';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    downloadFile(fileId) {
        const fileData = this.uploadedFiles.find(file => file.id === fileId);
        if (!fileData) return;

        const link = document.createElement('a');
        link.href = URL.createObjectURL(fileData.file);
        link.download = fileData.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    closePreview() {
        if (this.previewModal) {
            this.previewModal.remove();
            this.previewModal = null;
        }
    }
}

// Create global instance
window.geniusChat = new GeniusChat();

// Make it globally available
window.GeniusChat = GeniusChat;
