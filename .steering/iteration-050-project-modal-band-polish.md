# Iteration 050: Project Modals and Band Diagram Polish

## Purpose

Project保存操作とBand Diagramの見た目/操作を、最新の画面フィードバックに合わせて直す。

## Implemented

- Project exportのファイル名を`.upsleips.json.gz`へ変更。
- Save asを`Save as ...`表記に変更し、promptではなくmodalで入力するようにした。
- Delete Projectをbrowser alertではなくmodal confirmに変更した。
- Save as ...で同名Projectが保存済みの場合は、同じProject recordを上書きし、Recentに重複を作らないようにした。
- Project list windowを追加し、保存済みProjectの名前、作成日時、更新日時をTanStack Table + Virtualで表示するようにした。
- Help windowの内容を英語化し、Windows menuにもHelpを表示できるようにした。
- Band Diagramでドラッグ中に文字選択が起きないようにした。
- Band Diagram上部の結果summary行を削除し、調整欄をplot下へ移動した。
- Band DiagramのX tick fontを小さくし、SVG座標変換を使ってdrag/zoom座標のずれを減らした。
- Band DiagramのUPS+/LEIPS+を実値offsetではなく、各スペクトル強度レンジに対するpercent offsetとして扱うようにした。
- Band DiagramのIP/EA/Eg indicator font sizeとarrow scaleを数値入力で調整できるようにした。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build`
- `curl -I http://127.0.0.1:4199/`
- `curl -I http://127.0.0.1:4199/assets/index-*.js`
- Browser smoke: Save as modal、Delete modal、Project list window、Windows menuのHelp項目を確認。

## TODO

- 実データ表示状態でBand Diagramのdrag/zoomとindicator調整の視認性を継続確認する。

## Simplifications / Debt

- Project listは一覧とdouble click loadまでの軽量実装。行内deleteやrenameは後続。
- Band Diagramのindicator設定はUI local stateで、Project JSONへの保存は後続。
