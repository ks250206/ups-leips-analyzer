import { SelectField } from "../FormSelect";

export function UpsIpTitleSelector({
  activeDatasetId,
  datasetIds,
  datasets,
  onChange,
}: {
  activeDatasetId?: string;
  datasetIds: readonly string[];
  datasets: readonly { id: string; name: string }[];
  onChange: (datasetId: string) => void;
}) {
  const validActive =
    activeDatasetId && datasetIds.includes(activeDatasetId) ? activeDatasetId : "";
  const value = validActive || datasetIds[0] || "";
  if (datasetIds.length === 0) {
    return <span className="text-[11px] font-medium text-slate-500">No IP dataset</span>;
  }
  const names = new Map(datasets.map((dataset) => [dataset.id, dataset.name]));
  return (
    <div className="w-56 text-[11px]" onPointerDown={(event) => event.stopPropagation()}>
      <SelectField
        ariaLabel="Active UPS IP dataset"
        options={[...datasetIds]}
        value={value}
        labelForOption={(id) => names.get(id) ?? id}
        onChange={onChange}
      />
    </div>
  );
}
