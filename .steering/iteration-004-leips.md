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

## TODO

- LEET/LEIPSの二軸表示。
- 真空準位基準LEIPS専用plot window。

## Simplifications

- LEET、LEET(der)、LEIPS、fit補助線を1つのplot windowで表示している。

## Tests

- bandpass、真空準位変換、ガウスpeak、EA計算。
