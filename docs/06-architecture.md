# Architecture

## Layers

- `src/domain`: スペクトル型、線形fit、ガウスfit、UPS/LEIPS/REELS/バンド図計算、Sample Info helper。
- `src/io`: MultiPak CSV parserとdataset kind推定。
- `src/store`: Zustand store、Catalog registry Dexie、Catalog別Project Dexie、Project/Catalog import/export。
- `src/ui`: Workspace window、Data Browser、Table、D3/SVG plot wrapper、解析パネル。

## Module Responsibilities

- `src/store/projectStore.ts`: Zustand store composition、初期state、公開store APIの入口。
- `src/store/projectStoreTypes.ts`: Zustand storeの公開interface。
- `src/store/projectStoreHelpers.ts`: dataset selection repair、UPS IP fit range/config seed、record key omit helper。
- `src/store/projectStoreDatasetActions.ts`: dataset load/add/delete/role変更、Data tab assignment、UPS IP multi-select。
- `src/store/projectStoreAnalysisActions.ts`: fit range、UPS IP applied voltage、Band IP source、bandpass、REELS incident energy、manual EF-EVBM、再計算。
- `src/store/projectStoreUiActions.ts`: plot viewport、active UPS IP dataset、REELS BG mode、plot cursor style、Sample Info。
- `src/store/projectStoreWindowActions.ts`: window update/focus/reset、Help/Project List utility window。
- `src/store/projectStoreLifecycleActions.ts`: Project/Catalog save/load/import/export/delete/rename、last-opened restore。
- `src/store/projectStoreLifecycleHelpers.ts`: default catalog、active Catalog DB解決、Catalog内最新Project取得。
- `src/store/projectStoreUpdateHelpers.ts`: Project touch/recalculate、UI state patch helper。
- `src/store/projectStoreSliceTypes.ts`: Zustand slice factory用 `set/get` 型。
- `src/store/projectStoreTestUtils.ts`: store tests共通のCatalog reset、demo fixture、UPS IP result fixture。
- `src/store/projectStoreLifecycle.test.ts`: Project/Catalog persistence、last-opened restore、Catalog import/exportのstore integration tests。
- `src/store/projectStoreAnalysis.test.ts`: analysis recalculation、normalization、UI state、window geometryのstore-adjacent tests。
- `src/store/projectStoreDatasets.test.ts`: dataset load/import/delete/role change、auto-selection、UPS IP multi-selectのstore integration tests。
- `src/store/projectFactory.ts`: 空Project、demo Project、初期dataset/window生成。
- `src/store/projectModel.ts`: 既存import互換のProject model re-export、`fitRangeKey`、`touchProject`。
- `src/store/projectAnalysisRecalculation.ts`: UPS/LEIPS/REELS/Band Diagramの解析再計算とエラー集約。
- `src/store/projectNormalization.ts`: Project JSON/load時のnormalization、window migration、Sample Info/UPS IP migration。
- `src/store/projectFitRanges.ts`: LEIPS/REELS fit range自動推定、bandpass energy解決。
- `src/store/projectBandIpSource.ts`: Band Diagram用IP source解決、0 V外挿、平均、dataset指定。
- `src/store/projectAxisLabels.ts`: dataset kind別axis label。
- `src/store/projectModelSelection.ts`: dataset merge、demo判定、auto selection、UPS IP selection/range/applied voltage helper。
- `src/store/projectDb.ts`: Catalog registry DB、Catalog別Project DB生成、legacy Project DB migration、Project/Catalog gzip import/export。
- `src/store/lastOpenedWorkspace.ts`: 前回最後に開いたCatalog/Project IDを`localStorage`へ保存するユーザー環境state。Project/Catalog archiveには含めない。
- `src/store/windowModel.ts`: workspace window生成とdefault layout。
- `ProjectSnapshot.ui`: UPS/LEIPS/REELS/Band Diagram plot viewport、UPS IP dataset別plot viewport、plot別cursor表示設定、Sample Info、Help window状態などProjectと一緒に復元したいUI state。Sample Infoのmulti-select値はProject JSON import時に旧string値から配列へ軽量migrationする。
- `src/ui/Workspace.tsx`: workspace shell、window frame配置、modal open state、top-level orchestration。
- `src/ui/workspace/WorkspaceViewport.ts`: workspace pan/zoom state and handlers。
- `src/ui/workspace/WorkspaceLastOpened.ts`: 前回workspace復元とlocalStorage書き込みeffect。
- `src/ui/workspace/WorkspaceFileActions.ts`: Project/Catalog import/export download/upload。
- `src/ui/workspace/WorkspaceModalActions.ts`: Project/Catalog modal action side effects。
- `src/ui/workspace/WorkspaceModalLayer.tsx`: Project/Catalog modal rendering。
- `src/ui/workspace/WorkspaceMenu.tsx`: TopBar/background context menuの共通menu definition。
- `src/ui/workspace/WorkspaceWindows.tsx`: window kindごとのtitle/icon/render/context menu/help window。
- `src/ui/workspace/UpsIpTitleSelector.tsx`: UPS IP window titlebar dataset selector。
- `src/ui/workspace/workspaceTabs.ts`: window kindからAnalysis tabへの対応。
- `AnalysisState.upsIpDatasetIds`: 複数UPS IP dataset選択。旧`upsIpDatasetId`はProject import時に配列へmigrationする。
- `AnalysisState.upsIpFitRangesByDatasetId` / `upsIpConfigsByDatasetId`: UPS IP datasetごとのfit rangeと印加電圧設定。CSV推定値で初期化し、UPS tabで手動編集する。
- `AnalysisState.bandIpSource`: Band Diagramに渡すIP値のsource。特定dataset、平均、0 V外挿を選ぶ。
- `src/ui/workspace/WorkspaceModals.tsx`: Save as、Delete、Load Project modal。
- `src/ui/Settings.ts`: Project/Catalogに含めないユーザー個人設定。表示localeを`localStorage`へ保存し、Sample Infoの表示ラベルを切り替える。
- `src/ui/windows/SpectrumPlot.tsx`: D3/SVG plot container、public props compatibility。
- `src/ui/windows/SpectrumPlotSvg.tsx`: SVG composition and pointer event wiring。
- `src/ui/windows/SpectrumPlotAxes.tsx`: 軸、tick、軸ラベル。
- `src/ui/windows/SpectrumPlotSeries.tsx`: series path、fit label位置計算。
- `src/ui/windows/SpectrumPlotCursors.tsx`: range band、range cursor、point cursor。
- `src/ui/windows/SpectrumPlotSinglePointCursors.tsx`: REELS single point cursor。
- `src/ui/windows/SpectrumPlotCursorModel.ts`: cursor対象seriesと補間helper。
- `src/ui/windows/SpectrumPlotMarkers.tsx`: marker線、annotation。
- `src/ui/windows/SpectrumPlotContextMenu.ts`: plot context menu。
- `src/ui/windows/SpectrumPlotViewportState.ts`: viewport request同期とecho guard。
- `src/ui/windows/SpectrumPlotScales.ts`: plot geometry、domain、scale、tick formatting。
- `src/ui/windows/SpectrumPlotViewport.ts`: wheel/drag viewport math、range math、series visibility判定。
- `src/ui/windows/SpectrumPlotInteraction.ts`: pointer lifecycle for plot drag/pan/cursor/range drag。
- `src/ui/windows/SpectrumPlotParts.tsx`: 既存import互換のためのplot部品re-export。
- `src/ui/windows/UPSVBPlotWindow.tsx`: UPS VB plot。
- `src/ui/windows/UPSIPPlotWindow.tsx`: UPS IP plot、dataset context menu、snapshot view。
- `src/ui/windows/UPSBiasDependenceWindow.tsx`: Cutoff/EVBM/IP bias dependence plot。
- `src/ui/windows/UPSPlotModel.ts`: UPS plot shared constants/helper。
- `src/ui/windows/AnalysisControls.tsx`: Analysis tab state and panel routing。
- `src/ui/windows/AnalysisControlModel.ts`: fit target/dataset slot/IP source helper。
- `src/ui/windows/AnalysisControlParts.tsx`: shared analysis form components。
- `src/ui/windows/AnalysisRangeInput.tsx`: fit range number input draft state。
- `src/ui/windows/BandDiagramWindow.tsx`: Band Diagram control stateとplot/control composition。
- `src/ui/windows/bandDiagramModel.ts`: Igor風Band Diagram model、auto viewport、data signature、percent offset。
- `src/ui/windows/bandDiagramInteraction.ts`: Band Diagram wheel/drag/pan viewport math。
- `src/ui/windows/BandDiagramPlot.tsx`: Band Diagram専用SVG plot。
- `src/ui/windows/BandDiagramAnnotations.tsx`: VBM/CBM/Vacuum線、IP/EA/Eg矢印annotation。
- `src/ui/windows/BandDiagramControls.tsx`: Band Diagram compact control inputs。
- `src/ui/FormSelect.tsx`: native selectに依存しないsingle/multi select field。placeholderは未選択時の表示専用で、選択肢には含めない。

## State

Zustandは現在のCatalog recordとProject snapshotを保持する。DexieはCatalog registry DBとCatalog別Project DBに分かれる。Catalog registryはCatalog metadataだけを持ち、Project情報は参照しない。Project JSONは単一Project共有用、Catalog archiveはCatalog専用DB全体の共有用に使う。表示localeや前回開いていたCatalog/Project IDなど各ユーザーの環境設定は`localStorage`に保存し、Project/Catalog import/exportには含めない。前回IDが削除済みの場合はtoastで通知し、Default Catalogの空Projectへfallbackする。

## Build

`vp build` が静的assetsを `dist/` に生成し、Goの `main.go` が `dist/` を埋め込んで配信する。
