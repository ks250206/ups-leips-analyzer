# UI Workflows

## Workspace

IGOR Proの複数グラフ/操作パネル画面とSciSpace風ワークベンチを合わせる。

- Data Browser: 読み込んだdataset、Project import/export、demo読み込み。
- Table: 選択datasetをTanStack Table + Virtualで表示。
- UPS Plot: VB/IPスペクトル、fit line、VBM/cut-off marker。
- LEIPS Plot: LEET、LEET(der)、LEIPS、ガウスfit、真空準位marker、EA marker。
- Band Diagram: UPSとLEIPSをEnergy relative to Ef/eVで重ね、IP/EA/Egを表示。
- Analysis Controls: dataset割当、fit範囲、bandpass、計算結果。

## Cursor / Range Selection

plot上でドラッグ選択したx範囲を、現在アクティブなfit範囲に反映する。数値入力での調整も可能にする。

## Persistence

作業状態はIndexedDBへ保存する。Project JSON export/importで別環境へ渡せる。
