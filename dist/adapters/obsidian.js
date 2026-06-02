import fs from 'node:fs';
import path from 'node:path';
function getRepoInfo(projectRoot) {
    const info = {
        name: path.basename(projectRoot),
        version: '1.0.0',
        description: 'No description found in package.json.',
        scripts: [],
        techStack: []
    };
    const pkgPath = path.join(projectRoot, 'package.json');
    if (fs.existsSync(pkgPath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            if (pkg.name)
                info.name = pkg.name;
            if (pkg.version)
                info.version = pkg.version;
            if (pkg.description)
                info.description = pkg.description;
            if (pkg.scripts) {
                info.scripts = Object.keys(pkg.scripts);
            }
            // Detect tech stack
            const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
            if (deps['typescript'])
                info.techStack.push('TypeScript');
            if (deps['react'])
                info.techStack.push('React');
            if (deps['next'])
                info.techStack.push('Next.js');
            if (deps['vue'])
                info.techStack.push('Vue');
            if (deps['@angular/core'])
                info.techStack.push('Angular');
            if (deps['express'])
                info.techStack.push('Express');
            if (deps['@nestjs/core'])
                info.techStack.push('NestJS');
            if (deps['fastify'])
                info.techStack.push('Fastify');
            if (deps['prisma'])
                info.techStack.push('Prisma ORM');
            if (deps['tailwindcss'])
                info.techStack.push('Tailwind CSS');
        }
        catch (err) {
            // Ignore parse errors
        }
    }
    if (fs.existsSync(path.join(projectRoot, 'tsconfig.json'))) {
        if (!info.techStack.includes('TypeScript'))
            info.techStack.push('TypeScript');
    }
    return info;
}
function buildDirTree(dir, baseDir, depth = 0) {
    if (depth > 3)
        return ''; // limit depth to 3 for performance
    let result = '';
    try {
        const files = fs.readdirSync(dir, { withFileTypes: true });
        // Sort directories first, then files
        files.sort((a, b) => {
            if (a.isDirectory() && !b.isDirectory())
                return -1;
            if (!a.isDirectory() && b.isDirectory())
                return 1;
            return a.name.localeCompare(b.name);
        });
        for (const file of files) {
            if (file.name.startsWith('.') && file.name !== '.talos')
                continue;
            if (['node_modules', 'dist', 'build', 'out', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'].includes(file.name))
                continue;
            const fullPath = path.join(dir, file.name);
            const indent = '  '.repeat(depth);
            if (file.isDirectory()) {
                result += `${indent}- 📂 **${file.name}/**\n`;
                result += buildDirTree(fullPath, baseDir, depth + 1);
            }
            else {
                result += `${indent}- 📄 ${file.name}\n`;
            }
        }
    }
    catch (err) {
        // Ignore read errors
    }
    return result;
}
export const obsidianAdapter = {
    name: 'obsidian',
    async render(context) {
        const repo = getRepoInfo(context.projectRoot);
        const dirTree = buildDirTree(context.projectRoot, context.projectRoot);
        const contextMd = `# Repository Context: ${repo.name}

## Overview
- **Name**: ${repo.name}
- **Version**: ${repo.version}
- **Description**: ${repo.description}
- **Tech Stack**: ${repo.techStack.length > 0 ? repo.techStack.join(', ') : 'Not explicitly detected (Pure JS/HTML/CSS)'}

## Core Scripts
${repo.scripts.map(s => `- \`npm run ${s}\``).join('\n')}

## Codebase Tree Structure
\`\`\`markdown
${dirTree}\`\`\`
`;
        const welcomeMd = `# Welcome to the ${repo.name} Knowledge Base

This is a dynamically generated, fully inter-linked **Obsidian Graph Knowledge Base** of the **${repo.name}** repository powered by **Talos**.

## 📌 Repository Overview
- **Project Name**: \`${repo.name}\`
- **Version**: \`${repo.version}\`
- **Description**: ${repo.description}
- **Detected Stack**: ${repo.techStack.length > 0 ? repo.techStack.map(t => `\`${t}\``).join(', ') : 'Vanilla / Standard'}

## 📂 Codebase Navigation
- 🗺️ Explore the interactive directory structure: [[Codebase Map]]
- ⚙️ Available build/test commands:
${repo.scripts.map(s => `  - \`npm run ${s}\``).join('\n')}

---

## 🛠️ Talos Protocol Engine
Talos governs this repository using a structured, role-based workflow. Select any node to explore how it links to your codebase:

