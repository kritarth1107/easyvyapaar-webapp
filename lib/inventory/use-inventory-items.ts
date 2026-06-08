"use client";

import { useCallback, useEffect, useState } from "react";
import type { InventoryItem } from "@/lib/types/inventory-ui";
import {
  fetchAllInventoryItems,
  fetchInventoryItems,
} from "@/lib/inventory/inventory-api-client";
import type { InventoryItemListParams, PaginationMeta } from "@/lib/types/inventory-api";

export function useInventoryItems(
  organisationId: string | null | undefined,
  params: InventoryItemListParams = {},
) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
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
      setItems([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const loaded = await fetchInventoryItems(orgId, params);
      setItems(loaded.tableItems);
      setPagination(loaded.pagination);
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err.message : "Failed to load items");
    } finally {
      setLoading(false);
    }
  }, [
    organisationId,
    params.search,
    params.category,
    params.stockStatus,
    params.page,
    params.limit,
  ]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, pagination, loading, error, reload };
}

export function useAllInventoryItems(
  organisationId: string | null | undefined,
  params: Omit<InventoryItemListParams, "page" | "limit"> = {},
) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const orgId = organisationId?.trim();
    if (!orgId) {
      setItems([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const loaded = await fetchAllInventoryItems(orgId, params);
      setItems(loaded);
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err.message : "Failed to load items");
    } finally {
      setLoading(false);
    }
  }, [organisationId, params.search, params.category, params.stockStatus]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, loading, error, reload };
}
