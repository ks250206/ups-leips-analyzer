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

## UPS-LEIPS Band Diagram

- `EvacRelativeToEf = EFMinusEVBM - IP`。
- `CBMRelativeToEf = EvacRelativeToEf + EA`。
- `Eg = IP - EA`。
- 横軸ラベルは `Energy relative to Ef/eV`。
