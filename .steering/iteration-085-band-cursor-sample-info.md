# Iteration 085: Band Cursor and Sample Info

## Purpose

- Band Diagramのdrag zoomとannotation clipを通常plotに近づける。
- cursor styleをglobal localStorage設定からplot別Project stateへ戻す。
- Analysis ControlsにSample Info入力欄を追加し、Project保存対象にする。

## Implementation

- Band Diagramのdrag開始はplot内に限定し、drag中/終了時はplot外座標も使ってviewportを更新するようにした。
- Band DiagramのUPS/LEIPS label、VBM/CBM/Vacuum line、IP/EA/Eg arrowをplot clipPath配下に移し、plot外にはみ出さないようにした。
- `ProjectSnapshot.ui.cursorStyles`を追加し、UPS VB、UPS IP、LEIPS、LEIPS Evac、REELSごとにcursor styleを保存するようにした。
- TopBar/background menuのglobal `Setting > Cursor style`を外し、plot context menuのcursor styleだけを正式な切替UIにした。
- Analysis Controlsに`Sample Info` tabを追加し、試料情報、選択式語彙、含有元素自動抽出をProject stateに保存するようにした。
- Sample Infoのplaceholderは匿名性の高い例（山田/太郎、Sample-001）へ変更した。
- Load Project modalはbackdrop clickでcancelできるようにした。
- Band tabのtitleを`Band Diagram`へ変更し、EVBMは`E` + subscript `VBM`表記にした。

## TODO

- Sample Infoのxlsx import/exportは未実装。必要なら後続でテンプレート書き戻しを扱う。
- 電池イオン種の語彙はExcelの全513件ではなく、代表候補だけの軽量静的リストにした。

## Temporary / Debt

- 旧localStorageのglobal cursor styleはmigrationせず無視する。
- Sample Infoのselect語彙は`sample/`のxlsxを直接読むのではなく、Git管理可能な静的定義として取り込んだ。

## Tests

- Passed: `vp check`
- Passed: `vp test --coverage`
- Passed: `vp build`
- Passed: `pnpm binary:build`
- Passed: `curl -I http://127.0.0.1:4187/`
- Passed: `curl -I http://127.0.0.1:4187/assets/...`
- Browser smoke: ChromeでSample Info tab、匿名placeholder、Project menuからSetting削除、No data状態のwindow表示を確認した。
