#!/usr/bin/env node
/* 多言語の実ストア相当フィクスチャを集める: Deezerのプレイリスト検索(チャート/インディー/
 * ジャンル)+ 曲名直接検索から言語ごとに最大100曲。harness形式(題名・アーティスト・アルバム・
 * 尺・ISRC)で scripts/fixture/batch/{lang}.json に書く。ディレクトリごとgitignored。
 *
 *     node scripts/batch-collect.js [1言語の曲数=100] [この言語だけ]
 *
 * Copyright (C) 2026 y-exe
 * SPDX-License-Identifier: GPL-3.0-only
 */
'use strict';
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'fixture', 'batch');
const TARGET = Number(process.argv[2]) || 100;
const ONLY = process.argv[3] || '';
const sleep = ms => new Promise(r => setTimeout(r, ms));

// 各言語: 文字種フィルタ(任意)とクエリ(ネイティブ+英語。インディー・ジャンルも混ぜる)。
const LANGS = [
    { key: 'ja', script: /[\u3040-\u30ff\u3400-\u9fff]/, queries: ['j-pop hits', 'j-rock', 'japanese indie', 'japanese acoustic', 'j-urban'] },
    { key: 'ko', script: /[\uac00-\ud7af]/, queries: ['k-pop hits', 'korean indie band', 'korean ballad', 'korean rnb'] },
    { key: 'zh', script: /[\u3400-\u9fff]/, queries: ['mandarin hits', 'cantonese hits', 'chinese indie', 'chinese pop songs'] },
    { key: 'ru', script: /[\u0400-\u04ff]/, queries: ['russian pop hits', 'russian rock', 'russian rap'] },
    { key: 'es', queries: ['pop latino hits', 'rock espanol', 'reggaeton', 'musica espanola indie'] },
    { key: 'pt', queries: ['brasil top hits', 'MPB brasileira', 'sertanejo', 'rock brasileiro'] },
    { key: 'fr', queries: ['chanson francaise', 'rap francais', 'pop francaise hits', 'Top France'] },
    { key: 'de', queries: ['deutsche pop hits', 'deutscher rock', 'deutschrap', 'Top Germany'] },
    { key: 'it', queries: ['musica italiana hits', 'rock italiano', 'pop italiano', 'Top Italy'] },
    { key: 'tr', queries: ['turkce pop', 'turkish rock', 'turkce rap', 'arabesk'] },
    { key: 'hi', script: /[\u0900-\u097f]/, queries: ['bollywood songs', 'hindi indie', 'punjabi hits', 'hindi romantic'] },
    { key: 'id', queries: ['pop indonesia hits', 'indie indonesia', 'band indonesia'] },
    { key: 'vi', script: /[\u01b0\u01a1\u0111\u1ea0-\u1eff]/, queries: ['nhac viet hits', 'vpop', 'indie viet', 'nhac tru tinh'] },
    { key: 'th', script: /[\u0e00-\u0e7f]/, queries: ['thai pop hits', 'เพลงไทย', 'string thai', 'indie thailand'] },
    { key: 'ar', script: /[\u0600-\u06ff]/, queries: ['arabic pop songs', 'arabic songs', 'egyptian pop', 'arabic indie'] },
    { key: 'he', script: /[\u0590-\u05ff]/, queries: ['israeli songs', 'hebrew songs', 'israeli rock', 'mizrahi music'] },
    { key: 'el', script: /[\u0370-\u03ff]/, queries: ['greek songs', 'greek pop', 'laiko', 'greek rock'] },
    { key: 'nl', queries: ['nederpop hits', 'nederlandse hits', 'hollandse indie'] },
    { key: 'pl', queries: ['polskie przeboje', 'polski rap', 'polski rock', 'disco polo'] },
    { key: 'sv', queries: ['svenska hits', 'svensk pop', 'svensk rock', 'svensk indie'] },
    { key: 'en', queries: ['top worldwide hits', 'indie hits', 'alternative rock hits', 'acoustic singer songwriter'] },
    { key: 'fa', script: /[\u067e\u0686\u0698\u06af]/, queries: ['persian songs', 'persian pop hits', 'persian traditional'] },
    { key: 'ur', script: /[\u0679\u0688\u0691\u06ba\u06be\u06d2]/, queries: ['urdu songs', 'pakistan pop', 'coke studio'] },
    { key: 'bn', script: /[\u0980-\u09ff]/, queries: ['bangla songs', 'bengali songs', 'bangla film songs'] },
    { key: 'ta', script: /[\u0b80-\u0bff]/, queries: ['tamil songs', 'tamil film songs', 'tamil melody'] },
    { key: 'te', script: /[\u0c00-\u0c7f]/, queries: ['telugu songs', 'telugu film songs', 'telugu melody'] },
    { key: 'kn', script: /[\u0c80-\u0cff]/, queries: ['kannada songs', 'kannada film songs'] },
    { key: 'ml', script: /[\u0d00-\u0d7f]/, queries: ['malayalam songs', 'malayalam film songs'] },
    { key: 'gu', script: /[\u0a80-\u0aff]/, queries: ['gujarati songs garba'] },
    { key: 'pa', script: /[\u0a00-\u0a7f]/, queries: ['punjabi songs', 'punjabi pop'] },
    { key: 'lo', script: /[\u0e80-\u0eff]/, queries: ['lao songs', 'laos music'] },
    { key: 'my', script: /[\u1000-\u109f]/, queries: ['myanmar song', 'burmese music'] },
    { key: 'km', script: /[\u1780-\u17ff]/, queries: ['khmer songs', 'cambodia music'] },
    { key: 'ka', script: /[\u10a0-\u10ff]/, queries: ['georgian songs', 'georgia music'] },
    { key: 'hy', script: /[\u0530-\u058f]/, queries: ['armenian songs'] },
    { key: 'am', script: /[\u1200-\u137f]/, queries: ['ethiopian songs', 'amharic music'] },
];
// ヒンディー語等はDeezerがローマ字表記で返すことがある。足りない言語は文字種フィルタを外した
// 追加クエリで補う(照合テスト自体は成立する)。
const RELAXED = {
    ja: ['japanese cover songs'], ko: ['korean pop', 'kpop songs'],
    ar: ['arabic hits', 'sham hits'], he: ['israeli top'], el: ['ellinika tragoudia'],
    hi: ['bollywood', 'hindi songs'], fa: ['farsi music'], ur: ['pakistan music'],
    bn: ['bangla hits'], ta: ['tamil', 'tamil melody'], te: ['telugu'], kn: ['kannada'],
    ml: ['malayalam'], gu: ['gujarati'], pa: ['panjabi mc'], lo: ['lao'], my: ['myanmar'],
    km: ['khmer'], ka: ['kartuli simghera'], hy: ['armenian'], am: ['amharic', 'ethiopian music'],
};

