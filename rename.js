/**
 * QRunch Brand Rename Script
 * --------------------------
 * Run this script to replace the brand name across the entire project.
 *
 * Usage:
 *   1. Set your new brand name below
 *   2. Open a terminal in the root of your project (where this file lives)
 *   3. Run: node rename.js
 */

const fs   = require('fs');
const path = require('path');

// ─────────────────────────────────────────
//   SET YOUR NEW BRAND NAME HERE
// ─────────────────────────────────────────
const OLD_NAME = 'QRunch';
const NEW_NAME = 'QRunch'; // <- change this
// ─────────────────────────────────────────

// File extensions to search through
const EXTENSIONS = ['.js', '.jsx', '.json', '.md', '.html', '.css', '.env'];

// Folders to skip
const SKIP_DIRS = ['node_modules', '.git', 'dist', 'build', '.next'];

let filesChanged = 0;
let totalReplacements = 0;

const processFile = (filePath) => {
  try {
    const original = fs.readFileSync(filePath, 'utf8');
    const regex = new RegExp(OLD_NAME, 'g');
    const count = (original.match(regex) || []).length;
    if (count === 0) return;
    const updated = original.replace(regex, NEW_NAME);
    fs.writeFileSync(filePath, updated, 'utf8');
    filesChanged++;
    totalReplacements += count;
    console.log(`✅ ${filePath} — ${count} replacement${count > 1 ? 's' : ''}`);
  } catch (err) {
    console.error(`❌ Could not process ${filePath}: ${err.message}`);
  }
};

const walk = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.includes(entry.name)) walk(fullPath);
    } else if (entry.isFile()) {
      if (EXTENSIONS.includes(path.extname(entry.name))) processFile(fullPath);
    }
  }
};

// Also rename localStorage keys — remind the user
const remindLocalStorage = () => {
  const lower = OLD_NAME.toLowerCase();
  console.log(`\n⚠️  Remember to also update localStorage keys manually if needed:`);
  console.log(`   "${lower}_token"  →  "${NEW_NAME.toLowerCase()}_token"`);
  console.log(`   "${lower}_theme"  →  "${NEW_NAME.toLowerCase()}_theme"`);
  console.log(`   (Search for these in AuthContext.jsx and ThemeContext.jsx)\n`);
};

console.log(`\n🔄 Renaming "${OLD_NAME}" → "${NEW_NAME}" across the project...\n`);

const ROOT = path.resolve(__dirname);
walk(ROOT);

console.log(`\n✅ Done! ${filesChanged} file${filesChanged !== 1 ? 's' : ''} updated, ${totalReplacements} total replacement${totalReplacements !== 1 ? 's' : ''}.`);
remindLocalStorage();