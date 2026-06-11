"use client";

import {
  InvoiceAuthorSignature,
  InvoicePreviewBillToDetails,
  InvoicePreviewBusinessDetails,
  InvoicePreviewGstBreakdownTable,
  InvoicePreviewItemDetails,
  InvoicePreviewLogo,
  InvoicePreviewShippingAddress,
  InvoicePreviewSummaryRows,
  InvoiceReceiverSignature,
} from "@/components/dashboard/sales/invoice-preview-shared";
import { getHeaderTextColor } from "@/lib/sales/invoice-settings-config";
import { resolveInvoicePreviewContent } from "@/lib/sales/invoice-preview-document";
import {
  A4_MIN_HEIGHT,
  A4_WIDTH,
  COL,
  fmtRupee,
  resolveInvoiceLogoUrl,
  type InvoicePreviewProps,
} from "@/lib/sales/invoice-preview-data";

export function InvoicePreviewSimple(props: InvoicePreviewProps) {
  const {
    businessName,
    accentHex,
    showPartyBalance,
    showPhoneOnInvoice,
    showItemDescription,
    enableReceiverSignature,
    signatureImageUrl,
    embedded = false,
  } = props;
  const content = resolveInvoicePreviewContent(props);
  const displayName = businessName.toUpperCase() || "MAYANK ELECTRONICS";
  const logoUrl = resolveInvoiceLogoUrl(props);
  const headerTextColor = getHeaderTextColor(accentHex);

  const barStyle = {
    backgroundColor: accentHex,
    color: headerTextColor,
  };

  const metaRow = (label: string, value: string) => (
    <div
      key={label}
      className="flex justify-between gap-4"
      style={{ fontSize: "10px", lineHeight: 1.45 }}
    >
      <span className="text-slate-600">{label}</span>
      <span>{value}</span>
    </div>
  );

  const documentNode = (
      <div
        data-invoice-document
        data-invoice-page-size="a4"
        className="mx-auto flex shrink-0 flex-col font-[Arial,Helvetica,sans-serif] text-black"
        style={{ width: A4_WIDTH, minHeight: A4_MIN_HEIGHT, fontSize: "12px", lineHeight: 1.35 }}
      >
        <div className="box-border border border-black">
          {/* Header */}
          <div className="flex border-b border-black">
            <div className="flex flex-1 gap-2 border-r border-black p-[8px]">
              <InvoicePreviewLogo
                businessName={displayName}
                logoUrl={logoUrl}
                width={42}
                height={42}
                fontSize={15}
                containerWidth={52}
                taglineFontSize={5}
                taglineMarginTop={3}
              />
              <div className="min-w-0 flex-1">
                <p style={{ fontSize: "16px", fontWeight: 700, lineHeight: 1.1 }}>{displayName}</p>
                <InvoicePreviewBusinessDetails
                  content={content}
                  showPhoneOnInvoice={showPhoneOnInvoice}
                  fontSize={10}
                  marginTop={4}
                />
              </div>
            </div>
            <div
              className="flex items-center justify-center border-r border-black px-3"
              style={{ width: 120 }}
            >
              <p style={{ fontSize: "14px", fontWeight: 700, textAlign: "center" }}>TAX INVOICE</p>
            </div>
            <div className="p-[8px]" style={{ width: 200 }}>
              <div
                className="mb-2 inline-block rounded-sm border border-slate-400 px-2 py-0.5 text-slate-500"
                style={{ fontSize: "8px" }}
              >
                ORIGINAL FOR RECIPIENT
              </div>
              <div className="space-y-1">
                {metaRow("Invoice No.", content.invoiceNumber)}
                {metaRow("Invoice Date", content.invoiceDate)}
                {metaRow("Due Date", content.dueDate)}
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="border-b border-black">
            <div className="px-2 py-1 font-bold uppercase" style={{ ...barStyle, fontSize: "10px" }}>
              BILL TO
            </div>
            <div className="flex">
              <div className="flex-1 border-r border-black p-[8px]">
                <InvoicePreviewBillToDetails
                  content={content}
                  nameFontSize={11}
                  fontSize={10}
                />
              </div>
              <div className="p-[8px]" style={{ width: 200 }}>
                <InvoicePreviewShippingAddress content={content} fontSize={10} label="" />
              </div>
            </div>
          </div>

          {/* Items */}
          <table
            className="w-full border-collapse"
            style={{ fontSize: "10px", tableLayout: "fixed" }}
          >
            <colgroup>
              <col style={{ width: COL.sno }} />
              <col style={{ width: COL.items }} />
              <col style={{ width: COL.hsn }} />
              <col style={{ width: COL.qty }} />
              <col style={{ width: COL.rate }} />
              <col style={{ width: COL.disc }} />
              <col style={{ width: COL.tax }} />
              <col style={{ width: COL.amount }} />
            </colgroup>
            <thead>
              <tr style={barStyle}>
                {(["S.NO.", "ITEMS", "HSN", "QTY.", "RATE", "DISC.", "TAX", "AMOUNT"] as const).map(
                  (h, i) => (
                    <th
                      key={h}
                      className="px-2 py-1.5 font-bold uppercase"
                      style={{
                        fontSize: "9px",
                        textAlign:
                          i === 0 || i === 2 || i === 3 ? "center" : i >= 4 ? "right" : "left",
                      }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {content.lines.map((line, idx) => (
                <tr key={`${line.name}-${idx}`} className="align-top">
                  <td className="border-b border-black px-2 py-2 text-center">{idx + 1}</td>
                  <td className="border-b border-black px-2 py-2">
                    <p style={{ fontWeight: 700, fontSize: "10px" }}>{line.name.toUpperCase()}</p>
                    <InvoicePreviewItemDetails
                      serial={line.serial}
                      desc={line.desc}
                      showDescription={showItemDescription}
                      fontSize={9}
                      color="#666"
                    />
                  </td>
                  <td className="border-b border-black px-2 py-2 text-center">{line.hsn}</td>
                  <td className="border-b border-black px-2 py-2 text-center">{line.qty}</td>
                  <td className="border-b border-black px-2 py-2 text-right">{line.rate}</td>
                  <td className="border-b border-black px-2 py-2 text-right">
                    {line.disc}
                    <br />
                    <span style={{ fontSize: "9px", color: "#666" }}>{line.discSub}</span>
                  </td>
                  <td className="border-b border-black px-2 py-2 text-right">
                    {line.tax}
                    <br />
                    <span style={{ fontSize: "9px", color: "#666" }}>{line.taxSub}</span>
                  </td>
                  <td className="border-b border-black px-2 py-2 text-right font-semibold">
                    {line.amount}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={barStyle}>
                <td colSpan={4} className="px-2 py-1.5 font-bold uppercase" style={{ fontSize: "9px" }}>
                  SUBTOTAL
                </td>
                <td className="px-2 py-1.5" />
                <td className="px-2 py-1.5 text-right font-bold">{fmtRupee(content.totalDisc)}</td>
                <td className="px-2 py-1.5 text-right font-bold">{fmtRupee(content.totalTax)}</td>
                <td className="px-2 py-1.5 text-right font-bold">{fmtRupee(content.totalAmount)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Footer */}
          <div className="flex border-t border-black">
            <div className="min-w-0 flex-1 border-r border-black p-[8px]">
              <p style={{ fontSize: "10px", fontWeight: 700 }}>NOTES</p>
              <p style={{ fontSize: "10px", marginTop: 3 }}>{content.notes}</p>
              <InvoiceReceiverSignature enabled={enableReceiverSignature} fontSize={10} />
              <p style={{ fontSize: "10px", fontWeight: 700, marginTop: 12 }}>TERMS AND CONDITIONS</p>
              <p
                style={{ fontSize: "8px", marginTop: 3, lineHeight: 1.45, color: "#444" }}
                className="uppercase"
              >
                {content.terms}
              </p>
            </div>

            <div className="shrink-0 p-[8px]" style={{ width: "44%" }}>
              <InvoicePreviewSummaryRows rows={content.summaryRows} fontSize={10} />
              <div className="mt-2">
                <InvoicePreviewGstBreakdownTable rows={content.gstRows} fontSize={9} />
              </div>
              <div className="mt-2 space-y-1">
                {showPartyBalance && (
                  <>
                    <div className="flex justify-between gap-3" style={{ fontSize: "10px" }}>
                      <span>Previous Balance</span>
                      <span>{fmtRupee(content.previousBalance)}</span>
                    </div>
                    <div
                      className="flex justify-between gap-3"
                      style={{ fontSize: "10px", fontWeight: 700 }}
                    >
                      <span>Current Balance</span>
                      <span>{fmtRupee(content.currentBalance)}</span>
                    </div>
                  </>
                )}
                {!showPartyBalance && (
                  <div
                    className="flex justify-between gap-3"
                    style={{ fontSize: "10px", fontWeight: 700 }}
                  >
                    <span>Current Balance</span>
                    <span>{fmtRupee(content.totalAmount)}</span>
                  </div>
                )}
              </div>

              <p
                className="mt-4 text-right"
                style={{ fontSize: "9px", lineHeight: 1.4, color: "#333" }}
              >
                <span style={{ fontWeight: 700 }}>Total Amount (in words):</span>
                <br />
                {content.amountInWords}
              </p>

              <div className="mt-6">
                <InvoiceAuthorSignature
                  businessName={businessName}
                  signatureImageUrl={signatureImageUrl}
                  label="Authorised Signature for"
                  captionFontSize={9}
                  nameFontSize={13}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
  );

  if (embedded) return documentNode;

  return (
    <div className="mx-auto w-fit max-w-full rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      {documentNode}
    </div>
  );
}
