# Iteration 018 - empty initial project and demo button

## Purpose

- 起動直後はデータロードなしにする。
- Demoボタンを押したときだけdemo datasetが表示されるようにする。

## Implemented

- Zustand storeの初期projectを空datasetの`createEmptyProject`へ変更。
- `loadDemo()`はdemo dataset入りの`createDemoProject`を作るように分離。
- `createInitialProject()`は互換用に空projectを返す。
- 初期状態0件、Demo後5件をstore testで固定。
- App smoke testを空初期状態に合わせて更新。

## TODO

- 空状態で各plotに明示的なempty stateを表示するか検討。

## Verification

- Passed: `vp check`
- Passed: `vp test --coverage` (38 tests, all-file line coverage 98.00%)
- Passed: `vp build`
- Passed: `pnpm binary:build`
- Passed: `curl -I http://127.0.0.1:4187/`
- Passed: `curl -I http://127.0.0.1:4187/assets/index-DvjIOXTS.js`
