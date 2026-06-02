import { WorkspaceSerializer } from './serializer.js';
import { ContextCompactor } from '../sdk/compaction.js';
export class FailoverCoordinator {
    serializer;
    compactor;
    constructor(tokenBudget = 100000) {
        this.serializer = new WorkspaceSerializer();
        this.compactor = new ContextCompactor(tokenBudget);
    }
    /**
     * Wrapper function executing primary Gemini turns with automated multi-model
     * fallback, context compaction, and file state restoration.
     */
    async executeTurn(activeFilePaths, history, primaryModelCall, secondaryModelCall) {
        // 1. Snapshot the workspace prior to invoking LLM turn
        console.error('[Failover] Capturing pre-turn file states...');
        this.serializer.serialize(activeFilePaths);
        try {
            // 2. Attempt primary turn execution
            console.error('[Failover] Initiating turn with primary model (Gemini 3.5 Flash)...');
            return await primaryModelCall();
        }
        catch (err) {
            const errorMsg = err.message || '';
            // Check if this matches a known model abort / agent termination issue on Linux
            if (errorMsg.includes('Agent terminated due to error') ||
                errorMsg.includes('terminated due to error') ||
                errorMsg.includes('socket hang up') ||
                errorMsg.includes('ECONNRESET') ||
                errorMsg.includes('API failure')) {
                console.error(`[Failover] Captured primary model crash: ${errorMsg}`);
                console.error('[Failover] Restoring pre-turn workspace checkpoints to avoid work loss...');
                // Restore active files
                this.serializer.deserialize();
                // 3. Compact conversation history payload to optimize token cost on failover retry
                console.error('[Failover] Shrinking history payload via dynamic compaction...');
                const compactedHistory = this.compactor.compact(history);
                // 4. Retry turn execution utilizing backup model
                console.error('[Failover] Re-routing turn execution to backup model (Claude 3.5 Sonnet / Local Gemma)...');
                try {
                    return await secondaryModelCall(compactedHistory);
                }
                catch (failoverErr) {
                    console.error(`[Failover] Critical: Secondary model failover failed: ${failoverErr.message}`);
                    throw new Error(`Talos Recovery Error: Both primary and secondary failover engines failed: ${failoverErr.message}`);
                }
            }
            // Re-throw standard non-failover errors (e.g., compile errors in tool usage)
            throw err;
        }
    }
}
