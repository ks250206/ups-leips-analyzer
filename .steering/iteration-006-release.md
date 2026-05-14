# Iteration 006 Release

## Goal

検証、Go単一バイナリ、READMEを整える。

## Implemented

- `pnpm binary:build` で `dist/` を埋め込むGo binaryを生成。
- SPA fallback付きローカルHTTPサーバー。
- READMEを短い入口に整理。
- plot PNG/SVG exportを実装。
- 右操作パネルをData/UPS/LEIPS/Band/Fitのタブに分け、初期表示の詰まりを改善。
- `vp check`、`vp test`、`vp test --coverage`、`vp build`、`pnpm binary:build` を実行。
- `curl -I /` と `/assets/index-*.js` でバイナリ配信を確認。

## TODO

- Windows/Linux/macOSビルド成果物のCI化。
- Playwright E2Eの導入。

## Simplifications

- 署名、インストーラ、自動更新は未実装。

## Tests

- `vp check`: pass。
- `vp test`: 6 files / 27 tests pass。
- `vp test --coverage`: Lines 97.95%、Branches 84.15%。
- `vp build`: pass。
- `pnpm binary:build`: pass。
