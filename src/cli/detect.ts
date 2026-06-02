import fs from 'node:fs';
import path from 'node:path';
import { Target } from '../adapters/index.js';

export async function detectCommand() {
  console.log('Detecting optimal Talos targets...\n');
  const projectRoot = process.cwd();

  console.log('Detected:');

  const hasPkg = fs.existsSync(path.join(projectRoot, 'package.json'));
  if (hasPkg) console.log('✓ package.json');

  const hasGit = fs.existsSync(path.join(projectRoot, '.git'));
  if (hasGit) console.log('✓ .git');

  const hasSrc = fs.existsSync(path.join(projectRoot, 'src'));
  if (hasSrc) console.log('✓ src/');

  const hasGemini = fs.existsSync(path.join(projectRoot, '.gemini'));
  if (hasGemini) console.log('✓ .gemini/ configuration');

  if (!fs.existsSync(path.join(projectRoot, 'CLAUDE.md'))) console.log('✓ no CLAUDE.md');
  if (!fs.existsSync(path.join(projectRoot, 'AGENTS.md'))) console.log('✓ no AGENTS.md');
  if (!fs.existsSync(path.join(projectRoot, 'GEMINI.md'))) console.log('✓ no GEMINI.md');

  console.log('\nRecommended:');
  console.log('- codex');
  console.log('- claude');
  console.log('- gemini');
  console.log('- cursor');
  console.log('- antigravity');
  console.log('- obsidian');

  console.log('\nRun `talos init --target all` to apply all recommended configurations.');
}
