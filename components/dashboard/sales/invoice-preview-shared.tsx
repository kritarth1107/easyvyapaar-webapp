"use client";

import { orgInitials } from "@/components/dashboard/business-switch";
import {
  fmtRupee,
  fmtSummaryValue,
  type InvoiceGstRow,
} from "@/lib/sales/invoice-preview-data";

export const SAMPLE_INVOICE_DATE = "17/01/2023";
export const SAMPLE_INVOICE_TIME = "02:30 PM";

export function formatInvoiceDateTime(showTime: boolean): string {
  return showTime ? `${SAMPLE_INVOICE_DATE}, ${SAMPLE_INVOICE_TIME}` : SAMPLE_INVOICE_DATE;
}

const TRADE_NAME_BLUE = "#2563eb";

type InvoicePreviewLogoProps = {
  businessName: string;
  logoUrl?: string | null;
  width?: number;
  height?: number;
  fontSize?: number;
  containerWidth?: number;
  taglineFontSize?: number;
  taglineMarginTop?: number;
  taglineLine2?: string;
};

export function InvoicePreviewLogo({
  businessName,
  logoUrl,
  width = 44,
  height = 44,
  fontSize = 15,
  containerWidth,
  taglineFontSize = 6,
  taglineMarginTop = 4,
  taglineLine2 = "SABSE BADHIYA",
}: InvoicePreviewLogoProps) {
  const boxWidth = containerWidth ?? width + 12;
  const trimmedLogo = logoUrl?.trim();

  if (trimmedLogo) {
    return (
      <div className="shrink-0 text-center" style={{ width: boxWidth }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={trimmedLogo}
          alt={businessName}
          className="mx-auto rounded-sm object-contain"
          style={{ width, height }}
        />
      </div>
    );
  }

  return (
    <div className="shrink-0 text-center" style={{ width: boxWidth }}>
      <div
        className="mx-auto flex items-center justify-center rounded-sm bg-[#f63e16] font-bold text-white"
        style={{ width, height, fontSize }}
      >
        {orgInitials(businessName)}
      </div>
      <p
        style={{
          fontSize: taglineFontSize,
          lineHeight: 1.2,
          marginTop: taglineMarginTop,
          color: "#555",
        }}
      >
        SABSE SASTA
        <br />
        {taglineLine2}
      </p>
    </div>
  );
}

type SignatureVisualProps = {
  businessName: string;
  signatureImageUrl: string | null;
  imageMaxHeight?: number;
  nameFontSize?: number;
};

export function InvoiceSignatureVisual({
  businessName,
  signatureImageUrl,
  imageMaxHeight = 48,
  nameFontSize = 14,
}: SignatureVisualProps) {
  const displayName = businessName.toUpperCase() || "MAYANK ELECTRONICS";

  if (signatureImageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={signatureImageUrl}
        alt="Signature"
        style={{ maxHeight: imageMaxHeight, maxWidth: 160, objectFit: "contain" }}
      />
    );
  }

  return (
    <p
      style={{
        color: TRADE_NAME_BLUE,
        fontWeight: 700,
        fontSize: nameFontSize,
        lineHeight: 1.2,
        textAlign: "center",
      }}
    >
      {displayName}
    </p>
  );
}

type AuthorSignatureProps = SignatureVisualProps & {
  label?: string;
  captionFontSize?: number;
};

export function InvoiceAuthorSignature({
  businessName,
  signatureImageUrl,
  label = "Authorised Signatory For",
  imageMaxHeight = 48,
  nameFontSize = 14,
  captionFontSize = 10,
}: AuthorSignatureProps) {
  const displayName = businessName.toUpperCase() || "MAYANK ELECTRONICS";

  return (
    <div className="text-center">
      <div
        className="flex min-h-[48px] items-center justify-center"
        style={{ minHeight: imageMaxHeight }}
      >
        <InvoiceSignatureVisual
          businessName={businessName}
          signatureImageUrl={signatureImageUrl}
          imageMaxHeight={imageMaxHeight}
          nameFontSize={nameFontSize}
        />
      </div>
      <p style={{ fontSize: captionFontSize, marginTop: 8, fontWeight: 700, lineHeight: 1.35 }}>
        {label}
        <br />
        {displayName}
      </p>
    </div>
  );
}

