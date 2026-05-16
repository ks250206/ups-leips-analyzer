import { useEffect, useState, type ReactNode } from "react";
import {
  SAMPLE_INFO_FIELDS,
  elementsFromComposition,
  isValidBasePressurePa,
  type SampleInfoFieldDefinition,
  type SampleInfoFieldValue,
  type SampleInfoState,
} from "../../domain/sampleInfo";
import type { AnalysisState, FitRange, SpectrumDataset } from "../../domain/types";
import { MultiSelectField, SelectField } from "../FormSelect";
import {
  containedElementsLabel,
  sampleInfoLabel,
  sampleInfoPlaceholder,
  useUserSettingsStore,
} from "../Settings";
import { formatRange } from "../format";
import { bandIpSourceValue, defaultIpSourceForDisplay } from "./AnalysisControlModel";
import { RangeNumberInput } from "./AnalysisRangeInput";

export function DatasetMultiSelect({
  datasets,
  selectedIds,
  onChange,
}: {
  datasets: readonly SpectrumDataset[];
  selectedIds: readonly string[];
  onChange: (ids: string[]) => void;
}) {
  const byId = new Map(datasets.map((dataset) => [dataset.id, dataset.name]));
  return (
    <MultiSelectField
      ariaLabel="UPS IP datasets"
      options={datasets.map((dataset) => dataset.id)}
      values={[...selectedIds]}
      placeholder="Select UPS IP datasets"
      labelForOption={(id) => byId.get(id) ?? id}
      summaryLabel={(ids, labelForOption) =>
        ids.length <= 1
          ? labelForOption(ids[0] ?? "")
          : `${labelForOption(ids[0] ?? "")} .. + ${ids.length - 1}`
      }
      onChange={onChange}
    />
  );
}

export function IpSourceSelect({
  analysis,
  setBandIpSource,
}: {
  analysis: AnalysisState;
  setBandIpSource: (source: NonNullable<AnalysisState["bandIpSource"]>) => void;
}) {
  const validIpResults = (analysis.ups?.ipResults ?? []).filter((result) =>
    Number.isFinite(result.ip),
  );
  return (
    <label className="mb-2 grid grid-cols-[118px_1fr_34px] items-center gap-2">
      <span className="font-semibold text-slate-600">IP source</span>
      <SelectField
        ariaLabel="Band Diagram IP source"
        options={[
          "zero-voltage-extrapolated",
          "average",
          ...(analysis.ups?.ipResults ?? []).map((result) => `dataset:${result.datasetId}`),
        ]}
        value={bandIpSourceValue(analysis.bandIpSource ?? defaultIpSourceForDisplay(analysis))}
        disabledOptions={validIpResults.length < 2 ? ["zero-voltage-extrapolated"] : []}
        labelForOption={(value) => {
          if (value === "zero-voltage-extrapolated") {
            return "0 V extrapolated";
          }
          if (value === "average") {
            return "Average";
          }
          const datasetId = value.replace("dataset:", "");
          return (
            (analysis.ups?.ipResults ?? []).find((result) => result.datasetId === datasetId)
              ?.datasetName ?? datasetId
          );
        }}
        onChange={(value) => {
          if (value === "average" || value === "zero-voltage-extrapolated") {
            setBandIpSource({ mode: value });
          } else {
            setBandIpSource({ mode: "dataset", datasetId: value.replace("dataset:", "") });
          }
        }}
      />
      <span className="text-slate-500">IP</span>
    </label>
  );
}

export function SampleInfoFields({
  locale,
  sampleInfo,
  setSampleInfoField,
}: {
  locale: ReturnType<typeof useUserSettingsStore.getState>["locale"];
  sampleInfo: SampleInfoState;
  setSampleInfoField: (field: keyof SampleInfoState, value: SampleInfoFieldValue) => void;
}) {
  return (
    <div className="grid gap-2">
      {SAMPLE_INFO_FIELDS.map((field) => (
        <FragmentWithElements
          key={field.field}
          field={field}
          locale={locale}
          sampleInfo={sampleInfo}
          onChange={(value) => setSampleInfoField(field.field, value)}
        />
      ))}
    </div>
  );
}

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-slate-300 p-2">
      <h2 className="mb-2 text-sm font-bold text-slate-800">{title}</h2>
      {children}
    </section>
  );
}

export function ResultGrid({ rows }: { rows: Array<[ReactNode, string, string]> }) {
  return (
    <div className="grid gap-1">
      {rows.map(([label, value, unit], index) => (
        <div key={String(index)} className="grid grid-cols-[118px_1fr_34px] items-center gap-2">
          <span className="font-semibold text-slate-600">{label}</span>
          <span className="rounded border border-slate-300 bg-white px-2 py-1 font-mono">
            {value}
          </span>
          <span className="text-slate-500">{unit}</span>
        </div>
      ))}
    </div>
  );
}

