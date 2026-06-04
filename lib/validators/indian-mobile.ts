const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

export type IndianMobileParseResult =
  | { valid: true; e164: string; national: string; countryCode: "+91" }
  | { valid: false; error: string };

/**
 * Normalizes and validates an Indian mobile number.
 * Accepts +91 / 91 prefix, leading 0, or 10-digit national format.
 */
export function parseIndianMobile(input: unknown): IndianMobileParseResult {
  if (typeof input !== "string") {
    return { valid: false, error: "Mobile number must be a string" };
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return { valid: false, error: "Mobile number is required" };
  }

  let digits = trimmed.replace(/[\s\-().]/g, "");

  if (digits.startsWith("+")) {
    digits = digits.slice(1);
  }

  while (digits.length > 10) {
    if (digits.startsWith("91") && digits.length >= 12) {
      digits = digits.slice(2);
    } else if (digits.startsWith("0") && digits.length >= 11) {
      digits = digits.slice(1);
    } else {
      digits = digits.slice(-10);
      break;
    }
  }

  if (!INDIAN_MOBILE_REGEX.test(digits)) {
    return {
      valid: false,
      error:
        "Enter a valid Indian mobile number (10 digits, starting with 6–9). Example: +91 98765 43210",
    };
  }

  return {
    valid: true,
    e164: `+91${digits}`,
    national: digits,
    countryCode: "+91",
  };
}

/** Formats pasted or autofilled values to a 10-digit national number (6–9 prefix). */
export function normalizeIndianMobileInput(value: string): string {
  if (!value.trim()) return "";

  let digits = value.trim().replace(/[\s\-().]/g, "");
  if (digits.startsWith("+")) {
    digits = digits.slice(1);
  }
  digits = digits.replace(/\D/g, "");

  while (digits.length > 10) {
    if (digits.startsWith("91") && digits.length >= 12) {
      digits = digits.slice(2);
    } else if (digits.startsWith("0") && digits.length >= 11) {
      digits = digits.slice(1);
    } else {
      digits = digits.slice(-10);
      break;
    }
  }

  return digits.slice(0, 10);
}
