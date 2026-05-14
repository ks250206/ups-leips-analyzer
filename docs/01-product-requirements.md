# Product Requirements

## Goal

UPS/LEIPS解析をIGOR Proマクロからブラウザ内ワークベンチへ移植する。研究者がMultiPak CSVを読み込み、範囲選択、fit、結果確認、バンド図作成、Project保存/共有を1つのアプリで行える状態にする。

## v1 Scope

- MultiPak CSVのUPS VB/IP、LEET、LEET(der)、LEIPS読み込み。
- UPS: VBとIPスペクトルの表示、edge/BG線形fit、VBM/cut-off/IP計算。
- LEIPS: LEET/LEET(der)/LEIPS表示、LEET(der)ガウスfit、bandpass補正、真空準位基準への変換、EA計算。
- UPS-LEIPS: VBとLEIPSをEnergy relative to Ef/eV軸で重ね、IP/EA/Egを表示。
- ProjectはIndexedDBに保存し、JSON import/exportで共有する。
- Go単一バイナリはビルド済みWebアプリをローカルHTTPで配信する。

## Out of Scope

- `.spe` バイナリ本体の正式parser。
- ネイティブOSファイル操作、署名付きインストーラ、自動更新。
- クラウド同期、共同編集、ユーザー管理。