export function RangeEditor({
  label,
  selected,
  range,
  onChange,
  onFocus,
}: {
  label: string;
  selected: boolean;
  range: FitRange;
  onChange: (range: FitRange) => void;
  onFocus: () => void;
}) {
  return (
    <label
      className={
        selected
          ? "grid grid-cols-[98px_1fr] items-center gap-2 rounded border border-slate-500 bg-slate-200 px-1 py-0.5 shadow-sm"
          : "grid grid-cols-[98px_1fr] items-center gap-2 rounded border border-transparent px-1 py-0.5"
      }
      onFocus={onFocus}
      onPointerDown={onFocus}
    >
      <span
        className={selected ? "truncate font-semibold text-slate-800" : "truncate text-slate-600"}
        title={`${label}: ${formatRange(range.min, range.max)}`}
      >
        {label}
      </span>
      <span className="grid grid-cols-2 gap-1">
        <RangeNumberInput
          value={range.min}
          onChange={(value) => onChange({ ...range, min: value })}
        />
        <RangeNumberInput
          value={range.max}
          onChange={(value) => onChange({ ...range, max: value })}
        />
      </span>
    </label>
  );
}

function FragmentWithElements({
  field,
  locale,
  sampleInfo,
  onChange,
}: {
  field: SampleInfoFieldDefinition;
  locale: ReturnType<typeof useUserSettingsStore.getState>["locale"];
  sampleInfo: SampleInfoState;
  onChange: (value: SampleInfoFieldValue) => void;
}) {
  return (
    <>
      <SampleInfoFieldRow
        definition={field}
        locale={locale}
        value={sampleInfo?.[field.field] ?? (field.kind === "multiselect" ? [] : "")}
        onChange={onChange}
      />
      {field.field === "nominalComposition" ? (
        <label className="grid grid-cols-[118px_1fr] items-center gap-2">
          <span className="font-semibold text-slate-600">{containedElementsLabel(locale)}</span>
          <input
            className="min-w-0 rounded border border-slate-300 bg-slate-50 px-2 py-1 text-slate-600"
            readOnly
            value={elementsFromComposition(sampleInfo?.nominalComposition)}
            placeholder="Li, P, S, Cl"
          />
        </label>
      ) : null}
    </>
  );
}

function SampleInfoFieldRow({
  definition,
  locale,
  value,
  onChange,
}: {
  definition: SampleInfoFieldDefinition;
  locale: ReturnType<typeof useUserSettingsStore.getState>["locale"];
  value: SampleInfoFieldValue;
  onChange: (value: SampleInfoFieldValue) => void;
}) {
  const commonClass = "min-w-0 rounded border border-slate-300 bg-white px-2 py-1";
  const stringValue = typeof value === "string" ? value : "";
  const validatesBasePressure = definition.field === "basePressurePa";
  const [draftValue, setDraftValue] = useState(stringValue);
  useEffect(() => {
    setDraftValue(stringValue);
  }, [stringValue]);
  const hasBasePressureError =
    validatesBasePressure && draftValue.length > 0 && !isValidBasePressurePa(draftValue);
  const updateTextValue = (next: string) => {
    if (validatesBasePressure) {
      setDraftValue(next);
      if (isValidBasePressurePa(next)) {
        onChange(next);
      }
      return;
    }
    onChange(next);
  };
  return (
    <label className="grid grid-cols-[118px_1fr] items-start gap-2">
      <span className="font-semibold text-slate-600">
        {sampleInfoLabel(definition.field, definition.label, locale)}
      </span>
      {definition.kind === "select" ? (
        <SelectField
          ariaLabel={sampleInfoLabel(definition.field, definition.label, locale)}
          options={definition.options ?? []}
          placeholder={sampleInfoPlaceholder(definition.field, definition.placeholder, locale)}
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
        />
      ) : definition.kind === "multiselect" ? (
        <MultiSelectField
          ariaLabel={sampleInfoLabel(definition.field, definition.label, locale)}
          options={definition.options ?? []}
          placeholder={sampleInfoPlaceholder(definition.field, definition.placeholder, locale)}
          values={Array.isArray(value) ? value : value ? [value] : []}
          onChange={onChange}
        />
      ) : definition.kind === "textarea" ? (
        <textarea
          className={`${commonClass} min-h-20 resize-y`}
          value={stringValue}
          placeholder={sampleInfoPlaceholder(definition.field, definition.placeholder, locale)}
          onChange={(event) => updateTextValue(event.currentTarget.value)}
        />
      ) : (
        <span className="grid gap-1">
          <input
            aria-invalid={hasBasePressureError || undefined}
            autoComplete="off"
            className={
              hasBasePressureError ? `${commonClass} border-red-400 bg-red-50` : commonClass
            }
            name={`ups-leips-${definition.field}`}
            type={definition.kind === "date" ? "date" : "text"}
            value={validatesBasePressure ? draftValue : stringValue}
            placeholder={sampleInfoPlaceholder(definition.field, definition.placeholder, locale)}
            onChange={(event) => updateTextValue(event.currentTarget.value)}
          />
          {hasBasePressureError ? (
            <span className="text-[10px] font-semibold text-red-600">
              Enter a positive pressure value, e.g. 6.7E-8.
            </span>
          ) : null}
        </span>
      )}
    </label>
  );
}
