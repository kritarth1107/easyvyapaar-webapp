import { NextResponse } from "next/server";
import { fetchBackend, getApiBaseUrl, parseBackendBody } from "@/lib/api/backend";
import { getHeadersFromRequest } from "@/lib/header-utils";

export async function POST(request: Request) {
  try {
    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      return NextResponse.json({ error: "Billing service is not configured" }, { status: 500 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const raw = body as {
      paymentToken?: unknown;
      planCode?: unknown;
      billingCycle?: unknown;
      couponCode?: unknown;
    };

    const paymentToken = typeof raw.paymentToken === "string" ? raw.paymentToken.trim() : "";
    const planCode = typeof raw.planCode === "string" ? raw.planCode.trim() : "";
    const billingCycle = typeof raw.billingCycle === "string" ? raw.billingCycle.trim() : "";
    const couponCode =
      typeof raw.couponCode === "string" ? raw.couponCode.trim() : undefined;

    if (!paymentToken || !planCode || !billingCycle) {
      return NextResponse.json(
        { error: "paymentToken, planCode, and billingCycle are required" },
        { status: 400 },
      );
    }

    const headers = getHeadersFromRequest(request);
    const backendResponse = await fetchBackend(`${apiBaseUrl}billing/razorpay/update-plan`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        paymentToken,
        planCode,
        billingCycle,
        couponCode: raw.couponCode === undefined || raw.couponCode === null
          ? ""
          : typeof raw.couponCode === "string"
            ? raw.couponCode.trim().toUpperCase()
            : "",
      }),
      timeoutMs: 20_000,
    });

    const responseBody = await parseBackendBody(backendResponse);
    return NextResponse.json(responseBody, { status: backendResponse.status });
  } catch (error) {
    console.error("Update pending plan error:", error);
    return NextResponse.json({ error: "Failed to update plan selection" }, { status: 500 });
  }
}
