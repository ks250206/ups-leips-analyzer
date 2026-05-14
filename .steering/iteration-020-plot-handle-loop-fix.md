# Iteration 020 - plot handle loop fix

## Purpose

- データロード後に処理が止まる、無限ループのように見える挙動を止める。

## Implemented

- uPlotの`draw`/`ready` hookから同期するカーソルhandle stateを、内容が変わった時だけ更新するようにした。
- handleの座標比較はサブピクセル差で再描画ループしないよう0.25px未満を同値扱いにした。

## Root Cause

- plot描画hookが毎回新しいhandle配列を`setHandles`していた。
- データロード後にrange bandが有効になると、uPlot draw -> React state update -> redrawの循環が発生しやすくなっていた。

## Verification

- Passed: `vp check --fix`
- Passed: `vp test --coverage` (38 tests, all-file line coverage 98.00%)
- Passed: `vp build`
- Passed: `pnpm binary:build`
- Passed: `curl -I http://127.0.0.1:4187/`
- Passed: `curl -I http://127.0.0.1:4187/assets/index-Dsu3WZZ3.js`
