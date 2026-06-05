"use client";

import { useRef, useState } from "react";
import { InvoiceSignatureDrawModal } from "@/components/dashboard/sales/invoice-signature-draw-modal";
import { useTranslation } from "@/lib/localization";

const MAX_BYTES = 3 * 1024 * 1024;
const ACCEPT = "image/png,image/jpeg,image/jpg";

type InvoiceSignatureInputProps = {
  source: "desktop" | "draw";
  dataUrl: string | null;
  onSourceChange: (source: "desktop" | "draw") => void;
  onDataUrlChange: (dataUrl: string | null) => void;
};

export function InvoiceSignatureInput({
  source,
  dataUrl,
  onSourceChange,
  onDataUrlChange,
}: InvoiceSignatureInputProps) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [drawOpen, setDrawOpen] = useState(false);
  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clear = () => {
    onDataUrlChange(null);
    setFileLabel(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
      setError("Only PNG or JPEG images are supported.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be under 3 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") return;
      const img = new Image();
      img.onload = () => {
        if (img.width < 300 || img.height < 300) {
          setError("Image dimensions must be at least 300 × 300 px.");
          return;
        }
        onDataUrlChange(result);
        setFileLabel(file.name);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSourceChange("desktop")}
          className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
            source === "desktop"
              ? "border-brand-primary bg-brand-primary/[0.06] text-brand-primary"
              : "border-slate-200/90 text-brand-primary-mid hover:border-slate-300"
          }`}
        >
          {t("dashboard.invoiceSettings.uploadDesktop")}
        </button>
        <button
          type="button"
          onClick={() => onSourceChange("draw")}
          className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
            source === "draw"
              ? "border-brand-primary bg-brand-primary/[0.06] text-brand-primary"
              : "border-slate-200/90 text-brand-primary-mid hover:border-slate-300"
          }`}
        >
          {t("dashboard.invoiceSettings.drawSignature")}
        </button>
      </div>

      {source === "desktop" ? (
        <div className="mt-2">
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-md border border-dashed border-slate-300 bg-slate-50/80 px-3 py-3 text-sm font-medium text-brand-primary hover:border-brand-primary/40 hover:bg-brand-primary/[0.04]"
          >
            Choose image from computer
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setDrawOpen(true)}
          className="mt-2 w-full rounded-md border border-dashed border-slate-300 bg-slate-50/80 px-3 py-3 text-sm font-medium text-brand-primary hover:border-brand-primary/40 hover:bg-brand-primary/[0.04]"
        >
          Open signature pad
        </button>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {dataUrl && (
        <div className="mt-2 flex items-center gap-2 rounded-md border border-slate-200/90 bg-slate-50/60 px-3 py-2">
          <div className="flex h-10 w-16 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-slate-200 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={dataUrl} alt="Signature preview" className="max-h-full max-w-full object-contain" />
          </div>
          <span className="flex-1 truncate text-sm text-brand-primary">
            {fileLabel ?? (source === "draw" ? "Drawn signature" : "Uploaded signature")}
          </span>
          <button
            type="button"
            onClick={clear}
            className="text-brand-primary-muted hover:text-red-600"
            aria-label="Remove signature"
          >
            ×
          </button>
        </div>
      )}

      <p className="mt-1 text-[11px] text-brand-primary-muted">
        {t("dashboard.invoiceSettings.signatureHint")}
      </p>

      <InvoiceSignatureDrawModal
        open={drawOpen}
        onClose={() => setDrawOpen(false)}
        onSave={(url) => {
          onDataUrlChange(url);
          setFileLabel("Drawn signature");
          setError(null);
        }}
      />
    </div>
  );
}
