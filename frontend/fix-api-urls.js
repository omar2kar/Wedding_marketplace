/*
 * fix-api-urls.js
 * ---------------------------------------------------------------------------
 * Replaces hardcoded "http://localhost:5000" URLs across the frontend source
 * with env-driven constants (API_BASE / SERVER_BASE) that read from
 * REACT_APP_API_URL at build time and fall back to localhost for local dev.
 *
 * HOW TO RUN (from the `frontend/` folder):
 *     node fix-api-urls.js
 *
 * It will:
 *   1. create/overwrite  src/config/api.ts
 *   2. rewrite every .ts/.tsx under src/ that contains the hardcoded host,
 *      converting the affected string literals to template literals and
 *      adding the needed import.
 *
 * Safe & reversible: commit first, review `git diff`, then build with CI=true
 * before pushing. To undo everything:  git checkout .
 * ---------------------------------------------------------------------------
 */

const fs = require('fs');
const path = require('path');

const SRC = path.join(process.cwd(), 'src');

if (!fs.existsSync(SRC)) {
  console.error('ERROR: "src" folder not found. Run this from the frontend/ folder.');
  process.exit(1);
}

const HOST = 'http://localhost:5000';
const API_CONFIG = path.join(SRC, 'config', 'api.ts');

// Files to skip: the config itself + the already-correct env-based axios file
const SKIP = new Set([
  path.normalize(path.join(SRC, 'config', 'axios.ts')),
  path.normalize(API_CONFIG),
]);

// ---------------------------------------------------------------------------
// 1) Create src/config/api.ts
// ---------------------------------------------------------------------------
const apiConfigContent =
`// Central API base URLs. Read from REACT_APP_API_URL at build time.
// Local dev (env unset)  -> http://localhost:5000
// Vercel  (env set)      -> https://wedding-marketplace.onrender.com
export const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export const SERVER_BASE = API_BASE.replace(/\\/api\\/?$/, '');
`;

fs.mkdirSync(path.dirname(API_CONFIG), { recursive: true });
fs.writeFileSync(API_CONFIG, apiConfigContent, 'utf8');
console.log('created/updated  src/config/api.ts');

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (/\.tsx?$/.test(name)) acc.push(p);
  }
  return acc;
}

// Replace the host inside the raw content of a string literal.
// ".../api"  -> ${API_BASE} ,  bare host -> ${SERVER_BASE}
function transformContent(inner) {
  let out = inner.split('http://localhost:5000/api').join('${API_BASE}');
  out = out.split('http://localhost:5000').join('${SERVER_BASE}');
  return out;
}

// ---------------------------------------------------------------------------
// 2) Rewrite source files
// ---------------------------------------------------------------------------
let changed = 0;

for (const file of walk(SRC)) {
  if (SKIP.has(path.normalize(file))) continue;

  let code = fs.readFileSync(file, 'utf8');
  if (!code.includes(HOST)) continue;

  const before = code;

  // (a) single- and double-quoted literals containing the host -> backtick literals
  code = code.replace(/(['"])((?:\\.|(?!\1)[^\\\r\n])*)\1/g, (m, q, content) => {
    if (!content.includes(HOST)) return m;
    return '`' + transformContent(content) + '`';
  });

  // (b) existing backtick literals containing the host -> replace host in place
  code = code.replace(/`((?:\\.|[^`\\])*)`/g, (m, content) => {
    if (!content.includes(HOST)) return m;
    return '`' + transformContent(content) + '`';
  });

  if (code === before) continue;

  // (c) add the import for whatever symbols are now used
  const needsApi = code.includes('${API_BASE}');
  const needsServer = code.includes('${SERVER_BASE}');
  const names = [];
  if (needsApi) names.push('API_BASE');
  if (needsServer) names.push('SERVER_BASE');

  const alreadyImported = /from\s+['"][^'"]*config\/api['"]/.test(code);

  if (names.length && !alreadyImported) {
    let rel = path
      .relative(path.dirname(file), path.join(SRC, 'config', 'api'))
      .replace(/\\/g, '/');
    if (!rel.startsWith('.')) rel = './' + rel;

    const importLine = `import { ${names.join(', ')} } from '${rel}';\n`;

    // insert after the last top-level import statement
    const importRegex = /^import[^\n]*?;[ \t]*\r?\n/gm;
    let last = null, mm;
    while ((mm = importRegex.exec(code)) !== null) last = mm;

    if (last) {
      const idx = last.index + last[0].length;
      code = code.slice(0, idx) + importLine + code.slice(idx);
    } else {
      code = importLine + code;
    }
  }

  fs.writeFileSync(file, code, 'utf8');
  changed++;
  console.log('updated  ' + path.relative(process.cwd(), file));
}

console.log(`\nDone. ${changed} file(s) updated + src/config/api.ts created.`);
console.log('Next:');
console.log('  1) git diff            (review the changes)');
console.log('  2) $env:CI="true"; npm run build; Remove-Item Env:\\CI   (must compile)');
console.log('  3) git commit + git push   (Vercel auto-redeploys)');
