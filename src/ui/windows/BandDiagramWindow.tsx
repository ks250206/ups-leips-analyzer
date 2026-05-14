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
            { x: band.efMinusEvbm, label: "VBM", color: "#2563eb" },
            {
              x: band.cbmRelativeToEf,
              label: "CBM",
              color: "#dc2626",
            },
          ]
        : [],
    [band],
  );

  return (
    <div className="flex h-full flex-col bg-white">
      {band ? (
        <div className="grid grid-cols-5 gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1 text-[11px]">
          <Metric label="Vac" value={band.vacuumRelativeToEf} />
          <Metric label="VBM" value={band.efMinusEvbm} />
          <Metric label="CBM" value={band.cbmRelativeToEf} />
          <Metric label="IP" value={band.ip} />
          <Metric
            label="EA / Eg"
            text={`${formatNumber(band.ea, 2)} / ${formatNumber(band.eg, 2)} eV`}
          />
        </div>
      ) : null}
      <div className="min-h-0 flex-1">
        <SpectrumPlot
          title="UPS-LEIPS Band Diagram"
          xLabel="Energy relative to Ef/eV"
          yLabel="Intensity / a.u."
          series={series}
          markers={markers}
        />
      </div>
    </div>
  );
}

function Metric({ label, value, text }: { label: string; value?: number; text?: string }) {
  return (
    <div className="truncate rounded border border-slate-200 bg-white px-2 py-1">
      <span className="mr-1 font-semibold text-slate-500">{label}</span>
      <span className="font-mono text-slate-900">{text ?? `${formatNumber(value, 2)} eV`}</span>
    </div>
  );
}
