export class ContextCompactor {
    tokenBudget;
    constructor(tokenBudget = 100000) {
        this.tokenBudget = tokenBudget;
    }
    /**
     * Estimates token usage using character count.
     */
    estimateTokens(history) {
        let totalLength = 0;
        for (const msg of history) {
            totalLength += msg.content ? msg.content.length : 0;
        }
        return Math.ceil(totalLength / 4);
    }
    /**
     * Hooks into post-turn execution cycles to monitor and compact history.
     */
    async processLifecycleHook(history) {
        const currentTokens = this.estimateTokens(history);
        if (currentTokens <= this.tokenBudget) {
            // Within budget, no compaction needed
            return history;
        }
        console.error(`[Compactor Hook] Context size ${currentTokens} exceeds budget ${this.tokenBudget}. Triggering compaction...`);
        return this.compact(history);
    }
    /**
     * Compacts early history by summarizing turns using a sub-agent strategy.
     */
    compact(history) {
        if (history.length <= 4) {
            // Too short to compact logically, return as is
            return history;
        }
        // Retain system instructions (index 0) and the last 3 active turns in full detail
        const systemInstruction = history[0];
        const recentTurns = history.slice(history.length - 3);
        const middleHistory = history.slice(1, history.length - 3);
        // Simulate background sub-agent context summarizer
        let summarizedTimeline = '';
        let summarizedDecisions = [];
        // Extract critical milestones from middle turns
        for (let i = 0; i < middleHistory.length; i++) {
            const turn = middleHistory[i];
            if (turn.role === 'user' && turn.content.includes('Current User Query')) {
                const queryLines = turn.content.split('\n');
                const query = queryLines.find(l => l.includes('Engineering Request:') || l.includes('Query:')) || '';
                summarizedDecisions.push(`- User query: "${query.substring(0, 50).trim()}..."`);
            }
        }
        summarizedTimeline = `=== COMPACTED CONTEXT TIMELINE ===\n` +
            `Below is a chronological summary of preceding conversation turns compiled by the Talos background sub-agent:\n` +
            summarizedDecisions.join('\n') + `\n` +
            `- Cleaned and pruned intermediate execution logs, shell dumps, and raw tool trace responses.\n` +
            `=== END OF TIMELINE ===\n`;
        // Construct the compacted history array
        const compactedHistory = [];
        // 1. Keep system instruction
        compactedHistory.push(systemInstruction);
        // 2. Inject compacted timeline
        compactedHistory.push({
            role: 'system',
            content: summarizedTimeline
        });
        // 3. Append detailed recent turns
        for (const turn of recentTurns) {
            compactedHistory.push(turn);
        }
        const prunedTokens = this.estimateTokens(compactedHistory);
        console.error(`[Compactor Hook] Compaction complete. Footprint reduced from ${this.estimateTokens(history)} to ${prunedTokens} tokens.`);
        return compactedHistory;
    }
}