async function getJson(url) {
    for (let a = 0; a < 3; a++) {
        try {
            const r = await fetch(url, { headers: { 'user-agent': 'orpheon-youtube-music-batch/1.0' } });
            if (r.status === 429) { await sleep(3000); continue; }
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return await r.json();
        } catch (e) { if (a === 2) throw e; await sleep(1500); }
    }
}

function pass(lang, x) {
    if (!x.title || !x.artist || x.duration < 45 || x.duration > 900) return false;
    return !lang.script || lang.script.test(x.title) || lang.script.test(x.artist.name || '');
}

async function fromPlaylist(lang, q) {
    const j = await getJson('https://api.deezer.com/search/playlist?q=' + encodeURIComponent(q) + '&limit=8');
    const pl = (j.data || []).find(p => p.nb_tracks >= 30 && p.nb_tracks <= 2000);
    if (!pl) return [];
    const t = await getJson('https://api.deezer.com/playlist/' + pl.id + '/tracks?limit=300');
    return (t.data || []).filter(x => pass(lang, x));
}

async function fromTrackSearch(lang, q) {
    const rows = [];
    for (const index of [0, 100]) {
        const j = await getJson('https://api.deezer.com/search/track?q=' + encodeURIComponent(q) + '&limit=100&index=' + index);
        for (const x of (j.data || [])) if (pass(lang, x)) rows.push(x);
        if ((j.data || []).length < 100) break;
        await sleep(300);
    }
    return rows;
}

