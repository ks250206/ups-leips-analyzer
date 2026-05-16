# Iteration 107: Analysis Controls semantic split

## Purpose

`AnalysisControls.tsx` をtab routing中心へ縮小し、shared form部品と純粋helperを分離する。
Sample Info、Data assignment、UPS/LEIPS/REELS/Band/Fitの挙動は変更しない。

## Implemented

- `AnalysisControls.tsx` はtab state、store action取得、panel routing中心にした。
- `AnalysisControlModel.ts` にfit target定義、dataset slot定義、IP source補助計算を移動した。
- `AnalysisControlParts.tsx` にdataset multi-select、IP source select、Sample Info fields、Panel、ResultGrid、RangeEditorを移動した。
- `AnalysisRangeInput.tsx` にfit range数値入力のdraft state処理を移動した。

## Current line counts

- `src/ui/windows/AnalysisControls.tsx`: 266 lines
- `src/ui/windows/AnalysisControlParts.tsx`: 304 lines
- `src/ui/windows/AnalysisControlModel.ts`: 83 lines
- `src/ui/windows/AnalysisRangeInput.tsx`: 52 lines

## TODO

- 後続iterationでWorkspace、Store/model、巨大testを分割する。

## Simplifications / technical debt

- Panelごとの個別ファイル化は行わず、まずshared parts単位にまとめた。300行前後に収まっており、次に機能追加が入る場合はpanel別ファイルへ切り出す。

## Tests

- `vp check`
