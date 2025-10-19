class CSharpFlashcardService {
    constructor() {
        this.isAvailable = true;
        this.azureConfig = null;
        this.loadConfigFromEnvironment();
    }

    async loadConfigFromEnvironment() {
        // Try to get API key from environment or global config
        let apiKey = window.getOpenAIApiKey?.() || window.APP_CONFIG?.OPENAI_API_KEY;
        
        // If not found, try to load from server
        if (!apiKey) {
            try {
                const response = await fetch('/api/env');
                const config = await response.json();
                apiKey = config.openaiApiKey;
                console.log('🔑 [FLASHCARDS] Loaded API key from server');
            } catch (error) {
                console.warn('Could not load API key from server:', error);
            }
        }
        
        if (apiKey) {
            this.azureConfig = {
                apiKey: apiKey,
                endpoint: 'https://api.openai.com/v1'
            };
            console.log('🔑 [FLASHCARDS] API key configured successfully');
        } else {
            console.error('❌ [FLASHCARDS] No API key found in environment or server');
        }
    }

    setAzureConfig(config) {
        this.azureConfig = config;
    }

    async generateFlashcardsFromFile(file, flashcardCount = 10) {
        // Ensure config is loaded
        if (!this.azureConfig) {
            await this.loadConfigFromEnvironment();
        }
        
        if (!this.azureConfig) {
            throw new Error('OpenAI API key not found. Please check your environment configuration.');
        }

        try {
            // Use Assistants API for proper file handling (supports PDFs, etc.)
            const flashcards = await this.generateFlashcardsWithAssistants(file, flashcardCount);
            
            return flashcards;
        } catch (error) {
            console.error('Error generating flashcards from file:', error);
            throw error;
        }
    }

    async generateFlashcardsFromText(text, flashcardCount = 10, fileName = "document.txt", retryCount = 0) {
        const maxRetries = 3;
        const baseDelay = 1000; // 1 second base delay
        
        // Ensure config is loaded
        if (!this.azureConfig) {
            await this.loadConfigFromEnvironment();
        }
        
        if (!this.azureConfig) {
            throw new Error('OpenAI API key not found. Please check your environment configuration.');
        }

        try {
            console.log(`Generating ${flashcardCount} flashcards from text... (attempt ${retryCount + 1})`);
            
            // Chunk the text if it's too long (limit to ~8000 characters to stay under token limits)
            const maxChunkSize = 8000;
            const chunks = this.chunkText(text, maxChunkSize);
            
            // Show thinking effect for flashcard generation
            this.showThinkingEffect('creating flashcards');
            
            let allFlashcards = [];
            const flashcardsPerChunk = Math.max(1, Math.floor(flashcardCount / chunks.length));
            
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const chunkFlashcardCount = i === chunks.length - 1 ? 
                    flashcardCount - allFlashcards.length : flashcardsPerChunk;
                
                if (chunkFlashcardCount <= 0) break;
                
                console.log(`Processing chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`);
                
                const response = await fetch(`${this.azureConfig.endpoint}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.azureConfig.apiKey}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-3.5-turbo', // Use more efficient model
                        messages: [
                            {
                                role: "system",
                                content: `Create ${chunkFlashcardCount} educational flashcards from the text. Return as JSON array with 'question' and 'answer' fields.`
                            },
                            {
                                role: "user",
                                content: `Create ${chunkFlashcardCount} flashcards from this text:\n\n${chunk}`
                            }
                        ],
                        max_tokens: 2000, // Reduced token limit
                        temperature: 0.7
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    
                    // Handle rate limiting with retry
                    if (response.status === 429 && retryCount < maxRetries) {
                        const delay = baseDelay * Math.pow(2, retryCount) + Math.random() * 1000; // Exponential backoff with jitter
                        console.log(`Rate limited. Retrying in ${Math.round(delay)}ms...`);
                        
                        // Update thinking effect for retry
                        this.updateThinkingEffect('Rate limited, retrying...');
                        
                        await new Promise(resolve => setTimeout(resolve, delay));
                        return this.generateFlashcardsFromText(text, flashcardCount, fileName, retryCount + 1);
                    }
                    
                    throw new Error(`OpenAI API error: ${response.status} ${errorData.error?.message || response.statusText}`);
                }

                const data = await response.json();
                const content = data.choices[0].message.content;
                
                // Parse the flashcards from the response
                const chunkFlashcards = this.parseFlashcardsFromResponse(content);
                allFlashcards.push(...chunkFlashcards);
                
                // Add small delay between chunks to avoid rate limits
                if (i < chunks.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            
            // Hide thinking effect
            this.hideThinkingEffect();
            
            // Limit to requested number of flashcards
            return allFlashcards.slice(0, flashcardCount);
        } catch (error) {
            console.error('Error generating flashcards from text:', error);
            
            // Hide thinking effect on error
            this.hideThinkingEffect();
            
            // If it's a rate limit error and we haven't exceeded max retries, retry
            if (error.message.includes('429') && retryCount < maxRetries) {
                const delay = baseDelay * Math.pow(2, retryCount) + Math.random() * 1000;
                console.log(`Rate limited. Retrying in ${Math.round(delay)}ms...`);
                
                // Show thinking effect again for retry
                this.showThinkingEffect('creating flashcards');
                this.updateThinkingEffect('Rate limited, retrying...');
                
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.generateFlashcardsFromText(text, flashcardCount, fileName, retryCount + 1);
            }
            
            throw error;
        }
    }

    async generateFlashcardsWithAssistants(file, flashcardCount = 10, showThinkingEffect = true) {
        try {
            console.log(`Using Assistants API to generate ${flashcardCount} flashcards from file: ${file.name}`);
            
            // Show thinking effect with appropriate message only if requested
            const isImage = this.isImageFile(file);
            if (showThinkingEffect) {
                this.showThinkingEffect(isImage ? 'analyzing image' : 'creating flashcards');
            }
            
            // For images, try vision API first as fallback
            if (isImage) {
                try {
                    const flashcards = await this.generateFlashcardsFromImageVision(file, flashcardCount);
                    // Don't hide thinking effect here - let the calling function handle it
                    return flashcards;
                } catch (visionError) {
                    console.log('Vision API failed, falling back to Assistants API:', visionError);
                    // Continue with Assistants API
                }
            }
            
            // Use text extraction approach (most reliable)
            console.log('Using text extraction approach for content analysis');
            
            // For images, use vision API
            if (this.isImageFile(file)) {
                const flashcards = await this.generateFlashcardsFromImageVision(file, flashcardCount);
                return flashcards;
            }
            
            // For documents, extract text and use Chat Completions
            const textContent = await this.extractTextFromFile(file);
            
            console.log('File details:', {
                name: file.name,
                type: file.type,
                size: file.size,
                extractedLength: textContent ? textContent.length : 0
            });
            
            if (!textContent || textContent.trim().length === 0) {
                console.error('No text content extracted from file:', file.name, file.type);
                
                // If it's a Word document, provide helpful message
                if (file.name.toLowerCase().endsWith('.doc') || 
                    file.name.toLowerCase().endsWith('.docx')) {
                    throw new Error(`Cannot extract text from "${file.name}". Word documents need to be converted to text first. Please try uploading a .txt, .html, .md, or .pdf file instead.`);
                }
                
                throw new Error(`Could not extract text content from file "${file.name}". Please try uploading a text-based file (txt, html, json, csv, md, etc.)`);
            }
            
            console.log('Extracted text content preview:', textContent.substring(0, 200) + '...');
            console.log('Full extracted text:', textContent);
            
            // Make sure we're not just getting the filename
            if (textContent.trim() === file.name || textContent.trim() === 'Untitled Document') {
                console.error('Warning: Only filename extracted, no actual content');
                throw new Error(`Could not extract actual content from file "${file.name}". The file appears to be empty or in an unsupported format.`);
            }
            
            const flashcards = await this.generateFlashcardsFromText(textContent, flashcardCount, file.name, 0);
            
            // Hide thinking effect only if we showed it
            if (showThinkingEffect) {
                this.hideThinkingEffect();
            }
            
            return flashcards;
            
        } catch (error) {
            console.error('Error generating flashcards with Assistants API:', error);
            if (showThinkingEffect) {
                this.hideThinkingEffect();
            }
            throw error;
        }
    }

    async createAssistant() {
        const response = await fetch('https://api.openai.com/v1/assistants', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.azureConfig.apiKey}`,
                'OpenAI-Beta': 'assistants=v1'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini', // Use GPT-4o-mini like the C# version
                name: 'Flashcard Generator',
                instructions: 'You are a helpful study assistant that creates educational flashcards from documents. Create comprehensive flashcards covering key concepts, definitions, and important information. Return flashcards as JSON array with "question" and "answer" fields.',
                tools: [{ type: 'file_search' }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Create assistant error:', response.status, errorText);
            console.error('Request body was:', JSON.stringify({
                model: 'gpt-4o-mini',
                name: 'Flashcard Generator',
                instructions: 'You are a helpful study assistant that creates educational flashcards from documents. Create comprehensive flashcards covering key concepts, definitions, and important information. Return flashcards as JSON array with "question" and "answer" fields.',
                tools: [{ type: 'file_search' }]
            }, null, 2));
            throw new Error(`Failed to create assistant: ${response.status} ${response.statusText} - ${errorText}`);
        }

        return await response.json();
    }

    async uploadFile(file) {
        // Check if it's an image file
        const isImage = this.isImageFile(file);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('purpose', 'assistants');

        const response = await fetch('https://api.openai.com/v1/files', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.azureConfig.apiKey}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('File upload error:', response.status, errorText);
            throw new Error(`Failed to upload file: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const uploadedFile = await response.json();
        
        // Add image metadata for processing
        if (isImage) {
            uploadedFile.isImage = true;
            uploadedFile.imageType = file.type;
        }

        return uploadedFile;
    }

    isImageFile(file) {
        const imageTypes = [
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'image/gif',
            'image/webp',
            'image/bmp',
            'image/tiff',
            'image/svg+xml',
            'image/avif'
        ];
        
        return imageTypes.includes(file.type) || 
               /\.(jpg|jpeg|png|gif|webp|bmp|tiff|svg|avif)$/i.test(file.name);
    }

    async generateFlashcardsFromFileWithChatCompletions(file, flashcardCount) {
        try {
            // Upload file to OpenAI
            const uploadedFile = await this.uploadFile(file);
            console.log('File uploaded successfully:', uploadedFile.filename);
            
            // Use Chat Completions API with file reference
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.azureConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'user',
                            content: `Please analyze this document and create ${flashcardCount} educational flashcards. Cover the main concepts, definitions, and important information. Return the flashcards as a JSON array with this exact format: [{"question": "Your question here", "answer": "Your answer here"}]`,
                            attachments: [{
                                type: 'file',
                                file_id: uploadedFile.id
                            }]
                        }
                    ],
                    max_tokens: 4000,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Chat Completions API error:', response.status, errorText);
                throw new Error(`Failed to generate flashcards: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;
            
            // Parse flashcards from response
            const flashcards = this.parseFlashcardsFromResponse(content);
            
            // Cleanup - delete the uploaded file
            await fetch(`https://api.openai.com/v1/files/${uploadedFile.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.azureConfig.apiKey}`
                }
            });
            
            return flashcards;
            
        } catch (error) {
            console.error('Error generating flashcards with Chat Completions:', error);
            throw error;
        }
    }

    async extractTextFromFile(file) {
        return new Promise((resolve, reject) => {
            // For PDF files, use a different approach
            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                this.extractTextFromPDF(file).then(resolve).catch(reject);
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const content = e.target.result;
                
                // For text files, return the content directly
                if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
                    resolve(content);
                    return;
                }
                
                // For HTML files, extract text content
                if (file.type === 'text/html' || file.name.endsWith('.html') || content.includes('<') && content.includes('>')) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(content, 'text/html');
                    let textContent = doc.body.textContent || doc.body.innerText || '';
                    
                    // Clean up extra whitespace and normalize
                    textContent = textContent.replace(/\s+/g, ' ').trim();
                    
                    console.log(`Extracted text from HTML: ${textContent.length} characters`);
                    resolve(textContent);
                    return;
                }
                
                // For JSON files, extract text content
                if (file.type === 'application/json' || file.name.endsWith('.json')) {
                    try {
                        const jsonData = JSON.parse(content);
                        const textContent = JSON.stringify(jsonData, null, 2);
                        resolve(textContent);
                        return;
                    } catch (e) {
                        resolve(content);
                        return;
                    }
                }
                
                // For CSV files, extract text content
                if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                    resolve(content);
                    return;
                }
                
                // For markdown files, extract text content
                if (file.type === 'text/markdown' || file.name.endsWith('.md')) {
                    resolve(content);
                    return;
                }
                
                // Check if this might be HTML content from document editor
                if (content.includes('<div') || content.includes('<p>') || content.includes('<span')) {
                    console.log('Detected HTML content, extracting text...');
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(content, 'text/html');
                    let textContent = doc.body.textContent || doc.body.innerText || '';
                    textContent = textContent.replace(/\s+/g, ' ').trim();
                    console.log(`Extracted text from HTML-like content: ${textContent.length} characters`);
                    resolve(textContent);
                    return;
                }
                
                // For other text-based file types, try to extract text
                if (typeof content === 'string' && content.length > 0) {
                    resolve(content);
                } else {
                    reject(new Error(`Unsupported file type for text extraction: ${file.type}. Please try uploading a text-based file (txt, html, json, csv, md, pdf, etc.)`));
                }
            };
            
            reader.onerror = function() {
                reject(new Error('Failed to read file'));
            };
            
            // Read as text for most file types
            reader.readAsText(file);
        });
    }

    async extractTextFromPDF(file) {
        try {
            console.log('Starting PDF text extraction for:', file.name);
            
            // Load PDF.js library dynamically
            if (typeof pdfjsLib === 'undefined') {
                console.log('Loading PDF.js library...');
                await this.loadPDFJS();
                console.log('PDF.js library loaded successfully');
            }
            
            console.log('Converting file to array buffer...');
            const arrayBuffer = await file.arrayBuffer();
            console.log('Array buffer size:', arrayBuffer.byteLength);
            
            console.log('Loading PDF document...');
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            console.log(`PDF loaded successfully: ${pdf.numPages} pages`);
            
            let fullText = '';
            
            // Extract text from all pages
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                console.log(`Extracting text from page ${pageNum}/${pdf.numPages}...`);
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n\n';
                console.log(`Page ${pageNum} text length: ${pageText.length} characters`);
            }
            
            const finalText = fullText.trim();
            console.log(`PDF text extraction complete: ${pdf.numPages} pages, ${finalText.length} characters`);
            console.log('PDF text preview:', finalText.substring(0, 200) + '...');
            
            if (finalText.length === 0) {
                throw new Error('No text content found in PDF');
            }
            
            return finalText;
            
        } catch (error) {
            console.error('Error extracting text from PDF:', error);
            throw new Error(`Failed to extract text from PDF: ${error.message}`);
        }
    }

    async loadPDFJS() {
        return new Promise((resolve, reject) => {
            if (typeof pdfjsLib !== 'undefined') {
                console.log('PDF.js already loaded');
                resolve();
                return;
            }
            
            console.log('Loading PDF.js from CDN...');
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.async = true;
            
            script.onload = () => {
                try {
                    console.log('PDF.js script loaded, configuring worker...');
                    // Configure PDF.js worker
                    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                    console.log('PDF.js configured successfully');
                    resolve();
                } catch (error) {
                    console.error('Error configuring PDF.js:', error);
                    reject(new Error('Failed to configure PDF.js: ' + error.message));
                }
            };
            
            script.onerror = (error) => {
                console.error('Failed to load PDF.js script:', error);
                reject(new Error('Failed to load PDF.js library from CDN'));
            };
            
            document.head.appendChild(script);
        });
    }

    async createThread() {
        const response = await fetch('https://api.openai.com/v1/threads', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.azureConfig.apiKey}`,
                'OpenAI-Beta': 'assistants=v1'
            },
            body: JSON.stringify({})
        });

        if (!response.ok) {
            throw new Error(`Failed to create thread: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    async sendMessageWithFile(threadId, fileId, flashcardCount, isImage = false) {
        let content;
        let attachments;

        if (isImage) {
            // For images, use vision capabilities
            content = `Please analyze this image and create ${flashcardCount} educational flashcards based on the visual content. Look for text, diagrams, charts, graphs, or any educational information visible in the image. Cover the main concepts, definitions, and important information you can see. Return the flashcards as a JSON array with this exact format: [{"question": "Your question here", "answer": "Your answer here"}]`;
            
            attachments = [{
                file_id: fileId,
                tools: [{ type: 'file_search' }]
            }];
        } else {
            // For documents, use file search
            content = `Please analyze this document and create ${flashcardCount} educational flashcards. Cover the main concepts, definitions, and important information. Return the flashcards as a JSON array with this exact format: [{"question": "Your question here", "answer": "Your answer here"}]`;
            
            attachments = [{
                file_id: fileId,
                tools: [{ type: 'file_search' }]
            }];
        }

        const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.azureConfig.apiKey}`,
                'OpenAI-Beta': 'assistants=v1'
            },
            body: JSON.stringify({
                role: 'user',
                content: content,
                attachments: attachments
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Assistants API error:', response.status, errorText);
            throw new Error(`Failed to send message: ${response.status} ${response.statusText} - ${errorText}`);
        }

        return await response.json();
    }

    async runAssistant(threadId, assistantId) {
        const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.azureConfig.apiKey}`,
                'OpenAI-Beta': 'assistants=v1'
            },
            body: JSON.stringify({
                assistant_id: assistantId
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to run assistant: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    async waitForCompletion(threadId, runId) {
        let runStatus;
        let attempts = 0;
        const maxAttempts = 60; // 60 seconds timeout

        while (attempts < maxAttempts) {
            const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
                headers: {
                    'Authorization': `Bearer ${this.azureConfig.apiKey}`,
                    'OpenAI-Beta': 'assistants=v1'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to check run status: ${response.status} ${response.statusText}`);
            }

            runStatus = await response.json();

            if (runStatus.status === 'completed') {
                break;
            } else if (runStatus.status === 'failed' || runStatus.status === 'cancelled') {
                throw new Error(`Run failed with status: ${runStatus.status}`);
            }

            // Update thinking effect
            // Keep the original thinking message

            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
        }

        if (attempts >= maxAttempts) {
            throw new Error('Run timed out');
        }

        // Get the response messages
        const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
            headers: {
                'Authorization': `Bearer ${this.azureConfig.apiKey}`,
                'OpenAI-Beta': 'assistants=v1'
            }
        });

        if (!messagesResponse.ok) {
            throw new Error(`Failed to get messages: ${messagesResponse.status} ${messagesResponse.statusText}`);
        }

        const messages = await messagesResponse.json();
        const assistantMessage = messages.data.find(m => m.role === 'assistant');
        
        if (!assistantMessage || !assistantMessage.content[0]?.text?.value) {
            throw new Error('No response from assistant');
        }

        return assistantMessage.content[0].text.value;
    }

    async cleanup(assistantId, threadId, fileId) {
        try {
            // Delete assistant
            await fetch(`https://api.openai.com/v1/assistants/${assistantId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.azureConfig.apiKey}`,
                    'OpenAI-Beta': 'assistants=v1'
                }
            });

            // Delete thread
            await fetch(`https://api.openai.com/v1/threads/${threadId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.azureConfig.apiKey}`,
                    'OpenAI-Beta': 'assistants=v1'
                }
            });

            // Delete file
            await fetch(`https://api.openai.com/v1/files/${fileId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.azureConfig.apiKey}`
                }
            });
        } catch (error) {
            console.warn('Error during cleanup:', error);
        }
    }

    async generateFlashcardsFromImageVision(file, flashcardCount = 10) {
        try {
            console.log(`Using Vision API to generate ${flashcardCount} flashcards from image: ${file.name}`);
            
            // Convert image to base64
            const base64Image = await this.fileToBase64(file);
            
            const response = await fetch(`${this.azureConfig.endpoint}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.azureConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o', // Use GPT-4o for vision
                    messages: [
                        {
                            role: 'system',
                            content: `You are a helpful study assistant that creates educational flashcards from images. Analyze the visual content including text, diagrams, charts, graphs, and any educational information visible. Create ${flashcardCount} comprehensive flashcards covering key concepts, definitions, and important information. Return flashcards as JSON array with "question" and "answer" fields.`
                        },
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: `Please analyze this image and create ${flashcardCount} educational flashcards based on the visual content. Look for text, diagrams, charts, graphs, or any educational information visible in the image. Cover the main concepts, definitions, and important information you can see. Return the flashcards as a JSON array with this exact format: [{"question": "Your question here", "answer": "Your answer here"}]`
                                },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: `data:${file.type};base64,${base64Image}`
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens: 4000,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                throw new Error(`Vision API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;
            
            // Parse the flashcards from the response
            const flashcards = this.parseFlashcardsFromResponse(content);
            
            return flashcards;
            
        } catch (error) {
            console.error('Error generating flashcards from image with Vision API:', error);
            throw error;
        }
    }

    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target.result.split(',')[1]; // Remove data:image/...;base64, prefix
                resolve(base64);
            };
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    async readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    parseFlashcardsFromResponse(responseText) {
        try {
            // Clean the response - remove markdown code blocks if present
            let cleanResponse = responseText.trim();
            if (cleanResponse.startsWith('```json')) {
                cleanResponse = cleanResponse.replace('```json', '').replace('```', '').trim();
            } else if (cleanResponse.startsWith('```')) {
                cleanResponse = cleanResponse.replace('```', '').trim();
            }

            // Try to find JSON array in the response
            const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                cleanResponse = jsonMatch[0];
            }

            const flashcardsData = JSON.parse(cleanResponse);
            
            // Convert to our flashcard format
            return flashcardsData.map((card, index) => ({
                id: `card_ai_${index}`,
                question: card.question || "Question not available",
                answer: card.answer || "Answer not available",
                source: "AI Generated"
            }));
        } catch (error) {
            console.error('Error parsing flashcards:', error);
            console.log('Response text:', responseText);
            
            // Return a fallback flashcard
            return [{
                id: "card_fallback_0",
                question: "What did you learn from your documents?",
                answer: "The AI had trouble processing your documents. Please try uploading different files or check your internet connection.",
                source: "Error Recovery"
            }];
        }
    }

    chunkText(text, maxChunkSize) {
        if (text.length <= maxChunkSize) {
            return [text];
        }
        
        const chunks = [];
        let start = 0;
        
        while (start < text.length) {
            let end = start + maxChunkSize;
            
            // If we're not at the end of the text, try to break at a sentence or paragraph
            if (end < text.length) {
                // Look for sentence endings
                const sentenceEnd = text.lastIndexOf('.', end);
                const paragraphEnd = text.lastIndexOf('\n\n', end);
                const lineEnd = text.lastIndexOf('\n', end);
                
                if (sentenceEnd > start + maxChunkSize * 0.5) {
                    end = sentenceEnd + 1;
                } else if (paragraphEnd > start + maxChunkSize * 0.5) {
                    end = paragraphEnd + 2;
                } else if (lineEnd > start + maxChunkSize * 0.5) {
                    end = lineEnd + 1;
                }
            }
            
            chunks.push(text.slice(start, end).trim());
            start = end;
        }
        
        return chunks.filter(chunk => chunk.length > 0);
    }

    showThinkingEffect(action = 'creating flashcards') {
        // Find the existing Genius floating component or create one
        let geniusFloating = document.querySelector('.genius-floating');
        let createdByService = false;
        
        if (!geniusFloating) {
            // Create the floating component if it doesn't exist
            geniusFloating = document.createElement('div');
            geniusFloating.className = 'genius-floating';
            geniusFloating.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: transparent;
                z-index: 10000;
            `;
            document.body.appendChild(geniusFloating);
            createdByService = true;
        }
        
        // Store the original content
        const originalContent = geniusFloating.innerHTML;
        
        // Replace with thinking animation (brain icon with dots)
        geniusFloating.innerHTML = `
            <div class="genius-thinking-container" style="
                display: flex;
                align-items: center;
                gap: 12px;
                color: #333333;
            ">
                <img src="assets/darkgenius.png" alt="Genius" class="genius-thinking-icon genius-pulse-icon" style="
                    width: 24px;
                    height: 24px;
                    border-radius: 8px;
                ">
                <div class="genius-thinking-text" style="font-size: 16px; font-weight: 500;">Genius is ${action}...</div>
                <div class="genius-thinking-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        // Add animations if not already added
        if (!document.querySelector('#genius-flashcard-animations')) {
            const style = document.createElement('style');
            style.id = 'genius-flashcard-animations';
            style.textContent = `
                @keyframes geniusPulse {
                    0%, 20% { transform: scale(1); opacity: 0.4; }
                    50% { transform: scale(1.2); opacity: 1; }
                    80%, 100% { transform: scale(1); opacity: 0.4; }
                }
                @keyframes geniusDots {
                    0%, 20% { transform: scale(1); opacity: 0.4; }
                    50% { transform: scale(1.2); opacity: 1; }
                    80%, 100% { transform: scale(1); opacity: 0.4; }
                }
                .genius-pulse-icon {
                    animation: geniusPulse 1.5s ease-in-out infinite;
                }
                .genius-thinking-dots span {
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #333333;
                    margin: 0 3px;
                    animation: geniusDots 1.4s ease-in-out infinite;
                }
                .genius-thinking-dots span:nth-child(2) {
                    animation-delay: 0.2s;
                }
                .genius-thinking-dots span:nth-child(3) {
                    animation-delay: 0.4s;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Store the thinking effect state
        this.thinkingEffect = {
            element: geniusFloating,
            originalContent: originalContent,
            isImage: action.includes('image'),
            createdByService: createdByService
        };
    }

    updateThinkingEffect(message) {
        if (!this.thinkingEffect) return;
        
        const thinkingText = this.thinkingEffect.element.querySelector('.genius-thinking-text');
        if (thinkingText) {
            thinkingText.textContent = message;
        }
    }

    hideThinkingEffect() {
        if (!this.thinkingEffect) return;
        
        // If we created the floating component, remove it entirely
        if (this.thinkingEffect.createdByService) {
            this.thinkingEffect.element.remove();
        } else {
            // Restore original content if it existed before
            this.thinkingEffect.element.innerHTML = this.thinkingEffect.originalContent;
            
            // Re-setup input listeners if needed
            const input = this.thinkingEffect.element.querySelector('.genius-input');
            if (input && window.setupGeniusInputListeners) {
                window.setupGeniusInputListeners(input, window.currentClassData, window.currentExistingDoc);
            }
        }
        
        this.thinkingEffect = null;
    }

    async extractTextFromFile(file) {
        try {
            // Use the proper text extraction method that handles PDFs correctly
            return await this.extractTextFromFileProper(file);
        } catch (error) {
            console.error('Error extracting text from file:', error);
            return `[Error extracting text from ${file.name}: ${error.message}]`;
        }
    }

    async extractTextFromFileProper(file) {
        return new Promise((resolve, reject) => {
            // For PDF files, use a different approach
            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                this.extractTextFromPDF(file).then(resolve).catch(reject);
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const content = e.target.result;
                
                // For text files, return the content directly
                if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
                    resolve(content);
                    return;
                }
                
                // For HTML files, extract text content
                if (file.type === 'text/html' || file.name.endsWith('.html') || content.includes('<') && content.includes('>')) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(content, 'text/html');
                    let textContent = doc.body.textContent || doc.body.innerText || '';
                    
                    // Clean up extra whitespace and normalize
                    textContent = textContent.replace(/\s+/g, ' ').trim();
                    
                    console.log(`Extracted text from HTML: ${textContent.length} characters`);
                    resolve(textContent);
                    return;
                }
                
                // For JSON files, extract text content
                if (file.type === 'application/json' || file.name.endsWith('.json')) {
                    try {
                        const jsonData = JSON.parse(content);
                        const textContent = JSON.stringify(jsonData, null, 2);
                        resolve(textContent);
                        return;
                    } catch (e) {
                        resolve(content);
                        return;
                    }
                }
                
                // For CSV files, extract text content
                if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                    resolve(content);
                    return;
                }
                
                // For markdown files, extract text content
                if (file.type === 'text/markdown' || file.name.endsWith('.md')) {
                    resolve(content);
                    return;
                }
                
                // Check if this might be HTML content from document editor
                if (content.includes('<div') || content.includes('<p>') || content.includes('<span')) {
                    console.log('Detected HTML content, extracting text...');
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(content, 'text/html');
                    let textContent = doc.body.textContent || doc.body.innerText || '';
                    textContent = textContent.replace(/\s+/g, ' ').trim();
                    console.log(`Extracted text from HTML-like content: ${textContent.length} characters`);
                    resolve(textContent);
                    return;
                }
                
                // For other text-based file types, try to extract text
                if (typeof content === 'string' && content.length > 0) {
                    resolve(content);
                } else {
                    reject(new Error(`Unsupported file type for text extraction: ${file.type}. Please try uploading a text-based file (txt, html, json, csv, md, pdf, etc.)`));
                }
            };
            
            reader.onerror = function() {
                reject(new Error('Failed to read file'));
            };
            
            // Read as text for most file types
            reader.readAsText(file);
        });
    }

    async showStudyScalePrompt(fileName) {
        return new Promise((resolve) => {
            // Create modal overlay
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            `;

            // Create modal content
            const modalContent = document.createElement('div');
            modalContent.style.cssText = `
                background: linear-gradient(145deg, #1a1a1a, #2d2d2d);
                padding: 30px;
                border-radius: 16px;
                border: 1px solid #333;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 
                            inset 0 1px 0 rgba(255, 255, 255, 0.1);
                max-width: 600px;
                width: 90%;
                text-align: center;
                transform: perspective(1000px) rotateX(5deg);
            `;

            modalContent.innerHTML = `
                <h2 style="color: #fff; margin-bottom: 20px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">Generate Flashcards</h2>
                <p style="color: #ccc; margin-bottom: 20px;">File: <strong style="color: #fff;">${fileName}</strong></p>
                <p style="color: #999; margin-bottom: 25px;">Choose study intensity:</p>
                
                <div style="display: grid; grid-template-columns: 1fr; gap: 15px; margin-bottom: 20px;">
                    <div class="study-option" data-count="25" style="padding: 20px; background: linear-gradient(145deg, #2a2a2a, #1a1a1a); border: 1px solid #444; border-radius: 12px; cursor: pointer; transition: all 0.3s; box-shadow: 0 8px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);">
                        <h3 style="color: #fff; margin: 0 0 8px 0; font-size: 16px; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">Light Study</h3>
                        <p style="color: #bbb; margin: 0; font-size: 14px;">25 flashcards</p>
                    </div>
                    
                    <div class="study-option" data-count="35" style="padding: 20px; background: linear-gradient(145deg, #2a2a2a, #1a1a1a); border: 1px solid #444; border-radius: 12px; cursor: pointer; transition: all 0.3s; box-shadow: 0 8px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);">
                        <h3 style="color: #fff; margin: 0 0 8px 0; font-size: 16px; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">Medium Study</h3>
                        <p style="color: #bbb; margin: 0; font-size: 14px;">35 flashcards</p>
                    </div>
                    
                    <div class="study-option" data-count="50" style="padding: 20px; background: linear-gradient(145deg, #2a2a2a, #1a1a1a); border: 1px solid #444; border-radius: 12px; cursor: pointer; transition: all 0.3s; box-shadow: 0 8px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);">
                        <h3 style="color: #fff; margin: 0 0 8px 0; font-size: 16px; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">Intensive Study</h3>
                        <p style="color: #bbb; margin: 0; font-size: 14px;">50 flashcards</p>
                    </div>
                </div>
                
                <div style="border-top: 1px solid #444; padding-top: 20px; margin-bottom: 25px;">
                    <div class="study-option custom-option" data-count="custom" style="padding: 20px; background: linear-gradient(145deg, #2a2a2a, #1a1a1a); border: 1px solid #444; border-radius: 12px; cursor: pointer; transition: all 0.3s; box-shadow: 0 8px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);">
                        <h3 style="color: #fff; margin: 0 0 8px 0; font-size: 16px; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">Custom Amount</h3>
                        <div style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
                            <input type="number" id="customCount" placeholder="Enter number" min="1" max="50" 
                                   style="flex: 1; padding: 10px; background: #1a1a1a; color: white; border: 1px solid #555; border-radius: 6px; font-size: 14px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);">
                            <span style="color: #bbb; font-size: 14px;">flashcards</span>
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button id="cancelBtn" style="padding: 12px 24px; background: linear-gradient(145deg, #444, #333); color: white; 
                            border: 1px solid #555; border-radius: 8px; cursor: pointer; font-size: 16px; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">Cancel</button>
                </div>
            `;

            modal.appendChild(modalContent);
            document.body.appendChild(modal);

            // Add hover effects and selection logic
            const studyOptions = modalContent.querySelectorAll('.study-option');
            const customInput = modalContent.querySelector('#customCount');
            let selectedCount = 25; // Default to light study
            let isCustomSelected = false;

            studyOptions.forEach(option => {
                option.addEventListener('mouseenter', () => {
                    if (!isCustomSelected) {
                        option.style.borderColor = '#666';
                        option.style.background = 'linear-gradient(145deg, #333, #2a2a2a)';
                        option.style.transform = 'translateY(-2px)';
                        option.style.boxShadow = '0 12px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)';
                    }
                });

                option.addEventListener('mouseleave', () => {
                    if (!isCustomSelected && option.dataset.count !== selectedCount.toString()) {
                        option.style.borderColor = '#444';
                        option.style.background = 'linear-gradient(145deg, #2a2a2a, #1a1a1a)';
                        option.style.transform = 'translateY(0)';
                        option.style.boxShadow = '0 8px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)';
                    }
                });

                option.addEventListener('click', () => {
                    if (option.dataset.count === 'custom') {
                        // Handle custom option
                        isCustomSelected = true;
                        customInput.focus();
                        
                        // Reset all other options
                        studyOptions.forEach(opt => {
                            if (opt.dataset.count !== 'custom') {
                                opt.style.borderColor = '#444';
                                opt.style.background = 'linear-gradient(145deg, #2a2a2a, #1a1a1a)';
                                opt.style.transform = 'translateY(0)';
                                opt.style.boxShadow = '0 8px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)';
                            }
                        });
                        
                        // Highlight custom option
                        option.style.borderColor = '#777';
                        option.style.background = 'linear-gradient(145deg, #333, #2a2a2a)';
                        option.style.transform = 'translateY(-1px)';
                        option.style.boxShadow = '0 10px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)';
                    } else {
                        // Handle preset options
                        isCustomSelected = false;
                        selectedCount = parseInt(option.dataset.count);
                        
                        // Reset all options
                        studyOptions.forEach(opt => {
                            opt.style.borderColor = '#444';
                            opt.style.background = 'linear-gradient(145deg, #2a2a2a, #1a1a1a)';
                            opt.style.transform = 'translateY(0)';
                            opt.style.boxShadow = '0 8px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)';
                        });
                        
                        // Select current option
                        option.style.borderColor = '#777';
                        option.style.background = 'linear-gradient(145deg, #333, #2a2a2a)';
                        option.style.transform = 'translateY(-1px)';
                        option.style.boxShadow = '0 10px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)';
                    }
                });
            });

            // Handle custom input
            customInput.addEventListener('input', () => {
                const value = parseInt(customInput.value);
                if (value >= 1 && value <= 50) {
                    selectedCount = value;
                }
            });

            customInput.addEventListener('focus', () => {
                isCustomSelected = true;
                const customOption = modalContent.querySelector('.custom-option');
                customOption.style.borderColor = '#777';
                customOption.style.background = 'linear-gradient(145deg, #333, #2a2a2a)';
                customOption.style.transform = 'translateY(-1px)';
                customOption.style.boxShadow = '0 10px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)';
                
                // Reset other options
                studyOptions.forEach(opt => {
                    if (opt.dataset.count !== 'custom') {
                        opt.style.borderColor = '#444';
                        opt.style.background = 'linear-gradient(145deg, #2a2a2a, #1a1a1a)';
                        opt.style.transform = 'translateY(0)';
                        opt.style.boxShadow = '0 8px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)';
                    }
                });
            });

            // Event handlers
            const cancelBtn = modalContent.querySelector('#cancelBtn');

            // Add hover effects for cancel button
            cancelBtn.addEventListener('mouseenter', () => {
                cancelBtn.style.background = 'linear-gradient(145deg, #555, #444)';
                cancelBtn.style.transform = 'translateY(-1px)';
                cancelBtn.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4)';
            });

            cancelBtn.addEventListener('mouseleave', () => {
                cancelBtn.style.background = 'linear-gradient(145deg, #444, #333)';
                cancelBtn.style.transform = 'translateY(0)';
                cancelBtn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
            });

            const cleanup = () => {
                document.body.removeChild(modal);
            };

            cancelBtn.onclick = () => {
                cleanup();
                resolve(null);
            };

            // Auto-generate when preset option is clicked
            studyOptions.forEach(option => {
                if (option.dataset.count !== 'custom') {
                    option.addEventListener('click', () => {
                        setTimeout(() => {
                            cleanup();
                            resolve(selectedCount);
                        }, 200);
                    });
                }
            });

            // Handle custom input submission
            customInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const value = parseInt(customInput.value);
                    if (value >= 1 && value <= 50) {
                        cleanup();
                        resolve(value);
                    } else {
                        alert('Please enter a number between 1 and 50');
                    }
                }
            });

            // Auto-generate when custom input loses focus (if valid)
            customInput.addEventListener('blur', () => {
                const value = parseInt(customInput.value);
                if (value >= 1 && value <= 50) {
                    setTimeout(() => {
                        cleanup();
                        resolve(value);
                    }, 100);
                }
            });

            // Close on escape key
            const handleKeydown = (e) => {
                if (e.key === 'Escape') {
                    cleanup();
                    resolve(null);
                    document.removeEventListener('keydown', handleKeydown);
                }
            };
            document.addEventListener('keydown', handleKeydown);
        });
    }
}

// Export the class for use in other modules
export { CSharpFlashcardService };

// Also make it available globally for compatibility
if (typeof window !== 'undefined') {
    window.CSharpFlashcardService = CSharpFlashcardService;
}

