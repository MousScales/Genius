// Secure OpenAI Service
// This service makes requests to our secure API endpoints instead of directly to OpenAI

class OpenAIService {
    constructor() {
        this.baseUrl = '/api';
    }

    async chat(messages, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}/openai`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages,
                    model: options.model || 'gpt-4o-mini',
                    max_tokens: options.max_tokens || 1000
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to get response from OpenAI');
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('OpenAI Service Error:', error);
            throw error;
        }
    }

    async generateText(prompt, options = {}) {
        const messages = [
            { role: 'user', content: prompt }
        ];
        
        const response = await this.chat(messages, options);
        return response.content;
    }

    async processHomework(fileContent, options = {}) {
        const prompt = `Please analyze this homework file and provide helpful feedback, suggestions, or answers. Here's the content:\n\n${fileContent}`;
        
        const messages = [
            { role: 'system', content: 'You are a helpful AI tutor. Analyze the homework content and provide constructive feedback, suggestions, and guidance.' },
            { role: 'user', content: prompt }
        ];
        
        const response = await this.chat(messages, {
            max_tokens: 2000,
            ...options
        });
        
        return response.content;
    }

    async generateStudyGuide(topic, options = {}) {
        const prompt = `Create a comprehensive study guide for: ${topic}`;
        
        const messages = [
            { role: 'system', content: 'You are an expert educational assistant. Create detailed, well-structured study guides that help students learn effectively.' },
            { role: 'user', content: prompt }
        ];
        
        const response = await this.chat(messages, {
            max_tokens: 3000,
            ...options
        });
        
        return response.content;
    }

    async checkConfiguration() {
        try {
            const response = await fetch(`${this.baseUrl}/env`);
            if (response.ok) {
                const config = await response.json();
                return config;
            }
            return { hasOpenAI: false, hasFirebase: false, hasAzure: false };
        } catch (error) {
            console.error('Configuration check failed:', error);
            return { hasOpenAI: false, hasFirebase: false, hasAzure: false };
        }
    }
}

// Make available globally (no export needed for script tag)
window.OpenAIService = OpenAIService;
