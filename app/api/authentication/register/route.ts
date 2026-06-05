import { NextResponse } from "next/server";
import { getApiBaseUrl, parseBackendBody } from "@/lib/api/backend";
import { getHeadersFromRequest } from "@/lib/header-utils";
import {
  INDUSTRY_TYPES,
  type IndustryType,
} from "@/lib/constants/industry-types";
import {
  ORGANISATION_TYPES,
  type OrganisationType,
} from "@/lib/constants/organisation-types";
import { isPreferredLanguageCode } from "@/lib/localization";
import { isValidGstin, normalizeGstin } from "@/lib/validators/gstin";
import { parseIndianMobile } from "@/lib/validators/indian-mobile";

export async function POST(request: Request) {
  try {
    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      return NextResponse.json(
        { error: "Authentication service is not configured" },
        { status: 500 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const payload = (body ?? {}) as {
      mobile?: unknown;
      userName?: unknown;
      organisationName?: unknown;
      organisationType?: unknown;
      industryType?: unknown;
      gstin?: unknown;
      preferredLanguage?: unknown;
    };

    const parsedMobile = parseIndianMobile(payload.mobile);
    if (!parsedMobile.valid) {
      return NextResponse.json({ error: parsedMobile.error }, { status: 400 });
    }

    const userName =
      typeof payload.userName === "string" ? payload.userName.trim() : "";
    const organisationName =
      typeof payload.organisationName === "string"
        ? payload.organisationName.trim()
        : "";

    if (userName.length < 2) {
      return NextResponse.json(
        { error: "Contact name must be at least 2 characters" },
        { status: 400 }
      );
    }

    if (organisationName.length < 2) {
      return NextResponse.json(
        { error: "Trade name must be at least 2 characters" },
        { status: 400 }
      );
    }

    const organisationType = payload.organisationType as OrganisationType;
    if (!ORGANISATION_TYPES.includes(organisationType)) {
      return NextResponse.json(
        { error: "Select a valid organisation type" },
        { status: 400 }
      );
    }

    const industryType = payload.industryType as IndustryType;
    if (!INDUSTRY_TYPES.includes(industryType)) {
      return NextResponse.json(
        { error: "Select a valid industry type" },
        { status: 400 }
      );
    }

    let preferredLanguage = "en";
    if (typeof payload.preferredLanguage === "string") {
      const code = payload.preferredLanguage.trim().toLowerCase();
      if (!isPreferredLanguageCode(code)) {
        return NextResponse.json(
          { error: "Select a valid preferred language" },
          { status: 400 }
        );
      }
      preferredLanguage = code;
    }

    let gstin: string | undefined;
    const rawGstin = typeof payload.gstin === "string" ? payload.gstin.trim() : "";
    if (rawGstin.length > 0) {
      const normalized = normalizeGstin(rawGstin);
      if (!isValidGstin(normalized)) {
        return NextResponse.json(
          { error: "Enter a valid 15-character GSTIN" },
          { status: 400 }
        );
      }
      gstin = normalized;
    }

    const headers = getHeadersFromRequest(request);

    let backendResponse: Response;
    try {
      backendResponse = await fetch(`${apiBaseUrl}auth/register`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          mobile: parsedMobile.national,
          userName,
          organisationName,
          organisationType,
          industryType,
          preferredLanguage,
          ...(gstin && { gstin }),
        }),
      });
    } catch (error) {
      console.error("Register backend request failed:", error);
      return NextResponse.json(
        { error: "Unable to reach authentication service" },
        { status: 502 }
      );
    }

    const responseBody = await parseBackendBody(backendResponse);
    return NextResponse.json(responseBody, { status: backendResponse.status });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Failed to register" }, { status: 500 });
  }
}
