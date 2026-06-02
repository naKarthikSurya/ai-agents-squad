import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
export function injectMcpConfig(projectRoot, packageRoot) {
    const homedir = os.homedir();
    const serverPath = path.join(packageRoot, 'dist', 'mcp', 'server.js');
    console.log('  Scanning for local IDE configurations to inject Talos MCP server...');
    // Target paths for different IDEs
    const targets = [
        {
            name: 'Antigravity',
            path: path.join(homedir, '.gemini', 'config', 'mcp_config.json'),
            config: {
                serverUrl: 'http://localhost:3018/sse',
                oauth: {
                    scopes: ['repo', 'user'],
                    authorizationUrl: 'http://localhost:3018/oauth/authorize'
                },
                headers: {
                    Authorization: 'Bearer talos-local-token-3018'
                }
            }
        },
        {
            name: 'VS Code (Cline)',
            path: path.join(homedir, '.config', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json'),
            config: {
                command: 'node',
                args: [serverPath],
                env: {
                    TALOS_WORKSPACE_ROOT: projectRoot
                }
            }
        },
        {
            name: 'Cursor',
            path: path.join(homedir, '.config', 'Cursor', 'User', 'globalStorage', 'rosecopilot.mcp', 'mcp.json'),
            config: {
                command: 'node',
                args: [serverPath],
                env: {
                    TALOS_WORKSPACE_ROOT: projectRoot
                }
            }
        }
    ];
    for (const target of targets) {
        try {
            const dir = path.dirname(target.path);
            // We only inject if the directory exists (implying the IDE/plugin is installed)
            // or for Antigravity, we can create the directory if it's the primary ecosystem.
            if (!fs.existsSync(dir)) {
                if (target.name === 'Antigravity') {
                    fs.mkdirSync(dir, { recursive: true });
                }
                else {
                    // Skip if the IDE directory doesn't exist
                    continue;
                }
            }
            let currentConfig = {};
            if (fs.existsSync(target.path)) {
                try {
                    const raw = fs.readFileSync(target.path, 'utf8');
                    currentConfig = JSON.parse(raw);
                }
                catch (e) {
                    console.warn(`  ⚠ Configuration at ${target.path} is malformed. Overwriting.`);
                }
            }
            if (!currentConfig.mcpServers) {
                currentConfig.mcpServers = {};
            }
            // Merge or overwrite the talos-engineering-engine config
            currentConfig.mcpServers['talos-engineering-engine'] = target.config;
            fs.writeFileSync(target.path, JSON.stringify(currentConfig, null, 2), 'utf8');
            console.log(`  ✓ Injected Talos MCP config into ${target.name} (${target.path})`);
        }
        catch (err) {
            console.error(`  ✗ Failed to configure ${target.name}: ${err.message}`);
        }
    }
}
