# Iteration 019 - file input freeze fix

## Purpose

- CSVクリック時にファイルピッカー周りで固まる問題を避ける。

## Implemented

- 隠しinputをref経由で`.click()`する実装を廃止。
- CSV/Importを`label + input[type=file]`のネイティブ挙動へ変更。
- `FileList`はawait前に配列へコピーする。
- 読み込み後にinput valueを空に戻し、同じファイルを再選択できるようにした。

## TODO

- Drag and drop importも追加すると、ブラウザ/OSのfile picker問題をさらに回避できる。

## Verification

- Passed: `vp check`
- Passed: `vp test --coverage` (38 tests, all-file line coverage 98.00%)
- Passed: `vp build`
- Passed: `pnpm binary:build`
- Passed: `curl -I http://127.0.0.1:4187/`
- Passed: `curl -I http://127.0.0.1:4187/assets/index-DGud-RJU.js`
