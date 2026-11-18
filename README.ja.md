<div align="center">

<h1>YouTube Music Download Helper</h1>

[![License GPL v3](https://img.shields.io/badge/License-GPL--3.0-green?style=flat-square)](LICENSE)
[![Orpheon](https://img.shields.io/badge/Orpheon-1.0.0%2B-blue?style=flat-square)](https://github.com/kota-zo/Orpheon)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](main.js)
[![Category](https://img.shields.io/badge/store-tools-0e7690?style=flat-square)](https://github.com/kota-zo/Orpheon)

曲の公式音源をYouTube Musicで探し、元のAAC/M4Aを[Orpheon](https://github.com/kota-zo/Orpheon)(旧Myspoti)に渡す拡張機能。
ダウンロード・保存・再生はすべて本体が行います。フォーク不要・外部サーバー不要。

[English](README.md) · 日本語

</div>

## できること

- **公式音源のみ。** YouTube MusicのカタログがATV(公式楽曲)と分類した曲だけを返します。一般動画・カバー・再エンコードは拒否。渡すのは最高ビットレートの元AAC/M4Aで、先頭と末尾の範囲取得を確認してから返します。
- **多言語。** 曲の表記から検索言語と地域を決め、英語をフォールバックにします(かな・ハングル・漢字・キリル・ギリシャ・ヘブライ・アラビア・デーヴァナーガリー・タイ語ほか計25文字種)。カバー/ライブ/リミックス/カラオケ表記は全言語で拒否し、中国語は簡体字・繁体字の字形差を吸収します。
- **厳格な照合。** ISRCを最優先で、次に曲名+アーティスト。候補はタイトル類似度・アーティスト包含・本体と同じ長さ窓(−5秒/+15秒)を通過したものだけ。リマスター表記は拒否ではなく減点、公式曲がランキングに隠れたときは2巡目の再検索も行います。1曲は25秒の予算内で答えます。詳細は[docs/matching.md](docs/matching.md)(英語)。
- **レート制限対応。** 本体の120リクエスト/分の上限の下で自制し、それでも上限に達したときは `{outcome: rate-limited}` で答えて本体に後で再試行させます(*見つからない*誤登録を防ぐ)。
- **状態表示。** `status` フックは接続確認だけで答え、YouTube Musicに届かないときは無効表示にします。
- **検証済み。** PC上で同じ検索・照合を再生するNodeハーネスを実ストアのフィクスチャで回しています([docs/verification.md](docs/verification.md))。

## インストール

1. **ストア**: Orpheonの拡張ストアで *YouTube Music Download Helper* を探す(topic `myspoti-extension`)。
2. **アドレスから**: 設定 → 拡張機能 → インストール → *アドレスからインストール* → `https://github.com/y-exe/orpheon-youtube-music`。
3. **ファイルから**: [最新リリース](https://github.com/y-exe/orpheon-youtube-music/releases/latest)の `extension.zip`(または `node scripts/pack.js` でビルド)を端末に入れ、*ファイルからインストール*。

Orpheon 1.0.0-beta.1 以降が必要です(Myspoti 2.0.2-beta.4 以降でも動作します)。ダウンロード・保存・暗号化はすべて本体側で行われ、拡張は音源候補を返すだけです。

## 制限

- `download.source` は排他です。この拡張を有効にしている間、ダウンロードは本体が委ねるこの拡張だけが担い、ロスレス系ソースと併用できません。
- DRM・ログイン・署名が必要な音源は迂回せずスキップします。Cookieやアカウントトークンは使わず、公開APIから匿名のvisitor情報を1リクエストの間だけ借ります。
- `isrcMatched` は常にfalseです(ISRC一致は同一録音の保証にならない)。メタデータの一致は録音の一致の保証ではないため、違うテイクが保存されたら使用をやめて報告してください。
- 翻訳・ローマ字表記しかない曲、公式masterの長さが大きく違う曲、カバーコーナーに埋もれた曲は見つかりません。

## 開発

拡張本体はRhinoで動くプレーンなJavaScript(ビルド不要)。ユーザーが読むすべての文字 — ストアの説明文・インストール時の理由・ログや状態表示の文 — は本体の表示言語に従い、`i18n.json` に63言語分を収録しています(本体が持つ69の言語タグすべてを網羅。繁体字中国語とブラジルポルトガル語は独立訳、他の地域変体は基言語へ、最後は英語に落ちます。英語はコード内に基準文として置いています)。Orpheonはパッケージに余分なファイルを許さないため、`pack.js` がパッケージ化のときに `i18n.json` を `main.js` と `manifest.json` へ統合し、PCハーネスも同じ方法で差し込んでから読み込みます。リリースノートは英語と日本語で書きます。パッケージングはNodeで行います。

```powershell
node scripts/pack.js          # → extension.zip(決定的バイト列・LF正規化)
node scripts/check-i18n.js    # 全メッセージ×全言語の訳漏れ検査
```

CIは公式SDKの `check` とスモークテストを実行し、`manifest.json` と一致する `vX.Y.Z` タグのpushで `extension.zip` を添付したリリースを作ります。構成は [kota-zo/myspoti-extension-template](https://github.com/kota-zo/myspoti-extension-template) に準拠。

詳細は [docs/README.md](docs/README.md)(英語)— 照合の仕組み、フル尺取得の検証、Rhinoライブラリ調査、実機での確認手順。

## 参考・ライセンス

音源はYouTube Musicの公式カタログから、Webプレイヤーと同じ公開 `youtubei` エンドポイント経由でのみ取得します。復号は行わず、DRM音源はスキップ。本体のレート制限は回避せず従います。Orpheon(旧Myspoti)・YouTube・Googleとは無関係です。

全体を[GPL-3.0](LICENSE)とします。構成とパッケージングスクリプトは [kota-zo/myspoti-extension-template](https://github.com/kota-zo/myspoti-extension-template)(MIT)に準拠。照合基準は私の[Myspotiフォーク](https://github.com/y-exe/myspoti)から採用し、アルバム名による順位付けとリマスター表記の減点は [spotDL](https://github.com/spotDL/spotify-downloader) と [spotify_to_ytmusic](https://github.com/sigma67/spotify_to_ytmusic) から取り入れました。各プロジェクトから取り込んだ内容とライセンスは [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) にまとめています。

---

© 2026 yexe
