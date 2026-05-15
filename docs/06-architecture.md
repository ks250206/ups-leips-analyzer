# Architecture

## Layers

- `src/domain`: スペクトル型、線形fit、ガウスfit、UPS/LEIPS/REELS/バンド図計算、Sample Info helper。
- `src/io`: MultiPak CSV parserとdataset kind推定。
- `src/store`: Zustand store、Catalog registry Dexie、Catalog別Project Dexie、Project/Catalog import/export。
- `src/ui`: Workspace window、Data Browser、Table、D3/SVG plot wrapper、解析パネル。

## Module Responsibilities

- `src/store/projectStore.ts`: Zustand state/action wiring、active Catalog、Dexie呼び出し、公開store API。
- `src/store/projectFactory.ts`: 空Project、demo Project、初期dataset/window生成。
- `src/store/projectModel.ts`: 解析再計算、dataset auto selection、dataset role変更時のaxis label補正、fit range migration、Project JSON変換。
- `src/store/projectDb.ts`: Catalog registry DB、Catalog別Project DB生成、legacy Project DB migration、Project/Catalog gzip import/export。
- `src/store/lastOpenedWorkspace.ts`: 前回最後に開いたCatalog/Project IDを`localStorage`へ保存するユーザー環境state。Project/Catalog archiveには含めない。
- `src/store/windowModel.ts`: workspace window生成とdefault layout。
- `ProjectSnapshot.ui`: UPS/LEIPS/REELS/Band Diagram plot viewport、plot別cursor表示設定、Sample Info、Help window状態などProjectと一緒に復元したいUI state。Sample Infoのmulti-select値はProject JSON import時に旧string値から配列へ軽量migrationする。
- `src/ui/Workspace.tsx`: workspace viewport、background pan/context menu、window frame配置、modal open state。
- `src/ui/workspace/WorkspaceMenu.tsx`: TopBar/background context menuの共通menu definition。
- `src/ui/workspace/WorkspaceWindows.tsx`: window kindごとのtitle/icon/render/context menu/help window。
- `src/ui/workspace/WorkspaceModals.tsx`: Save as、Delete、Load Project modal。
- `src/ui/Settings.ts`: Project/Catalogに含めないユーザー個人設定。表示localeを`localStorage`へ保存し、Sample Infoの表示ラベルを切り替える。
- `src/ui/windows/SpectrumPlot.tsx`: D3/SVG plot container、viewport state、public props compatibility。
- `src/ui/windows/SpectrumPlotScales.ts`: plot geometry、domain、scale、tick formatting。
- `src/ui/windows/SpectrumPlotViewport.ts`: wheel/drag viewport math、range math、series visibility判定。
- `src/ui/windows/SpectrumPlotInteraction.ts`: pointer lifecycle for plot drag/pan/cursor/range drag。
- `src/ui/windows/SpectrumPlotParts.tsx`: axis、series path、range band、marker、cursor handle SVG部品。
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
