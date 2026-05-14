# Iteration 021: Event Loop and Window Drag Recovery

## Purpose

CSVクリック後に処理が止まる挙動と、マルチウィンドウのドラッグが効かなくなる退行を直す。

## Implemented

- uPlot標準のdrag zoomを無効化し、plot領域だけに限定した手動drag zoomへ切り替え。
- Shift+dragはfit range選択、通常dragはX軸zoomとして扱う。
- uPlot `draw` hook内でReact stateを更新しないようにし、cursor handle同期を`ready`/`setScale`/resize/drag完了時へ限定。
- データ無し/空points時はuPlotを生成せず、`No data` placeholderを表示する。
- 空データ時のcursor handle state更新をガードし、デフォルト空配列propsを参照安定化した。
- CSV/Importの透明file input overlayを廃止し、`sr-only` input + `label htmlFor`へ変更。
- 既に最前面のwindowをfocusしてもz-indexを更新しないようにした。
- `SpectrumPlot`のoption testを、uPlot標準drag無効化の期待値へ更新。
- 空Projectで`recalculate`してもUPS/LEIPS/Band計算とerror生成をしないことをstore testで固定。
- 空ProjectではTanStack Table/Virtualizerを起動せず、`No dataset`を即時表示するようにした。
- 空ワークスペースでAnalysis tab clickと`Recalculate`が動くUI testを追加。

## TODO

- Browser上でCSV picker、window drag、plot drag zoom、Shift+drag range選択の手動確認を継続する。

## Scope

- 今回はフリーズ/ドラッグ競合の修正に限定。
- LEIPS軸の意味論や表示方向の追加変更は、UI操作が安定した後に別iterationで扱う。

## Tests

- Passed: `vp check`
- Passed: `vp test --coverage`
- Passed: `vp build`
- Passed: `pnpm binary:build`
