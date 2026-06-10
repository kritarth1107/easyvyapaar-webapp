"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useOrganisationPermissions } from "@/components/providers/organisation-permissions-provider";
import { useUserMe } from "@/components/providers/user-me-provider";
import { ModernSelect } from "@/components/ui/modern-select";
import {
  tableBodyCellClass,
  tableBodyRowClass,
  tableClass,
  tableHeadCellClass,
  tableHeadRowClass,
  tablePanelClass,
} from "@/lib/dashboard/page-utils";
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
import { TeamInviteModal } from "./team-invite-wizard";
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
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary/10 to-brand-orange-1/15 text-xs font-bold text-brand-primary">
      {initial}
    </div>
  );
}

function RemoveMemberConfirmModal({
  open,
  member,
  loading,
  onClose,
  onConfirm,
}: {
  open: boolean;
  member: OrganisationMember | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, loading, onClose]);

  if (!open || !mounted || !member) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-brand-primary/50 p-4 backdrop-blur-[2px]"
      onClick={() => !loading && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="remove-member-title"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200/90 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 id="remove-member-title" className="text-lg font-bold text-brand-primary">
            {t("dashboard.teamSettings.removeMemberTitle")}
          </h2>
          <p className="mt-2 text-sm text-brand-primary-muted">
            {formatMessage(t("dashboard.teamSettings.removeConfirm"), { name: member.name })}
          </p>
          <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
            <p className="text-sm font-semibold text-brand-primary">{member.name}</p>
            <p className="mt-0.5 text-xs text-brand-primary-muted">{member.mobile}</p>
            <div className="mt-2">
              <RoleBadge role={member.role} label={t(ROLE_LABEL_KEYS[member.role])} />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-10 items-center rounded-xl border border-slate-200/90 px-4 text-sm font-semibold text-brand-primary hover:bg-slate-50 disabled:opacity-60"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex h-10 items-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? t("common.pleaseWait") : t("dashboard.teamSettings.removeMember")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
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

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<OrganisationMember | null>(null);
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

  const confirmRemoveMember = async () => {
    const orgId = activeOrganisationId?.trim();
    const member = removeTarget;
    if (!orgId || !member) return;

    setRemovingUserId(member.userId);
    setError(null);
    setMessage(null);
    try {
      await removeOrganisationMember(orgId, member.userId);
      setMessage(t("dashboard.teamSettings.memberRemoved"));
      setRemoveTarget(null);
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

  if (!activeOrganisationId?.trim()) {
    return (
      <div className="px-4 py-8 lg:px-6">
        <div className="mx-auto max-w-lg rounded-2xl border border-amber-200/90 bg-amber-50/50 p-8 text-center shadow-sm">
          <h1 className="text-lg font-bold text-amber-950">{t("orgSelect.noOrganisationSelected")}</h1>
          <p className="mt-2 text-sm text-amber-900/80">{t("orgSelect.selectOrganisationPrompt")}</p>
          <p className="mt-4 text-xs text-amber-900/70">{t("orgSelect.selectFromSidebarHint")}</p>
        </div>
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

  const orgId = activeOrganisationId.trim();
  const totalRows = members.length + pendingInvites.length;
  const colSpan = 5;

  return (
    <div className="p-4 lg:p-6">
      <RemoveMemberConfirmModal
        open={removeTarget !== null}
        member={removeTarget}
        loading={removingUserId !== null}
        onClose={() => {
          if (removingUserId === null) setRemoveTarget(null);
        }}
        onConfirm={() => void confirmRemoveMember()}
      />

      <TeamInviteModal
        open={inviteModalOpen}
        organisationId={orgId}
        onClose={() => setInviteModalOpen(false)}
        onSuccess={() => {
          setInviteModalOpen(false);
          setMessage(t("dashboard.teamSettings.inviteSent"));
          void loadTeam();
        }}
        onError={(msg) => setError(msg || null)}
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link
            href="/dashboard/settings"
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/90 text-brand-primary-muted transition-colors hover:bg-slate-50 hover:text-brand-primary"
            aria-label={t("dashboard.teamSettings.backToSettings")}
          >
            <BackIcon />
          </Link>
          <div>
            <p className="text-sm font-medium text-brand-primary-muted">
              {t("dashboard.teamSettings.subtitle")}
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-brand-primary lg:text-2xl">
              {t("dashboard.teamSettings.title")}
            </h1>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setInviteModalOpen(true);
          }}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-brand-primary to-brand-primary-light px-4 text-sm font-semibold text-white shadow-[0_2px_10px_-4px_rgba(3,31,73,0.45)] transition-all hover:brightness-110"
        >
          <span aria-hidden className="text-lg leading-none">+</span>
          {t("dashboard.teamSettings.inviteMemberButton")}
        </button>
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

      <div className={tablePanelClass}>
        <div className="flex flex-col gap-1 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-brand-primary">{t("dashboard.teamSettings.members")}</h2>
          {!loading ? (
            <span className="text-xs font-medium text-brand-primary-muted">
              {formatMessage(t("dashboard.teamSettings.memberCount"), { count: totalRows })}
            </span>
          ) : null}
        </div>

        <div className="overflow-x-auto scrollbar-brand">
          <table className={`${tableClass} min-w-[800px]`}>
            <thead>
              <tr className={tableHeadRowClass}>
                <th className={`${tableHeadCellClass} text-left`}>{t("dashboard.teamSettings.colName")}</th>
                <th className={`${tableHeadCellClass} text-left`}>{t("dashboard.teamSettings.colMobile")}</th>
                <th className={`${tableHeadCellClass} text-left`}>{t("dashboard.teamSettings.colRole")}</th>
                <th className={`${tableHeadCellClass} text-left`}>{t("dashboard.teamSettings.colStatus")}</th>
                <th className={`${tableHeadCellClass} text-right`}>{t("dashboard.teamSettings.colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={colSpan}
                    className={`${tableBodyCellClass} py-12 text-center text-brand-primary-muted`}
                  >
                    {t("common.pleaseWait")}
                  </td>
                </tr>
              ) : totalRows === 0 ? (
                <tr>
                  <td
                    colSpan={colSpan}
                    className={`${tableBodyCellClass} py-12 text-center text-brand-primary-muted`}
                  >
                    {t("dashboard.teamSettings.noMembers")}
                  </td>
                </tr>
              ) : (
                <>
                  {members.map((member) => {
                    const isOwner = member.role === "Owner";
                    const roleEditable = !isOwner && !member.isSelf;
                    return (
                      <tr key={member.userId} className={`${tableBodyRowClass} hover:bg-brand-surface/40`}>
                        <td className={tableBodyCellClass}>
                          <div className="flex min-w-0 items-center gap-3">
                            <MemberAvatar name={member.name} />
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-brand-primary">
                                {member.name}
                                {member.isSelf ? (
                                  <span className="ml-1.5 text-xs font-normal text-brand-primary-muted">
                                    ({t("dashboard.teamSettings.you")})
                                  </span>
                                ) : null}
                              </p>
                              {member.email ? (
                                <p className="truncate text-xs text-brand-primary-muted">{member.email}</p>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className={`${tableBodyCellClass} tabular-nums`}>{member.mobile}</td>
                        <td className={tableBodyCellClass}>
                          {roleEditable ? (
                            <div className="w-[140px]">
                              <ModernSelect
                                value={member.role}
                                onChange={(v) => void handleRoleChange(member, v as UserRole)}
                                options={roleOptions}
                                disabled={updatingUserId === member.userId}
                              />
                            </div>
                          ) : (
                            <RoleBadge role={member.role} label={t(ROLE_LABEL_KEYS[member.role])} />
                          )}
                        </td>
                        <td className={tableBodyCellClass}>
                          {member.joiningStatus === "PENDING" ? (
                            <span className="inline-flex rounded-sm bg-amber-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800 ring-1 ring-inset ring-amber-600/15">
                              {t("dashboard.teamSettings.statusPending")}
                            </span>
                          ) : (
                            <span className="inline-flex rounded-sm bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-800 ring-1 ring-inset ring-emerald-600/15">
                              {t("dashboard.teamSettings.statusJoined")}
                            </span>
                          )}
                        </td>
                        <td className={`${tableBodyCellClass} text-right`}>
                          {roleEditable ? (
                            <button
                              type="button"
                              disabled={removingUserId === member.userId}
                              onClick={() => setRemoveTarget(member)}
                              className="inline-flex h-8 items-center rounded-md border border-red-200 px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                            >
                              {removingUserId === member.userId
                                ? t("common.pleaseWait")
                                : t("dashboard.teamSettings.removeMember")}
                            </button>
                          ) : (
                            <span className="text-xs text-brand-primary-muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {pendingInvites.map((invite) => (
                    <tr
                      key={`pending-${invite.inviteId}`}
                      className={`${tableBodyRowClass} bg-amber-50/30 hover:bg-amber-50/50`}
                    >
                      <td className={tableBodyCellClass}>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-brand-primary shadow-sm ring-1 ring-slate-200/80">
                            {invite.mobile.slice(-2)}
                          </div>
                          <span className="text-sm text-brand-primary-muted">
                            {t("dashboard.teamSettings.pendingInvites")}
                          </span>
                        </div>
                      </td>
                      <td className={`${tableBodyCellClass} tabular-nums`}>{invite.mobile}</td>
                      <td className={tableBodyCellClass}>
                        <RoleBadge role={invite.role} label={t(ROLE_LABEL_KEYS[invite.role])} />
                      </td>
                      <td className={tableBodyCellClass}>
                        <span className="text-xs text-brand-primary-muted">
                          {t("dashboard.teamSettings.awaitingConsent")}
                        </span>
                      </td>
                      <td className={`${tableBodyCellClass} text-right`}>
                        <button
                          type="button"
                          disabled={revokingInviteId === invite.inviteId}
                          onClick={() => void handleRevokeInvite(invite)}
                          className="inline-flex h-8 items-center rounded-md border border-red-200 px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                        >
                          {revokingInviteId === invite.inviteId
                            ? t("common.pleaseWait")
                            : t("dashboard.teamSettings.revokeInvite")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
