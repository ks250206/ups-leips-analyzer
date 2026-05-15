# Iteration 049: Layout, Menu, Help Polish

## Purpose

最新の画面確認で出た余白、menu挙動、Data Browser、Help表示の違和感を直す。

## Implemented

- LEIPS PlotとLEIPS vs Energy from Evac.に専用margin variantを追加し、左余白を詰め、右Y軸側の余白を広げた。
- Band Diagram以外のplot軸ラベルfont sizeを上げた。
- Data BrowserからDemo、Project export/import操作を外し、CSV読み込みをdropdown field風の単一入力にした。
- No data placeholderの文言をCSV読み込みだけに更新した。
- Top menuを共有ContextMenuへ寄せ、menuを開いた状態で別列へhoverするとそのmenuへ切り替わるようにした。
- Project menuの順序を`Delete project`が`Save as`直下、`Recent project`が末尾になるようにした。
- Helpをalertから専用Help windowのtoggle表示へ変更した。
- UPS_analysis default位置を少し右へ移動し、plot windowとの重なりを減らした。
- Band DiagramのX tick font sizeとaxisからの距離を小さくし、X labelとの重なりを減らした。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build`
- `curl -I http://127.0.0.1:4199/`
- `curl -I http://127.0.0.1:4199/assets/index-*.js`
- Browser smoke: initial Data Browser shows CSV only, no Demo/GZIP/Import buttons; Help menu opens a dedicated Help window.

## TODO

- 実データロード後のLEIPS余白とBand Diagram tick位置は、次の目視フィードバックで必要ならさらに調整する。

## Simplifications / Debt

- CSV入力は実ファイル選択に直結するlabel実装で、専用dropdown menuはまだ持たない。
- Help windowは軽量な静的説明に留め、ヘルプ内ナビゲーションや検索は後続。