async function collect(lang, queries) {
    const pool = [], seen = new Set(), artistCount = {};
    for (const q of queries) {
        if (pool.length >= TARGET * 1.5) break;
        try {
            let rows = await fromPlaylist(lang, q);
            if (rows.length < 20) {
                const tr = await fromTrackSearch(lang, q);
                if (tr.length > rows.length) rows = tr;
            }
            let added = 0;
            for (const x of rows) {
                const k = (x.title + '|' + x.artist.name).toLowerCase();
                if (seen.has(k)) continue;
                const ac = artistCount[x.artist.name] || 0;
                if (ac >= 2) continue; // 同一アーティストの占拠を避ける
                seen.add(k); artistCount[x.artist.name] = ac + 1;
                pool.push({ x, src: q }); added++;
            }
            console.log('    ' + q + ' -> +' + added + ' (pool ' + pool.length + ')');
        } catch (e) { console.log('    ' + q + ' ERR ' + e.message); }
        await sleep(300);
    }
    // プールから均等に選ぶ(先頭のヒット曲に偏らないよう間を空ける)。
    const step = Math.max(1, pool.length / TARGET), picks = [], used = new Set();
    for (let i = Math.floor(step / 2); i < pool.length && picks.length < TARGET; i += step) {
        const p = pool[Math.floor(i)];
        const k = (p.x.title + '|' + p.x.artist.name).toLowerCase();
        if (used.has(k)) continue; used.add(k); picks.push(p);
    }
    const out = [];
    for (const p of picks) {
        await sleep(120);
        let isrc = '';
        try { const d = await getJson('https://api.deezer.com/track/' + p.x.id); isrc = d.isrc || ''; } catch (e) {}
        out.push({
            label: lang.key + ': ' + String(p.x.title).slice(0, 30) + ' / ' + String(p.x.artist.name).slice(0, 24) + ' [' + String(p.src).slice(0, 16) + ']',
            title: p.x.title,
            artist: p.x.artist.name,
            album: (p.x.album || {}).title || '',
            durationMs: p.x.duration * 1000,
            isrc: isrc,
        });
    }
    return out;
}

(async () => {
    fs.mkdirSync(OUT, { recursive: true });
    const targets = LANGS.filter(l => !ONLY || l.key === ONLY);
    for (const lang of targets) {
        console.log('[' + lang.key + ']');
        try {
            let tracks = await collect(lang, lang.queries);
            if (tracks.length < TARGET && RELAXED[lang.key]) {
                // フィルタを緩めて上乗せ: Deezerはヒンディー語等をローマ字表記で返すことがある。
                const extra = await collect({ key: lang.key, script: null }, RELAXED[lang.key]);
                const have = new Set(tracks.map(t => (t.title + '|' + t.artist).toLowerCase()));
                for (const t of extra) {
                    const k = (t.title + '|' + t.artist).toLowerCase();
                    if (!have.has(k)) { have.add(k); tracks.push(t); }
                }
            }
            fs.writeFileSync(path.join(OUT, lang.key + '.json'), JSON.stringify(tracks, null, '\t') + '\n');
            console.log('  -> wrote ' + tracks.length + ' tracks');
        } catch (e) { console.log('  ERR ' + e.message); }
        await sleep(400);
    }
    const files = fs.readdirSync(OUT).filter(f => f.endsWith('.json'));
    let total = 0;
    for (const f of files) total += JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8')).length;
    console.log('done: ' + files.length + ' languages, ' + total + ' tracks');
})();
