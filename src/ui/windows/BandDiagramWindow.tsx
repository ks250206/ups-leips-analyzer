import { useEffect, useMemo, useState } from "react";
import { useProjectStore } from "../../store/projectStore";
import { formatNumber } from "../format";
import { bandSeries, type PlotMarker } from "../plotData";
import { SpectrumPlot } from "./SpectrumPlot";
import type { PlotViewport } from "./SpectrumPlot";

export function BandDiagramWindow() {
  const band = useProjectStore((state) => state.project.analysis.band);
  const [upsScale, setUpsScale] = useState(1);
  const [upsOffset, setUpsOffset] = useState(0);
  const [leipsScale, setLeipsScale] = useState(1);
  const [leipsOffset, setLeipsOffset] = useState(0);
  const bandXDomain = useMemo(() => {
    const points = band ? [...band.upsPoints, ...band.leipsPoints] : [];
    if (points.length === 0) {
      return { min: -10, max: 6 };
    }
    return {
      min: Math.min(...points.map((point) => point.x)),
      max: Math.max(...points.map((point) => point.x)),
    };
  }, [band]);
  const [xMin, setXMin] = useState(bandXDomain.min);
  const [xMax, setXMax] = useState(bandXDomain.max);
  const [viewportRequest, setViewportRequest] = useState<
    { id: number; viewport: PlotViewport } | undefined
  >();
  useEffect(() => {
    setXMin(bandXDomain.min);
    setXMax(bandXDomain.max);
  }, [bandXDomain.min, bandXDomain.max]);
  const series = useMemo(
    () =>
      band
        ? bandSeries(band).map((item) => {
            const scale = item.yAxis === "right" ? leipsScale : upsScale;
            const offset = item.yAxis === "right" ? leipsOffset : upsOffset;
            return {
              ...item,
              points: item.points.map((point) => ({ x: point.x, y: point.y * scale + offset })),
            };
          })
        : [],
    [band, leipsOffset, leipsScale, upsOffset, upsScale],
  );
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
        <div className="border-b border-slate-200 bg-slate-50 px-2 py-1 text-[11px]">
          <div className="grid grid-cols-5 gap-1">
            <Metric label="Vac" value={band.vacuumRelativeToEf} />
            <Metric label="VBM" value={band.efMinusEvbm} />
            <Metric label="CBM" value={band.cbmRelativeToEf} />
            <Metric label="IP" value={band.ip} />
            <Metric
              label="EA / Eg"
              text={`${formatNumber(band.ea, 2)} / ${formatNumber(band.eg, 2)} eV`}
            />
          </div>
          <div className="mt-1 grid grid-cols-5 gap-1">
            <SmallNumber label="UPS×" value={upsScale} onChange={setUpsScale} />
            <SmallNumber label="UPS+" value={upsOffset} onChange={setUpsOffset} />
            <SmallNumber label="LEIPS×" value={leipsScale} onChange={setLeipsScale} />
            <SmallNumber label="LEIPS+" value={leipsOffset} onChange={setLeipsOffset} />
            <span className="grid grid-cols-[1fr_1fr_auto] gap-1">
              <input
                className="min-w-0 rounded border border-slate-200 bg-white px-1 py-0.5 font-mono"
                value={xMin}
                onChange={(event) => setXMin(Number(event.currentTarget.value))}
              />
              <input
                className="min-w-0 rounded border border-slate-200 bg-white px-1 py-0.5 font-mono"
                value={xMax}
                onChange={(event) => setXMax(Number(event.currentTarget.value))}
              />
              <button
                className="rounded border border-slate-300 bg-white px-1 py-0.5 font-semibold hover:bg-cyan-50"
                type="button"
                onClick={() =>
                  setViewportRequest({
                    id: Date.now(),
                    viewport: { x: { min: Math.min(xMin, xMax), max: Math.max(xMin, xMax) } },
                  })
                }
              >
                X
              </button>
            </span>
          </div>
        </div>
      ) : null}
      <div className="min-h-0 flex-1">
        <SpectrumPlot
          title="UPS-LEIPS Band Diagram"
          xLabel="Energy relative to Ef/eV"
          yLabel="UPS"
          yRightLabel="LEIPS"
          series={series}
          markers={markers}
          xDirection="reverse"
          viewportRequest={viewportRequest}
          hideYTicks
          largeAxisLabels
        />
      </div>
    </div>
  );
}

function SmallNumber({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid grid-cols-[42px_1fr] items-center gap-1 rounded border border-slate-200 bg-white px-1 py-0.5">
      <span className="font-semibold text-slate-500">{label}</span>
      <input
        className="min-w-0 bg-transparent font-mono text-slate-900 outline-none"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </label>
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
