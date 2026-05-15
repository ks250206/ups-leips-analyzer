# Iteration 047: gzip Project export and Igor-style Band Diagram

## Purpose

- Project JSON exportをfflate gzip形式へ切り替え、重い生JSON共有を避ける。
- Band Diagramの見た目をIGOR Proの参照図に近づける。

## Implemented

- `fflate`を追加し、Project JSONをgzip圧縮する`exportProjectGzip`とgzip/生JSON両対応の`importProjectBytes`を追加。
- Data BrowserとTop Project menuのExportを`.upsleips.gz`出力へ変更。
- Importは`.upsleips`/`.gz`/`.json`を受け付けるようにし、既存JSON互換を維持。
- Band Diagramを汎用`SpectrumPlot`から専用SVG描画へ切り替えた。
- Band Diagramに太枠、内向きtick、大きな`UPS`/`LEIPS`ラベル、VBM/CBM/Vacuum levelの破線、IP/EA/Egの両矢印を追加。
- 既存のUPS/LEIPS別スケール・オフセット入力とX範囲入力を維持した。
- `docs/03-data-formats.md`と`docs/05-ui-workflows.md`を更新。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build`
- `curl -I http://127.0.0.1:4187/`
- Browser smoke: Demoロード後、Band Diagramに`IP=`/`EA=`/`UPS`/`LEIPS`表示が出ることを確認。

## Done

- gzip Project export/import実装完了。
- Band DiagramのIGOR風専用描画実装完了。

## TODO

- Band Diagram専用SVGのドラッグズーム/パンは未実装。必要なら後続で汎用plot操作に寄せる。
- Project exportのファイル拡張子は`.upsleips.gz`で固定。将来、UI上でraw JSON exportを選べるようにしてもよい。

## Technical Debt / Shortcuts

- Store APIは従来の`importProject(json)`を維持し、UI側でgzipを生JSONへ戻してから渡している。
- Band Diagram exportは専用SVGからPNG/SVGを生成する簡易実装。
