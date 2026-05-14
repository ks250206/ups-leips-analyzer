# Testing and Release

## Test Policy

- ドメイン計算は純粋関数としてunit testで確認する。
- parserはコミット可能な合成fixtureで確認し、`sample/` に依存しない。
- storeはfake-indexeddbでDexie roundtripを確認する。
- UIはTesting Libraryで主要ラベルと結果表示を確認する。

## Gates

```sh
vp check
vp test
vp test --coverage
vp build
pnpm binary:build
```

## Manual Smoke

1. `vp dev` で起動する。
2. demo datasetが表示される。
3. UPS/LEIPS計算結果とBand Diagramが表示される。
4. Project JSON export/importが動く。
5. Goバイナリで `/` と `/assets/...` が返る。