type ReceiverSignatureProps = {
  enabled: boolean;
  fontSize?: number;
};

export type InvoicePreviewAddressContent = {
  businessAddress: string;
  businessTaxLine: string;
  businessPhone: string;
  partyName: string;
  partyAddress: string;
  partyTaxLine: string;
  partyPhone: string;
  placeOfSupply: string;
  shippingAddress: string;
};

export function InvoicePreviewBusinessDetails({
  content,
  showPhoneOnInvoice,
  fontSize = 11,
  marginTop = 4,
}: {
  content: Pick<InvoicePreviewAddressContent, "businessAddress" | "businessTaxLine" | "businessPhone">;
  showPhoneOnInvoice: boolean;
  fontSize?: number;
  marginTop?: number;
}) {
  const lines: string[] = [];
  if (content.businessAddress.trim()) lines.push(content.businessAddress.trim());
  if (content.businessTaxLine.trim()) lines.push(content.businessTaxLine.trim());
  if (showPhoneOnInvoice && content.businessPhone.trim()) {
    lines.push(`Mobile: ${content.businessPhone.trim()}`);
  }

  if (lines.length === 0) return null;

  return (
    <p style={{ fontSize, marginTop, lineHeight: 1.4 }}>
      {lines.map((line, index) => (
        <span key={`${line}-${index}`}>
          {index > 0 ? <br /> : null}
          {line}
        </span>
      ))}
    </p>
  );
}

export function InvoicePreviewBillToDetails({
  content,
  nameFontSize = 12,
  fontSize = 11,
}: {
  content: Pick<
    InvoicePreviewAddressContent,
    "partyName" | "partyAddress" | "partyTaxLine" | "placeOfSupply" | "partyPhone"
  >;
  nameFontSize?: number;
  fontSize?: number;
}) {
  const detailLines: string[] = [];
  if (content.partyAddress.trim()) detailLines.push(content.partyAddress.trim());
  if (content.partyTaxLine.trim()) detailLines.push(content.partyTaxLine.trim());
  if (content.placeOfSupply.trim()) {
    detailLines.push(`Place of Supply: ${content.placeOfSupply.trim()}`);
  }
  if (content.partyPhone.trim()) detailLines.push(`Mobile: ${content.partyPhone.trim()}`);

  return (
    <>
      <p style={{ fontSize: nameFontSize, fontWeight: 700, marginTop: 3 }}>{content.partyName}</p>
      {detailLines.length > 0 ? (
        <p style={{ fontSize, marginTop: 3, lineHeight: 1.4 }}>
          {detailLines.map((line, index) => (
            <span key={`${line}-${index}`}>
              {index > 0 ? <br /> : null}
              {line}
            </span>
          ))}
        </p>
      ) : null}
    </>
  );
}

export function InvoicePreviewShippingAddress({
  content,
  fontSize = 11,
  label = "Address:",
}: {
  content: Pick<InvoicePreviewAddressContent, "shippingAddress">;
  fontSize?: number;
  label?: string;
}) {
  if (!content.shippingAddress.trim()) return null;

  return (
    <>
      <p style={{ fontSize, fontWeight: 700 }}>{label}</p>
      <p style={{ fontSize, marginTop: 3, lineHeight: 1.4 }}>{content.shippingAddress.trim()}</p>
    </>
  );
}

type InvoicePreviewItemDetailsProps = {
  serial?: string;
  desc?: string;
  showDescription: boolean;
  fontSize?: number;
  color?: string;
  marginTop?: number;
};

export function InvoicePreviewItemDetails({
  serial,
  desc,
  showDescription,
  fontSize = 10,
  color = "#444",
  marginTop = 2,
}: InvoicePreviewItemDetailsProps) {
  const hasSerial = Boolean(serial?.trim());
  const hasDesc = showDescription && Boolean(desc?.trim());

  if (!hasSerial && !hasDesc) return null;

  return (
    <>
      {hasSerial ? (
        <p style={{ fontSize, color, marginTop }}>
          <span style={{ fontWeight: 600 }}>IMEI/Serial:</span> {serial}
        </p>
      ) : null}
      {hasDesc ? (
        <p style={{ fontSize, color, marginTop: hasSerial ? 1 : marginTop }}>{desc}</p>
      ) : null}
    </>
  );
}

