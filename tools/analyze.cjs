/*
  Repo analysis script (CommonJS)
  - Generates reports into ./reports
  Reports:
    - repo_map.json (tree depth ≤3 with file counts)
    - files_by_loc.csv (path,loc sorted desc)
    - functions_by_size.csv (path,function,loc)
    - dep_graph.json (adjacency), dep_graph.mmd (Mermaid)
    - cycles.csv (SCCs > 1)
    - public_surface.csv (exports and consumers)
    - events_catalog.csv (publish/subscribe topics)
*/

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const REPORT_DIR = path.join(ROOT, 'reports');

const INCLUDE_DIRS = ['js', 'src'];
const EXCLUDE_DIR_NAMES = new Set([
  'node_modules', '.git', 'dist', 'build', '.vite', 'reports', 'coverage', 'public'
]);

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeText(filePath, text) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, text, 'utf8');
}

function listFiles(startDirs, extensions = ['.js']) {
  const results = [];
  for (const dir of startDirs) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) continue;
    walk(abs, 0, (fp, st) => {
      if (st.isFile() && extensions.includes(path.extname(fp))) {
        results.push(fp);
      }
    });
  }
  return results;
}

function walk(dir, depth, onFile, maxDepth = Infinity) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return;
  }
  for (const entry of entries) {
    if (EXCLUDE_DIR_NAMES.has(entry.name)) continue;
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (depth < maxDepth) {
        walk(fp, depth + 1, onFile, maxDepth);
      }
    } else {
      try {
        const st = fs.statSync(fp);
        onFile(fp, st);
      } catch {}
    }
  }
}

function countLines(text) {
  if (text.length === 0) return 0;
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return normalized.split('\n').length;
}

function buildRepoMap() {
  const rootEntries = {};
  for (const top of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!top.isDirectory()) continue;
    if (EXCLUDE_DIR_NAMES.has(top.name)) continue;
    const topPath = path.join(ROOT, top.name);
    const node = { name: top.name, path: rel(topPath), files: 0, children: [] };
    walk(topPath, 1, (fp) => {
      node.files += 1;
    }, 3);
    let level1 = [];
    try {
      level1 = fs.readdirSync(topPath, { withFileTypes: true })
        .filter(d => d.isDirectory() && !EXCLUDE_DIR_NAMES.has(d.name));
    } catch {}
    for (const l1 of level1) {
      const l1Path = path.join(topPath, l1.name);
      const child = { name: l1.name, path: rel(l1Path), files: 0, children: [] };
      walk(l1Path, 2, (fp) => { child.files += 1; }, 2);
      let level2 = [];
      try {
        level2 = fs.readdirSync(l1Path, { withFileTypes: true })
          .filter(d => d.isDirectory() && !EXCLUDE_DIR_NAMES.has(d.name));
      } catch {}
      for (const l2 of level2) {
        const l2Path = path.join(l1Path, l2.name);
        const grand = { name: l2.name, path: rel(l2Path), files: 0 };
        walk(l2Path, 3, (fp) => { grand.files += 1; }, 3);
        child.children.push(grand);
      }
      node.children.push(child);
    }
    rootEntries[top.name] = node;
  }
  return rootEntries;
}

function rel(abs) {
  return path.relative(ROOT, abs).replace(/\\/g, '/');
}

function parseImports(content) {
  const imports = [];
  const importRegex = /\bimport\s+(?:[^;]*?\s+from\s+)?["']([^"']+)["']/g;
  let m;
  while ((m = importRegex.exec(content)) !== null) {
    imports.push(m[1]);
  }
  return imports;
}

function parseImportBindings(content) {
  const results = [];
  const re = /import\s+([^;]*?)\s+from\s+["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const clause = m[1].trim();
    const source = m[2];
    let defaultImport = null;
    const named = [];
    if (clause.startsWith('{')) {
      const inside = clause.slice(1, clause.indexOf('}'));
      inside.split(',').map(s => s.trim()).filter(Boolean).forEach((p) => {
        const mm = p.match(/^(\w+)(?:\s+as\s+(\w+))?$/);
        if (mm) named.push({ imported: mm[1], local: mm[2] || mm[1] });
      });
    } else {
      const parts = clause.split(',').map(s => s.trim()).filter(Boolean);
      if (parts.length > 0) defaultImport = parts[0];
      const namedMatch = clause.match(/\{([^}]*)\}/);
      if (namedMatch) {
        const inside = namedMatch[1];
        inside.split(',').map(s => s.trim()).filter(Boolean).forEach((p) => {
          const mm = p.match(/^(\w+)(?:\s+as\s+(\w+))?$/);
          if (mm) named.push({ imported: mm[1], local: mm[2] || mm[1] });
        });
      }
    }
    results.push({ source, defaultImport, named });
  }
  return results;
}

