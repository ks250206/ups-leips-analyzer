# UPS-LEIPS Analyzer

UPS/LEIPSスペクトルを読み込み、VBM、cut-off、IP、LEET(der)ピーク、真空準位、EA、UPS-LEIPSバンド図をブラウザ内で解析するVite+ / Reactアプリです。

詳細仕様は `docs/`、実装ログは `.steering/` を参照してください。

## 開発

```sh
vp install
vp dev
vp check
vp test
vp test --coverage
vp build
```

## 単一バイナリ

```sh
pnpm binary:build
./bin/ups-leips-analyzer
```

デフォルトでは `http://127.0.0.1:4173/` で起動します。
