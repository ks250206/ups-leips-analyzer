# Iteration 082: Band X Range and Range Cursor Visual

## Purpose

Band DiagramのX range controlを左が高エネルギー側、右が低エネルギー側に並べ、defaultを`8`から`-5`にする。range cursor表示は境界線を試験的に消し、塗りとラベルだけで見やすさを確認する。

## Implemented

- `DEFAULT_BAND_X_RANGE`を`{ min: -5, max: 8 }`として追加した。
- Band DiagramのAuto/double click resetと初期viewportは、X rangeを`8`から`-5`に固定するようにした。
- X range formは左入力に高エネルギー側`xMax`、右入力に低エネルギー側`xMin`を表示するようにした。
- range cursor modeの境界線を非表示にし、range bandの薄い塗りと用途ラベル、透明drag targetだけを残した。
- docs/SSoTにBand Diagram X rangeとrange cursor表示方針を追記した。

## Tests

- `DEFAULT_BAND_X_RANGE`のunit testを追加した。

## TODO

- range cursor境界線なしの視認性を実データで確認し、必要なら薄い短線やhandleだけ復活させる。

## Simplifications / Debt

- Band Diagram X range defaultは固定値とした。データ範囲に応じた自動候補は後続で必要になったら検討する。
