"use client";

import {
  InvoiceAuthorSignature,
  InvoicePreviewBillToDetails,
  InvoicePreviewBusinessDetails,
  InvoicePreviewGstBreakdownTable,
  InvoicePreviewItemDetails,
  InvoicePreviewSummaryRows,
  InvoiceReceiverSignature,
} from "@/components/dashboard/sales/invoice-preview-shared";
import { getHeaderTextColor } from "@/lib/sales/invoice-settings-config";
import { resolveInvoicePreviewContent } from "@/lib/sales/invoice-preview-document";
import {
  A5_MIN_HEIGHT,
  A5_WIDTH,
  BILLBOOK_COL,
  fmtRupee,
  type InvoicePreviewProps,
} from "@/lib/sales/invoice-preview-data";

const VC =
  "border-l border-r border-black border-b-0 border-t-0 align-top px-[4px] py-[3px] text-[10px]";
const SB = "border border-black px-[4px] py-[3px] text-[10px]";
const SBL = `${SB} border-l-0`;
const SBR = `${SB} border-r-0`;

export function InvoicePreviewBillbookA5(props: InvoicePreviewProps) {
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
  const headerTextColor = getHeaderTextColor(accentHex);

  const headerCell = (extra = "") =>
    `border border-black px-[4px] py-[4px] text-[10px] font-bold ${extra}`;

  const headerStyle = { backgroundColor: accentHex, color: headerTextColor };

  const documentNode = (
      <div
        data-invoice-document
        data-invoice-page-size="a5"
        className="mx-auto flex shrink-0 flex-col font-[Arial,Helvetica,sans-serif] text-black"
        style={{
          width: A5_WIDTH,
          minHeight: A5_MIN_HEIGHT,
          fontSize: "11px",
          lineHeight: 1.3,
        }}
      >
        {/* Title — outside main border */}
        <div className="mb-1 flex shrink-0 items-center gap-2 px-[2px]">
          <span style={{ fontSize: "13px", fontWeight: 700 }}>BILL OF SUPPLY</span>
          <span
            className="rounded-sm border border-slate-400 px-2 py-0.5 text-slate-500"
            style={{ fontSize: "9px" }}
          >
            ORIGINAL FOR RECIPIENT
          </span>
        </div>

        <div className="invoice-doc-border box-border flex min-h-0 flex-1 flex-col border border-black">
          {/* Seller */}
          <div
            className="flex shrink-0 items-center border-b border-black p-[6px]"
            style={{ minHeight: 64 }}
          >
            <div className="shrink-0 text-center" style={{ width: 48 }}>
              <div
                className="mx-auto flex items-center justify-center bg-[#f63e16] font-bold text-white"
                style={{ width: 38, height: 38, fontSize: "14px" }}
              >
                ME
              </div>
              <p style={{ fontSize: "5px", lineHeight: 1.1, marginTop: 2, color: "#333" }}>
                SABSE SASTA
                <br />
                SABSE ACCHA
              </p>
            </div>
            <div className="min-w-0 flex-1 text-center">
              <p style={{ fontSize: "15px", fontWeight: 700, lineHeight: 1.1 }}>{displayName}</p>
              <InvoicePreviewBusinessDetails
                content={content}
                showPhoneOnInvoice={showPhoneOnInvoice}
                fontSize={10}
                marginTop={3}
              />
            </div>
            <div className="shrink-0" style={{ width: 48 }} />
          </div>

          {/* Bill To + invoice meta */}
          <div className="flex shrink-0 border-b border-black" style={{ minHeight: 58 }}>
            <div className="flex-1 border-r border-black p-[6px]">
              <p style={{ fontSize: "10px", fontWeight: 700 }}>BILL TO</p>
              <InvoicePreviewBillToDetails
                content={content}
                nameFontSize={11}
                fontSize={10}
              />
            </div>
            <div className="flex" style={{ width: 252 }}>
              {(
                [
                  { label: "Invoice No.", value: content.invoiceNumber },
                  { label: "Invoice Date", value: content.invoiceDate },
                  { label: content.dueDateLabel, value: content.dueDate },
                ] as const
              ).map((field, i) => (
                <div
                  key={field.label}
                  className={`flex flex-1 flex-col p-[6px] ${i > 0 ? "border-l border-black" : ""}`}
                >
                  <p style={{ fontSize: "10px", fontWeight: 700 }}>{field.label}</p>
                  <p style={{ fontSize: "10px", marginTop: 4 }}>{field.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Items */}
          <div className="invoice-items-grow flex min-h-0 flex-1 flex-col">
            <table
              className="w-full shrink-0 border-collapse"
              style={{ fontSize: "10px", tableLayout: "fixed" }}
            >
              <colgroup>
                <col style={{ width: BILLBOOK_COL.sno }} />
                <col style={{ width: BILLBOOK_COL.items }} />
                <col style={{ width: BILLBOOK_COL.qty }} />
                <col style={{ width: BILLBOOK_COL.rate }} />
                <col style={{ width: BILLBOOK_COL.disc }} />
                <col style={{ width: BILLBOOK_COL.amount }} />
              </colgroup>
              <thead>
                <tr>
                  <th
                    className={`${headerCell("border-l-0 border-t-0 text-center")}`}
                    style={headerStyle}
                  >
                    S.NO.
                  </th>
                  <th className={`${headerCell("border-t-0 text-left")}`} style={headerStyle}>
                    ITEMS
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
                  <th
                    className={`${headerCell("border-t-0 border-r-0 text-right")}`}
                    style={headerStyle}
                  >
                    AMOUNT
                  </th>
                </tr>
              </thead>
              <tbody>
                {content.billbookLines.map((line, idx) => (
                  <tr key={`${line.name}-${idx}`}>
                    <td className={`${VC} border-l-0 text-center`}>{idx + 1}</td>
                    <td className={VC}>
                      <p style={{ fontWeight: 700, fontSize: "10px" }}>{line.name}</p>
                      <InvoicePreviewItemDetails
                        serial={line.serial}
                        desc={line.desc}
                        showDescription={showItemDescription}
                        fontSize={9}
                        marginTop={1}
                      />
                    </td>
                    <td className={`${VC} text-center`}>{line.qty}</td>
                    <td className={`${VC} text-right`}>{line.rate}</td>
                    <td className={`${VC} text-right`}>
                      {line.disc}
                      <br />
                      <span style={{ fontSize: "9px" }}>{line.discSub}</span>
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
              style={{ fontSize: "10px", tableLayout: "fixed", minHeight: 24 }}
              aria-hidden
            >
              <colgroup>
                <col style={{ width: BILLBOOK_COL.sno }} />
                <col style={{ width: BILLBOOK_COL.items }} />
                <col style={{ width: BILLBOOK_COL.qty }} />
                <col style={{ width: BILLBOOK_COL.rate }} />
                <col style={{ width: BILLBOOK_COL.disc }} />
                <col style={{ width: BILLBOOK_COL.amount }} />
              </colgroup>
              <tbody className="h-full">
                <tr className="h-full">
                  <td className={`${VC} border-l-0`} style={{ height: "100%", verticalAlign: "top" }} />
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
              className="w-full shrink-0 border-collapse"
              style={{ fontSize: "10px", tableLayout: "fixed" }}
            >
              <colgroup>
                <col style={{ width: BILLBOOK_COL.sno }} />
                <col style={{ width: BILLBOOK_COL.items }} />
                <col style={{ width: BILLBOOK_COL.qty }} />
                <col style={{ width: BILLBOOK_COL.rate }} />
                <col style={{ width: BILLBOOK_COL.disc }} />
                <col style={{ width: BILLBOOK_COL.amount }} />
              </colgroup>
              <tbody>
                <tr style={headerStyle}>
                  <td className={`${SBL} border-t`} />
                  <td className={`${SB} border-t text-right`} style={{ fontWeight: 700 }}>
                    TOTAL
                  </td>
                  <td className={`${SB} border-t`} />
                  <td className={`${SB} border-t`} />
                  <td className={`${SB} border-t text-right`} style={{ fontWeight: 700 }}>
                    {fmtRupee(content.totalDisc)}
                  </td>
                  <td className={`${SBR} border-t text-right`} style={{ fontWeight: 700 }}>
                    {fmtRupee(content.totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="shrink-0 border-t border-black px-[6px] py-[5px]">
            <InvoicePreviewSummaryRows rows={content.summaryRows} fontSize={10} />
          </div>
          <div className="shrink-0">
            <InvoicePreviewGstBreakdownTable rows={content.gstRows} fontSize={10} />
          </div>

          {!content.hidePaymentSummary && (
            <div className="flex shrink-0 border-b border-t border-black">
              <div className="flex-1 border-r border-black p-[6px]">
                <p style={{ fontSize: "10px", fontWeight: 700 }}>Received Amount</p>
                <p style={{ fontSize: "10px", marginTop: 2 }}>{fmtRupee(content.receivedAmount)}</p>
              </div>
              {showPartyBalance && (
                <div className="flex-1 border-r border-black p-[6px]">
                  <p style={{ fontSize: "10px", fontWeight: 700 }}>Previous Balance</p>
                  <p style={{ fontSize: "10px", marginTop: 2 }}>{fmtRupee(content.previousBalance)}</p>
                </div>
              )}
              <div className="flex-1 p-[6px]">
                <p style={{ fontSize: "10px", fontWeight: 700 }}>Current Balance</p>
                <p style={{ fontSize: "10px", marginTop: 2, fontWeight: 700 }}>
                  {showPartyBalance ? fmtRupee(content.currentBalance) : fmtRupee(content.totalAmount)}
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div
            className="shrink-0 border-b border-black px-[6px] py-[4px]"
            style={{ fontSize: "10px" }}
          >
            <span style={{ fontWeight: 700 }}>Notes: </span>
            {content.notes}
            <InvoiceReceiverSignature enabled={enableReceiverSignature} fontSize={10} />
          </div>

          {/* Footer */}
          <div className="invoice-doc-footer mt-auto flex shrink-0" style={{ minHeight: 56 }}>
            <div className="flex-1 border-r border-black p-[6px]">
              <p style={{ fontSize: "10px", fontWeight: 700 }}>Terms and Conditions</p>
              <p style={{ fontSize: "9px", marginTop: 2, lineHeight: 1.4 }}>{content.terms}</p>
            </div>
            <div
              className="flex flex-col items-center justify-end p-[6px]"
              style={{ width: 148 }}
            >
              <InvoiceAuthorSignature
                businessName={businessName}
                signatureImageUrl={signatureImageUrl}
                captionFontSize={9}
                nameFontSize={11}
                imageMaxHeight={40}
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
