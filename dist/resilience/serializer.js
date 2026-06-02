import fs from 'node:fs';
import path from 'node:path';
export class WorkspaceSerializer {
    checkpointDir;
    checkpointFile;
    constructor() {
        const projectRoot = process.cwd();
        this.checkpointDir = path.join(projectRoot, '.talos', 'checkpoints');
        this.checkpointFile = path.join(this.checkpointDir, 'active_turn_checkpoint.json');
    }
    /**
     * Captures and serializes the state of uncommitted/active workspace files.
     */
    serialize(filePaths) {
        try {
            if (!fs.existsSync(this.checkpointDir)) {
                fs.mkdirSync(this.checkpointDir, { recursive: true });
            }
            const filesState = [];
            for (const filePath of filePaths) {
                const absolutePath = path.isAbsolute(filePath)
                    ? filePath
                    : path.resolve(process.cwd(), filePath);
                if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
                    const content = fs.readFileSync(absolutePath, 'utf8');
                    filesState.push({
                        filePath: absolutePath,
                        content
                    });
                }
            }
            const state = {
                timestamp: new Date().toISOString(),
                files: filesState
            };
            fs.writeFileSync(this.checkpointFile, JSON.stringify(state, null, 2), 'utf8');
            console.error(`[Serializer] Serialized ${filesState.length} active files successfully.`);
            return true;
        }
        catch (e) {
            console.error(`[Serializer] Failed to serialize workspace state: ${e.message}`);
            return false;
        }
    }
    /**
     * Restores uncommitted workspace file contents from the active turn checkpoint.
     */
    deserialize() {
        try {
            if (!fs.existsSync(this.checkpointFile)) {
                console.error('[Serializer] Restore failed: No checkpoint found.');
                return false;
            }
            const raw = fs.readFileSync(this.checkpointFile, 'utf8');
            const state = JSON.parse(raw);
            for (const file of state.files) {
                const parentDir = path.dirname(file.filePath);
                if (!fs.existsSync(parentDir)) {
                    fs.mkdirSync(parentDir, { recursive: true });
                }
                fs.writeFileSync(file.filePath, file.content, 'utf8');
                console.error(`[Serializer] Restored file: ${file.filePath}`);
            }
            console.error(`[Serializer] Restored ${state.files.length} files successfully.`);
            return true;
        }
        catch (e) {
            console.error(`[Serializer] Failed to deserialize workspace state: ${e.message}`);
            return false;
        }
    }
}
