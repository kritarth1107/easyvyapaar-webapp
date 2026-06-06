"use client";

import { useCallback, useEffect, useState } from "react";
import type { PartiesPageView } from "@/lib/dashboard/mock-parties";
import { fetchParties, fetchPartiesSummary } from "@/lib/parties/parties-api-client";
import type { PartyDashboardSummary, PartyListParams, PartySummary } from "@/lib/types/parties-api";
import type { PartyType } from "@/lib/dashboard/mock-parties";

type UsePartiesOptions = {
  view: PartiesPageView;
  partyType?: PartyType | "all";
  status?: "all" | "active" | "inactive";
  balance?: "all" | "receivable" | "payable" | "settled";
  search?: string;
  page?: number;
  limit?: number;
};

export function useParties(
  organisationId: string | null | undefined,
  options: UsePartiesOptions,
) {
  const [parties, setParties] = useState<PartySummary[]>([]);
  const [summary, setSummary] = useState<PartyDashboardSummary | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const orgId = organisationId?.trim();
    if (!orgId) {
      setParties([]);
      setSummary(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const listParams: PartyListParams = {
      view: options.view,
      partyType: options.partyType,
      status: options.status,
      balance: options.balance,
      search: options.search,
      page: options.page ?? 1,
      limit: options.limit ?? 20,
    };

    try {
      const [listResult, summaryResult] = await Promise.all([
        fetchParties(orgId, listParams),
        fetchPartiesSummary(orgId),
      ]);
      setParties(listResult.items);
      setPagination(listResult.pagination);
      setSummary(summaryResult);
    } catch (err) {
      setParties([]);
      setSummary(null);
      setError(err instanceof Error ? err.message : "Failed to load parties");
    } finally {
      setLoading(false);
    }
  }, [
    organisationId,
    options.view,
    options.partyType,
    options.status,
    options.balance,
    options.search,
    options.page,
    options.limit,
  ]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { parties, summary, pagination, loading, error, reload };
}
