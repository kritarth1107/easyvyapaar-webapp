"use client";

import { useEffect, useState } from "react";
import { ModernSelect } from "@/components/ui/modern-select";
import type { PosSettings } from "@/lib/pos/pos-settings";
import { useTranslation } from "@/lib/localization";
import { PosModalShell } from "./pos-modal-shell";
import { ShortcutBadge } from "./shortcut-badge";

type PosSettingsModalProps = {
  open: boolean;
  settings: PosSettings;
  onClose: () => void;
  onSave: (settings: PosSettings) => void;
};

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-slate-200/90 px-4 py-3">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-brand-primary">{label}</div>
        <div className="mt-0.5 text-xs text-brand-primary-muted">{description}</div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-brand-orange-1"
      />
    </label>
  );
}

export function PosSettingsModal({ open, settings, onClose, onSave }: PosSettingsModalProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(settings);

  useEffect(() => {
    if (open) setDraft(settings);
  }, [open, settings]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F7") {
        e.preventDefault();
        onSave(draft);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, draft, onSave]);

  const footer = (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => onSave(draft)}
        className="flex h-11 w-full items-center justify-center rounded-lg bg-brand-orange-1 text-sm font-bold text-white hover:bg-brand-orange-1/90"
      >
        {t("common.save")}
        <ShortcutBadge keys="F7" />
      </button>
      <button
        type="button"
        onClick={onClose}
        className="flex h-11 w-full items-center justify-center rounded-lg border border-slate-200/90 text-sm font-semibold text-brand-primary hover:bg-slate-50"
      >
        {t("common.cancel")}
        <ShortcutBadge keys="ESC" />
      </button>
    </div>
  );

  return (
    <PosModalShell
      open={open}
      title={t("dashboard.pos.settingsTitle")}
      onClose={onClose}
      footer={footer}
      widthClass="max-w-lg"
    >
      <div className="space-y-3">
        <ToggleRow
          label={t("dashboard.pos.hideCustomer")}
          description={t("dashboard.pos.hideCustomerHint")}
          checked={draft.hideCustomer}
          onChange={(hideCustomer) => setDraft((s) => ({ ...s, hideCustomer }))}
        />
        <ToggleRow
          label={t("dashboard.pos.fullyPaid")}
          description={t("dashboard.pos.fullyPaidHint")}
          checked={draft.fullyPaid}
          onChange={(fullyPaid) => setDraft((s) => ({ ...s, fullyPaid }))}
        />
        <ToggleRow
          label={t("dashboard.pos.roundOff")}
          description={t("dashboard.pos.roundOffHint")}
          checked={draft.roundOff}
          onChange={(roundOff) => setDraft((s) => ({ ...s, roundOff }))}
        />
        <ToggleRow
          label={t("dashboard.pos.hideMrp")}
          description={t("dashboard.pos.hideMrpHint")}
          checked={draft.hideMrp}
          onChange={(hideMrp) => setDraft((s) => ({ ...s, hideMrp }))}
        />
        <div className="rounded-lg border border-slate-200/90 px-4 py-3">
          <label className="mb-2 block text-sm font-semibold text-brand-primary">
            {t("dashboard.pos.printerType")}
          </label>
          <ModernSelect
            value={draft.printerType}
            onChange={(printerType) =>
              setDraft((s) => ({
                ...s,
                printerType: printerType === "thermal" ? "thermal" : "a4",
              }))
            }
            options={[
              { value: "a4", label: t("dashboard.pos.printerA4") },
              { value: "thermal", label: t("dashboard.pos.printerThermal") },
            ]}
          />
        </div>
      </div>
    </PosModalShell>
  );
}
