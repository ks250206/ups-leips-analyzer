import { BANDPASS_OPTIONS, CUSTOM_BANDPASS_TYPE } from "../../domain/constants";
import { useEffect, useState } from "react";
import { fitRangeKey, useProjectStore } from "../../store/projectStore";
import { useUserSettingsStore } from "../Settings";
import { formatNumber } from "../format";
import {
  averageIp,
  DATASET_SLOTS,
  FIT_TARGETS,
  type AnalysisTab,
  zeroVoltageIp,
} from "./AnalysisControlModel";
import {
  DatasetMultiSelect,
  IpSourceSelect,
  Panel,
  RangeEditor,
  ResultGrid,
  SampleInfoFields,
} from "./AnalysisControlParts";

export function AnalysisControls({ activeTab = "sample" }: { activeTab?: AnalysisTab }) {
  const project = useProjectStore((state) => state.project);
  const activeFitTarget = useProjectStore((state) => state.activeFitTarget);
  const assignDataset = useProjectStore((state) => state.assignDataset);
  const assignUpsIpDatasets = useProjectStore((state) => state.assignUpsIpDatasets);
  const setUpsIpAppliedVoltage = useProjectStore((state) => state.setUpsIpAppliedVoltage);
  const setBandIpSource = useProjectStore((state) => state.setBandIpSource);
  const setFitRange = useProjectStore((state) => state.setFitRange);
  const setActiveFitTarget = useProjectStore((state) => state.setActiveFitTarget);
  const setBandpassType = useProjectStore((state) => state.setBandpassType);
  const setCustomBandpassEnergy = useProjectStore((state) => state.setCustomBandpassEnergy);
  const setReelsIncidentEnergy = useProjectStore((state) => state.setReelsIncidentEnergy);
  const setEfMinusEvbm = useProjectStore((state) => state.setEfMinusEvbm);
  const setSampleInfoField = useProjectStore((state) => state.setSampleInfoField);
  const analysis = project.analysis;
  const sampleInfo = project.ui?.sampleInfo ?? {};
  const locale = useUserSettingsStore((state) => state.locale);
  const [tab, setTab] = useState<AnalysisTab>(activeTab);
  useEffect(() => setTab(activeTab), [activeTab]);

  return (
    <div className="flex h-full flex-col bg-slate-100 text-xs">
      {analysis.error ? (
        <div className="border-b border-red-200 bg-red-50 p-2 font-semibold text-red-700">
          {analysis.error}
        </div>
      ) : null}
      <div className="grid grid-cols-7 gap-1 border-b border-slate-300 bg-slate-200 p-2 text-[11px]">
        {[
          ["sample", "Samp."],
          ["data", "Data"],
          ["ups", "UPS"],
          ["leips", "LEIPS"],
          ["reels", "REELS"],
          ["band", "Band"],
          ["fit", "Fit"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={
              tab === id
                ? "rounded border border-slate-700 bg-slate-800 px-1.5 py-1 font-semibold text-white shadow-sm"
                : "rounded border border-slate-300 bg-white px-1.5 py-1 text-slate-700 hover:bg-slate-100"
            }
            type="button"
            onClick={() => setTab(id as typeof tab)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {tab === "data" ? (
          <Panel title="Datasets">
            <div className="grid gap-2">
              {DATASET_SLOTS.map((item) =>
                item.slot === "upsIpDatasetId" ? (
                  <label key={item.slot} className="grid grid-cols-[82px_1fr] items-center gap-2">
                    <span className="font-semibold text-slate-600">UPS IP</span>
                    <DatasetMultiSelect
                      datasets={project.datasets.filter(item.filter)}
                      selectedIds={analysis.selection.upsIpDatasetIds ?? []}
                      onChange={assignUpsIpDatasets}
                    />
                  </label>
                ) : (
                  <label key={item.slot} className="grid grid-cols-[82px_1fr] items-center gap-2">
                    <span className="font-semibold text-slate-600">{item.label}</span>
                    <select
                      className="min-w-0 rounded border border-slate-300 bg-white px-2 py-1"
                      value={(analysis.selection[item.slot] as string | undefined) ?? ""}
                      onChange={(event) => assignDataset(item.slot, event.currentTarget.value)}
                    >
                      <option value="">-</option>
                      {project.datasets.filter(item.filter).map((dataset) => (
                        <option key={dataset.id} value={dataset.id}>
                          {dataset.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ),
              )}
            </div>
          </Panel>
        ) : null}

        {tab === "sample" ? (
          <Panel title="Sample Info">
            <SampleInfoFields
              locale={locale}
              sampleInfo={sampleInfo}
              setSampleInfoField={setSampleInfoField}
            />
          </Panel>
        ) : null}

        {tab === "ups" ? (
          <Panel title="UPS spectra analysis">
            <h3 className="mb-1 font-bold text-slate-700">VB set</h3>
            <ResultGrid rows={[["EVBM", formatNumber(analysis.ups?.vbEvbm), "eV"]]} />
            <h3 className="mb-1 mt-3 font-bold text-slate-700">Band IP source</h3>
            <IpSourceSelect analysis={analysis} setBandIpSource={setBandIpSource} />
            <ResultGrid
              rows={[
                ["0 V extrapolated IP", formatNumber(zeroVoltageIp(analysis)), "eV"],
                ["Average IP", formatNumber(averageIp(analysis)), "eV"],
              ]}
            />
            <h3 className="mb-1 mt-3 font-bold text-slate-700">IP set</h3>
            <div className="grid gap-2">
              {(analysis.ups?.ipResults ?? []).map((result) => (
                <div
                  key={result.datasetId}
                  className="rounded border border-slate-200 bg-white p-2"
                >
                  <div className="mb-1 truncate font-semibold text-slate-700">
                    {result.datasetName}
                  </div>
                  <label className="mb-1 grid grid-cols-[118px_1fr_34px] items-center gap-2">
                    <span className="font-semibold text-slate-600">Applied bias</span>
                    <input
                      className="min-w-0 rounded border border-slate-300 bg-white px-2 py-1"
                      inputMode="decimal"
                      value={result.appliedVoltage}
                      onChange={(event) =>
                        setUpsIpAppliedVoltage(result.datasetId, Number(event.currentTarget.value))
                      }
                    />
                    <span className="text-slate-500">V</span>
                  </label>
                  <ResultGrid
                    rows={[
                      ["EVBM", formatNumber(result.ipEvbm), "eV"],
                      ["Ecut-off", formatNumber(result.ecutoff), "eV"],
                      ["IP", formatNumber(result.ip), "eV"],
                    ]}
                  />
                </div>
              ))}
            </div>
          </Panel>
        ) : null}

        {tab === "leips" ? (
          <Panel title="LEIPS spectra analysis">
            <label className="mb-2 grid grid-cols-[118px_1fr_34px] items-center gap-2">
              <span className="font-semibold text-slate-600">Bandpass Filter</span>
              <select
                className="min-w-0 rounded border border-slate-300 bg-white px-2 py-1"
                value={analysis.bandpassType}
                onChange={(event) => setBandpassType(Number(event.currentTarget.value))}
              >
                {BANDPASS_OPTIONS.map((option) => (
                  <option key={option.type} value={option.type}>
                    {option.label}
                  </option>
                ))}
                <option value={CUSTOM_BANDPASS_TYPE}>Custom</option>
              </select>
              <span className="text-slate-500">eV</span>
            </label>
            {analysis.bandpassType === CUSTOM_BANDPASS_TYPE ? (
              <label className="mb-2 grid grid-cols-[118px_1fr_34px] items-center gap-2">
                <span className="font-semibold text-slate-600">Custom</span>
                <input
                  className="min-w-0 rounded border border-slate-300 bg-white px-2 py-1"
                  inputMode="decimal"
                  value={analysis.customBandpassEnergy ?? ""}
                  onChange={(event) => setCustomBandpassEnergy(Number(event.currentTarget.value))}
                />
                <span className="text-slate-500">eV</span>
              </label>
            ) : null}
            <ResultGrid
              rows={[
                ["Epeak", formatNumber(analysis.leips?.ePeak), "V"],
                ["Evac", formatNumber(analysis.leips?.vacuumLevel), "eV"],
                ["EA", formatNumber(analysis.leips?.ea), "eV"],
              ]}
            />
          </Panel>
        ) : null}

        {tab === "reels" ? (
          <Panel title="REELS analysis">
            <label className="mb-2 grid grid-cols-[118px_1fr_34px] items-center gap-2">
              <span className="font-semibold text-slate-600">Incident E</span>
              <input
                className="min-w-0 rounded border border-slate-300 bg-white px-2 py-1"
                inputMode="decimal"
                value={analysis.reelsIncidentEnergy}
                onChange={(event) => setReelsIncidentEnergy(Number(event.currentTarget.value))}
              />
              <span className="text-slate-500">eV</span>
            </label>
            <ResultGrid rows={[["Eg", formatNumber(analysis.reels?.bandGap), "eV"]]} />
          </Panel>
        ) : null}

        {tab === "band" ? (
          <Panel title="Band Diagram">
            <IpSourceSelect analysis={analysis} setBandIpSource={setBandIpSource} />
            <label className="mb-2 grid grid-cols-[118px_1fr_34px] items-center gap-2">
              <span className="font-semibold text-slate-600">
                E<sub>VBM</sub>
              </span>
              <input
                className="min-w-0 rounded border border-slate-300 bg-white px-2 py-1"
                inputMode="decimal"
                value={analysis.efMinusEvbm}
                onChange={(event) => setEfMinusEvbm(Number(event.currentTarget.value))}
              />
              <span className="text-slate-500">eV</span>
            </label>
            <ResultGrid
              rows={[
                ["IP", formatNumber(analysis.band?.ip), "eV"],
                ["EA", formatNumber(analysis.band?.ea), "eV"],
                ["Eg", formatNumber(analysis.band?.eg), "eV"],
              ]}
            />
          </Panel>
        ) : null}

        {tab === "fit" ? (
          <Panel title="Cursor / fitting ranges">
            <div className="grid gap-1">
              {FIT_TARGETS.map((item) => (
                <RangeEditor
                  key={item.target}
                  label={item.label}
                  range={analysis.fitRanges[fitRangeKey(item.target)]}
                  selected={item.target === activeFitTarget}
                  onChange={(range) => setFitRange(item.target, range)}
                  onFocus={() => setActiveFitTarget(item.target)}
                />
              ))}
            </div>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}
