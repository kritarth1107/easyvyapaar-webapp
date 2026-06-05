"use client";

import type { ComponentType } from "react";
import { InvoicePreviewAdvancedGst } from "@/components/dashboard/sales/invoice-preview-advanced-gst";
import { InvoicePreviewGstAdvanceA5 } from "@/components/dashboard/sales/invoice-preview-gst-advance-a5";
import { InvoicePreviewBillbook } from "@/components/dashboard/sales/invoice-preview-billbook";
import { InvoicePreviewBillbookA5 } from "@/components/dashboard/sales/invoice-preview-billbook-a5";
import { InvoicePreviewModern } from "@/components/dashboard/sales/invoice-preview-modern";
import { InvoicePreviewPlaceholder } from "@/components/dashboard/sales/invoice-preview-placeholder";
import type { InvoiceThemeId } from "@/lib/sales/invoice-settings-config";
import type { InvoicePreviewProps } from "@/lib/sales/invoice-preview-data";

type InvoiceSettingsPreviewProps = InvoicePreviewProps & {
  themeId: InvoiceThemeId;
  themeLabel: string;
};

const IMPLEMENTED_THEMES: Partial<Record<InvoiceThemeId, ComponentType<InvoicePreviewProps>>> = {
  "gst-advance-a4": (props) => <InvoicePreviewAdvancedGst {...props} pageSize="a4" />,
  "gst-advance-a5": InvoicePreviewGstAdvanceA5,
  "billbook-a4": (props) => <InvoicePreviewBillbook {...props} pageSize="a4" />,
  "billbook-a5": InvoicePreviewBillbookA5,
  modern: InvoicePreviewModern,
};

export function InvoiceSettingsPreview({
  themeId,
  themeLabel,
  ...previewProps
}: InvoiceSettingsPreviewProps) {
  const Preview = IMPLEMENTED_THEMES[themeId];

  if (Preview) {
    return <Preview {...previewProps} />;
  }

  return <InvoicePreviewPlaceholder themeLabel={themeLabel} />;
}
