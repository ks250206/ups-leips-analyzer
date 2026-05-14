# Iteration 004 LEIPS

## Goal

LEET、LEET(der)、LEIPSを読み込み、Epeak、Evac、EAを計算する。

## Implemented

- LEIPS plot window。
- LEET/LEET(der)/LEIPS dataset割当。
- LEET(der)ガウスfit。
- bandpass選択。
- `Evac = Epeak + bandpassEnergy`。
- `Energy from Evac = Evac - Vbias`。
- LEIPS onset/BG fitからEAを計算。
- LEET/LEET(der)のApplied Bias plotとLEIPSのEvac基準plotを上下分割し、座標系混在を解消。

## TODO

- 二軸表示は未実装。上下分割で代替。
- 真空準位基準LEIPS専用plot window。

## Simplifications

- LEET、LEET(der)、LEIPS、fit補助線を1つのplot windowで表示している。

## Tests

- bandpass、真空準位変換、ガウスpeak、EA計算。
