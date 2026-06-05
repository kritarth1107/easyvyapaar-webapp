"use client";

import {
  formatInvoiceDateTime,
  InvoiceAuthorSignature,
  InvoiceReceiverSignature,
} from "@/components/dashboard/sales/invoice-preview-shared";
import { getHeaderTextColor } from "@/lib/sales/invoice-settings-config";
import {
  A4_MIN_HEIGHT,
  A4_WIDTH,
  COL,
  fmtRupee,
  LINES,
  SUMMARY_ROWS,
  type InvoicePreviewProps,
} from "@/lib/sales/invoice-preview-data";

export function InvoicePreviewSimple({
  businessName,
  accentHex,
  showPartyBalance,
  showPhoneOnInvoice,
  showItemDescription,
  showTimeOnInvoice,
  enableReceiverSignature,
  signatureImageUrl,
}: InvoicePreviewProps) {
  const displayName = businessName.toUpperCase() || "MAYANK ELECTRONICS";
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

  return (
    <div className="mx-auto w-fit max-w-full rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div
        className="mx-auto shrink-0 font-[Arial,Helvetica,sans-serif] text-black"
        style={{ width: A4_WIDTH, minHeight: A4_MIN_HEIGHT, fontSize: "12px", lineHeight: 1.35 }}
      >
        <div className="box-border border border-black">
          {/* Header */}
          <div className="flex border-b border-black">
            <div className="flex flex-1 gap-2 border-r border-black p-[8px]">
              <div className="shrink-0 text-center" style={{ width: 52 }}>
                <div
                  className="mx-auto flex items-center justify-center bg-[#f63e16] font-bold text-white"
                  style={{ width: 42, height: 42, fontSize: "15px" }}
                >
                  ME
                </div>
                <p style={{ fontSize: "5px", lineHeight: 1.1, marginTop: 3, color: "#333" }}>
                  SABSE SASTA
                  <br />
                  SABSE BADHIYA
                </p>
              </div>
              <div className="min-w-0 flex-1">
                <p style={{ fontSize: "16px", fontWeight: 700, lineHeight: 1.1 }}>{displayName}</p>
                <p style={{ fontSize: "10px", marginTop: 4, lineHeight: 1.45 }}>
                  Bazarpara patna, Baikunthpur, Chhattisgarh, 497331
                  <br />
                  {showPhoneOnInvoice && (
                    <>
                      Mobile : 9399576767
                      <br />
                    </>
                  )}
                  GSTIN : 22FGDPS5345Q1ZS
                </p>
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
                {metaRow("Invoice No.", "AABBCCDD/202")}
                {metaRow("Invoice Date", formatInvoiceDateTime(showTimeOnInvoice))}
                {metaRow("Due Date", "16/02/2023")}
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
                <p style={{ fontSize: "11px", fontWeight: 700 }}>Sample Party</p>
                <p style={{ fontSize: "10px", marginTop: 3, lineHeight: 1.45 }}>
                  No F2, Outer Circle, Connaught Circus, New Delhi, DELHI, 110001
                  <br />
                  Mobile: 7400417400
                  <br />
                  GSTIN: 07ABCCH2702H4ZZ
                  <br />
                  Place of Supply: Karnataka
                </p>
              </div>
              <div className="p-[8px]" style={{ width: 200 }}>
                <p style={{ fontSize: "10px", lineHeight: 1.45, color: "#333" }}>
                  1234123 324324234,
                  <br />
                  Bengaluru,
                </p>
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
              {LINES.map((line, idx) => (
                <tr key={`${line.name}-${idx}`} className="align-top">
                  <td className="border-b border-black px-2 py-2 text-center">{idx + 1}</td>
                  <td className="border-b border-black px-2 py-2">
                    <p style={{ fontWeight: 700, fontSize: "10px" }}>{line.name.toUpperCase()}</p>
                    {showItemDescription && line.desc && (
                      <p style={{ fontSize: "9px", color: "#666", marginTop: 2 }}>{line.desc}</p>
                    )}
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
                <td className="px-2 py-1.5 text-right font-bold">{fmtRupee("1,051.43")}</td>
                <td className="px-2 py-1.5 text-right font-bold">{fmtRupee("1,724.57")}</td>
                <td className="px-2 py-1.5 text-right font-bold">{fmtRupee("9,596.5")}</td>
              </tr>
            </tfoot>
          </table>

          {/* Footer */}
          <div className="flex border-t border-black">
            <div className="min-w-0 flex-1 border-r border-black p-[8px]">
              <p style={{ fontSize: "10px", fontWeight: 700 }}>NOTES</p>
              <p style={{ fontSize: "10px", marginTop: 3 }}>Sample Note</p>
              <InvoiceReceiverSignature enabled={enableReceiverSignature} fontSize={10} />
              <p style={{ fontSize: "10px", fontWeight: 700, marginTop: 12 }}>TERMS AND CONDITIONS</p>
              <p
                style={{ fontSize: "8px", marginTop: 3, lineHeight: 1.45, color: "#444" }}
                className="uppercase"
              >
                NOTE:- IF ALL THE GOODS ARE DEFECTIVE, THE SERVICE CENTER WILL BE MADE FROM SERVICE
                CENTER, THERE WILL BE NO RESPOSSIBILITY FOR THE STORE. ALL DISPUTES ARE SUBJECT TO
                LOCAL JURISDICTION ONLY. E. &amp; O.E.
              </p>
            </div>

            <div className="shrink-0 p-[8px]" style={{ width: "44%" }}>
              <div className="space-y-1">
                {SUMMARY_ROWS.map((row) => (
                  <div
                    key={row.label}
                    className="flex justify-between gap-3"
                    style={{ fontSize: "10px", fontWeight: row.bold ? 700 : 400 }}
                  >
                    <span>{row.label}</span>
                    <span>{fmtRupee(row.value)}</span>
                  </div>
                ))}
                {showPartyBalance && (
                  <>
                    <div className="flex justify-between gap-3" style={{ fontSize: "10px" }}>
                      <span>Previous Balance</span>
                      <span>{fmtRupee("-1,92,050.15")}</span>
                    </div>
                    <div
                      className="flex justify-between gap-3"
                      style={{ fontSize: "10px", fontWeight: 700 }}
                    >
                      <span>Current Balance</span>
                      <span>{fmtRupee("-1,82,453.65")}</span>
                    </div>
                  </>
                )}
                {!showPartyBalance && (
                  <div
                    className="flex justify-between gap-3"
                    style={{ fontSize: "10px", fontWeight: 700 }}
                  >
                    <span>Current Balance</span>
                    <span>{fmtRupee("9,596.5")}</span>
                  </div>
                )}
              </div>

              <p
                className="mt-4 text-right"
                style={{ fontSize: "9px", lineHeight: 1.4, color: "#333" }}
              >
                <span style={{ fontWeight: 700 }}>Total Amount (in words):</span>
                <br />
                Nine Thousand Five Hundred Ninety Six Rupees and Fifty Paise
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
    </div>
  );
}
