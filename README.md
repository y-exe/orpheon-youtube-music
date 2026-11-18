<div align="center">

<h1>YouTube Music Download Helper</h1>

[![License GPL v3](https://img.shields.io/badge/License-GPL--3.0-green?style=flat-square)](LICENSE)
[![Orpheon](https://img.shields.io/badge/Orpheon-1.0.0%2B-blue?style=flat-square)](https://github.com/kota-zo/Orpheon)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](main.js)
[![Category](https://img.shields.io/badge/store-tools-0e7690?style=flat-square)](https://github.com/kota-zo/Orpheon)

Finds a song's official master on YouTube Music and hands the original AAC/M4A to
[Orpheon](https://github.com/kota-zo/Orpheon) (formerly Myspoti), which downloads, stores and plays it.
No Orpheon fork, no resolver service, nothing running outside Orpheon.

English · [日本語](README.ja.md)

</div>

## What it does

- **Official masters only.** Answers Orpheon's `download-source` hook with ATV (artist upload) rows from the YouTube Music catalog — never ordinary videos, covers or re-encodes. The stream is the original AAC/M4A at the highest bitrate, probed head-and-tail before it is offered.
- **Multilingual.** The song's writing system picks the search language and region, English as fallback — kana, hangul, han, Cyrillic, Greek, Hebrew, Arabic, Devanagari, Thai and 15 more. Cover/live/remix/karaoke wording is refused in all of them; Chinese tolerates simplified/traditional glyph drift.
- **Strict matching.** ISRC first, then title + artist. Candidates must clear title similarity, artist containment and Orpheon's own length window; remaster notes cost score instead of refusing, and a second pass re-searches when the rankings hide the song. One track, one 25 s hook budget. Details: [docs/matching.md](docs/matching.md).
- **Rate-limit aware.** Self-limits under Orpheon's 120 req/min cap; when the cap still eats the budget it answers `{outcome: rate-limited}` so the app retries later instead of mislabeling the song *not found*.
- **Honest status.** The `status` hook shows the source inactive when YouTube Music is unreachable.
- **Verified.** A Node harness replays the same search and matching on real-store fixtures ([docs/verification.md](docs/verification.md)).

## Install

1. **Store**: open Orpheon's extension store and look for *YouTube Music Download Helper* (this repo, via the `myspoti-extension` topic).
2. **From an address**: Settings → Extensions → Install → *Install from an address* → `https://github.com/y-exe/orpheon-youtube-music`.
3. **From a file**: grab `extension.zip` from the [latest release](https://github.com/y-exe/orpheon-youtube-music/releases/latest) (or build it with `node scripts/pack.js`), push it to the phone, and choose *Install from a file*.

Requires Orpheon 1.0.0-beta.1 or newer (Myspoti 2.0.2-beta.4 and newer also work). All downloading, storage and encryption stay inside Orpheon — the extension only proposes files.

## Limits

- `download.source` is exclusive in Orpheon: while this extension is on, it owns downloads — a lossless source cannot share the duty.
- Streams behind DRM, login or signing are skipped, not bypassed. No cookies, no account tokens; an anonymous visitor id is borrowed from the public API for the duration of one request.
- `isrcMatched` is always false: an ISRC hit is not proof of an identical recording. A metadata match is not a proven recording match — stop using the extension and report if the wrong take is ever saved.
- Titles that only ever appear translated or romanized, masters whose length drifts too far, and songs lost in cover-storm rankings are not found.

## Development

Plain JavaScript for Rhino (no build step for the extension itself). Everything people
read — the store description, the install reasons, and every log line and status
detail — follows Orpheon's display language: 63 translation sets in `i18n.json`
covering all 69 language tags the app offers (Traditional Chinese and Brazilian
Portuguese have their own; other regional variants fall back to their base language,
English is the final fallback and lives in the code itself). Orpheon refuses extra
files in a package, so `pack.js` merges `i18n.json` into `main.js` and `manifest.json`
at package time; the PC harness does the same before loading the script. Release
notes are written in English and Japanese. Package it with Node:

```powershell
node scripts/pack.js          # → extension.zip (deterministic bytes, LF-normalized)
node scripts/check-i18n.js    # every message translated for every app language
```

CI runs the official SDK `check` plus a smoke test, and a pushed `vX.Y.Z` tag matching `manifest.json` becomes a release with `extension.zip`. Layout follows [kota-zo/myspoti-extension-template](https://github.com/kota-zo/myspoti-extension-template).

More: [docs/README.md](docs/README.md) — how matching works, the full-length fetch proof, the Rhino library survey, and device verification.

## Sources and licensing

Audio comes exclusively from YouTube Music's official catalog, fetched through the same public `youtubei` endpoints the YouTube Music web player uses. Nothing is decrypted: DRM streams are skipped, and the app's per-extension rate limits are respected, not avoided. This extension is not affiliated with Orpheon (formerly Myspoti), YouTube or Google.

[GPL-3.0](LICENSE) throughout. The layout and the packaging script follow [kota-zo/myspoti-extension-template](https://github.com/kota-zo/myspoti-extension-template) (MIT); matching criteria adapted from my [Myspoti fork](https://github.com/y-exe/myspoti) (kept for comparison), with the album-name signal and the remaster-note penalty taken from [spotDL](https://github.com/spotDL/spotify-downloader) and [spotify_to_ytmusic](https://github.com/sigma67/spotify_to_ytmusic) — see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for what was taken from each project and under which license.

---

© 2026 yexe
