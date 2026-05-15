export interface SampleInfoState {
  researcherLastName?: string;
  researcherFirstName?: string;
  researcherFirstNameEnglish?: string;
  researcherLastNameEnglish?: string;
  sampleName?: string;
  sampleState?: string;
  nominalComposition?: string;
  crystalStructure?: string;
  crystalState?: string;
  applicationCategory?: string;
  batteryIonSpecies?: string[];
  holder?: string;
  transferVessel?: string;
  sampleForm?: string;
  basePressurePa?: string;
  samplePreparedDate?: string;
  sampleMeasuredDate?: string;
  notes?: string;
}

export type SampleInfoField = keyof SampleInfoState;
export type SampleInfoFieldValue = string | string[];

export interface SampleInfoFieldDefinition {
  field: SampleInfoField;
  label: string;
  kind: "text" | "select" | "multiselect" | "date" | "textarea";
  placeholder?: string;
  options?: readonly string[];
}

export const SAMPLE_HOLDER_OPTIONS = [
  "フラット試料ホルダー_190HC",
  "リセス試料ホルダー_191HC",
  "AR用試料ホルダー_279HCA",
  "φ60mm&ファラデーカップホルダー_260S",
  "加熱・冷却用フラットホルダー_190HC1",
  "加熱専用フラットホルダー_190HE1",
  "加熱・冷却用4端子試料ホルダー_190Q",
  "ガス反応セル用試料ホルダー_190HR",
  "LEIPS測定対応傾斜試料ホルダ_MOD201",
] as const;

export const TRANSFER_VESSEL_OPTIONS = ["使用", "未使用"] as const;

export const CRYSTAL_STATE_OPTIONS = ["crystal", "amorphous/glass", "glass-ceramics"] as const;

export const APPLICATION_CATEGORY_OPTIONS = [
  "cathode",
  "anode",
  "solid-electrolyte",
  "collector",
  "other",
] as const;

export const BATTERY_ION_SPECIES_OPTIONS = [
  "H-",
  "H+",
  "Li-",
  "Li+",
  "Na+",
  "K+",
  "Mg2+",
  "Ca2+",
  "Zn2+",
  "Al3+",
] as const;

export const SAMPLE_FORM_OPTIONS = ["thin film", "pellet", "powder", "other"] as const;

export const SAMPLE_INFO_FIELDS: readonly SampleInfoFieldDefinition[] = [
  { field: "researcherLastName", label: "実験者名(姓)", kind: "text", placeholder: "山田" },
  { field: "researcherFirstName", label: "実験者名(名)", kind: "text", placeholder: "太郎" },
  {
    field: "researcherFirstNameEnglish",
    label: "実験者名_英語(名)",
    kind: "text",
    placeholder: "Taro",
  },
  {
    field: "researcherLastNameEnglish",
    label: "実験者名_英語(姓)",
    kind: "text",
    placeholder: "Yamada",
  },
  { field: "sampleName", label: "試料名", kind: "text", placeholder: "Sample-001" },
  { field: "sampleState", label: "sample state", kind: "text", placeholder: "powder sample" },
  { field: "nominalComposition", label: "組成(仕込)", kind: "text", placeholder: "Li6PS5Cl" },
  { field: "crystalStructure", label: "結晶構造", kind: "text", placeholder: "argyrodite" },
  {
    field: "crystalState",
    label: "結晶の状態",
    kind: "select",
    options: CRYSTAL_STATE_OPTIONS,
    placeholder: "crystal",
  },
  {
    field: "applicationCategory",
    label: "用途分類",
    kind: "select",
    options: APPLICATION_CATEGORY_OPTIONS,
    placeholder: "solid-electrolyte",
  },
  {
    field: "batteryIonSpecies",
    label: "電池のイオン種",
    kind: "multiselect",
    options: BATTERY_ION_SPECIES_OPTIONS,
    placeholder: "Li+",
  },
  {
    field: "holder",
    label: "試料台",
    kind: "select",
    options: SAMPLE_HOLDER_OPTIONS,
    placeholder: "LEIPS測定対応傾斜試料ホルダ_MOD201",
  },
  {
    field: "transferVessel",
    label: "トランスファーベッセル",
    kind: "select",
    options: TRANSFER_VESSEL_OPTIONS,
    placeholder: "使用",
  },
  {
    field: "sampleForm",
    label: "装置試料形態",
    kind: "select",
    options: SAMPLE_FORM_OPTIONS,
    placeholder: "pellet",
  },
  {
    field: "basePressurePa",
    label: "到達真空度 (Pa)",
    kind: "text",
    placeholder: "6.7E-8",
  },
  { field: "samplePreparedDate", label: "試料作成日", kind: "date" },
  { field: "sampleMeasuredDate", label: "試料測定日", kind: "date" },
  { field: "notes", label: "備考", kind: "textarea" },
];

export function elementsFromComposition(composition: string | undefined): string {
  if (!composition) {
    return "";
  }
  const seen = new Set<string>();
  const elements: string[] = [];
  for (const match of composition.matchAll(/[A-Z][a-z]?/g)) {
    const element = match[0];
    if (!seen.has(element)) {
      seen.add(element);
      elements.push(element);
    }
  }
  return elements.join(", ");
}

export function normalizeSampleInfo(input: SampleInfoState | undefined): SampleInfoState {
  if (!input) {
    return {};
  }
  return {
    ...input,
    batteryIonSpecies: normalizeStringArray(input.batteryIonSpecies),
  };
}

export function isValidBasePressurePa(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return true;
  }
  const numeric = Number(trimmed);
  return Number.isFinite(numeric) && numeric > 0;
}

function normalizeStringArray(value: string | string[] | undefined): string[] | undefined {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  return value ? [value] : undefined;
}
