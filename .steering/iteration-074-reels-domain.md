# Iteration 074: REELS Domain / Parser / Store

## Purpose

REELSをUPSと同じ線形fitモデルで解析できるように、domain/parser/storeの基礎を追加する。

## Implemented

- `SpectrumKind`に`reels`を追加し、MultiPak CSVのfilename/headerから`REELS`を判定するようにした。
- `reels-edge`、`reels-bg`、`REELSResult`、`reelsIncidentEnergy`、`reelsDatasetId`を追加した。
- `convertKineticToLoss`と`calculateREELSResult`を追加し、`Electron loss energy = incidentEnergy - kineticEnergy`上でedge/BG交点を`bandGap`にするようにした。
- Demo datasetに合成REELSを追加し、storeのauto-select、migration、recalculateでREELS結果を保持するようにした。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`

## TODO

- REELS Plot window、Analysis ControlsのREELS tab、window/menu integrationはIteration 075で実装する。

## Simplifications / Debt

- REELS v1のincident energy defaultはIgor macro互換の`1000 eV`固定。UI編集は次iterationで追加する。
