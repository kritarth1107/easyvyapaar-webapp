import { stateCodeToLabel } from "@/lib/constants/indian-state-codes";

/** GSTIN first two digits → state code (mirrors backend gst-state.constant) */
const GST_NUMERIC_STATE_TO_CODE: Record<string, string> = {
  "01": "JK",
  "02": "HP",
  "03": "PB",
  "04": "CH",
  "05": "UK",
  "06": "HR",
  "07": "DL",
  "08": "RJ",
  "09": "UP",
  "10": "BR",
  "11": "SK",
  "12": "AR",
  "13": "NL",
  "14": "MN",
  "15": "MZ",
  "16": "TR",
  "17": "ML",
  "18": "AS",
  "19": "WB",
  "20": "JH",
  "21": "OR",
  "22": "CT",
  "23": "MP",
  "24": "GJ",
  "26": "DN",
  "27": "MH",
  "29": "KA",
  "30": "GA",
  "31": "KL",
  "32": "LA",
  "33": "TN",
  "34": "PY",
  "35": "AN",
  "36": "TS",
  "37": "AP",
  "38": "LA",
};

export function resolveStateCodeFromGstin(gstin: string): string {
  const normalized = gstin.trim().toUpperCase();
  if (normalized.length < 2) return "DL";
  return GST_NUMERIC_STATE_TO_CODE[normalized.slice(0, 2)] ?? "DL";
}

export function placeOfSupplyFromGstin(gstin: string): string {
  return stateCodeToLabel(resolveStateCodeFromGstin(gstin));
}
