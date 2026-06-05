import { NextResponse } from "next/server";
import {
  mapFormToUpdatePayload,
  normalizeBusinessProfileResponse,
  type UpdateOrganisationPayload,
} from "@/lib/api/business-profile";
import { getApiBaseUrl, parseBackendBody } from "@/lib/api/backend";
import { INDUSTRY_TYPES } from "@/lib/constants/industry-types";
import { INDUSTRY_TYPE_NONE, type BusinessProfileForm } from "@/lib/dashboard/business-profile-form";
import { getHeadersFromRequest } from "@/lib/header-utils";
import { isValidGstin, normalizeGstin } from "@/lib/validators/gstin";
import { parseIndianMobile } from "@/lib/validators/indian-mobile";

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function validateUpdateBody(body: unknown): { organisationId: string; payload: UpdateOrganisationPayload } | string {
  const root = asRecord(body);
  if (!root) return "Invalid JSON body";

  const organisationId =
    typeof root.organisationId === "string" ? root.organisationId.trim() : "";
  if (!organisationId) return "organisationId is required";

  const form = root as Partial<BusinessProfileForm> & { organisationId?: string };
  const payload = mapFormToUpdatePayload(form as BusinessProfileForm);

  if (payload.contactNumber) {
    const parsed = parseIndianMobile(payload.contactNumber);
    if (!parsed.valid) return parsed.error;
    payload.contactNumber = parsed.national;
  }

  if (payload.gstin) {
    const normalized = normalizeGstin(payload.gstin);
    if (!isValidGstin(normalized)) {
      return "Enter a valid 15-character GSTIN";
    }
    payload.gstin = normalized;
  }

  if (payload.pan && !PAN_REGEX.test(payload.pan)) {
    return "Invalid PAN format";
  }

  if (
    payload.industryType &&
    payload.industryType !== INDUSTRY_TYPE_NONE &&
    !INDUSTRY_TYPES.includes(payload.industryType as (typeof INDUSTRY_TYPES)[number])
  ) {
    return "Select a valid industry type";
  }

  if (Object.keys(payload).length === 0) {
    return "At least one field is required to update";
  }

  return { organisationId, payload };
}

export async function PATCH(request: Request) {
  try {
    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      return NextResponse.json(
        { error: "Authentication service is not configured" },
        { status: 500 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const validated = validateUpdateBody(body);
    if (typeof validated === "string") {
      return NextResponse.json({ error: validated }, { status: 400 });
    }

    const headers = getHeadersFromRequest(request);
    const backendUrl = new URL(`user/organisations/${validated.organisationId}`, apiBaseUrl);

    let backendResponse: Response;
    try {
      backendResponse = await fetch(backendUrl.toString(), {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validated.payload),
        cache: "no-store",
      });
    } catch (error) {
      console.error("Business profile update backend request failed:", error);
      return NextResponse.json(
        { error: "Unable to reach authentication service" },
        { status: 502 },
      );
    }

    const responseBody = await parseBackendBody(backendResponse);
    const normalized = normalizeBusinessProfileResponse(responseBody);

    return NextResponse.json(normalized, { status: backendResponse.status });
  } catch (error) {
    console.error("Business profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update business profile" },
      { status: 500 },
    );
  }
}