function parseExports(content) {
  const exports = [];
  const reDefaultFn = /export\s+default\s+function(?:\s+(\w+))?/g;
  let m;
  while ((m = reDefaultFn.exec(content)) !== null) {
    exports.push({ type: 'default', name: m[1] || 'default' });
  }
  const reDefault = /export\s+default\s+(?!function)(\w+)?/g;
  while ((m = reDefault.exec(content)) !== null) {
    exports.push({ type: 'default', name: 'default' });
  }
  const reFn = /export\s+(?:async\s+)?function\s+(\w+)\s*\(/g;
  while ((m = reFn.exec(content)) !== null) {
    exports.push({ type: 'named', name: m[1] });
  }
  const reClass = /export\s+class\s+(\w+)\s*\{/g;
  while ((m = reClass.exec(content)) !== null) {
    exports.push({ type: 'named', name: m[1] });
  }
  const reVar = /export\s+(?:const|let|var)\s+(\w+)/g;
  while ((m = reVar.exec(content)) !== null) {
    exports.push({ type: 'named', name: m[1] });
  }
  const reList = /export\s*\{([^}]*)\}/g;
  while ((m = reList.exec(content)) !== null) {
    const inside = m[1];
    inside.split(',').map(s => s.trim()).filter(Boolean).forEach((p) => {
      const mm = p.match(/^(\w+)(?:\s+as\s+(\w+))?$/);
      if (mm) exports.push({ type: 'named', name: mm[2] || mm[1] });
    });
  }
  return exports;
}

function resolveImport(fromFile, spec) {
  if (!spec.startsWith('.')) return null;
  const basedir = path.dirname(fromFile);
  const target = path.resolve(basedir, spec);
  const candidates = [target, target + '.js', path.join(target, 'index.js')];
  for (const c of candidates) {
    try {
      const st = fs.statSync(c);
      if (st.isFile()) return c;
    } catch {}
  }
  return null;
}

function findFunctionBlocks(content) {
  const blocks = [];
  const patterns = [
    { type: 'decl', re: /function\s+(\w+)\s*\(/g },
    { type: 'expr', re: /const\s+(\w+)\s*=\s*(?:async\s*)?function\s*\(/g },
    { type: 'arrow', re: /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*\{/g },
  ];
  const searchStarts = [];
  for (const { re } of patterns) {
    let m;
    while ((m = re.exec(content)) !== null) {
      searchStarts.push({ name: m[1], index: m.index });
    }
  }
  searchStarts.sort((a, b) => a.index - b.index);
  for (const s of searchStarts) {
    const braceStart = content.indexOf('{', s.index);
    if (braceStart === -1) continue;
    const end = findMatchingBrace(content, braceStart);
    if (end === -1) continue;
    const snippet = content.slice(braceStart, end + 1);
    const loc = countLines(snippet);
    blocks.push({ name: s.name, start: s.index, loc });
  }
  return blocks;
}

function findMatchingBrace(text, openIndex) {
  let depth = 0;
  let inStr = false;
  let strCh = '';
  for (let i = openIndex; i < text.length; i++) {
    const ch = text[i];
    const prev = i > 0 ? text[i - 1] : '';
    if (inStr) {
      if (ch === strCh && prev !== '\\') {
        inStr = false;
        strCh = '';
      }
      continue;
    } else {
      if ((ch === '"' || ch === '\'' || ch === '`') && prev !== '\\') {
        inStr = true;
        strCh = ch;
        continue;
      }
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) return i;
      }
    }
  }
  return -1;
}

function sanitizeId(id) {
  return id.replace(/[^A-Za-z0-9_]/g, '_');
}

function main() {
  ensureDir(REPORT_DIR);
  const files = listFiles(INCLUDE_DIRS, ['.js']);

  const fileStats = files.map((abs) => {
    let text = '';
    try { text = readText(abs); } catch {}
    return { path: rel(abs), loc: countLines(text) };
  }).sort((a, b) => b.loc - a.loc);

  const repoMap = buildRepoMap();

  const depEdges = [];
  const exportsMap = new Map();
  const importUse = new Map();
  const events = [];
  const funcSizes = [];

  for (const abs of files) {
    const relPath = rel(abs);
    let text = '';
    try { text = readText(abs); } catch {}

    const specs = parseImports(text);
    for (const spec of specs) {
      const resolved = resolveImport(abs, spec);
      if (resolved) depEdges.push([relPath, rel(resolved)]);
    }
    const bindings = parseImportBindings(text);
    importUse.set(relPath, bindings);

    const exps = parseExports(text);
    exportsMap.set(relPath, new Set(exps.map(e => e.type === 'default' ? 'default' : e.name)));

    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const pub = line.match(/\.(?:publish)\(\s*(["'])(.*?)\1/);
      if (pub) events.push({ type: 'publish', topic: pub[2], file: relPath, line: i + 1, snippet: line.trim().slice(0, 200) });
      const sub = line.match(/\.(?:subscribe)\(\s*(["'])(.*?)\1/);
      if (sub) events.push({ type: 'subscribe', topic: sub[2], file: relPath, line: i + 1, snippet: line.trim().slice(0, 200) });
    }

    const blocks = findFunctionBlocks(text);
    for (const b of blocks) funcSizes.push({ path: relPath, function: b.name, loc: b.loc });
  }

  const nodes = Array.from(new Set(files.map(f => rel(f))));
  const graph = Object.fromEntries(nodes.map(n => [n, []]));
  for (const [a, b] of depEdges) {
    if (!graph[a]) graph[a] = [];
    graph[a].push(b);
  }

  // Tarjan SCC
  const indexMap = new Map();
  const lowlink = new Map();
  const onStack = new Map();
  const stack = [];
  let index = 0;
  const sccs = [];
  function strongconnect(v) {
    indexMap.set(v, index);
    lowlink.set(v, index);
    index++;
    stack.push(v);
    onStack.set(v, true);
    const neighbors = graph[v] || [];
    for (const w of neighbors) {
      if (!indexMap.has(w)) {
        strongconnect(w);
        lowlink.set(v, Math.min(lowlink.get(v), lowlink.get(w)));
      } else if (onStack.get(w)) {
        lowlink.set(v, Math.min(lowlink.get(v), indexMap.get(w)));
      }
    }
    if (lowlink.get(v) === indexMap.get(v)) {
      const comp = [];
      let w;
      do {
        w = stack.pop();
        onStack.set(w, false);
        comp.push(w);
      } while (w !== v);
      if (comp.length > 1) sccs.push(comp);
    }
  }
  for (const v of Object.keys(graph)) {
    if (!indexMap.has(v)) strongconnect(v);
  }

  const exportConsumers = new Map();
  for (const [consumer, bindings] of importUse.entries()) {
    for (const b of bindings) {
      const sourceAbs = resolveImport(path.resolve(ROOT, consumer), b.source);
      if (!sourceAbs) continue;
      const sourceRel = rel(sourceAbs);
      if (b.defaultImport) {
        const key = `${sourceRel}::default`;
        if (!exportConsumers.has(key)) exportConsumers.set(key, new Set());
        exportConsumers.get(key).add(consumer);
      }
      for (const n of b.named) {
        const key = `${sourceRel}::${n.imported}`;
        if (!exportConsumers.has(key)) exportConsumers.set(key, new Set());
        exportConsumers.get(key).add(consumer);
      }
    }
  }

  writeText(path.join(REPORT_DIR, 'repo_map.json'), JSON.stringify(repoMap, null, 2));

  const filesCsv = ['path,loc', ...fileStats.map(r => `${r.path},${r.loc}`)].join('\n');
  writeText(path.join(REPORT_DIR, 'files_by_loc.csv'), filesCsv);

  funcSizes.sort((a, b) => b.loc - a.loc);
  const funcsCsv = ['path,function,loc', ...funcSizes.map(r => `${r.path},${r.function},${r.loc}`)].join('\n');
  writeText(path.join(REPORT_DIR, 'functions_by_size.csv'), funcsCsv);

  writeText(path.join(REPORT_DIR, 'dep_graph.json'), JSON.stringify(graph, null, 2));

  const nodeIds = new Map();
  let idx = 0;
  for (const n of Object.keys(graph)) nodeIds.set(n, 'N' + idx++ + '_' + sanitizeId(path.basename(n, '.js')));
  const lines = ['graph LR'];
  for (const [from, tos] of Object.entries(graph)) {
    for (const to of tos) {
      if (!nodeIds.has(to)) nodeIds.set(to, 'N' + idx++ + '_' + sanitizeId(path.basename(to, '.js')));
      lines.push(`  ${nodeIds.get(from)}["${from}"] --> ${nodeIds.get(to)}["${to}"]`);
    }
  }
  writeText(path.join(REPORT_DIR, 'dep_graph.mmd'), lines.join('\n'));

  if (sccs.length > 0) {
    const cyc = ['cycle_id,size,files'];
    sccs.forEach((comp, i) => cyc.push(`${i + 1},${comp.length},"${comp.join(' | ')}"`));
    writeText(path.join(REPORT_DIR, 'cycles.csv'), cyc.join('\n'));
  } else {
    writeText(path.join(REPORT_DIR, 'cycles.csv'), 'cycle_id,size,files');
  }

  const publicSurfaceRows = ['file,export,consumers,consumer_files'];
  for (const [file, set] of exportsMap.entries()) {
    const names = Array.from(set);
    if (names.length === 0) continue;
    for (const name of names) {
      const key = `${file}::${name}`;
      const consumers = exportConsumers.get(key) || new Set();
      publicSurfaceRows.push(`${file},${name},${consumers.size},"${Array.from(consumers).join(' | ')}"`);
    }
  }
  writeText(path.join(REPORT_DIR, 'public_surface.csv'), publicSurfaceRows.join('\n'));

  const eventRows = ['topic,type,file,line,snippet'];
  for (const e of events) {
    const snip = e.snippet.replace(/"/g, '""');
    eventRows.push(`${e.topic},${e.type},${e.file},${e.line},"${snip}"`);
  }
  writeText(path.join(REPORT_DIR, 'events_catalog.csv'), eventRows.join('\n'));

  console.log('Reports written to ./reports');
}

main();



