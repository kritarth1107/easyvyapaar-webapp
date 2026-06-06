"use client";

import {
  InvoiceAuthorSignature,
  InvoicePreviewBillToDetails,
  InvoicePreviewBusinessDetails,
  InvoicePreviewGstBreakdownTable,
  InvoicePreviewItemDetails,
  InvoicePreviewShippingAddress,
  InvoicePreviewSummaryRows,
  InvoiceReceiverSignature,
} from "@/components/dashboard/sales/invoice-preview-shared";
import { getHeaderTextColor } from "@/lib/sales/invoice-settings-config";
import { resolveInvoicePreviewContent } from "@/lib/sales/invoice-preview-document";
import {
  COL,
  fmtRupee,
  PAGE_SIZES,
  pageScale,
  type InvoicePageSize,
  type InvoicePreviewProps,
} from "@/lib/sales/invoice-preview-data";

export type GstAdvancePreviewProps = InvoicePreviewProps & {
  pageSize: InvoicePageSize;
};

const VC =
  "border-l border-r border-black border-b-0 border-t-0 align-top px-[6px] py-[5px] text-[11px]";
const FC = "border border-black px-[6px] py-[5px] text-[11px]";
const SB = "border border-black px-[6px] py-[5px] text-[11px]";
const SBL = `${SB} border-l-0`;
const SBR = `${SB} border-r-0`;

