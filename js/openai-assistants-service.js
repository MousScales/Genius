class OpenAIAssistantsService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.assistantId = null;
        this.threadId = null;
        this.uploadedFiles = [];
    }

    async createAssistant(name, instructions) {
        try {
            const response = await fetch('https://api.openai.com/v1/assistants', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'OpenAI-Beta': 'assistants=v2'
                },
                body: JSON.stringify({
                    name: name,
                    instructions: instructions,
                    model: 'gpt-4o-mini',
                    tools: [{ type: 'file_search' }]
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to create assistant: ${response.statusText}`);
            }

            const assistant = await response.json();
            this.assistantId = assistant.id;
            console.log('✅ Assistant created:', assistant.id);
            return assistant;
        } catch (error) {
            console.error('❌ Error creating assistant:', error);
            throw error;
        }
    }

    async uploadFile(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('purpose', 'assistants');

            const response = await fetch('https://api.openai.com/v1/files', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Failed to upload file: ${response.statusText}`);
            }

            const uploadedFile = await response.json();
            this.uploadedFiles.push(uploadedFile);
            console.log('✅ File uploaded:', uploadedFile.id);
            return uploadedFile;
        } catch (error) {
            console.error('❌ Error uploading file:', error);
            throw error;
        }
    }

    async createThread() {
        try {
            const response = await fetch('https://api.openai.com/v1/threads', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'OpenAI-Beta': 'assistants=v2'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to create thread: ${response.statusText}`);
            }

            const thread = await response.json();
            this.threadId = thread.id;
            console.log('✅ Thread created:', thread.id);
            return thread;
        } catch (error) {
            console.error('❌ Error creating thread:', error);
            throw error;
        }
    }

    async sendMessage(message, fileIds = []) {
        try {
            if (!this.threadId) {
                await this.createThread();
            }

            const messageData = {
                role: 'user',
                content: message
            };

            // Add file attachments if any
            if (fileIds.length > 0) {
                messageData.attachments = fileIds.map(fileId => ({
                    file_id: fileId,
                    tools: [{ type: 'file_search' }]
                }));
            }

            const response = await fetch(`https://api.openai.com/v1/threads/${this.threadId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'OpenAI-Beta': 'assistants=v2'
                },
                body: JSON.stringify(messageData)
            });

            if (!response.ok) {
                throw new Error(`Failed to send message: ${response.statusText}`);
            }

            const messageResponse = await response.json();
            console.log('✅ Message sent:', messageResponse.id);
            return messageResponse;
        } catch (error) {
            console.error('❌ Error sending message:', error);
            throw error;
        }
    }

    // Alias for sendMessage to match expected interface
    async addMessage(message, fileIds = []) {
        return this.sendMessage(message, fileIds);
    }

    async runAssistant(onUpdate = null, onComplete = null) {
        try {
            if (!this.assistantId || !this.threadId) {
                throw new Error('Assistant and thread must be created first');
            }

            const response = await fetch(`https://api.openai.com/v1/threads/${this.threadId}/runs`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'OpenAI-Beta': 'assistants=v2'
                },
                body: JSON.stringify({
                    assistant_id: this.assistantId,
                    instructions: 'Please generate flashcards based on the uploaded document content. Create comprehensive flashcards that cover the key concepts, definitions, and important information from the document.'
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to run assistant: ${response.statusText}`);
            }

            const run = await response.json();
            console.log('✅ Run started:', run.id);

            // If callbacks are provided, wait for completion and call them
            if (onUpdate || onComplete) {
                await this.waitForCompletionWithCallbacks(run.id, onUpdate, onComplete);
            }

            return run;
        } catch (error) {
            console.error('❌ Error running assistant:', error);
            throw error;
        }
    }

    async waitForCompletionWithCallbacks(runId, onUpdate, onComplete) {
        try {
            let run;
            let fullResponse = '';
            
            do {
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                
                const response = await fetch(`https://api.openai.com/v1/threads/${this.threadId}/runs/${runId}`, {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'OpenAI-Beta': 'assistants=v2'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to check run status: ${response.statusText}`);
                }

                run = await response.json();
                console.log('Run status:', run.status);

                // Simulate streaming updates for now
                if (onUpdate && run.status === 'in_progress') {
                    onUpdate({
                        event: 'thread.message.delta',
                        data: {
                            delta: {
                                content: [{
                                    text: {
                                        value: 'Processing...'
                                    }
                                }]
                            }
                        }
                    });
                }
            } while (run.status === 'in_progress' || run.status === 'queued');

            if (run.status === 'completed') {
                const messages = await this.getMessages();
                const assistantMessage = messages.find(msg => msg.role === 'assistant');
                if (assistantMessage && assistantMessage.content[0]?.text?.value) {
                    fullResponse = assistantMessage.content[0].text.value;
                }
                
                if (onComplete) {
                    onComplete(fullResponse);
                }
            } else {
                throw new Error(`Run failed with status: ${run.status}`);
            }
        } catch (error) {
            console.error('❌ Error waiting for completion:', error);
            throw error;
        }
    }

    async waitForCompletion(runId) {
        try {
            let run;
            do {
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                
                const response = await fetch(`https://api.openai.com/v1/threads/${this.threadId}/runs/${runId}`, {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'OpenAI-Beta': 'assistants=v2'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to check run status: ${response.statusText}`);
                }

                run = await response.json();
                console.log('Run status:', run.status);
            } while (run.status === 'in_progress' || run.status === 'queued');

            if (run.status === 'completed') {
                return await this.getMessages();
            } else {
                throw new Error(`Run failed with status: ${run.status}`);
            }
        } catch (error) {
            console.error('❌ Error waiting for completion:', error);
            throw error;
        }
    }

    async getMessages() {
        try {
            const response = await fetch(`https://api.openai.com/v1/threads/${this.threadId}/messages`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'OpenAI-Beta': 'assistants=v2'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to get messages: ${response.statusText}`);
            }

            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('❌ Error getting messages:', error);
            throw error;
        }
    }

    async generateFlashcardsFromFile(file) {
        try {
            console.log('🔄 Starting flashcard generation process...');
            
            // Upload the file
            const uploadedFile = await this.uploadFile(file);
            
            // Send message with file attachment
            const message = `Please analyze this document and create comprehensive flashcards. Generate flashcards that cover:
            1. Key concepts and definitions
            2. Important facts and details
            3. Processes and procedures
            4. Examples and applications
            
            Format the flashcards as JSON array with this structure:
            [
                {
                    "question": "Question or term",
                    "answer": "Answer or definition"
                }
            ]`;

            await this.sendMessage(message, [uploadedFile.id]);
            
            // Run the assistant
            const run = await this.runAssistant();
            
            // Wait for completion and get results
            const messages = await this.waitForCompletion(run.id);
            
            // Find the assistant's response
            const assistantMessage = messages.find(msg => msg.role === 'assistant');
            if (assistantMessage && assistantMessage.content[0]?.text?.value) {
                const responseText = assistantMessage.content[0].text.value;
                console.log('✅ Flashcard generation completed');
                return responseText;
            } else {
                throw new Error('No response from assistant');
            }
        } catch (error) {
            console.error('❌ Error generating flashcards:', error);
            throw error;
        }
    }

    async cleanup() {
        try {
            // Clean up uploaded files
            for (const file of this.uploadedFiles) {
                await fetch(`https://api.openai.com/v1/files/${file.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`
                    }
                });
            }
            
            // Clean up assistant
            if (this.assistantId) {
                await fetch(`https://api.openai.com/v1/assistants/${this.assistantId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'OpenAI-Beta': 'assistants=v2'
                    }
                });
            }
            
            console.log('✅ Cleanup completed');
        } catch (error) {
            console.error('❌ Error during cleanup:', error);
        }
    }
}

// Export the class for use in other modules
export { OpenAIAssistantsService };
