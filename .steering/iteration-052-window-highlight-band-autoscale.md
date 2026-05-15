# Iteration 052: Window Highlight and Band Autoscale

## Purpose

Active windowの視認性を上げ、Band Diagramのoffset変更時にautoscaleが追従してoffsetが効かない問題を直す。

## Implemented

- 最前面windowを`isActive`として`WindowFrame`へ渡すようにした。
- Active windowはborderを濃くし、shadowを大きくし、淡いcyan ringを付けるようにした。
- Band DiagramのAuto/double click resetを、空viewportではなく現在のX/Y/Y2 domainを明示的に固定する方式へ変更した。
- `createBandAutoViewport`を追加し、offset変更後も固定domainが維持されることをunit testで固定した。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build`
- `curl -I http://127.0.0.1:4199/`
- `curl -I http://127.0.0.1:4199/assets/index-*.js`
- Browser smoke: app renders with active window styling changes available and Band Diagram window present.

## TODO

- 実データ表示状態でBand DiagramのAuto/double click reset後にUPS+/LEIPS+が見かけのoffsetとして効くことを継続確認する。

## Simplifications / Debt

- Active window判定は現在の最大z-indexに基づく。z-index正規化は後続。
