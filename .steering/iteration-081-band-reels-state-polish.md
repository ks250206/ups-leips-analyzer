# Iteration 081: Band Diagram and REELS State Polish

## Purpose

Band Diagramの表示丸めとIgor風のCBM線を調整し、REELS Plotのviewport/cursor状態をProject保存対象にする。TopBarの右側は手動Recalculateではなく現在の表示倍率を見せる。

## Implemented

- Band Diagramのindicator有効数字defaultを3桁にした。
- Band DiagramのX range入力は小数第2位まで表示するようにした。
- CBMの点線は上側を短くし、IgorProの見た目に寄せた。
- REELS Plotのviewportを`ProjectUiState.reelsPlotViewport`として保持し、Project save/load/import/exportで復元できるようにした。
- REELS BG single point modeをglobal cursor styleから分離し、Project UI stateとして保存し、REELS Plotのcontext menuにだけ表示するようにした。
- REELS BG single point modeではREELS BG fit線を描かず、`y = y0`の水平線だけを表示し、Eg表示も水平BG線との交点から計算するようにした。
- TopBar右側の`Recalculate`を外し、workspace zoom倍率を表示するようにした。
- Help windowの初期位置を`UPS_analysis`の下に移動した。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build`
- in-app browserで`Zoom 100%`表示とTopBarから`Recalculate`が消えていることを確認した。

## TODO

- REELS viewport復元はProject内の保存状態をplotへ反映する軽量実装。将来、全plot viewportを共通UI state schemaへ揃える。

## Simplifications / Debt

- REELS BG single point modeの交点はREELS Plot側で表示用に再計算している。ドメイン結果へ正式反映する場合は、`calculateREELSResult`にBG model種別を渡す。
- Help windowの初期位置は固定座標で、UPS_analysis windowの移動には追従しない。
