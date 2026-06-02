import http from 'node:http';
export class LocalInferenceClient {
    ollamaUrl;
    modelName;
    constructor(ollamaUrl = 'http://localhost:11434', modelName = 'gemma2:2b') {
        this.ollamaUrl = ollamaUrl;
        this.modelName = modelName;
    }
    /**
     * Pings the local Ollama service to verify if it is running.
     */
    async isAvailable() {
        return new Promise((resolve) => {
            const url = new URL('/api/tags', this.ollamaUrl);
            const req = http.get(url.href, { timeout: 1500 }, (res) => {
                if (res.statusCode === 200) {
                    resolve(true);
                }
                else {
                    resolve(false);
                }
            });
            req.on('error', () => resolve(false));
            req.on('timeout', () => {
                req.destroy();
                resolve(false);
            });
        });
    }
    /**
     * Executes offline inference using the local quantized model.
     */
    async generate(prompt) {
        const isReady = await this.isAvailable();
        if (!isReady) {
            throw new Error('Local Ollama engine is offline or unreachable.');
        }
        return new Promise((resolve, reject) => {
            const url = new URL('/api/generate', this.ollamaUrl);
            const payload = JSON.stringify({
                model: this.modelName,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.2
                }
            });
            const req = http.request(url.href, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload)
                },
                timeout: 15000 // 15s timeout for local generation
            }, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        const data = JSON.parse(body);
                        resolve(data.response || '');
                    }
                    catch (err) {
                        reject(new Error(`Failed to parse local response: ${err.message}`));
                    }
                });
            });
            req.on('error', (err) => reject(err));
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Local inference request timed out.'));
            });
            req.write(payload);
            req.end();
        });
    }
}
export class LocalRouter {
    /**
     * Categorizes whether a developer query is simple enough to run locally
     * or requires cloud frontier LLM escalation.
     */
    static shouldRouteLocally(query) {
        const lowercase = query.toLowerCase();
        // Routine lightweight keywords for local routing
        const routineKeywords = [
            'parse syntax',
            'list imports',
            'find functions',
            'regex pattern',
            'format comment',
            'check eslint',
            'simple refactor',
            'read directory'
        ];
        const hasRoutineMatch = routineKeywords.some(keyword => lowercase.includes(keyword));
        const isShortQuery = query.length < 150;
        // Escalate complex architectural words to cloud
        const complexKeywords = [
            'architect',
            'infrastructure',
            'failover',
            'security review',
            'apparmor',
            'restore checkpoint',
            'oauth integration'
        ];
        const hasComplexEscalation = complexKeywords.some(keyword => lowercase.includes(keyword));
        return (hasRoutineMatch || isShortQuery) && !hasComplexEscalation;
    }
}
