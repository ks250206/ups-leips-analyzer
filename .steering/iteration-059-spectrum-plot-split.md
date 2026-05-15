# Iteration 059: Spectrum Plot Split

## Purpose

`SpectrumPlot.tsx`からscale/geometry/interaction/export/SVG部品を分離し、D3 plot本体をcontainer componentへ近づける。

## Implemented

- `SpectrumPlotScales.ts`にplot geometry、scale、domain、tick formattingを移した。
- `SpectrumPlotInteraction.ts`にdrag、pan、cursor lifecycleを移した。
- `SpectrumPlotViewport.ts`にwheel、viewport、cursor/range mathを移した。
- `SpectrumPlotChrome.tsx`にNo data placeholderとselection overlayを移した。
- `SpectrumPlotParts.tsx`にaxis、series path、range band、marker、cursor handleを移した。
- `plotExport.ts`にSVG/PNG exportを移した。
- 既存test import互換のため、`SpectrumPlot.tsx`から既存helper exportをre-exportした。

## Line Counts

- `src/ui/windows/SpectrumPlot.tsx`: 319 lines
- `src/ui/windows/SpectrumPlotChrome.tsx`: 70 lines
- `src/ui/windows/SpectrumPlotParts.tsx`: 323 lines
- `src/ui/windows/SpectrumPlotModel.ts`: 37 lines
- `src/ui/windows/SpectrumPlotScales.ts`: 183 lines
- `src/ui/windows/SpectrumPlotInteraction.ts`: 150 lines
- `src/ui/windows/SpectrumPlotViewport.ts`: 280 lines
- `src/ui/windows/plotExport.ts`: 45 lines

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`

## TODO

- `SpectrumPlot.tsx`と`SpectrumPlotParts.tsx`は300行を少し超えている。既存props/APIとhelper re-export互換を優先し、追加分割はIteration 061のcleanup候補に残す。
- 最終Iterationで`pnpm binary:build`とGo binary smokeを実行する。

## Simplifications / Debt

- 挙動変更を避けるため、test import互換を優先して`SpectrumPlotModel.ts`をre-export façadeとして残した。
- 今回はD3操作仕様や表示ロジックは変更していない。
