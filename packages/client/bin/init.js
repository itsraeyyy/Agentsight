#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import readline from 'node:readline';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const CWD = process.cwd();

const MCP_SERVER_CONFIG = {
  command: 'npx',
  args: ['-y', '@itsraeyy/agentsight-mcp'],
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/** Detect the user's package manager by checking for lockfiles. */
function detectPackageManager() {
  if (fs.existsSync(path.join(CWD, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(CWD, 'yarn.lock'))) return 'yarn';
  if (fs.existsSync(path.join(CWD, 'bun.lockb'))) return 'bun';
  return 'npm';
}

/** Get the install-as-devDep command for a given package manager. */
function getInstallCommand(pm, pkg) {
  switch (pm) {
    case 'pnpm': return `pnpm add -D ${pkg}`;
    case 'yarn': return `yarn add -D ${pkg}`;
    case 'bun':  return `bun add -D ${pkg}`;
    default:     return `npm install -D ${pkg}`;
  }
}

/** Check if a file exists at any of the given relative paths. Returns the first match or null. */
function findFirst(relativePaths) {
  for (const p of relativePaths) {
    const full = path.join(CWD, p);
    if (fs.existsSync(full)) return { relative: p, absolute: full };
  }
  return null;
}

/** Detect the framework used in the current project. */
function detectFramework() {
  // Next.js App Router
  const nextConfigs = ['next.config.js', 'next.config.mjs', 'next.config.ts'];
  const hasNext = nextConfigs.some(f => fs.existsSync(path.join(CWD, f)));
  const hasAppDir = fs.existsSync(path.join(CWD, 'app')) || fs.existsSync(path.join(CWD, 'src', 'app'));

  if (hasNext && hasAppDir) return 'nextjs';

  // Vite
  const viteConfigs = ['vite.config.ts', 'vite.config.js', 'vite.config.mjs'];
  const hasVite = viteConfigs.some(f => fs.existsSync(path.join(CWD, f)));

  if (hasVite) return 'vite';

  return 'unknown';
}

// ─── STEP 1: INJECT PROVIDER ─────────────────────────────────────────────────

function injectProvider() {
  const framework = detectFramework();

  let layoutFile = null;
  let importStatement = `import { AgentSightProvider } from '@itsraeyy/agentsight-client';`;
  let jsxStatement = `{process.env.NODE_ENV === 'development' && <AgentSightProvider />}`;

  if (framework === 'nextjs') {
    // Next.js App Router — look for root layout
    layoutFile = findFirst([
      'app/layout.tsx',
      'app/layout.jsx',
      'src/app/layout.tsx',
      'src/app/layout.jsx',
    ]);

    if (layoutFile) {
      const isSrc = layoutFile.relative.startsWith('src/');
      const componentsDir = path.join(CWD, isSrc ? 'src/components' : 'components');
      
      if (!fs.existsSync(componentsDir)) {
        fs.mkdirSync(componentsDir, { recursive: true });
      }

      const isTs = layoutFile.relative.endsWith('.tsx');
      const ext = isTs ? '.tsx' : '.jsx';
      const wrapperPath = path.join(componentsDir, `AgentSightWrapper${ext}`);
      
      const wrapperContent = `"use client";\n\nimport { AgentSightProvider } from '@itsraeyy/agentsight-client';\n\nexport default function AgentSightWrapper() {\n  return <AgentSightProvider />;\n}\n`;

      if (!fs.existsSync(wrapperPath)) {
        fs.writeFileSync(wrapperPath, wrapperContent, 'utf8');
        console.log(`✅ Created ${path.relative(CWD, wrapperPath)}`);
      } else {
        console.log(`ℹ️  AgentSightWrapper already exists at ${path.relative(CWD, wrapperPath)}`);
      }

      importStatement = `import AgentSightWrapper from '../components/AgentSightWrapper';`;
      jsxStatement = `{process.env.NODE_ENV === 'development' && <AgentSightWrapper />}`;
    }
  } else if (framework === 'vite') {
    // Vite — look for root App or main entry
    layoutFile = findFirst([
      'src/App.tsx',
      'src/App.jsx',
      'src/main.tsx',
      'src/main.jsx',
    ]);
  }

  if (!layoutFile) {
    if (framework === 'unknown') {
      console.log('⚠️  Could not detect framework (Next.js or Vite).');
    } else {
      console.log(`⚠️  Detected ${framework} but could not find the root layout file.`);
    }
    console.log('   Please manually add <AgentSightProvider /> to your root component.\n');
    return;
  }

  let content = fs.readFileSync(layoutFile.absolute, 'utf8');

  // Idempotent — don't inject twice
  if (content.includes('AgentSightProvider') || content.includes('AgentSightWrapper')) {
    console.log(`ℹ️  AgentSight already exists in ${layoutFile.relative}`);
    return;
  }

  // Add the import statement at the top of the file
  // Insert after the last existing import to keep it clean
  const lastImportIndex = content.lastIndexOf('\nimport ');
  if (lastImportIndex !== -1) {
    const endOfImportLine = content.indexOf('\n', lastImportIndex + 1);
    content =
      content.slice(0, endOfImportLine + 1) +
      importStatement + '\n' +
      content.slice(endOfImportLine + 1);
  } else {
    // No imports found — add at the very top
    content = importStatement + '\n' + content;
  }

  // Inject the component based on framework
  if (framework === 'nextjs') {
    // Next.js: inject before </body>
    if (content.includes('</body>')) {
      content = content.replace(
        '</body>',
        `        ${jsxStatement}\n      </body>`
      );
    } else {
      console.log(`⚠️  Could not find </body> tag in ${layoutFile.relative}.`);
      console.log(`   Please manually add: ${jsxStatement}\n`);
      return;
    }
  } else if (framework === 'vite') {
    // Vite: inject before the closing fragment, div, or return statement
    // For App.tsx, add inside the returned JSX
    if (content.includes('</div>') || content.includes('</>')) {
      // Find the last closing tag in the return statement and inject before it
      const closingTag = content.includes('</>') ? '</>' : '</div>';
      const lastClose = content.lastIndexOf(closingTag);
      if (lastClose !== -1) {
        content =
          content.slice(0, lastClose) +
          `  ${jsxStatement}\n      ` +
          content.slice(lastClose);
      }
    } else {
      console.log(`⚠️  Could not find a suitable injection point in ${layoutFile.relative}.`);
      console.log(`   Please manually add: ${jsxStatement}\n`);
      return;
    }
  }

  fs.writeFileSync(layoutFile.absolute, content, 'utf8');
  console.log(`✅ Injected AgentSight into ${layoutFile.relative}`);
}

// ─── STEP 2: CONFIGURE IDE ───────────────────────────────────────────────────

async function configureIDE() {
  const ideConfigs = [
    { dir: '.cursor', file: 'mcp.json', name: 'Cursor' },
    { dir: '.windsurf', file: 'mcp.json', name: 'Windsurf' },
    { dir: '.agents', file: 'mcp.json', name: 'Antigravity' },
    { dir: '', file: 'cline_mcp_settings.json', name: 'Cline' },
    { dir: '', file: 'roo_mcp_settings.json', name: 'Roo Code' }
  ];

  let configured = false;

  // 1. Auto-detect and configure
  for (const ide of ideConfigs) {
    const targetDir = path.join(CWD, ide.dir);
    // Auto-detect: if the specific IDE directory exists, or if it's a VS Code extension and .vscode exists
    if (ide.dir && fs.existsSync(targetDir)) {
      writeMcpConfig(path.join(targetDir, ide.file), ide.name);
      configured = true;
    } else if (!ide.dir && fs.existsSync(path.join(CWD, '.vscode'))) {
      writeMcpConfig(path.join(targetDir, ide.file), ide.name);
      configured = true;
    }
  }

  // Antigravity global config
  const antigravityGlobalDir = path.join(os.homedir(), '.gemini', 'config');
  if (fs.existsSync(antigravityGlobalDir)) {
    writeMcpConfig(path.join(antigravityGlobalDir, 'mcp_config.json'), 'Antigravity (Global)');
    configured = true;
  }

  if (configured) return;

  // 2. Prompt if no known IDE configuration folders detected
  console.log('⚠️  Could not automatically detect your AI IDE.');
  console.log('Please select your AI IDE or Assistant to configure MCP:');
  console.log('  1) Cursor');
  console.log('  2) Windsurf');
  console.log('  3) Cline (VS Code)');
  console.log('  4) Roo Code (VS Code)');
  console.log('  5) Claude Code (CLI)');
  console.log('  6) None / Manual');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  
  return new Promise((resolve) => {
    rl.question('Select an option (1-6): ', (answer) => {
      rl.close();
      const choice = answer.trim();
      let targetIde = null;
      
      switch (choice) {
        case '1': targetIde = ideConfigs[0]; break;
        case '2': targetIde = ideConfigs[1]; break;
        case '3': targetIde = ideConfigs[3]; break;
        case '4': targetIde = ideConfigs[4]; break;
        case '5':
          console.log('\nFor Claude Code, run this command manually:');
          console.log('claude mcp add agentsight npx -y @itsraeyy/agentsight-mcp\n');
          return resolve();
        default:
          console.log('\nAdd this to your MCP settings manually:');
          console.log(JSON.stringify({ mcpServers: { agentsight: MCP_SERVER_CONFIG } }, null, 2), '\n');
          return resolve();
      }

      if (targetIde) {
        const targetDir = path.join(CWD, targetIde.dir);
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
        writeMcpConfig(path.join(targetDir, targetIde.file), targetIde.name);
      }
      resolve();
    });
  });
}

function writeMcpConfig(configPath, ideName) {
  let config = { mcpServers: {} };

  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (!config.mcpServers) config.mcpServers = {};
    } catch {
      console.log(`⚠️  Could not parse existing ${path.basename(configPath)}. Overwriting...`);
    }
  }

  // Idempotent — don't overwrite if already configured
  if (config.mcpServers.agentsight) {
    console.log(`ℹ️  AgentSight MCP already configured in ${ideName}`);
    return;
  }

  config.mcpServers.agentsight = MCP_SERVER_CONFIG;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
  console.log(`✅ Configured MCP server in ${ideName} (${path.relative(CWD, configPath)})`);
}

