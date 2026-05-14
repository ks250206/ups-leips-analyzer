# Iteration 000 Bootstrap

## Goal

SSoT、Vite+ scaffold、Tailwind、test基盤、Go wrapper、sample非コミットを整える。

## Implemented

- `AGENTS.md` と `docs/**/*.md` をSSoTとして追加。
- `.gitignore` に `sample/`、`dist/`、`bin/`、coverageを追加。
- Vite+ React TypeScript scaffoldをルートへ配置。
- Tailwind 4 Vite plugin、uPlot、Zustand、Dexie、TanStack Table/Virtual、react-rndを採用。
- Go単一バイナリ用のbuild scriptを定義。

## TODO

- ドメイン解析、CSV parser、GUI、Project永続化、バイナリsmokeを順次実装する。

## Simplifications

- `.spe` バイナリ解析はv1対象外。

## Tests

- 後続イテレーションで `vp check`、`vp test`、`vp test --coverage`、`vp build` を実行する。
