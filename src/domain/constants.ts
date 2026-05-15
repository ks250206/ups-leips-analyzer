export const DEFAULT_PHOTON_ENERGY_EV = 21.22;
export const CUSTOM_BANDPASS_TYPE = 0;

export const BANDPASS_OPTIONS = [
  { type: 1, label: "1_4.77 eV", energy: 4.77 },
  { type: 2, label: "2_4.43 eV", energy: 4.43 },
  { type: 3, label: "3_4.35 eV", energy: 4.35 },
  { type: 4, label: "4_3.65 eV", energy: 3.65 },
  { type: 5, label: "5_4.88 eV", energy: 4.88 },
  { type: 6, label: "6_5.79 eV", energy: 5.79 },
  { type: 7, label: "7_3.70 eV", energy: 3.7 },
] as const;

export function bandpassEnergy(type: number): number {
  const option = BANDPASS_OPTIONS.find((item) => item.type === type);
  if (!option) {
    throw new Error(`Unknown bandpass filter type: ${type}`);
  }
  return option.energy;
}
