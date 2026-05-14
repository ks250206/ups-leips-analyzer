import { useMemo } from "react";
import { useProjectStore } from "../../store/projectStore";
import { formatNumber } from "../format";
import { bandSeries, type PlotMarker } from "../plotData";
import { SpectrumPlot } from "./SpectrumPlot";

export function BandDiagramWindow() {
  const band = useProjectStore((state) => state.project.analysis.band);
  const series = useMemo(() => (band ? bandSeries(band) : []), [band]);
  const markers = useMemo<PlotMarker[]>(
    () =>
      band
        ? [
            {
              x: band.vacuumRelativeToEf,
              label: `Vac ${formatNumber(band.vacuumRelativeToEf, 2)}`,
              color: "#0f766e",
            },
            { x: band.efMinusEvbm, label: `IP ${formatNumber(band.ip, 2)} eV`, color: "#2563eb" },
            {
              x: band.cbmRelativeToEf,
              label: `EA ${formatNumber(band.ea, 2)} eV / Eg ${formatNumber(band.eg, 2)} eV`,
              color: "#dc2626",
            },
          ]
        : [],
    [band],
  );

  return (
    <SpectrumPlot
      title="UPS-LEIPS Band Diagram"
      xLabel="Energy relative to Ef/eV"
      yLabel="Intensity / a.u."
      series={series}
      markers={markers}
    />
  );
}
