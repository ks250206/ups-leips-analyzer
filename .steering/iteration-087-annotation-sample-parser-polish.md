# Iteration 087: Annotation, Sample, and Parser Polish

## 目的

- Band/REELS annotationの重なりを減らす。
- Sample tabを初期表示にし、試料情報入力とvalidationを改善する。
- MultiPak CSVのdataset kind推定を実データ命名に合わせて高精度化する。

## 実装内容

- Band DiagramのCBM点線上端を短くし、EA annotationと被りにくくした。
- REELS plotのEg上部marker labelを消し、矢印labelを`E_g=... eV`下付き表記にした。
- Plot annotation labelをReactNode対応にした。
- Analysis Controlsの初期tabをSampleに変更し、tab順を`Sample / Data / UPS / LEIPS / REELS / Band / Fit`へ変更した。
- Sample Infoに`sample state`自由記述欄を追加した。
- 到達真空度(Pa)に、空文字または正の有限数値だけProject stateへ反映するvalidationを追加した。
- CSV kind推定をfilename/metadata context対応にし、LEIPS/LEET/LEET(der)/UPS VB/IP/REELSの判定順を更新した。
- docs/03, docs/04, docs/05を更新した。

## TODO

- 1つのCSV内で列ごとに異なる測定種別が混在する場合の列別kind推定は未対応。
- filenameに偶然`LEIPS`が含まれる試料名は誤判定し得るため、Data Browserの`Change role`で補正する。

## 完了範囲

- annotation表示、Sample初期tab、sample state、到達真空度validation、CSV kind推定まで完了。

## 簡易実装・技術負債

- 到達真空度validationはUI入力時に不正値をProject stateへ反映しない方式。フォーム全体のschema validationは未導入。

## 実行したテスト

- `vp check`
- `vp test --coverage`
