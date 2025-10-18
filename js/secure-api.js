// Secure API service for client-side
// This handles all API calls through our secure server endpoints

class SecureAPI {
    constructor() {
        this.baseURL = '/api';
    }

    // OpenAI Chat Completions
    async chatCompletion(messages, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}/openai`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages,
                    model: options.model || 'gpt-4o',
                    max_tokens: options.max_tokens || 1000,
                    temperature: options.temperature || 0.7,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'API request failed');
            }

            return await response.json();
        } catch (error) {
            console.error('OpenAI API error:', error);
            throw error;
        }
    }

    // ZeroGPT Detection
    async detectAI(text) {
        try {
            const response = await fetch(`${this.baseURL}/zerogpt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'ZeroGPT API request failed');
            }

            return await response.json();
        } catch (error) {
            console.error('ZeroGPT API error:', error);
            throw error;
        }
    }

    // Generate flashcards
    async generateFlashcards(content, options = {}) {
        const messages = [
            {
                role: 'system',
                content: `You are a helpful assistant that creates educational flashcards. Create flashcards based on the provided content. Return the response as a JSON array of objects with "front" and "back" properties.`
            },
            {
                role: 'user',
                content: `Create flashcards for this content: ${content}`
            }
        ];

        return await this.chatCompletion(messages, {
            model: options.model || 'gpt-4o',
            max_tokens: options.max_tokens || 2000,
            temperature: options.temperature || 0.7,
        });
    }

    // Humanize text
    async humanizeText(text, options = {}) {
        const messages = [
            {
                role: 'system',
                content: `You are a professional text humanizer. Rewrite the given text to make it sound more natural, human-like, and engaging while maintaining the original meaning and key information.`
            },
            {
                role: 'user',
                content: `Please humanize this text: ${text}`
            }
        ];

        return await this.chatCompletion(messages, {
            model: options.model || 'gpt-4o',
            max_tokens: options.max_tokens || 1000,
            temperature: options.temperature || 0.8,
        });
    }

    // Generate study guide
    async generateStudyGuide(content, options = {}) {
        const messages = [
            {
                role: 'system',
                content: `You are an expert study guide creator. Create a comprehensive study guide based on the provided content. Structure it with clear headings, key points, examples, and practice questions.`
            },
            {
                role: 'user',
                content: `Create a study guide for this content: ${content}`
            }
        ];

        return await this.chatCompletion(messages, {
            model: options.model || 'gpt-4o',
            max_tokens: options.max_tokens || 3000,
            temperature: options.temperature || 0.7,
        });
    }
}

// Create global instance
window.secureAPI = new SecureAPI();

// Export for module usage
export default SecureAPI;
