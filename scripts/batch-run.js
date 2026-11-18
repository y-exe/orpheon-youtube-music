#!/usr/bin/env node
/* batch-collect.jsの言語別フィクスチャをharnessで順次実行し、成績と失敗ゲートを集計する。
 *
 *     node scripts/batch-run.js [ディレクトリ=scripts/fixture/batch]
 *
 * 失敗は「到達した最も深いゲート」(length/title/artist/version)で分類して出力する。
 * Copyright (C) 2026 y-exe
 * SPDX-License-Identifier: GPL-3.0-only
 */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.join(__dirname, '..');
const FIXDIR = path.resolve(ROOT, process.argv[2] || path.join('scripts', 'fixture', 'batch'));
const OUTDIR = path.join(FIXDIR, 'out');
fs.mkdirSync(OUTDIR, { recursive: true });

const keys = fs.readdirSync(FIXDIR).filter(f => f.endsWith('.json')).map(f => f.replace(/\.json$/, ''));
const summary = [];

for (const key of keys) {
    const log = path.join(OUTDIR, key + '.log');
    const t0 = Date.now();
    try {
        cp.execSync('node scripts/harness.js ' + path.relative(ROOT, path.join(FIXDIR, key + '.json')), {
            cwd: ROOT, stdio: ['ignore', fs.openSync(log, 'w'), fs.openSync(log, 'a')], timeout: 45 * 60 * 1000,
        });
    } catch (e) { /* exit code 1 = 一部FAILは正常 */ }
    // harnessのログはUTF-16LEで出ることがある。
    const buf = fs.readFileSync(log);
    const text = buf.length > 2 && buf[1] === 0 ? buf.toString('utf16le') : buf.toString('utf8');
    const match = (text.match(/^MATCH /gm) || []).length;
    const fails = (text.match(/^FAIL .+$/gm) || []).map(l => l.replace(/^FAIL\s+/, ''));
    summary.push({ key, total: match + fails.length, match, fails });
    console.log('[' + key + '] ' + match + '/' + (match + fails.length) + ' matched  (' + Math.round((Date.now() - t0) / 1000) + 's)');
    fs.writeFileSync(path.join(OUTDIR, 'summary.json'), JSON.stringify(summary, null, 1), 'utf8');
}

console.log('\n===== SUMMARY =====');
let tot = 0, ok = 0;
for (const s of summary) {
    tot += s.total; ok += s.match;
    console.log(s.key.padEnd(6) + s.match + '/' + s.total + (s.fails.length ? '  FAIL: ' + s.fails.join(' | ').slice(0, 200) : ''));
}
console.log('TOTAL: ' + ok + '/' + tot + (tot ? ' (' + Math.round(ok * 1000 / tot) / 10 + '%)' : ''));
