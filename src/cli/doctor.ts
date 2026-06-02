import fs from 'node:fs';
import path from 'node:path';

export async function doctorCommand() {
  console.log('Running Talos Doctor...\n');
  const projectRoot = process.cwd();
  let errors = 0;
  let warnings = 0;

  const checkExists = (p: string, name: string) => {
    if (fs.existsSync(path.join(projectRoot, p))) {
      console.log(`✓ ${name} found`);
      return true;
    } else {
      console.error(`✗ ${name} missing (${p})`);
      errors++;
      return false;
    }
  };

  const hasTalos = checkExists('.talos', '.talos directory');
  checkExists('.talos/state.yaml', '.talos/state.yaml');
  checkExists('.talos/protocol.yaml', '.talos/protocol.yaml');

  if (hasTalos) {
    try {
      const roles = fs.readdirSync(path.join(projectRoot, '.talos/roles')).filter(f => !f.startsWith('.')).length;
      console.log(`✓ ${roles} roles registered`);
      const workflows = fs.readdirSync(path.join(projectRoot, '.talos/workflows')).filter(f => f.endsWith('.md')).length;
      console.log(`✓ ${workflows} workflows registered`);
    } catch (e) {
      console.error('✗ Error reading .talos subdirectories');
      errors++;
    }
  }

  // Check generated outputs based on detected files
  if (fs.existsSync(path.join(projectRoot, 'AGENTS.md'))) console.log('✓ AGENTS.md generated');
  if (fs.existsSync(path.join(projectRoot, 'CLAUDE.md'))) console.log('✓ CLAUDE.md generated');
  if (fs.existsSync(path.join(projectRoot, 'GEMINI.md'))) console.log('✓ GEMINI.md generated');
  if (fs.existsSync(path.join(projectRoot, '.gemini/settings.json'))) console.log('✓ .gemini/settings.json generated');
  if (fs.existsSync(path.join(projectRoot, '.cursor/rules/talos-core.mdc'))) console.log('✓ .cursor/rules/talos-core.mdc generated');
  if (fs.existsSync(path.join(projectRoot, '.clinerules/talos-core.md'))) console.log('✓ .clinerules/talos-core.md generated');
  if (fs.existsSync(path.join(projectRoot, 'CONVENTIONS.md'))) console.log('✓ CONVENTIONS.md generated');
  if (fs.existsSync(path.join(projectRoot, '.talos/context.md'))) console.log('✓ .talos/context.md generated');
  if (fs.existsSync(path.join(projectRoot, '.talos/knowledge-vault/Welcome to Talos.md'))) console.log('✓ Obsidian Knowledge Vault initialized');

  if (fs.existsSync(path.join(projectRoot, '.cursorrules'))) {
    console.warn('⚠ .cursorrules is legacy in Cursor. Prefer .cursor/rules/*.mdc.');
    warnings++;
  }

  console.log(`\nDoctor complete: ${errors} errors, ${warnings} warnings.`);
  process.exit(errors > 0 ? 1 : 0);
}
