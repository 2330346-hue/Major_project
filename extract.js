const fs = require('fs');
const path = require('path');

const srcRoot = path.join(__dirname, '..', 'dify');
const destRoot = 'C:\\Users\\KIIT0001\\Desktop\\dify-ui';

console.log(`Extracting Dify frontend UI from ${srcRoot} to ${destRoot}...`);

// Ensure directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Copy file or directory recursively
function copyRecursive(src, dest, excludePattern = null) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    const baseName = path.basename(src);
    if (excludePattern && excludePattern.test(baseName)) {
      return;
    }
    ensureDir(dest);
    const files = fs.readdirSync(src);
    for (const file of files) {
      copyRecursive(path.join(src, file), path.join(dest, file), excludePattern);
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

const excludes = /^(node_modules|\.next|\.git|dist|\.turbo|coverage|\.nyc_output)$/i;

// Ensure destination exists
ensureDir(destRoot);

// 1. Copy web
console.log('Copying web...');
copyRecursive(path.join(srcRoot, 'web'), path.join(destRoot, 'web'), excludes);

// 2. Copy packages
console.log('Copying packages...');
const packagesToCopy = ['contracts', 'dify-ui', 'iconify-collections', 'tsconfig', 'dev-proxy', 'jotai-tanstack-form'];
for (const pkg of packagesToCopy) {
  const srcPkg = path.join(srcRoot, 'packages', pkg);
  if (fs.existsSync(srcPkg)) {
    copyRecursive(srcPkg, path.join(destRoot, 'packages', pkg), excludes);
  }
}

// 3. Copy root configs
console.log('Copying root configuration files...');
const rootFiles = ['pnpm-lock.yaml', '.npmrc', 'AGENTS.md', 'CLAUDE.md'];
for (const file of rootFiles) {
  const srcFile = path.join(srcRoot, file);
  if (fs.existsSync(srcFile)) {
    fs.copyFileSync(srcFile, path.join(destRoot, file));
  }
}

// 4. Copy and adapt root package.json
console.log('Adapting root package.json...');
if (fs.existsSync(path.join(srcRoot, 'package.json'))) {
  const pkgJson = JSON.parse(fs.readFileSync(path.join(srcRoot, 'package.json'), 'utf8'));
  
  // Simplify scripts for UI only
  pkgJson.scripts = {
    "dev": "pnpm --filter dify-web dev",
    "build": "pnpm --filter dify-web build",
    "start": "pnpm --filter dify-web start",
    "type-check": "pnpm --filter dify-web type-check"
  };
  
  // Downgrade pnpm version to match Node v20
  pkgJson.packageManager = "pnpm@9.15.4";
  
  fs.writeFileSync(path.join(destRoot, 'package.json'), JSON.stringify(pkgJson, null, 2), 'utf8');
}

// 5. Copy and adapt pnpm-workspace.yaml
console.log('Adapting pnpm-workspace.yaml...');
if (fs.existsSync(path.join(srcRoot, 'pnpm-workspace.yaml'))) {
  let workspaceYaml = fs.readFileSync(path.join(srcRoot, 'pnpm-workspace.yaml'), 'utf8');
  
  // Replace the packages block with only web and packages/*
  workspaceYaml = workspaceYaml.replace(/packages:[\s\S]*?(?=\r?\n\w+:|$)/, `packages:
  - web
  - packages/*`);
  
  fs.writeFileSync(path.join(destRoot, 'pnpm-workspace.yaml'), workspaceYaml, 'utf8');
}

console.log('Extraction complete!');