export function InvoicePreviewAdvancedGst(props: GstAdvancePreviewProps) {
  const {
    businessName,
    accentHex,
    showPartyBalance,
    showPhoneOnInvoice,
    showItemDescription,
    enableReceiverSignature,
    signatureImageUrl,
    pageSize,
    embedded = false,
  } = props;
  const content = resolveInvoicePreviewContent(props);
  const displayName = businessName.toUpperCase() || "MAYANK ELECTRONICS";
  const headerTextColor = getHeaderTextColor(accentHex);
  const page = PAGE_SIZES[pageSize];
  const s = pageScale(pageSize);
  const px = (n: number) => Math.round(n * s);

  const headerCell = (extra = "") =>
    `border border-black px-[5px] py-[5px] text-[11px] font-bold ${extra}`;

  const headerStyle = { backgroundColor: accentHex, color: headerTextColor };

  const documentNode = (
      <div
        data-invoice-document
        data-invoice-page-size={pageSize}
        className="mx-auto flex shrink-0 flex-col bg-white font-[Arial,Helvetica,sans-serif] text-black"
        style={{
          width: page.width,
          height: page.minHeight,
          minHeight: page.minHeight,
          fontSize: "12px",
          lineHeight: 1.35,
        }}
      >
        <div className="invoice-doc-border box-border flex h-full min-h-full flex-1 flex-col border border-black">
          {/* Title bar */}
          <div className="flex border-b border-black" style={{ height: px(28) }}>
            <div className="flex flex-1 items-center pl-[10px]">
              <span style={{ fontSize: "15px", fontWeight: 700 }}>{content.documentTitle}</span>
            </div>
            <div
              className="flex items-center justify-center border-l border-black px-3 text-[#666]"
              style={{ width: px(148), fontSize: "10px" }}
            >
              ORIGINAL FOR RECIPIENT
            </div>
          </div>

          {/* Seller + invoice meta */}
          <div className="flex border-b border-black" style={{ minHeight: px(88) }}>
            <div className="flex flex-1 gap-[8px] border-r border-black p-[10px]">
              <div className="shrink-0 text-center" style={{ width: px(56) }}>
                <div
                  className="mx-auto flex items-center justify-center bg-[#f63e16] font-bold text-white"
                  style={{ width: px(44), height: px(44), fontSize: "16px" }}
                >
                  ME
                </div>
                <p style={{ fontSize: "6px", lineHeight: 1.15, marginTop: 3, color: "#333" }}>
                  SABSE SASTA
                  <br />
                  SABSE BADHIYA
                </p>
              </div>
              <div className="min-w-0 flex-1">
                <p style={{ fontSize: "18px", fontWeight: 700, lineHeight: 1.1 }}>{displayName}</p>
                <InvoicePreviewBusinessDetails
                  content={content}
                  showPhoneOnInvoice={showPhoneOnInvoice}
                  fontSize={11}
                />
              </div>
            </div>
            <div style={{ width: px(198) }}>
              <table className="h-full w-full border-collapse" style={{ fontSize: "11px" }}>
                <tbody>
                  <tr>
                    <td
                      className={`${headerCell("w-[42%] border-l-0 border-t-0")}`}
                      style={headerStyle}
                    >
                      Invoice No.
                    </td>
                    <td className={`${FC} border-t-0 border-r-0`}>{content.invoiceNumber}</td>
                  </tr>
                  <tr>
                    <td className={`${headerCell("border-l-0 border-t-0")}`} style={headerStyle}>
                      Invoice Date
                    </td>
                    <td className={`${FC} border-t-0 border-r-0`}>{content.invoiceDate}</td>
                  </tr>
                  <tr>
                    <td
                      className={`${headerCell("border-b-0 border-l-0 border-t-0")}`}
                      style={headerStyle}
                    >
                      Due Date
                    </td>
                    <td className={`${FC} border-b-0 border-r-0 border-t-0`}>{content.dueDate}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Bill To */}
          <div className="flex border-b border-black" style={{ minHeight: px(80) }}>
            <div className="flex-1 border-r border-black p-[10px]">
              <p style={{ fontSize: "11px", fontWeight: 700 }}>BILL TO</p>
              <InvoicePreviewBillToDetails content={content} />
            </div>
            <div className="p-[10px]" style={{ width: px(198) }}>
              <InvoicePreviewShippingAddress content={content} fontSize={11} />
            </div>
          </div>

          {/* Items */}
          <div
            className="invoice-items-grow flex min-h-0 flex-1 flex-col"
            style={{ minHeight: page.itemsBodyMinH }}
          >
            <table
              className="w-full border-collapse"
              style={{ fontSize: "11px", tableLayout: "fixed" }}
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
                <tr>
                  <th
                    className={`${headerCell("border-l-0 border-t-0 text-left")}`}
                    style={headerStyle}
                  >
                    S.NO.
                  </th>
                  <th className={`${headerCell("border-t-0 text-left")}`} style={headerStyle}>
                    ITEMS
                  </th>
                  <th className={`${headerCell("border-t-0 text-center")}`} style={headerStyle}>
                    HSN
                  </th>
                  <th className={`${headerCell("border-t-0 text-center")}`} style={headerStyle}>
                    QTY.
                  </th>
                  <th className={`${headerCell("border-t-0 text-right")}`} style={headerStyle}>
                    RATE
                  </th>
                  <th className={`${headerCell("border-t-0 text-right")}`} style={headerStyle}>
                    DISC.
                  </th>
                  <th className={`${headerCell("border-t-0 text-right")}`} style={headerStyle}>
                    TAX
                  </th>
                  <th
                    className={`${headerCell("border-t-0 border-r-0 text-right")}`}
                    style={headerStyle}
                  >
                    AMOUNT
                  </th>
                </tr>
              </thead>
              <tbody>
                {content.lines.map((line, idx) => (
                  <tr key={`${line.name}-${idx}`}>
                    <td className={`${VC} border-l-0 text-center`}>{idx + 1}</td>
                    <td className={VC}>
                      <p style={{ fontWeight: 700, fontSize: "11px" }}>{line.name}</p>
                      <InvoicePreviewItemDetails
                        serial={line.serial}
                        desc={line.desc}
                        showDescription={showItemDescription}
                        fontSize={10}
                      />
                    </td>
                    <td className={`${VC} text-center`}>{line.hsn}</td>
                    <td className={`${VC} text-center`}>{line.qty}</td>
                    <td className={`${VC} text-right`}>{line.rate}</td>
                    <td className={`${VC} text-right`}>
                      {line.disc}
                      <br />
                      <span style={{ fontSize: "10px" }}>{line.discSub}</span>
                    </td>
                    <td className={`${VC} text-right`}>
                      {line.tax}
                      <br />
                      <span style={{ fontSize: "10px" }}>{line.taxSub}</span>
                    </td>
                    <td className={`${VC} border-r-0 text-right`} style={{ fontWeight: 600 }}>
                      {line.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <table
              className="invoice-items-spacer w-full flex-1 border-collapse"
              style={{ fontSize: "11px", tableLayout: "fixed", minHeight: 80 }}
              aria-hidden
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
              <tbody className="h-full">
                <tr className="h-full">
                  <td className={`${VC} border-l-0`} style={{ height: "100%", verticalAlign: "top" }} />
                  <td className={VC} style={{ height: "100%", verticalAlign: "top" }} />
                  <td className={VC} style={{ height: "100%", verticalAlign: "top" }} />
                  <td className={VC} style={{ height: "100%", verticalAlign: "top" }} />
                  <td className={VC} style={{ height: "100%", verticalAlign: "top" }} />
                  <td className={VC} style={{ height: "100%", verticalAlign: "top" }} />
                  <td className={VC} style={{ height: "100%", verticalAlign: "top" }} />
                  <td
                    className={`${VC} border-r-0`}
                    style={{ height: "100%", verticalAlign: "top" }}
                  />
                </tr>
              </tbody>
            </table>

            <table
              className="w-full border-collapse"
              style={{ fontSize: "11px", tableLayout: "fixed" }}
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
              <tbody>
                <tr>
                  <td className={`${SBL} border-t`} colSpan={4} />
                  <td className={`${SB} border-t text-right`} style={{ fontWeight: 700 }}>
                    TOTAL
                  </td>
                  <td className={`${SB} border-t text-right`} style={{ fontWeight: 700 }}>
                    {fmtRupee(content.totalDisc)}
                  </td>
                  <td className={`${SB} border-t text-right`} style={{ fontWeight: 700 }}>
                    {fmtRupee(content.totalTax)}
                  </td>
                  <td className={`${SBR} border-t text-right`} style={{ fontWeight: 700 }}>
                    {fmtRupee(content.totalAmount)}
                  </td>
                </tr>
                <tr>
                  <td className={SBL} colSpan={7} style={{ textAlign: "right", fontWeight: 700 }}>
                    TOTAL
                  </td>
                  <td className={`${SBR} text-right`} style={{ fontWeight: 700 }}>
                    {fmtRupee(content.totalAmount)}
                  </td>
                </tr>
                {!content.hidePaymentSummary && (
                  <tr>
                    <td className={SBL} colSpan={7} style={{ textAlign: "right" }}>
                      RECEIVED AMOUNT
                    </td>
                    <td className={`${SBR} text-right`}>{fmtRupee(content.receivedAmount)}</td>
                  </tr>
                )}
                {showPartyBalance && !content.hidePaymentSummary && (
                  <tr>
                    <td className={SBL} colSpan={7} style={{ textAlign: "right" }}>
                      PREVIOUS BALANCE
                    </td>
                    <td className={`${SBR} text-right`}>{fmtRupee(content.previousBalance)}</td>
                  </tr>
                )}
                {!content.hidePaymentSummary && (
                  <tr>
                    <td className={SBL} colSpan={7} style={{ textAlign: "right", fontWeight: 700 }}>
                      CURRENT BALANCE
                    </td>
                    <td className={`${SBR} text-right`} style={{ fontWeight: 700 }}>
                      {showPartyBalance ? fmtRupee(content.currentBalance) : fmtRupee(content.totalAmount)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Tax & discount summary */}
          <div className="border-t border-black px-[10px] py-[8px]">
            <InvoicePreviewSummaryRows rows={content.summaryRows} fontSize={11} />
          </div>

          {/* GST breakdown — CGST / SGST */}
          <InvoicePreviewGstBreakdownTable rows={content.gstRows} fontSize={11} />

          {/* Amount in words */}
          <div
            className="border-b border-t border-black px-[10px] py-[8px]"
            style={{ fontSize: "11px" }}
          >
            <span style={{ fontWeight: 700 }}>Total Amount (in words) </span>
            {content.amountInWords}
          </div>

          {/* Footer */}
          <div className="invoice-doc-footer mt-auto flex" style={{ minHeight: px(96) }}>
            <div className="flex-1 border-r border-black p-[10px]">
              <p style={{ fontSize: "11px", fontWeight: 700 }}>Notes</p>
              <p style={{ fontSize: "11px", marginTop: 3 }}>{content.notes}</p>
              <InvoiceReceiverSignature enabled={enableReceiverSignature} fontSize={11} />
            </div>
            <div className="border-r border-black p-[10px]" style={{ width: "46%" }}>
              <p style={{ fontSize: "11px", fontWeight: 700 }}>Terms and Conditions</p>
              <p style={{ fontSize: "10px", marginTop: 3, lineHeight: 1.45 }}>{content.terms}</p>
            </div>
            <div
              className="flex flex-col items-center justify-end p-[10px]"
              style={{ width: px(168) }}
            >
              <InvoiceAuthorSignature
                businessName={businessName}
                signatureImageUrl={signatureImageUrl}
                captionFontSize={10}
                nameFontSize={12}
              />
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
