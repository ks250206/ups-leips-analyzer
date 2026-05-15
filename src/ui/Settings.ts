import { create } from "zustand";
import type { SampleInfoField } from "../domain/sampleInfo";
import type { CursorStyle } from "../store/projectTypes";

export type { CursorStyle };

export type UserLocale = "ja-JP" | "en-US";

interface UserSettingsState {
  locale: UserLocale;
  setLocale: (locale: UserLocale) => void;
}

export const USER_LOCALE_STORAGE_KEY = "ups-leips:user-locale";

export const USER_LOCALES: readonly UserLocale[] = ["ja-JP", "en-US"];

export const useUserSettingsStore = create<UserSettingsState>((set) => ({
  locale: readStoredLocale(),
  setLocale: (locale) => {
    writeStoredLocale(locale);
    set({ locale });
  },
}));

export function cursorStyleLabel(style: CursorStyle): string {
  switch (style) {
    case "range":
      return "Range cursor";
    default:
      return "Point cursor";
  }
}

export function localeLabel(locale: UserLocale): string {
  switch (locale) {
    case "en-US":
      return "English (en-US)";
    default:
      return "日本語 (ja-JP)";
  }
}

export function sampleInfoLabel(
  field: SampleInfoField,
  fallback: string,
  locale: UserLocale,
): string {
  if (locale !== "en-US") {
    return fallback;
  }
  return EN_SAMPLE_INFO_LABELS[field] ?? fallback;
}

export function sampleInfoPlaceholder(
  field: SampleInfoField,
  fallback: string | undefined,
  locale: UserLocale,
): string | undefined {
  if (locale !== "en-US") {
    return fallback;
  }
  return EN_SAMPLE_INFO_PLACEHOLDERS[field] ?? fallback;
}

export function containedElementsLabel(locale: UserLocale): string {
  return locale === "en-US" ? "Contained elements" : "含有元素";
}

function readStoredLocale(): UserLocale {
  try {
    if (typeof localStorage === "undefined") {
      return "ja-JP";
    }
    return normalizeLocale(localStorage.getItem(USER_LOCALE_STORAGE_KEY));
  } catch {
    return "ja-JP";
  }
}

function writeStoredLocale(locale: UserLocale): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(USER_LOCALE_STORAGE_KEY, locale);
    }
  } catch {
    // Ignore storage failures; the in-memory setting still works for this session.
  }
}

function normalizeLocale(value: string | null): UserLocale {
  return value === "en-US" ? "en-US" : "ja-JP";
}

const EN_SAMPLE_INFO_LABELS: Partial<Record<SampleInfoField, string>> = {
  researcherLastName: "Researcher last name",
  researcherFirstName: "Researcher first name",
  researcherFirstNameEnglish: "Researcher first name (English)",
  researcherLastNameEnglish: "Researcher last name (English)",
  sampleName: "Sample name",
  sampleState: "Sample state",
  nominalComposition: "Nominal composition",
  crystalStructure: "Crystal structure",
  crystalState: "Crystal state",
  applicationCategory: "Application category",
  batteryIonSpecies: "Battery ion species",
  holder: "Sample holder",
  transferVessel: "Transfer vessel",
  sampleForm: "Instrument sample form",
  basePressurePa: "Base pressure (Pa)",
  samplePreparedDate: "Sample preparation date",
  sampleMeasuredDate: "Sample measurement date",
  notes: "Notes",
};

const EN_SAMPLE_INFO_PLACEHOLDERS: Partial<Record<SampleInfoField, string>> = {
  researcherLastName: "Doe",
  researcherFirstName: "Alex",
  researcherFirstNameEnglish: "Alex",
  researcherLastNameEnglish: "Doe",
  sampleName: "Sample-001",
  sampleState: "initial, 1st charge, Ar etched",
  nominalComposition: "Li6PS5Cl",
  crystalStructure: "argyrodite",
  basePressurePa: "6.7E-8",
};
