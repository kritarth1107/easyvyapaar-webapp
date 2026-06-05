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
  fmtRupee,
  LINES,
  SUMMARY_ROWS,
  type InvoicePreviewProps,
} from "@/lib/sales/invoice-preview-data";

const MODERN_COL = {
  sno: "5%",
  items: "34%",
  hsn: "9%",
  qty: "8%",
  rate: "11%",
  disc: "11%",
  tax: "11%",
  amount: "11%",
} as const;

export function InvoicePreviewModern({
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
      className="flex justify-between gap-6"
      style={{ fontSize: "11px", lineHeight: 1.5 }}
    >
      <span className="text-slate-600">{label}</span>
      <span className="font-medium text-black">{value}</span>
    </div>
  );

  return (
    <div className="mx-auto w-fit max-w-full rounded-lg border border-slate-100 bg-white shadow-[0_2px_16px_rgba(15,23,42,0.08)]">
      <div
        className="mx-auto shrink-0 font-[Arial,Helvetica,sans-serif] text-black"
        style={{
          width: A4_WIDTH,
          minHeight: A4_MIN_HEIGHT,
          fontSize: "12px",
          lineHeight: 1.4,
          padding: "44px 48px 40px",
        }}
      >
        {/* Header */}
        <div className="mb-6 flex gap-8">
          <div className="flex min-w-0 flex-1 gap-3">
            <div className="shrink-0 text-center" style={{ width: 56 }}>
              <div
                className="mx-auto flex items-center justify-center rounded-sm bg-[#f63e16] font-bold text-white"
                style={{ width: 44, height: 44, fontSize: "15px" }}
              >
                ME
              </div>
              <p style={{ fontSize: "6px", lineHeight: 1.2, marginTop: 4, color: "#555" }}>
                SABSE SASTA
                <br />
                SABSE BADHIYA
              </p>
            </div>
            <div className="min-w-0">
              <p style={{ fontSize: "17px", fontWeight: 700, lineHeight: 1.15 }}>{displayName}</p>
              <p style={{ fontSize: "11px", marginTop: 6, color: "#333", lineHeight: 1.45 }}>
                Bazarpara patna, Baikunthpur, Chhattisgarh, 497331
                <br />
                GSTIN: 22FGDPS5345Q1ZS
                {showPhoneOnInvoice && (
                  <>
                    <br />
                    Mobile: 9399576767
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="shrink-0 text-right" style={{ width: 220 }}>
            <p style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "0.02em" }}>
              TAX INVOICE
            </p>
            <div
              className="ml-auto mt-2 inline-block rounded border border-slate-300 px-2 py-0.5 text-slate-500"
              style={{ fontSize: "9px", letterSpacing: "0.04em" }}
            >
              ORIGINAL FOR RECIPIENT
            </div>
            <div className="mt-4 space-y-1 text-left">
              {metaRow("Invoice No.", "AABBCCDD/202")}
              {metaRow("Invoice Date", formatInvoiceDateTime(showTimeOnInvoice))}
              {metaRow("Due Date", "16/02/2023")}
            </div>
            <p
              className="mt-4 text-left text-slate-600"
              style={{ fontSize: "11px", lineHeight: 1.45 }}
            >
              1234123 324324234,
              <br />
              Bengaluru,
            </p>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-5">
          <div
            className="px-2 py-1.5 font-bold uppercase tracking-wide"
            style={{ ...barStyle, fontSize: "11px" }}
          >
            BILL TO
          </div>
          <div className="px-2 py-3">
            <p style={{ fontSize: "12px", fontWeight: 700 }}>Sample Party</p>
            <p style={{ fontSize: "11px", marginTop: 4, color: "#333", lineHeight: 1.45 }}>
              No F2, Outer Circle, Connaught Circus, New Delhi, DELHI, 110001
              <br />
              Mobile: 7400417400
              <br />
              GSTIN: 07ABCCH2702H4ZZ
              <br />
              Place of Supply: Karnataka
            </p>
          </div>
        </div>

        {/* Items table */}
        <table
          className="w-full border-collapse"
          style={{ fontSize: "11px", tableLayout: "fixed" }}
        >
          <colgroup>
            <col style={{ width: MODERN_COL.sno }} />
            <col style={{ width: MODERN_COL.items }} />
            <col style={{ width: MODERN_COL.hsn }} />
            <col style={{ width: MODERN_COL.qty }} />
            <col style={{ width: MODERN_COL.rate }} />
            <col style={{ width: MODERN_COL.disc }} />
            <col style={{ width: MODERN_COL.tax }} />
            <col style={{ width: MODERN_COL.amount }} />
          </colgroup>
          <thead>
            <tr style={barStyle}>
              {(["S.NO.", "ITEMS", "HSN", "QTY.", "RATE", "DISC.", "TAX", "AMOUNT"] as const).map(
                (h, i) => (
                  <th
                    key={h}
                    className="px-2 py-2 font-bold uppercase"
                    style={{
                      fontSize: "10px",
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
                <td className="px-2 py-2.5 text-center">{idx + 1}</td>
                <td className="px-2 py-2.5">
                  <p style={{ fontWeight: 700, fontSize: "11px" }}>{line.name.toUpperCase()}</p>
                  {showItemDescription && line.desc && (
                    <p style={{ fontSize: "10px", color: "#666", marginTop: 2 }}>{line.desc}</p>
                  )}
                </td>
                <td className="px-2 py-2.5 text-center">{line.hsn}</td>
                <td className="px-2 py-2.5 text-center">{line.qty}</td>
                <td className="px-2 py-2.5 text-right">{line.rate}</td>
                <td className="px-2 py-2.5 text-right">
                  {line.disc}
                  <br />
                  <span style={{ fontSize: "10px", color: "#666" }}>{line.discSub}</span>
                </td>
                <td className="px-2 py-2.5 text-right">
                  {line.tax}
                  <br />
                  <span style={{ fontSize: "10px", color: "#666" }}>{line.taxSub}</span>
                </td>
                <td className="px-2 py-2.5 text-right font-semibold">{line.amount}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={barStyle}>
              <td colSpan={5} className="px-2 py-2" />
              <td className="px-2 py-2 text-right font-bold">{fmtRupee("1,051.43")}</td>
              <td className="px-2 py-2 text-right font-bold">{fmtRupee("1,724.57")}</td>
              <td className="px-2 py-2 text-right font-bold">{fmtRupee("9,596.5")}</td>
            </tr>
          </tfoot>
        </table>

        {/* Footer */}
        <div className="mt-6 flex gap-8">
          <div className="min-w-0 flex-1">
            <p style={{ fontSize: "11px", fontWeight: 700 }}>Notes</p>
            <p style={{ fontSize: "11px", marginTop: 4, color: "#333" }}>Sample Note</p>
            <InvoiceReceiverSignature enabled={enableReceiverSignature} fontSize={11} />
            <p style={{ fontSize: "11px", fontWeight: 700, marginTop: 16 }}>Terms and Conditions</p>
            <p
              style={{ fontSize: "9px", marginTop: 4, lineHeight: 1.5, color: "#444" }}
              className="uppercase"
            >
              NOTE:- IF ALL THE GOODS ARE DEFECTIVE, THE SERVICE CENTER WILL BE MADE FROM SERVICE
              CENTER, THERE WILL BE NO RESPOSSIBILITY FOR THE STORE. ALL DISPUTES ARE SUBJECT TO
              LOCAL JURISDICTION ONLY. E. &amp; O.E.
            </p>
          </div>

          <div className="shrink-0" style={{ width: "42%" }}>
            <div className="space-y-1">
              {SUMMARY_ROWS.map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between gap-4"
                  style={{ fontSize: "11px", fontWeight: row.bold ? 700 : 400 }}
                >
                  <span>{row.label}</span>
                  <span>{fmtRupee(row.value)}</span>
                </div>
              ))}
              {showPartyBalance && (
                <>
                  <div className="flex justify-between gap-4" style={{ fontSize: "11px" }}>
                    <span>Previous Balance</span>
                    <span>{fmtRupee("-1,92,050.15")}</span>
                  </div>
                  <div
                    className="flex justify-between gap-4"
                    style={{ fontSize: "11px", fontWeight: 700 }}
                  >
                    <span>Current Balance</span>
                    <span>{fmtRupee("-1,82,453.65")}</span>
                  </div>
                </>
              )}
              {!showPartyBalance && (
                <div
                  className="flex justify-between gap-4"
                  style={{ fontSize: "11px", fontWeight: 700 }}
                >
                  <span>Current Balance</span>
                  <span>{fmtRupee("9,596.5")}</span>
                </div>
              )}
            </div>

            <p
              className="mt-5 text-right"
              style={{ fontSize: "10px", lineHeight: 1.45, color: "#333" }}
            >
              <span style={{ fontWeight: 700 }}>Total Amount (in words):</span>
              <br />
              Nine Thousand Five Hundred Ninety Six Rupees and Fifty Paise
            </p>

            <div className="mt-8">
              <InvoiceAuthorSignature
                businessName={businessName}
                signatureImageUrl={signatureImageUrl}
                label="Authorised Signature for"
                captionFontSize={10}
                nameFontSize={13}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
