import { NextResponse } from "next/server";
import { fetchBackend, getApiBaseUrl, parseBackendBody } from "@/lib/api/backend";
import { setSessionCookies } from "@/lib/auth/session-cookies";
import { getHeadersFromRequest } from "@/lib/header-utils";
import type { PaymentSessionSuccessResponse } from "@/lib/types/auth-api";

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

    const payload = body as {
      paymentToken?: string;
      razorpayOrderId?: string;
      razorpaySubscriptionId?: string;
      razorpayPaymentId?: string;
      razorpaySignature?: string;
    };

    const headers = getHeadersFromRequest(request);
    const backendResponse = await fetchBackend(`${apiBaseUrl}billing/razorpay/verify`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        paymentToken: payload.paymentToken?.trim(),
        razorpayOrderId: payload.razorpayOrderId?.trim(),
        razorpaySubscriptionId: payload.razorpaySubscriptionId?.trim(),
        razorpayPaymentId: payload.razorpayPaymentId?.trim(),
        razorpaySignature: payload.razorpaySignature?.trim(),
      }),
      timeoutMs: 30_000,
    });

    const responseBody = await parseBackendBody(backendResponse);

    if (backendResponse.ok) {
      const success = responseBody as PaymentSessionSuccessResponse;
      const sessionToken = success?.data?.sessionToken;
      if (sessionToken) {
        await setSessionCookies(sessionToken);
      }
    }

    return NextResponse.json(responseBody, { status: backendResponse.status });
  } catch (error) {
    console.error("Verify Razorpay payment error:", error);
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
  }
}
