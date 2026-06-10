import { isApiErrorResponse, type CheckGstSuccessResponse } from "@/lib/types/auth-api";
import { isValidGstin, normalizeGstin } from "@/lib/validators/gstin";

export async function lookupGstin(
  gstin: string,
  options?: { compareName?: string },
): Promise<CheckGstSuccessResponse["data"]> {
  const normalized = normalizeGstin(gstin);
  if (!isValidGstin(normalized)) {
    throw new Error("Enter a valid 15-character GSTIN");
  }

  const compareName = options?.compareName?.trim();
  const res = await fetch("/api/authentication/register/check-gst", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      gstin: normalized,
      ...(compareName ? { compareName } : {}),
    }),
  });
  const data: unknown = await res.json();

  if (!res.ok) {
    const message = isApiErrorResponse(data)
      ? data.error.details ?? data.message
      : (data as { error?: string })?.error ?? "Failed to verify GSTIN";
    throw new Error(message);
  }

  const success = data as CheckGstSuccessResponse;
  return success.data;
}
