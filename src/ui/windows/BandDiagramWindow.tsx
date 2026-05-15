import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ContextMenuItem } from "../ContextMenu";
import { useProjectStore } from "../../store/projectStore";
import { SmallNumber } from "./BandDiagramControls";
import { IgorBandDiagramPlot } from "./BandDiagramPlot";
import {
  type BandViewport,
  bandPlotDataSignature,
  createBandAutoViewport,
} from "./bandDiagramModel";

export const DEFAULT_BAND_INDICATOR_FONT_SIZE = 30;
export const DEFAULT_BAND_INDICATOR_ARROW_SCALE = 0.7;
export const DEFAULT_BAND_SIGNIFICANT_DIGITS = 3;
export const DEFAULT_BAND_X_RANGE = { min: -5, max: 8 } as const;

export function BandDiagramWindow() {
  const band = useProjectStore((state) => state.project.analysis.band);
  const upsAnalysis = useProjectStore((state) => state.project.analysis.ups);
  const ipResults = upsAnalysis?.ipResults ?? [];
  const bandIpSource = useProjectStore((state) => state.project.analysis.bandIpSource);
  const setBandIpSource = useProjectStore((state) => state.setBandIpSource);
  const persistedViewport = useProjectStore((state) => state.project.ui?.bandDiagramViewport);
  const setBandDiagramViewport = useProjectStore((state) => state.setBandDiagramViewport);
  const [upsScale, setUpsScale] = useState(1);
  const [upsOffset, setUpsOffset] = useState(0);
  const [leipsScale, setLeipsScale] = useState(1);
  const [leipsOffset, setLeipsOffset] = useState(0);
  const [indicatorFontSize, setIndicatorFontSize] = useState(DEFAULT_BAND_INDICATOR_FONT_SIZE);
  const [indicatorArrowScale, setIndicatorArrowScale] = useState(
    DEFAULT_BAND_INDICATOR_ARROW_SCALE,
  );
  const [significantDigits, setSignificantDigits] = useState(DEFAULT_BAND_SIGNIFICANT_DIGITS);
  const lastBandDataSignature = useRef<string | undefined>(undefined);
  const bandDataSignature = useMemo(() => (band ? bandPlotDataSignature(band) : undefined), [band]);
  const [xMin, setXMin] = useState<number>(DEFAULT_BAND_X_RANGE.min);
  const [xMax, setXMax] = useState<number>(DEFAULT_BAND_X_RANGE.max);
  const [viewport, setViewport] = useState<BandViewport>(persistedViewport ?? {});
  const bandContextItems = useMemo<ContextMenuItem[]>(
    () => [
      {
        type: "submenu",
        label: "IP source",
        items: [
          {
            type: "item",
            label: `${bandIpSource?.mode === "zero-voltage-extrapolated" ? "✓ " : ""}0 V extrapolated`,
            disabled: ipResults.filter((result) => Number.isFinite(result.ip)).length < 2,
            action: () => setBandIpSource({ mode: "zero-voltage-extrapolated" }),
          },
          {
            type: "item",
            label: `${bandIpSource?.mode === "average" ? "✓ " : ""}Average`,
            action: () => setBandIpSource({ mode: "average" }),
          },
          ...ipResults.map((result) => ({
            type: "item" as const,
            label: `${
              bandIpSource?.mode === "dataset" && bandIpSource.datasetId === result.datasetId
                ? "✓ "
                : ""
            }${result.datasetName}`,
            action: () => setBandIpSource({ mode: "dataset", datasetId: result.datasetId }),
          })),
        ],
      },
    ],
    [bandIpSource, ipResults, setBandIpSource],
  );
  const applyAutoScale = useCallback(() => {
    if (!band) {
      setViewport({});
      return;
    }
    const next = createBandAutoViewport({
      band,
      xDomain: DEFAULT_BAND_X_RANGE,
      upsScale: 1,
      upsOffset: 0,
      leipsScale: 1,
      leipsOffset: 0,
    });
    setXMin(Number(next.x.min.toFixed(2)));
    setXMax(Number(next.x.max.toFixed(2)));
    setViewport(next);
    setBandDiagramViewport(next);
  }, [band, setBandDiagramViewport]);

  useEffect(() => {
    if (!band || !bandDataSignature) {
      lastBandDataSignature.current = undefined;
      setXMin(DEFAULT_BAND_X_RANGE.min);
      setXMax(DEFAULT_BAND_X_RANGE.max);
      setViewport({});
      setBandDiagramViewport(undefined);
      return;
    }
    if (lastBandDataSignature.current === bandDataSignature) {
      return;
    }
    lastBandDataSignature.current = bandDataSignature;
    const next =
      persistedViewport ??
      createBandAutoViewport({
        band,
        xDomain: DEFAULT_BAND_X_RANGE,
        upsScale: 1,
        upsOffset: 0,
        leipsScale: 1,
        leipsOffset: 0,
      });
    setXMin(next.x?.min ?? DEFAULT_BAND_X_RANGE.min);
    setXMax(next.x?.max ?? DEFAULT_BAND_X_RANGE.max);
    setViewport(next);
    setBandDiagramViewport(next);
  }, [band, bandDataSignature, persistedViewport, setBandDiagramViewport]);

  const handleViewportChange = (next: BandViewport) => {
    setViewport(next);
    setBandDiagramViewport(next);
    if (next.x) {
      setXMin(Number(next.x.min.toFixed(2)));
      setXMax(Number(next.x.max.toFixed(2)));
    } else if (!next.y && !next.y2) {
      setXMin(DEFAULT_BAND_X_RANGE.min);
      setXMax(DEFAULT_BAND_X_RANGE.max);
    }
  };

  return (
    <div className="flex h-full flex-col bg-white select-none">
      <div className="min-h-0 flex-1">
        <IgorBandDiagramPlot
          band={band}
          xDomain={{ min: Math.min(xMin, xMax), max: Math.max(xMin, xMax) }}
          upsScale={upsScale}
          upsOffset={upsOffset}
          leipsScale={leipsScale}
          leipsOffset={leipsOffset}
          indicatorFontSize={indicatorFontSize}
          indicatorArrowScale={indicatorArrowScale}
          significantDigits={significantDigits}
          viewport={viewport}
          extraContextMenuItems={bandContextItems}
          onResetView={applyAutoScale}
          onViewportChange={handleViewportChange}
        />
      </div>
      {band ? (
        <BandDiagramControlStrip
          xMax={xMax}
          xMin={xMin}
          setXMax={setXMax}
          setXMin={setXMin}
          setViewport={setViewport}
          onAutoScale={applyAutoScale}
          values={{
            upsScale,
            upsOffset,
            leipsScale,
            leipsOffset,
            indicatorFontSize,
            indicatorArrowScale,
            significantDigits,
          }}
          setters={{
            setUpsScale,
            setUpsOffset,
            setLeipsScale,
            setLeipsOffset,
            setIndicatorFontSize,
            setIndicatorArrowScale,
            setSignificantDigits: (value) => setSignificantDigits(clampSignificantDigits(value)),
          }}
        />
      ) : null}
    </div>
  );
}

