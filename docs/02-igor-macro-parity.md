# IGOR Macro Parity

参照マクロは `sample/Macro_VersaProbe_v8_3_6.ipf`。`sample/` はGitに含めない。

## UPS

- `fit_UPS_base` はカーソル範囲から線形fitを行う。
- `calc_VBM_or_Ecutoff_or_EA(1)` はedge/BGの交点をVBMにする。
- `calc_VBM_or_Ecutoff_or_EA(2)` はedge/BGの交点をcut-offにする。
- `calc_IP_VP` は `IP = 21.22 - (Ecutoff - EVBM)` を使う。

## LEIPS

- `fitgauss_forEvac_VP` はLEET(der)をガウスfitし、係数のpeak位置を `Epeak` にする。
- `get_energy_of_bandpassfilter` はbandpass選択を固定値に変換する。
- `Evac = Epeak + bandpassEnergy`。
- LEIPSの真空準位基準変換は `Energy from Evac = Evac - Vbias`。
- `calc_VBM_or_Ecutoff_or_EA(3)` はLEIPS onset/BG交点をEAにする。

## REELS

- `change_Ek_to_Eloss_REELS` は `Electron loss energy = 1000 - Kinetic Energy` を作る。
- `fit_UPS_base` はREELSでもUPSと同じ線形fit基盤として使う。
- `calc_VBM_or_Ecutoff_or_EA(4)` はREELS onset edge/BGの交点を計算し、Shift未押下時は `Eg = 1000 - intersectionKineticEnergy` として表示する。
- 本アプリではraw datasetはKinetic Energyのまま保持し、解析用にloss軸へ変換してからfitするため、`bandGap`はloss軸上の交点として保持する。
- REELSのEgは独立した解析結果であり、UPS-LEIPS Band Diagramの `Eg = IP - EA` は変更しない。

## UPS-LEIPS Band Diagram

- `EvacRelativeToEf = EFMinusEVBM - IP`。
- `CBMRelativeToEf = EvacRelativeToEf + EA`。
- `Eg = IP - EA`。
- 横軸ラベルは `Energy relative to Ef/eV`。
