# UI Workflows

## Workspace

IGOR Proの複数グラフ/操作パネル画面とSciSpace風ワークベンチを合わせる。

- Data Browser: `Load CSVs`ドロップダウンファイルフィールドからMultiPak CSVを読み込み、読み込んだdatasetを表示する。読み込み済みdatasetは行context menuから削除でき、`Change role`で`ups-vb`/`ups-ip`/`leet`/`leet-der`/`leips`/`reels`/`unknown`へdataset kindだけを変更できる。解析対象への割当はAnalysis ControlsのData tabで手動選択する。現在Data tabで解析対象に割り当てられているdatasetは、Data Browser上でUPS/LEIPS/REELSなどの色付きbadgeとして表示する。Project import/exportとdemo読み込みはData Browserから外し、Projects menuへ集約する。
- Table: 選択datasetをTanStack Table + Virtualで表示。
- UPS Plot: VB/IPスペクトル、fit line、VBM/cut-off marker。UPS spectra analysisのVB setはEVBMのみを表示し、EF-EVBMの重複表示はしない。
- LEIPS Plot: LEET、LEET(der)、LEIPS、ガウスfit、真空準位marker、EA marker。Filter menuの固定bandpass候補はエネルギー値だけを表示し、`Band pass` prefixは付けない。
- REELS Plot: Kinetic Energy datasetをElectron loss energyへ変換し、onset edge/BG fit、Eg markerを表示する。横軸は左が+側、右が-側になるよう反転表示する。plot viewportとcursor位置はProject stateに保存し、Project save/load/import/exportで復元する。
- UPS VB、UPS IP、LEIPS Plot、LEIPS vs Energy from Evac.、REELS Plotのwindow titleには現在割当中の主dataset名を表示する。window titlebar/context menuからAnalysis Controls Data tabと同じdataset割当を変更できる。
- Band Diagram: UPSとLEIPSをEnergy relative to Ef/eVで重ね、IGOR Pro風の大きいUPS/LEIPSラベル、VBM/CBM/Vacuum levelの縦線、IP/EA/Egの両矢印を表示する。調整欄はplot下に固定幅のcompact controlとして置き、UPS+/LEIPS+は各スペクトル強度レンジに対するpercent offsetとして扱う。IP/EA/Eg indicatorのfont sizeとarrow scaleは数値入力で調整できる。
- Band DiagramのUPS/LEIPS annotationはseriesより上に描画し、曲線と重なる部分を白いhaloで隠して読めるようにする。VBM/CBM/Vacuum levelとEgのsubscriptもFont入力に追従する。
- Analysis Controls: Sample tabを初期表示にし、Sample/Data/UPS/LEIPS/REELS/Band/Fitの順で並べる。Data tabでdataset割当、Sample tabで試料情報、各解析tabでfit範囲、bandpass、REELS incident energy、計算結果を扱う。bandpassは固定候補に加えてcustom値を入力できる。
- Sample InfoはProject stateに保存する。初期値は空で、Excelテンプレート由来の例値はplaceholderとしてだけ表示する。選択式項目は自前dropdownで表示し、placeholderは選択肢に含めない。複数選択が自然な項目だけcustom multi-selectを使う。含有元素は組成文字列から自動抽出し、組成入力の直下に表示する。`sample state`は自由記述欄として保存し、placeholderは`initial, 1st charge, Ar etched`のような状態例にする。到達真空度(Pa)は空または正の有限数値だけ有効とする。
- Analysis Controlsは初期表示をSample tabにし、plot/windowを選択したときは関連tab（UPS/LEIPS/REELS/Band/Data）へ同期する。
- 各plotのcontext menuにはcursor range表示のtoggle、Reset view、Copy PNG、Export PNG/SVGを置く。LEIPS PlotのFilter > Custom band passはmodalで任意値を入力する。REELS Plotだけ`REELS BG mode`を表示し、BG single point horizontal modeを選べる。
- Window context menuとWindows menuからwindow position/sizeをdefault layoutへ戻せる。Windows menuには全window position/size resetも置く。
- UPS VB、UPS IP、LEIPS Plot、LEIPS vs Energy from Evac.、REELS Plot、Band Diagramのplot viewportはProject stateに保存し、Project save/load/import/exportで復元する。fit cursor位置はfit range stateとして同じProject JSON/import/exportに含める。
- Band DiagramのX range controlは左入力を高エネルギー側、右入力を低エネルギー側として並べ、defaultは`8`から`-5`にする。
- Band DiagramのCBM点線はEA annotationと干渉しないよう、上端を短くする。
- Top menu: Catalogs/Projects/View/Windows/Helpを配置し、背景右クリックでも同じメニュー構成を表示する。ひとつのmenuを開いた状態で別menuにhoverした場合は、その列のmenuへ切り替える。Recent projectなどのsubmenuは対象行へhoverしたときだけ展開する。
- Plot context menuはplot固有項目を先に出し、Reset view / Export PNG / Export SVGは末尾に配置する。

