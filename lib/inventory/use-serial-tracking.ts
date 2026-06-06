"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchSerialTrackingItems } from "@/lib/inventory/inventory-api-client";
import type { InventoryItemDetail } from "@/lib/types/inventory-api";

export function useSerialTracking(organisationId: string | null | undefined) {
  const [items, setItems] = useState<InventoryItemDetail[]>([]);
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
      const loaded = await fetchSerialTrackingItems(orgId);
      setItems(loaded);
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err.message : "Failed to load serial tracking data");
    } finally {
      setLoading(false);
    }
  }, [organisationId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, loading, error, reload };
}
