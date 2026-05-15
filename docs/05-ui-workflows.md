# UI Workflows

## Workspace

IGOR Proの複数グラフ/操作パネル画面とSciSpace風ワークベンチを合わせる。

- Data Browser: `Load CSVs`ドロップダウンファイルフィールドからMultiPak CSVを読み込み、読み込んだdatasetを表示する。Project import/exportとdemo読み込みはData Browserから外し、Project menuへ集約する。
- Table: 選択datasetをTanStack Table + Virtualで表示。
- UPS Plot: VB/IPスペクトル、fit line、VBM/cut-off marker。
- LEIPS Plot: LEET、LEET(der)、LEIPS、ガウスfit、真空準位marker、EA marker。
- Band Diagram: UPSとLEIPSをEnergy relative to Ef/eVで重ね、IGOR Pro風の大きいUPS/LEIPSラベル、VBM/CBM/Vacuum levelの縦線、IP/EA/Egの両矢印を表示する。調整欄はplot下に置き、UPS+/LEIPS+は各スペクトル強度レンジに対するpercent offsetとして扱う。IP/EA/Eg indicatorのfont sizeとarrow scaleは数値入力で調整できる。
- Analysis Controls: dataset割当、fit範囲、bandpass、計算結果。
- Top menu: Project/View/Windows/Helpを配置し、背景右クリックでも同じメニュー構成を表示する。ひとつのmenuを開いた状態で別menuにhoverした場合は、その列のmenuへ切り替える。Recent projectなどのsubmenuは対象行へhoverしたときだけ展開する。

## Cursor / Range Selection

plot上でドラッグ選択したx範囲を、現在アクティブなfit範囲に反映する。数値入力での調整も可能にする。plot上の範囲ラベルは用途名だけを表示し、`active`文字やA/Bなどのハンドル文字は表示しない。

## View Controls

- View > Reset viewでワークスペースの位置と拡大率を初期値へ戻す。
- Windows menuは選択したwindowを最前面に移動する。
- Help menuはalertではなく英語の専用Help windowをtoggle表示する。Windows menuにもHelpを表示する。
- 通常plotとBand Diagramはホイール/Shiftホイール/Altドラッグ/ダブルクリックでズーム、パン、リセットを行う。

## Persistence

作業状態はIndexedDBへ保存する。Project exportはgzip圧縮したProject JSONを標準にし、別環境へ渡せる。従来の生JSON importも互換として残す。
Exportの拡張子は`.upsleips.json.gz`にする。
Project > Save as ...とProject > Delete projectはmodalで確認する。Project > Load Projectはmodal内にProject一覧を表示する。Save as ...で既存Projectと同じ名前を指定した場合は同名Projectを上書きし、Recentに重複を作らない。
Project > Project listは保存済みProjectの名前、作成日時、更新日時をvirtual tableで表示する。
Project > Delete projectは保存済みProjectレコードを削除し、画面を空Projectへ戻す。