## Cursor / Range Selection

plot上でドラッグ選択したx範囲を、現在アクティブなfit範囲に反映する。数値入力での調整も可能にする。cursor表示はplot context menuからplotごとに切り替える。defaultはIgorPro風point marker表示で、A/B/C/Dなどのcursor indicatorを表示する。plotごとのcursor styleはProject stateに保存し、Project save/load/import/exportで復元する。range band表示では範囲の塗りと用途名だけを表示し、境界線は出さない。REELS BG single point modeはcursor表示とは別のREELS専用Project stateとして扱い、REELSのBGだけ単点cursorにし、その点を通る水平線`y=y0`を表示する。

Analysis ControlsのFit tabは上段のtarget buttonを置かず、range入力行自体を選択対象にする。現在選択中のfit target行をslate系の控えめな色でhighlightし、range値は小数第3位まで表示する。入力中の`-`など未完成の数値は一時文字列として許容し、数値化できる値だけProject stateへ反映する。

CSV読み込み、Project保存/読み込み、Project import/export、Catalog作成/切替/import/export/deleteはtoastで成功/失敗を通知する。

## View Controls

- View > Reset viewでワークスペースの位置と拡大率を初期値へ戻す。
- TopBar右側には手動Recalculate buttonを置かず、現在のworkspace表示倍率を`Zoom 100%`のように表示する。
- Windows menuは選択したwindowを最前面に移動する。
- Help menuはalertではなく英語の専用Help windowをtoggle表示する。Windows menuにもHelpを表示する。
- 背景クリック時はwindowのactive highlightだけを解除し、z-indexの重ね順は維持する。
- 通常plotとBand Diagramはホイール/Shiftホイール/Altドラッグ/ダブルクリックでズーム、パン、リセットを行う。Band Diagramのdrag zoomはplot外へドラッグしても通常plotと同様に追随し、annotation/矢印はplot領域でclipする。
- active windowはmono系の濃いborder、やや大きいshadow、淡いslate ringでactive状態を示す。
- Band DiagramのAutoとdouble click resetは、その時点のX/Y/Y2 min/maxを明示的なviewport値として固定する。domain計算はpath生成を伴わない軽量helperで行う。これによりUPS+/LEIPS+のpercent offsetを変えてもautoscaleが追従せず、plot上の見かけのoffsetとして反映される。
- Band DiagramはLEIPS/fit cursor変更による再計算でIP/EA/Egなどのannotation値だけが変わった場合、現在のplot viewportを維持する。UPS/LEIPS点列のX範囲や点数が変わった場合のみ自動初期化する。

## Persistence

作業状態はIndexedDBへ保存する。Project exportはgzip圧縮したProject JSONを標準にし、別環境へ渡せる。従来の生JSON importも互換として残す。
Exportの拡張子は`.upsleips.json.gz`にする。
Catalogs > Switch CatalogはCatalog一覧modalを表示し、Catalog切替時はそのCatalog内の最新Projectを開く。Catalog importは既存Catalogを上書きせず、新規Catalogとして追加して切り替える。
Projects > Save as ...とProjects > Delete projectはmodalで確認する。Projects > Save Projectは未保存New ProjectではSave as ...と同じmodal flowにする。Projects > Load Projectはmodal内にProject一覧を表示する。Save as ...で既存Projectと同じ名前を指定した場合は同名Projectを上書きし、Recentに重複を作らない。
Projects > Project listはactive Catalog内の保存済みProjectの名前、作成日時、更新日時をvirtual tableで表示する。
Projects > Delete projectはactive Catalog内の保存済みProjectレコードを削除し、画面を空Projectへ戻す。