// ─── STEP 3: INSTALL PACKAGE ─────────────────────────────────────────────────

function ensureInstalled() {
  try {
    const pkgPath = path.join(CWD, 'package.json');
    if (!fs.existsSync(pkgPath)) {
      console.log('⚠️  No package.json found. Skipping dependency install.');
      return;
    }

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (!allDeps['@itsraeyy/agentsight-client']) {
      const pm = detectPackageManager();
      const cmd = getInstallCommand(pm, '@itsraeyy/agentsight-client');
      console.log(`⏳ Installing @itsraeyy/agentsight-client via ${pm}...`);
      execSync(cmd, { stdio: 'inherit', cwd: CWD });
      console.log(`✅ Installed @itsraeyy/agentsight-client`);
    } else {
      console.log('ℹ️  @itsraeyy/agentsight-client is already installed');
    }
  } catch (err) {
    console.log('⚠️  Could not auto-install. Please run: npm install -D @itsraeyy/agentsight-client');
  }
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('  👁️  AgentSight — Visual Feedback for AI Coding Agents');
  console.log('  ──────────────────────────────────────────────────────');
  console.log('');

  injectProvider();
  await configureIDE();
  ensureInstalled();

  console.log('');
  console.log('  🚀 AgentSight is live!');
  console.log('  Run your dev server and press Ctrl+Shift+A in the browser.');
  console.log('');
}

main().catch(console.error);
