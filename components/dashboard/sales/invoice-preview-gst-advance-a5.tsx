"use client";

import {
  formatInvoiceDateTime,
  InvoiceAuthorSignature,
  InvoiceReceiverSignature,
} from "@/components/dashboard/sales/invoice-preview-shared";
import { getHeaderTextColor } from "@/lib/sales/invoice-settings-config";
import {
  A5_MIN_HEIGHT,
  A5_WIDTH,
  COL,
  fmtRupee,
  LINES,
  type InvoicePreviewProps,
} from "@/lib/sales/invoice-preview-data";

const VC =
  "border-l border-r border-black border-b-0 border-t-0 align-top px-[4px] py-[3px] text-[10px]";
const SB = "border border-black px-[4px] py-[3px] text-[10px]";
const SBL = `${SB} border-l-0`;
const SBR = `${SB} border-r-0`;

const ITEMS_BODY_MIN_H = 36;

export function InvoicePreviewGstAdvanceA5({
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

  const headerCell = (extra = "") =>
    `border border-black px-[4px] py-[4px] text-[10px] font-bold ${extra}`;

  const headerStyle = { backgroundColor: accentHex, color: headerTextColor };

  return (
    <div className="mx-auto w-fit max-w-full rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div
        className="mx-auto shrink-0 bg-white font-[Arial,Helvetica,sans-serif] text-black"
        style={{
          width: A5_WIDTH,
          minHeight: A5_MIN_HEIGHT,
          fontSize: "11px",
          lineHeight: 1.3,
        }}
      >
        <div className="box-border border border-black">
          {/* Title */}
          <div
            className="flex items-center gap-2 border-b border-black px-[8px]"
            style={{ height: 26 }}
          >
            <span style={{ fontSize: "14px", fontWeight: 700 }}>TAX INVOICE</span>
            <span
              className="rounded-sm border border-slate-400 px-2 py-0.5 text-slate-500"
              style={{ fontSize: "9px" }}
            >
              ORIGINAL FOR RECIPIENT
            </span>
          </div>

          {/* Seller + invoice meta */}
          <div className="flex border-b border-black" style={{ minHeight: 72 }}>
            <div className="flex flex-1 gap-[6px] border-r border-black p-[6px]">
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
                  SABSE BADHIYA
                </p>
              </div>
              <div className="min-w-0 flex-1">
                <p style={{ fontSize: "15px", fontWeight: 700, lineHeight: 1.1 }}>{displayName}</p>
                <p style={{ fontSize: "10px", marginTop: 3, lineHeight: 1.35 }}>
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
            <div className="flex" style={{ width: 252 }}>
              {(
                [
                  { label: "Invoice No.", value: "AABBCCDD/202" },
                  { label: "Invoice Date", value: formatInvoiceDateTime(showTimeOnInvoice) },
                  { label: "Due Date", value: "16/02/2023" },
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

          {/* Bill To */}
          <div className="flex border-b border-black" style={{ minHeight: 64 }}>
            <div className="flex-1 border-r border-black p-[6px]">
              <p style={{ fontSize: "10px", fontWeight: 700 }}>BILL TO</p>
              <p style={{ fontSize: "11px", fontWeight: 700, marginTop: 2 }}>SAMPLE PARTY</p>
              <p style={{ fontSize: "10px", marginTop: 2, lineHeight: 1.35 }}>
                No F2, Outer Circle, Connaught Circus, New Delhi, DELHI, 110001
                <br />
                GSTIN: 07ABCCH2702H4ZZ · Place of Supply: Karnataka · Mobile: 7400417400
              </p>
            </div>
            <div className="p-[6px]" style={{ width: 168 }}>
              <p style={{ fontSize: "10px", fontWeight: 700 }}>Address:</p>
              <p style={{ fontSize: "10px", marginTop: 2, lineHeight: 1.35 }}>
                1234123 324324234, Bengaluru,
              </p>
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
                  IGST
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
              {LINES.map((line, idx) => (
                <tr key={`${line.name}-${idx}`}>
                  <td className={`${VC} border-l-0 text-center`}>{idx + 1}</td>
                  <td className={VC}>
                    <p style={{ fontWeight: 700, fontSize: "10px" }}>{line.name}</p>
                    {showItemDescription && line.desc && (
                      <p style={{ fontSize: "9px", color: "#444", marginTop: 1 }}>{line.desc}</p>
                    )}
                  </td>
                  <td className={`${VC} text-center`}>{line.hsn}</td>
                  <td className={`${VC} text-center`}>{line.qty}</td>
                  <td className={`${VC} text-right`}>{line.rate}</td>
                  <td className={`${VC} text-right`}>
                    {line.disc}
                    <br />
                    <span style={{ fontSize: "9px" }}>{line.discSub}</span>
                  </td>
                  <td className={`${VC} text-right`}>
                    {line.tax}
                    <br />
                    <span style={{ fontSize: "9px" }}>{line.taxSub}</span>
                  </td>
                  <td className={`${VC} border-r-0 text-right`} style={{ fontWeight: 600 }}>
                    {line.amount}
                  </td>
                </tr>
              ))}
              <tr style={{ height: ITEMS_BODY_MIN_H }}>
                <td className={`${VC} border-l-0`} />
                <td className={VC} />
                <td className={VC} />
                <td className={VC} />
                <td className={VC} />
                <td className={VC} />
                <td className={VC} />
                <td className={`${VC} border-r-0`} />
              </tr>
              <tr style={headerStyle}>
                <td className={`${SBL} border-t`} colSpan={4} />
                <td className={`${SB} border-t text-right`} style={{ fontWeight: 700 }}>
                  TOTAL
                </td>
                <td className={`${SB} border-t text-right`} style={{ fontWeight: 700 }}>
                  {fmtRupee("1,051.43")}
                </td>
                <td className={`${SB} border-t text-right`} style={{ fontWeight: 700 }}>
                  {fmtRupee("1,724.57")}
                </td>
                <td className={`${SBR} border-t text-right`} style={{ fontWeight: 700 }}>
                  {fmtRupee("9,596.5")}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Payment summary bar */}
          <div className="flex border-b border-t border-black">
            <div className="flex-1 border-r border-black p-[6px]">
              <p style={{ fontSize: "10px", fontWeight: 700 }}>Received Amount</p>
              <p style={{ fontSize: "10px", marginTop: 2 }}>{fmtRupee("0")}</p>
            </div>
            {showPartyBalance && (
              <div className="flex-1 border-r border-black p-[6px]">
                <p style={{ fontSize: "10px", fontWeight: 700 }}>Previous Balance</p>
                <p style={{ fontSize: "10px", marginTop: 2 }}>{fmtRupee("-1,92,050.15")}</p>
              </div>
            )}
            <div className="flex-1 p-[6px]">
              <p style={{ fontSize: "10px", fontWeight: 700 }}>Current Balance</p>
              <p style={{ fontSize: "10px", marginTop: 2, fontWeight: 700 }}>
                {showPartyBalance ? fmtRupee("-1,82,453.65") : fmtRupee("9,596.5")}
              </p>
            </div>
          </div>

          {/* Notes */}
          <div className="border-b border-black px-[6px] py-[4px]" style={{ fontSize: "10px" }}>
            <span style={{ fontWeight: 700 }}>Notes: </span>
            Sample Note
            <InvoiceReceiverSignature enabled={enableReceiverSignature} fontSize={10} />
          </div>

          {/* Footer */}
          <div className="flex" style={{ minHeight: 72 }}>
            <div className="flex-1 border-r border-black p-[6px]">
              <p style={{ fontSize: "10px", fontWeight: 700 }}>Terms and Conditions</p>
              <p style={{ fontSize: "9px", marginTop: 2, lineHeight: 1.4 }}>
                NOTE:- IF ALL THE GOODS ARE DEFECTIVE, THE SERVICE CENTER WILL BE MADE FROM SERVICE
                CENTER, THERE WILL BE NO RESPOSSIBILITY FOR THE STORE. ALL DISPUTES ARE SUBJECT TO
                LOCAL JURISDICTION ONLY. E. &amp; O.E.
              </p>
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
    </div>
  );
}