- 📖 **[[Talos Workflows]]**: The structured lifecycle stages of development.
- 👥 **[[Talos Roles]]**: The AI agents/personas and their responsibilities.
- 🔧 **[[CLI Commands]]**: Tools to initialize, sync, and audit this workspace.
- 🔌 **[[Target Adapters]]**: Integrating with IDEs and AI agent interfaces.

---

## 🚀 How to open this in Obsidian
Obsidian is already installed on your system! To open this graph view:
1. Open your Obsidian application.
2. Select **"Open folder as vault"**.
3. Choose the directory: \`${path.join(context.projectRoot, '.talos/knowledge-vault')}\`
`;
        const codebaseMapMd = `# Codebase Directory Map

This is a comprehensive map of files inside **${repo.name}**, automatically scanned and generated by **Talos**.

## 📂 Tree Directory Structure
\`\`\`markdown
${dirTree}\`\`\`

## 🔗 Key Architecture Links
- Explore how to control this workspace: [[Welcome to Talos]]
- Explore the CLI controls: [[CLI Commands]]
- Explore target adapters: [[Target Adapters]]
`;
        const cliCommandsMd = `# Talos CLI Commands

The Talos CLI helps you manage agent rules and configurations seamlessly.

## Commands List
- [[init command]]: Initialize Talos templates and rule files in any workspace.
- [[doctor command]]: Scan the workspace to verify health, active rules, and state.
- [[detect command]]: Analyze the workspace to recommend the best agent targets.
- [[sync command]]: Re-generate and synchronize rules, templates, and directory context maps.

Explore more:
- Back to [[Welcome to Talos]]
- Scanned files directory: [[Codebase Map]]
`;
        const targetAdaptersMd = `# Talos Target Adapters

Talos supports multi-agent and IDE-specific rulesets to configure any environment optimally.

## Supported Adapters
- [[antigravity adapter]]: Native support for the new Antigravity CLI, yielding \`GEMINI.md\` and \`AGENTS.md\`.
- [[gemini adapter]]: Standard settings for Gemini Code Assist and Gemini CLI.
- [[cursor adapter]]: Generates advanced rules inside \`.cursor/rules/\` (.mdc).
- [[claude adapter]]: Support for Claude Code and Claude CLI.
- [[cline adapter]]: Support for Cline and Roo-cline tools.
- [[aider adapter]]: Configuration settings for Aider AI coder.
- [[windsurf adapter]]: Setup files for Windsurf IDE.
- [[codex adapter]]: Fallback configurations.

Explore more:
- Back to [[Welcome to Talos]]
- Core CLI tools: [[CLI Commands]]
`;
        const talosWorkflowsMd = `# Talos Workflows

Development follows a deterministic sequence of development stages, ensuring maximum quality, security, and verification.

## 🔄 Lifecycle Stages
1. **pm-analysis**: Gathering requirements and scoping the feature. Owned by the [[product manager]].
2. **architecture**: Designing high-level specifications and data flows. Owned by the [[system architect]].
3. **implementation-plan**: Creating component-level checklists and task lists. Owned by the [[project manager]].
4. **backend**: Implementing robust APIs and server logic. Owned by the [[backend engineer]].
5. **frontend**: Designing accessible and responsive user interfaces. Owned by the [[frontend engineer]].
6. **database**: Establishing safe database schemas and migrations. Owned by the [[database engineer]].
7. **qa**: Writing extensive negative and positive test suites. Owned by the [[qa engineer]].
8. **security**: Hardening interfaces and setting up observability logs. Owned by the [[security engineer]].
9. **devops**: Organizing containerization and CI/CD pipelines. Owned by the [[devops engineer]].
10. **final-review**: Verification, final walkthroughs, and code approval.

Explore more:
- Back to [[Welcome to Talos]]
- Explore the engine personas: [[Talos Roles]]
`;
        const talosRolesMd = `# Talos Roles

Talos governs execution through 11 role-based agent personas, ensuring specialized expertise for every step.

## 👥 Personas
- [[product manager]]: Focuses on "what" and "why", producing the feature specification.
- [[system architect]]: Creates high-level architectural designs and decision records.
- [[project manager]]: Coordinates checklists, estimates, and documentation.
- [[backend engineer]]: Implements NestJS, FastAPI, or Django server-side logic.
- [[frontend engineer]]: Builds React, Next.js, or Angular components with Tailwind.
- [[database engineer]]: Optimizes schemas, foreign keys, and indexes.
- [[qa engineer]]: Audits requirements, tests negative paths, and tracks coverage.
- [[security engineer]]: Audits OWASP threats, masks secrets, and builds dashboards.
- [[devops engineer]]: Configures Docker, GitHub Actions, and deployments.
- [[ux-ui designer]]: Researches component styling and user flows.
- [[maintenance engineer]]: Debugs post-release incidents and upgrades packages.

Explore more:
- Back to [[Welcome to Talos]]
- Lifecycle stages: [[Talos Workflows]]
`;
        const outputs = [
            {
                path: '.talos/context.md',
                content: contextMd,
                overwriteStrategy: 'force',
            },
            {
                path: '.talos/knowledge-vault/Welcome to Talos.md',
                content: welcomeMd,
                overwriteStrategy: 'force',
            },
            {
                path: '.talos/knowledge-vault/Codebase Map.md',
                content: codebaseMapMd,
                overwriteStrategy: 'force',
            },
            {
                path: '.talos/knowledge-vault/CLI Commands.md',
                content: cliCommandsMd,
                overwriteStrategy: 'force',
            },
            {
                path: '.talos/knowledge-vault/Target Adapters.md',
                content: targetAdaptersMd,
                overwriteStrategy: 'force',
            },
            {
                path: '.talos/knowledge-vault/Talos Workflows.md',
                content: talosWorkflowsMd,
                overwriteStrategy: 'force',
            },
            {
                path: '.talos/knowledge-vault/Talos Roles.md',
                content: talosRolesMd,
                overwriteStrategy: 'force',
            }
        ];
        // Detail pages for commands
        const commands = ['init', 'doctor', 'detect', 'sync'];
        for (const cmd of commands) {
            outputs.push({
                path: `.talos/knowledge-vault/${cmd} command.md`,
                content: `# Talos ${cmd.toUpperCase()} Command

This command is a core component of the [[CLI Commands]] system.

## Purpose
Detailed documentation for running the \`talos ${cmd}\` utility to manage your workspace.

Explore:
- Back to [[CLI Commands]]
- Back to [[Welcome to Talos]]
`,
                overwriteStrategy: 'safe',
            });
        }
        // Detail pages for adapters
        const adapters = ['antigravity', 'gemini', 'cursor', 'claude', 'cline', 'aider', 'windsurf', 'codex'];
        for (const ad of adapters) {
            outputs.push({
                path: `.talos/knowledge-vault/${ad} adapter.md`,
                content: `# Talos ${ad.toUpperCase()} Adapter

This adapter is part of the [[Target Adapters]] suite.

## Purpose
Generates workspace rules and environment settings for the ${ad} coding assistant interface.

Explore:
- Back to [[Target Adapters]]
- Back to [[Welcome to Talos]]
`,
                overwriteStrategy: 'safe',
            });
        }
        // Detail pages for roles
        const roles = [
            'product manager',
            'system architect',
            'project manager',
            'backend engineer',
            'frontend engineer',
            'database engineer',
            'qa engineer',
            'security engineer',
            'devops engineer',
            'ux-ui designer',
            'maintenance engineer'
        ];
        for (const role of roles) {
            outputs.push({
                path: `.talos/knowledge-vault/${role}.md`,
                content: `# Role: ${role.toUpperCase()}

This role is a key member of the [[Talos Roles]] engine.

## Responsibilities
Acts as the specialized agent responsible for planning or implementing features in this phase.

Explore:
- Active in: [[Talos Workflows]]
- Back to [[Talos Roles]]
`,
                overwriteStrategy: 'safe',
            });
        }
        // Detail pages for workflow stages
        const stages = [
            'pm-analysis stage',
            'architecture stage',
            'implementation-plan stage',
            'backend stage',
            'frontend stage',
            'database stage',
            'qa stage',
            'security stage',
            'devops stage'
        ];
        for (const stage of stages) {
            outputs.push({
                path: `.talos/knowledge-vault/${stage}.md`,
                content: `# Stage: ${stage.toUpperCase()}

This stage represents a critical milestone in [[Talos Workflows]].

## Description
Enforces the specific quality gates, blueprints, and reviews for this lifecycle phase.

Explore:
- Controlled by: [[Talos Workflows]]
- Executed by: [[Talos Roles]]
`,
                overwriteStrategy: 'safe',
            });
        }
        return outputs;
    }
};
