# UPS-LEIPS Analyzer 開発ルール

このリポジトリは、UPS/LEIPS解析を Vite+ / React / TypeScript のクライアントサイドアプリとして再構築し、Go の単一バイナリで配布する。

## SSoT

- 仕様と判断は `docs/**/*.md` に集約する。
- `AGENTS.md` は守るべきルールとSSoTリンクを持つ入口にする。
- イテレーションごとの実装内容、TODO、完了範囲、簡易実装、実行テストは `.steering/iteration-*.md` に記録する。
- 実装が仕様からずれたら、コードだけでなく `docs/` と `.steering/` も更新する。

## 開発コマンド

Vite+ を標準入口にする。

```sh
vp install
vp dev
vp check
vp test
vp test --coverage
vp build
```

`pnpm` は `package.json` scripts の実行と Go バイナリビルドでのみ使う。

```sh
pnpm binary:build
./bin/ups-leips-analyzer
```

## 実装方針

- `sample/` はローカル検証専用で、Gitに含めない。
- v1はMultiPak CSVを正式対応にする。`.spe` バイナリ解析は後続イテレーション扱い。
- `src/domain` は純粋関数を置き、UIやIndexedDBに依存させない。
- `src/io` はCSVなど外部データ形式の変換を担う。
- `src/store` はZustandとDexieによるProject状態と永続化を担う。
- `src/ui` はマルチウィンドウ、表、plot、解析操作を担う。
- plotはuPlot、表はTanStack Table + TanStack Virtualを使う。
- Reactコンポーネントは巨大なboolean prop APIを避け、表示単位ごとに分割する。

## TDD / 品質ゲート

- 古典学派のTDDを基本にする。失敗テスト、最小実装、リファクタの順で進める。
- モックは極力使わず、ドメイン計算と保存処理は実データ構造またはin-memory IndexedDBで検証する。
- `src/domain`、`src/io`、`src/store` のカバレッジ目標は80%以上。
- 各イテレーション完了時に `vp check`、`vp test`、`vp test --coverage`、`vp build` を通す。
- Goバイナリは `pnpm binary:build` 後に起動し、`/` と `/assets/...` が返ることを確認する。

## Vite+ 注意点

- `vitest` は直接importしない。テストAPIは `vite-plus/test` からimportする。
- `vp check` と `vp test` を使い、`vp vitest` や `vp oxlint` のような存在しないコマンドは使わない。
- `oxfmt` / `oxlint` はVite+の管理下で動かす。