export function InvoiceReceiverSignature({ enabled, fontSize = 10 }: ReceiverSignatureProps) {
  if (!enabled) return null;

  return (
    <div style={{ marginTop: 12 }}>
      <p style={{ fontSize, fontWeight: 700 }}>Receiver&apos;s Signature</p>
      <div
        style={{
          marginTop: 28,
          borderBottom: "1px solid #000",
          minWidth: 140,
          maxWidth: 200,
        }}
      />
    </div>
  );
}

type SummaryRow = { label: string; value: string; bold?: boolean };

export function InvoicePreviewSummaryRows({
  rows,
  fontSize = 11,
  gap = 4,
}: {
  rows: SummaryRow[];
  fontSize?: number;
  gap?: number;
}) {
  if (!rows.length) return null;

  return (
    <div className="space-y-1" style={{ gap }}>
      {rows.map((row) => {
        const isDiscount = row.label.toLowerCase().includes("discount");
        return (
          <div
            key={row.label}
            className="flex justify-between gap-4"
            style={{ fontSize, fontWeight: row.bold ? 700 : 400 }}
          >
            <span>{row.label}</span>
            <span
              className="shrink-0 tabular-nums"
              style={isDiscount ? { color: "#dc2626", fontWeight: 600 } : undefined}
            >
              {fmtSummaryValue(row.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const GST_FC = "border border-black px-[5px] py-[4px] text-[11px]";
const GST_HC = "border border-black px-[5px] py-[4px] text-[11px] font-bold";

export function InvoicePreviewGstBreakdownTable({
  rows,
  fontSize = 11,
}: {
  rows: InvoiceGstRow[];
  fontSize?: number;
}) {
  if (!rows.length) return null;

  const cell = { fontSize };

  return (
    <table className="w-full border-collapse border-t border-black" style={{ tableLayout: "fixed" }}>
      <thead>
        <tr>
          <th className={`${GST_HC} border-l-0 border-t-0 text-left`} style={cell} rowSpan={2}>
            HSN/SAC
          </th>
          <th className={`${GST_HC} border-t-0 text-right`} style={cell} rowSpan={2}>
            Taxable Value
          </th>
          <th className={`${GST_HC} border-t-0 text-center`} style={cell} colSpan={2}>
            CGST
          </th>
          <th className={`${GST_HC} border-t-0 text-center`} style={cell} colSpan={2}>
            SGST
          </th>
          <th className={`${GST_HC} border-t-0 border-r-0 text-right`} style={cell} rowSpan={2}>
            Total Tax
          </th>
        </tr>
        <tr>
          <th className={`${GST_HC} border-t-0 text-center`} style={cell}>
            Rate
          </th>
          <th className={`${GST_HC} border-t-0 text-right`} style={cell}>
            Amount
          </th>
          <th className={`${GST_HC} border-t-0 text-center`} style={cell}>
            Rate
          </th>
          <th className={`${GST_HC} border-t-0 text-right`} style={cell}>
            Amount
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={`${row.hsn}-${row.cgstRate}`}>
            <td className={`${GST_FC} border-l-0 border-t-0`} style={cell}>
              {row.hsn}
            </td>
            <td className={`${GST_FC} border-t-0 text-right`} style={cell}>
              {fmtRupee(row.taxable)}
            </td>
            <td className={`${GST_FC} border-t-0 text-center`} style={cell}>
              {row.cgstRate}
            </td>
            <td className={`${GST_FC} border-t-0 text-right`} style={cell}>
              {fmtRupee(row.cgst)}
            </td>
            <td className={`${GST_FC} border-t-0 text-center`} style={cell}>
              {row.sgstRate}
            </td>
            <td className={`${GST_FC} border-t-0 text-right`} style={cell}>
              {fmtRupee(row.sgst)}
            </td>
            <td className={`${GST_FC} border-t-0 border-r-0 text-right`} style={cell}>
              {fmtRupee(row.tax)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
