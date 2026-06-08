"use client";

import { useCallback, useEffect, useState } from "react";
import { useUserMe } from "@/components/providers/user-me-provider";
import { useTranslation } from "@/lib/localization";

function formatMessage(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return Object.entries(params).reduce(
    (msg, [key, value]) => msg.replace(`{${key}}`, String(value)),
    template,
  );
}
import {
  acceptOrganisationInvite,
  declineOrganisationInvite,
  fetchMyPendingInvites,
  type PendingInvite,
} from "@/lib/permissions/team-api-client";

export function PendingInvitesBanner() {
  const { t } = useTranslation();
  const { refresh } = useUserMe();
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchMyPendingInvites();
      setInvites(rows);
    } catch {
      setInvites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || invites.length === 0) return null;

  const handleAccept = async (invite: PendingInvite) => {
    setActingId(invite.organisationId);
    try {
      await acceptOrganisationInvite(invite.organisationId);
      await refresh(undefined, { silent: true });
      await load();
    } finally {
      setActingId(null);
    }
  };

  const handleDecline = async (invite: PendingInvite) => {
    setActingId(invite.organisationId);
    try {
      await declineOrganisationInvite(invite.organisationId);
      await load();
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="border-b border-amber-200/80 bg-amber-50/90 px-4 py-3 lg:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-3">
        {invites.map((invite) => (
          <div
            key={`${invite.organisationId}-${invite.inviteId}`}
            className="flex flex-col gap-3 rounded-xl border border-amber-200/70 bg-white/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-sm text-brand-primary">
              <span className="font-semibold">{invite.organisationName}</span>{" "}
              {formatMessage(t("dashboard.teamSettings.pendingInviteBanner"), {
                role: invite.role,
              })}
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                disabled={actingId === invite.organisationId}
                onClick={() => void handleDecline(invite)}
                className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-brand-primary-muted transition-colors hover:bg-slate-50 disabled:opacity-60"
              >
                {t("dashboard.teamSettings.declineInvite")}
              </button>
              <button
                type="button"
                disabled={actingId === invite.organisationId}
                onClick={() => void handleAccept(invite)}
                className="h-9 rounded-lg bg-brand-primary px-3 text-sm font-semibold text-white transition-colors hover:brightness-105 disabled:opacity-60"
              >
                {actingId === invite.organisationId
                  ? t("common.pleaseWait")
                  : t("dashboard.teamSettings.acceptInvite")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
