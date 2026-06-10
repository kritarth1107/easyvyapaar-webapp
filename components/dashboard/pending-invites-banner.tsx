"use client";

import { useCallback, useEffect, useState } from "react";
import { PendingInviteActionModal } from "@/components/dashboard/pending-invite-action-modal";
import { useUserMe } from "@/components/providers/user-me-provider";
import { useTranslation } from "@/lib/localization";
import {
  fetchMyPendingInvites,
  type PendingInvite,
} from "@/lib/permissions/team-api-client";

function formatMessage(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return Object.entries(params).reduce(
    (msg, [key, value]) => msg.replace(`{${key}}`, String(value)),
    template,
  );
}

export function PendingInvitesBanner() {
  const { t } = useTranslation();
  const { refresh } = useUserMe();
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInvite, setActionInvite] = useState<PendingInvite | null>(null);
  const [actionType, setActionType] = useState<"accept" | "decline" | null>(null);

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

  const openAction = (invite: PendingInvite, action: "accept" | "decline") => {
    setActionInvite(invite);
    setActionType(action);
  };

  const closeAction = () => {
    setActionInvite(null);
    setActionType(null);
  };

  const handleComplete = async () => {
    await refresh(undefined, { silent: true });
    await load();
  };

  return (
    <>
      <PendingInviteActionModal
        open={actionInvite !== null && actionType !== null}
        invite={actionInvite}
        action={actionType}
        onClose={closeAction}
        onComplete={() => void handleComplete()}
      />
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
                  onClick={() => openAction(invite, "decline")}
                  className="h-9 rounded-sm border border-slate-200 px-3 text-sm font-medium text-brand-primary-muted transition-colors hover:bg-slate-50"
                >
                  {t("dashboard.teamSettings.declineInvite")}
                </button>
                <button
                  type="button"
                  onClick={() => openAction(invite, "accept")}
                  className="h-9 rounded-sm bg-brand-primary px-3 text-sm font-semibold text-white transition-colors hover:brightness-105"
                >
                  {t("dashboard.teamSettings.acceptInvite")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