function BandDiagramControlStrip({
  values,
  setters,
  xMin,
  xMax,
  setXMin,
  setXMax,
  setViewport,
  onAutoScale,
}: {
  values: {
    upsScale: number;
    upsOffset: number;
    leipsScale: number;
    leipsOffset: number;
    indicatorFontSize: number;
    indicatorArrowScale: number;
    significantDigits: number;
  };
  setters: {
    setUpsScale: (value: number) => void;
    setUpsOffset: (value: number) => void;
    setLeipsScale: (value: number) => void;
    setLeipsOffset: (value: number) => void;
    setIndicatorFontSize: (value: number) => void;
    setIndicatorArrowScale: (value: number) => void;
    setSignificantDigits: (value: number) => void;
  };
  xMin: number;
  xMax: number;
  setXMin: (value: number) => void;
  setXMax: (value: number) => void;
  setViewport: (updater: (current: BandViewport) => BandViewport) => void;
  onAutoScale: () => void;
}) {
  return (
    <div className="border-t border-slate-200 bg-slate-50 px-2 py-1 text-[11px]">
      <div className="flex flex-wrap items-center gap-1">
        <SmallNumber label="UPS×" value={values.upsScale} onChange={setters.setUpsScale} />
        <SmallNumber label="UPS+%" value={values.upsOffset} onChange={setters.setUpsOffset} />
        <SmallNumber label="LEIPS×" value={values.leipsScale} onChange={setters.setLeipsScale} />
        <SmallNumber label="LEIPS+%" value={values.leipsOffset} onChange={setters.setLeipsOffset} />
        <SmallNumber
          label="Font"
          value={values.indicatorFontSize}
          onChange={setters.setIndicatorFontSize}
        />
        <SmallNumber
          label="Arrow"
          value={values.indicatorArrowScale}
          onChange={setters.setIndicatorArrowScale}
        />
        <SmallNumber
          label="Sig"
          value={values.significantDigits}
          onChange={setters.setSignificantDigits}
        />
        <span className="grid w-[190px] grid-cols-[1fr_1fr_auto] gap-1">
          <BandDomainInput value={xMax} onChange={(value) => setXDomainMax(value)} />
          <BandDomainInput value={xMin} onChange={(value) => setXDomainMin(value)} />
          <button
            className="rounded border border-slate-300 bg-white px-1 py-0.5 font-semibold hover:bg-cyan-50"
            type="button"
            onClick={onAutoScale}
          >
            Auto
          </button>
        </span>
      </div>
    </div>
  );

  function setXDomainMin(value: number) {
    setXMin(value);
    setViewport((current) => ({
      ...current,
      x: { min: Math.min(value, xMax), max: Math.max(value, xMax) },
    }));
  }

  function setXDomainMax(value: number) {
    setXMax(value);
    setViewport((current) => ({
      ...current,
      x: { min: Math.min(xMin, value), max: Math.max(xMin, value) },
    }));
  }
}

export function clampSignificantDigits(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_BAND_SIGNIFICANT_DIGITS;
  }
  return Math.min(Math.max(Math.round(value), 1), 8);
}

function BandDomainInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <input
      className="min-w-0 rounded border border-slate-200 bg-white px-1 py-0.5 font-mono"
      value={Number.isFinite(value) ? value.toFixed(2) : ""}
      onChange={(event) => onChange(Number(event.currentTarget.value))}
    />
  );
}
