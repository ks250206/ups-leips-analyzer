# UI Workflows

## Workspace

IGOR Proの複数グラフ/操作パネル画面とSciSpace風ワークベンチを合わせる。

- Data Browser: 読み込んだdataset、Project import/export、demo読み込み。
- Table: 選択datasetをTanStack Table + Virtualで表示。
- UPS Plot: VB/IPスペクトル、fit line、VBM/cut-off marker。
- LEIPS Plot: LEET、LEET(der)、LEIPS、ガウスfit、真空準位marker、EA marker。
- Band Diagram: UPSとLEIPSをEnergy relative to Ef/eVで重ね、IGOR Pro風の大きいUPS/LEIPSラベル、VBM/CBM/Vacuum levelの縦線、IP/EA/Egの両矢印を表示。
- Analysis Controls: dataset割当、fit範囲、bandpass、計算結果。
- Top menu: Project/View/Windows/Helpを配置し、背景右クリックでも同じメニュー構成を表示する。

## Cursor / Range Selection

plot上でドラッグ選択したx範囲を、現在アクティブなfit範囲に反映する。数値入力での調整も可能にする。plot上の範囲ラベルは用途名だけを表示し、`active`文字やA/Bなどのハンドル文字は表示しない。

## View Controls

- View > Reset viewでワークスペースの位置と拡大率を初期値へ戻す。
- Windows menuは選択したwindowを最前面に移動する。
- 通常plotとBand Diagramはホイール/Shiftホイール/Altドラッグ/ダブルクリックでズーム、パン、リセットを行う。

## Persistence

作業状態はIndexedDBへ保存する。Project exportはgzip圧縮したProject JSONを標準にし、別環境へ渡せる。従来の生JSON importも互換として残す。
Project > Delete projectは保存済みProjectレコードを削除し、画面を空Projectへ戻す。
