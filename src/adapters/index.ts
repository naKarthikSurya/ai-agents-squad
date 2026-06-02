export type Target =
  | 'antigravity'
  | 'claude'
  | 'codex'
  | 'gemini'
  | 'cursor'
  | 'cline'
  | 'aider'
  | 'windsurf'
  | 'obsidian'
  | 'all';

export interface TalosContext {
  projectRoot: string;
  options: {
    withAgents: boolean;
    noAgents: boolean;
    universal: boolean;
  };
}

export interface OutputFile {
  path: string;
  content: string;
  overwriteStrategy: 'safe' | 'merge' | 'force';
}

export interface Adapter {
  name: Target;
  render(context: TalosContext): Promise<OutputFile[]>;
}

import { codexAdapter } from './codex.js';
import { claudeAdapter } from './claude.js';
import { geminiAdapter } from './gemini.js';
import { cursorAdapter } from './cursor.js';
import { clineAdapter } from './cline.js';
import { aiderAdapter } from './aider.js';
import { windsurfAdapter } from './windsurf.js';
import { antigravityAdapter } from './antigravity.js';
import { obsidianAdapter } from './obsidian.js';

export const allAdapters: Adapter[] = [
  codexAdapter,
  claudeAdapter,
  geminiAdapter,
  cursorAdapter,
  clineAdapter,
  aiderAdapter,
  windsurfAdapter,
  antigravityAdapter,
  obsidianAdapter
];
