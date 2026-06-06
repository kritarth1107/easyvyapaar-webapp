import { extractBackendError, normalizeDaybookListResponse } from "@/lib/api/daybook";
import type { DaybookListParams, DaybookListResponse } from "@/lib/types/daybook-api";

async function parseJsonResponse(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function buildQuery(organisationId: string, params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams({ organisationId });
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "all" && String(value).trim()) {
      search.set(key, String(value));
    }
  }
  return search.toString();
}

export async function fetchDaybook(
  organisationId: string,
  params: DaybookListParams = {},
): Promise<DaybookListResponse> {
  const res = await fetch(
    `/api/finance/daybook?${buildQuery(organisationId, {
      fromDate: params.fromDate,
      toDate: params.toDate,
      entryType: params.entryType,
      search: params.search,
      page: params.page,
      limit: params.limit ?? 100,
    })}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to load daybook");
  return normalizeDaybookListResponse(body);
}
