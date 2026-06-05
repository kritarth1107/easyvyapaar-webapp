"use client";

import { getHeaderTextColor } from "@/lib/sales/invoice-settings-config";
import {
  A5_MIN_HEIGHT,
  A5_WIDTH,
  BILLBOOK_COL,
  BILLBOOK_LINES,
  fmtRupee,
  type InvoicePreviewProps,
} from "@/lib/sales/invoice-preview-data";

const VC =
  "border-l border-r border-black border-b-0 border-t-0 align-top px-[4px] py-[3px] text-[10px]";
const SB = "border border-black px-[4px] py-[3px] text-[10px]";
const SBL = `${SB} border-l-0`;
const SBR = `${SB} border-r-0`;

const ITEMS_BODY_MIN_H = 36;

export function InvoicePreviewBillbookA5({
  businessName,
  accentHex,
  showPartyBalance,
  showPhoneOnInvoice,
  showItemDescription,
}: InvoicePreviewProps) {
  const displayName = businessName.toUpperCase() || "MAYANK ELECTRONICS";
  const signInitial = displayName.charAt(0) || "M";
  const headerTextColor = getHeaderTextColor(accentHex);

  const headerCell = (extra = "") =>
    `border border-black px-[4px] py-[4px] text-[10px] font-bold ${extra}`;

  const headerStyle = { backgroundColor: accentHex, color: headerTextColor };

  return (
    <div className="mx-auto w-fit max-w-full rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div
        className="mx-auto shrink-0 font-[Arial,Helvetica,sans-serif] text-black"
        style={{ width: A5_WIDTH, minHeight: A5_MIN_HEIGHT, fontSize: "11px", lineHeight: 1.3 }}
      >
        {/* Title — outside main border */}
        <div className="mb-1 flex items-center gap-2 px-[2px]">
          <span style={{ fontSize: "13px", fontWeight: 700 }}>BILL OF SUPPLY</span>
          <span
            className="rounded-sm border border-slate-400 px-2 py-0.5 text-slate-500"
            style={{ fontSize: "9px" }}
          >
            ORIGINAL FOR RECIPIENT
          </span>
        </div>

        <div className="box-border border border-black">
          {/* Seller */}
          <div
            className="flex items-center border-b border-black p-[6px]"
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
              <p style={{ fontSize: "10px", marginTop: 3, lineHeight: 1.35 }}>
                Bazarpara patna, Baikunthpur, Chhattisgarh, 497331
                {showPhoneOnInvoice && (
                  <>
                    <br />
                    Mobile: 9399576767
                  </>
                )}
              </p>
            </div>
            <div className="shrink-0" style={{ width: 48 }} />
          </div>

          {/* Bill To + invoice meta */}
          <div className="flex border-b border-black" style={{ minHeight: 58 }}>
            <div className="flex-1 border-r border-black p-[6px]">
              <p style={{ fontSize: "10px", fontWeight: 700 }}>BILL TO</p>
              <p style={{ fontSize: "11px", fontWeight: 700, marginTop: 2 }}>SAMPLE PARTY</p>
              <p style={{ fontSize: "10px", marginTop: 2, lineHeight: 1.35 }}>
                Address: No F2, Outer Circle, Connaught Circus, New Delhi, DELHI, 110001
                <br />
                Mobile: 7400417400
              </p>
            </div>
            <div className="flex" style={{ width: 252 }}>
              {(
                [
                  { label: "Invoice No.", value: "AABBCCDD/202" },
                  { label: "Invoice Date", value: "17/01/2023" },
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

          {/* Items */}
          <table
            className="w-full border-collapse"
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
              {BILLBOOK_LINES.map((line, idx) => (
                <tr key={`${line.name}-${idx}`}>
                  <td className={`${VC} border-l-0 text-center`}>{idx + 1}</td>
                  <td className={VC}>
                    <p style={{ fontWeight: 700, fontSize: "10px" }}>{line.name}</p>
                    {showItemDescription && line.desc && (
                      <p style={{ fontSize: "9px", color: "#444", marginTop: 1 }}>{line.desc}</p>
                    )}
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
              <tr style={{ height: ITEMS_BODY_MIN_H }}>
                <td className={`${VC} border-l-0`} />
                <td className={VC} />
                <td className={VC} />
                <td className={VC} />
                <td className={VC} />
                <td className={`${VC} border-r-0`} />
              </tr>
              <tr style={headerStyle}>
                <td className={`${SBL} border-t`} />
                <td className={`${SB} border-t text-right`} style={{ fontWeight: 700 }}>
                  TOTAL
                </td>
                <td className={`${SB} border-t`} />
                <td className={`${SB} border-t`} />
                <td className={`${SB} border-t text-right`} style={{ fontWeight: 700 }}>
                  {fmtRupee("1,051.43")}
                </td>
                <td className={`${SBR} border-t text-right`} style={{ fontWeight: 700 }}>
                  {fmtRupee("9,596.5")}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Balance summary bar */}
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
              className="flex flex-col items-center justify-end p-[6px] text-center"
              style={{ width: 148 }}
            >
              <p
                className="font-serif italic text-[#999]"
                style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}
              >
                {signInitial}
              </p>
              <p style={{ fontSize: "9px", marginTop: 6, lineHeight: 1.3 }}>
                Authorised Signatory For
                <br />
                {displayName}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
