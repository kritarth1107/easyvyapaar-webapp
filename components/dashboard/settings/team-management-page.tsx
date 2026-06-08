"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useOrganisationPermissions } from "@/components/providers/organisation-permissions-provider";
import { useUserMe } from "@/components/providers/user-me-provider";
import { ModernSelect } from "@/components/ui/modern-select";
import { useTranslation } from "@/lib/localization";
import {
  INVITABLE_ROLES,
  type UserRole,
} from "@/lib/permissions/role-permissions";
import {
  fetchOrganisationMembers,
  removeOrganisationMember,
  revokeOrganisationInvite,
  updateMemberRole,
  type OrganisationMember,
  type PendingInvite,
} from "@/lib/permissions/team-api-client";
import { TeamInviteWizard } from "./team-invite-wizard";
import { ROLE_LABEL_KEYS, RoleBadge } from "./team-role-ui";

function formatMessage(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return Object.entries(params).reduce(
    (msg, [key, value]) => msg.replace(`{${key}}`, String(value)),
    template,
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M14 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MemberAvatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary/10 to-brand-orange-1/15 text-sm font-bold text-brand-primary">
      {initial}
    </div>
  );
}

export function TeamManagementPage() {
  const { t } = useTranslation();
  const { activeOrganisationId } = useUserMe();
  const { can, loading: permissionsLoading } = useOrganisationPermissions();

  const [members, setMembers] = useState<OrganisationMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [revokingInviteId, setRevokingInviteId] = useState<string | null>(null);

  const roleOptions = useMemo(
    () =>
      INVITABLE_ROLES.map((role) => ({
        value: role,
        label: t(ROLE_LABEL_KEYS[role]),
      })),
    [t],
  );

  const loadTeam = useCallback(async () => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrganisationMembers(orgId);
      setMembers(data.members);
      setPendingInvites(data.pendingInvites);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.teamSettings.loadError"));
    } finally {
      setLoading(false);
    }
  }, [activeOrganisationId, t]);

  useEffect(() => {
    if (!can("members.manage")) {
      setLoading(false);
      return;
    }
    void loadTeam();
  }, [loadTeam, can]);

  const handleRoleChange = async (member: OrganisationMember, role: UserRole) => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId || member.role === role) return;
    setUpdatingUserId(member.userId);
    setError(null);
    setMessage(null);
    try {
      await updateMemberRole(orgId, member.userId, role);
      setMessage(t("dashboard.teamSettings.roleUpdated"));
      await loadTeam();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.teamSettings.roleUpdateError"));
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRemove = async (member: OrganisationMember) => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId) return;
    if (
      !window.confirm(
        formatMessage(t("dashboard.teamSettings.removeConfirm"), { name: member.name }),
      )
    ) {
      return;
    }
    setRemovingUserId(member.userId);
    setError(null);
    setMessage(null);
    try {
      await removeOrganisationMember(orgId, member.userId);
      setMessage(t("dashboard.teamSettings.memberRemoved"));
      await loadTeam();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.teamSettings.removeError"));
    } finally {
      setRemovingUserId(null);
    }
  };

  const handleRevokeInvite = async (invite: PendingInvite) => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId) return;
    setRevokingInviteId(invite.inviteId);
    setError(null);
    setMessage(null);
    try {
      await revokeOrganisationInvite(orgId, invite.inviteId);
      setMessage(t("dashboard.teamSettings.inviteRevoked"));
      await loadTeam();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.teamSettings.revokeError"));
    } finally {
      setRevokingInviteId(null);
    }
  };

  if (permissionsLoading) {
    return (
      <div className="px-4 py-8 lg:px-6">
        <p className="text-sm text-brand-primary-muted">{t("common.pleaseWait")}</p>
      </div>
    );
  }

  if (!can("members.manage")) {
    return (
      <div className="px-4 py-8 lg:px-6">
        <div className="mx-auto max-w-lg rounded-2xl border border-slate-200/90 bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-bold text-brand-primary">{t("dashboard.teamSettings.accessDenied")}</h1>
          <p className="mt-2 text-sm text-brand-primary-muted">
            {t("dashboard.teamSettings.accessDeniedHint")}
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex h-10 items-center rounded-xl bg-brand-primary px-4 text-sm font-semibold text-white"
          >
            {t("dashboard.breadcrumbHome")}
          </Link>
        </div>
      </div>
    );
  }

  const orgId = activeOrganisationId?.trim() ?? "";

  return (
    <div className="px-4 py-6 lg:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-start gap-3">
          <Link
            href="/dashboard/settings"
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/90 text-brand-primary-muted transition-colors hover:bg-slate-50 hover:text-brand-primary"
            aria-label={t("dashboard.teamSettings.backToSettings")}
          >
            <BackIcon />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-brand-primary lg:text-2xl">
              {t("dashboard.teamSettings.title")}
            </h1>
            <p className="mt-1 text-sm text-brand-primary-muted">{t("dashboard.teamSettings.subtitle")}</p>
          </div>
        </div>

        {error ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
            {message}
          </p>
        ) : null}

        {orgId ? (
          <div className="mb-8">
            <TeamInviteWizard
              organisationId={orgId}
              onSuccess={() => {
                setMessage(t("dashboard.teamSettings.inviteSent"));
                void loadTeam();
              }}
              onError={(msg) => setError(msg || null)}
            />
          </div>
        ) : null}

        {pendingInvites.length > 0 ? (
          <section className="mb-8 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm lg:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-brand-primary">
                {t("dashboard.teamSettings.pendingInvites")}
              </h2>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                {pendingInvites.length}
              </span>
            </div>
            <ul className="mt-4 space-y-3">
              {pendingInvites.map((invite) => (
                <li
                  key={invite.inviteId}
                  className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold text-brand-primary shadow-sm">
                      {invite.mobile.slice(-2)}
                    </div>
                    <div>
                      <p className="font-medium text-brand-primary">{invite.mobile}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <RoleBadge role={invite.role} label={t(ROLE_LABEL_KEYS[invite.role])} />
                        <span className="text-xs text-brand-primary-muted">
                          {t("dashboard.teamSettings.awaitingConsent")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={revokingInviteId === invite.inviteId}
                    onClick={() => void handleRevokeInvite(invite)}
                    className="h-9 shrink-0 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                  >
                    {revokingInviteId === invite.inviteId
                      ? t("common.pleaseWait")
                      : t("dashboard.teamSettings.revokeInvite")}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm lg:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-brand-primary">{t("dashboard.teamSettings.members")}</h2>
            {!loading ? (
              <span className="text-xs font-medium text-brand-primary-muted">
                {formatMessage(t("dashboard.teamSettings.memberCount"), { count: members.length })}
              </span>
            ) : null}
          </div>
          {loading ? (
            <p className="mt-4 text-sm text-brand-primary-muted">{t("common.pleaseWait")}</p>
          ) : members.length === 0 ? (
            <p className="mt-4 text-sm text-brand-primary-muted">{t("dashboard.teamSettings.noMembers")}</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {members.map((member) => {
                const isOwner = member.role === "Owner";
                const roleEditable = !isOwner && !member.isSelf;
                return (
                  <li
                    key={member.userId}
                    className="flex flex-col gap-3 rounded-xl border border-slate-100 px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <MemberAvatar name={member.name} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-brand-primary">
                          {member.name}
                          {member.isSelf ? (
                            <span className="ml-2 text-xs font-normal text-brand-primary-muted">
                              ({t("dashboard.teamSettings.you")})
                            </span>
                          ) : null}
                        </p>
                        <p className="text-sm text-brand-primary-muted">
                          {member.mobile}
                          {member.email ? ` · ${member.email}` : ""}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <RoleBadge role={member.role} label={t(ROLE_LABEL_KEYS[member.role])} />
                          {member.joiningStatus === "PENDING" ? (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                              {t("dashboard.teamSettings.statusPending")}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
                      {roleEditable ? (
                        <ModernSelect
                          value={member.role}
                          onChange={(v) => void handleRoleChange(member, v as UserRole)}
                          options={roleOptions}
                          disabled={updatingUserId === member.userId}
                        />
                      ) : null}
                      {roleEditable ? (
                        <button
                          type="button"
                          disabled={removingUserId === member.userId}
                          onClick={() => void handleRemove(member)}
                          className="h-9 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                        >
                          {removingUserId === member.userId
                            ? t("common.pleaseWait")
                            : t("dashboard.teamSettings.removeMember")}
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
