/** Mirrors `INDIAN_STATES` codes in EasyDukan_backend/constants/organisation.constant.ts */
export const INDIAN_STATE_CODE_LABELS: Record<string, string> = {
  AN: "Andaman and Nicobar Islands",
  AP: "Andhra Pradesh",
  AR: "Arunachal Pradesh",
  AS: "Assam",
  BR: "Bihar",
  CH: "Chandigarh",
  CT: "Chhattisgarh",
  DN: "Dadra and Nagar Haveli and Daman and Diu",
  DL: "Delhi",
  GA: "Goa",
  GJ: "Gujarat",
  HR: "Haryana",
  HP: "Himachal Pradesh",
  JK: "Jammu and Kashmir",
  JH: "Jharkhand",
  KA: "Karnataka",
  KL: "Kerala",
  LA: "Ladakh",
  LD: "Lakshadweep",
  MP: "Madhya Pradesh",
  MH: "Maharashtra",
  MN: "Manipur",
  ML: "Meghalaya",
  MZ: "Mizoram",
  NL: "Nagaland",
  OR: "Odisha",
  PY: "Puducherry",
  PB: "Punjab",
  RJ: "Rajasthan",
  SK: "Sikkim",
  TN: "Tamil Nadu",
  TS: "Telangana",
  TR: "Tripura",
  UP: "Uttar Pradesh",
  UK: "Uttarakhand",
  WB: "West Bengal",
};

export function stateCodeToLabel(code: string | undefined | null): string {
  if (!code) return "";
  const upper = code.trim().toUpperCase();
  return INDIAN_STATE_CODE_LABELS[upper] ?? code;
}

export function stateLabelToCode(label: string | undefined | null): string | undefined {
  if (!label) return undefined;
  const normalized = label.trim().toLowerCase();
  const entry = Object.entries(INDIAN_STATE_CODE_LABELS).find(
    ([, name]) => name.toLowerCase() === normalized,
  );
  return entry?.[0];
}
