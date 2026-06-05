"use client";

import {
  formatInvoiceDateTime,
  InvoiceAuthorSignature,
  InvoiceReceiverSignature,
} from "@/components/dashboard/sales/invoice-preview-shared";
import { getHeaderTextColor } from "@/lib/sales/invoice-settings-config";
import {
  BILLBOOK_COL,
  BILLBOOK_LINES,
  fmtRupee,
  PAGE_SIZES,
  pageScale,
  type InvoicePageSize,
  type InvoicePreviewProps,
} from "@/lib/sales/invoice-preview-data";

export type BillbookPreviewProps = InvoicePreviewProps & {
  pageSize: InvoicePageSize;
};

const VC =
  "border-l border-r border-black border-b-0 border-t-0 align-top px-[5px] py-[4px] text-[11px]";
const SB = "border border-black px-[5px] py-[4px] text-[11px]";
const SBL = `${SB} border-l-0`;
const SBR = `${SB} border-r-0`;

const BILLBOOK_ITEMS_BODY: Record<InvoicePageSize, number> = {
  a4: 320,
  a5: 72,
};

export function InvoicePreviewBillbook({
  businessName,
  accentHex,
  showPartyBalance,
  showPhoneOnInvoice,
  showItemDescription,
  showTimeOnInvoice,
  enableReceiverSignature,
  signatureImageUrl,
  pageSize,
}: BillbookPreviewProps) {
  const displayName = businessName.toUpperCase() || "MAYANK ELECTRONICS";
  const headerTextColor = getHeaderTextColor(accentHex);
  const page = PAGE_SIZES[pageSize];
  const s = pageScale(pageSize);
  const px = (n: number) => Math.round(n * s);

  const headerCell = (extra = "") =>
    `border border-black px-[5px] py-[5px] text-[11px] font-bold ${extra}`;

  const headerStyle = { backgroundColor: accentHex, color: headerTextColor };

  return (
    <div className="mx-auto w-fit max-w-full rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div
        className="mx-auto shrink-0 bg-white font-[Arial,Helvetica,sans-serif] text-black"
        style={{
          width: page.width,
          minHeight: page.minHeight,
          fontSize: "12px",
          lineHeight: 1.35,
        }}
      >
        <div className="box-border border border-black">
          {/* Title bar */}
          <div className="flex border-b border-black" style={{ height: px(28) }}>
            <div
              className="flex flex-1 items-center justify-center font-bold"
              style={{ fontSize: "13px" }}
            >
              BILL OF SUPPLY
            </div>
            <div
              className="flex flex-1 items-center justify-center border-l border-black text-[#666]"
              style={{ fontSize: "10px" }}
            >
              ORIGINAL FOR RECIPIENT
            </div>
          </div>

          {/* Seller */}
          <div
            className="flex items-center border-b border-black p-[8px]"
            style={{ minHeight: px(78) }}
          >
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
                SABSE ACCHA
              </p>
            </div>
            <div className="min-w-0 flex-1 text-center">
              <p style={{ fontSize: "18px", fontWeight: 700, lineHeight: 1.1 }}>{displayName}</p>
              <p style={{ fontSize: "11px", marginTop: 4, lineHeight: 1.4 }}>
                Bazarpara patna, Baikunthpur, Chhattisgarh, 497331
                {showPhoneOnInvoice && (
                  <>
                    <br />
                    Mobile: 9399576767
                  </>
                )}
              </p>
            </div>
            <div className="shrink-0" style={{ width: px(56) }} />
          </div>

          {/* Bill To + invoice meta */}
          <div className="flex border-b border-black" style={{ minHeight: px(72) }}>
            <div className="flex-1 border-r border-black p-[8px]">
              <p style={{ fontSize: "11px", fontWeight: 700 }}>BILL TO</p>
              <p style={{ fontSize: "12px", fontWeight: 700, marginTop: 3 }}>SAMPLE PARTY</p>
              <p style={{ fontSize: "11px", marginTop: 3, lineHeight: 1.4 }}>
                No F2, Outer Circle, Connaught Circus,
                <br />
                New Delhi, DELHI, 110001
                <br />
                Mobile: 7400417400
              </p>
            </div>
            <div className="flex" style={{ width: px(280) }}>
              {(
                [
                  { label: "Invoice No.", value: "AABBCCDD/202" },
                  { label: "Invoice Date", value: formatInvoiceDateTime(showTimeOnInvoice) },
                  { label: "Due Date", value: "16/02/2023" },
                ] as const
              ).map((field, i) => (
                <div
                  key={field.label}
                  className={`flex flex-1 flex-col p-[8px] ${i > 0 ? "border-l border-black" : ""}`}
                >
                  <p style={{ fontSize: "11px", fontWeight: 700 }}>{field.label}</p>
                  <p style={{ fontSize: "11px", marginTop: 6 }}>{field.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Items */}
          <table
            className="w-full border-collapse"
            style={{ fontSize: "11px", tableLayout: "fixed" }}
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
                    <p style={{ fontWeight: 700, fontSize: "11px" }}>{line.name}</p>
                    {showItemDescription && line.desc && (
                      <p style={{ fontSize: "10px", color: "#444", marginTop: 2 }}>{line.desc}</p>
                    )}
                  </td>
                  <td className={`${VC} text-center`}>{line.qty}</td>
                  <td className={`${VC} text-right`}>{line.rate}</td>
                  <td className={`${VC} text-right`}>
                    {line.disc}
                    <br />
                    <span style={{ fontSize: "10px" }}>{line.discSub}</span>
                  </td>
                  <td className={`${VC} border-r-0 text-right`} style={{ fontWeight: 600 }}>
                    {line.amount}
                  </td>
                </tr>
              ))}
              <tr style={{ height: BILLBOOK_ITEMS_BODY[pageSize] }}>
                <td className={`${VC} border-l-0`} />
                <td className={VC} />
                <td className={VC} />
                <td className={VC} />
                <td className={VC} />
                <td className={`${VC} border-r-0`} />
              </tr>
              <tr>
                <td className={`${SBL} border-t`} colSpan={3} />
                <td className={`${SB} border-t text-right`} style={{ fontWeight: 700 }}>
                  TOTAL
                </td>
                <td className={`${SB} border-t text-right`} style={{ fontWeight: 700 }}>
                  {fmtRupee("1,051.43")}
                </td>
                <td className={`${SBR} border-t text-right`} style={{ fontWeight: 700 }}>
                  {fmtRupee("9,596.5")}
                </td>
              </tr>
              <tr>
                <td className={SBL} colSpan={5} style={{ textAlign: "right" }}>
                  RECEIVED AMOUNT
                </td>
                <td className={`${SBR} text-right`}>{fmtRupee("0")}</td>
              </tr>
              {showPartyBalance && (
                <tr>
                  <td className={SBL} colSpan={5} style={{ textAlign: "right" }}>
                    PREVIOUS BALANCE
                  </td>
                  <td className={`${SBR} text-right`}>{fmtRupee("-1,92,050.15")}</td>
                </tr>
              )}
              <tr>
                <td className={SBL} colSpan={5} style={{ textAlign: "right", fontWeight: 700 }}>
                  CURRENT BALANCE
                </td>
                <td className={`${SBR} text-right`} style={{ fontWeight: 700 }}>
                  {showPartyBalance ? fmtRupee("-1,82,453.65") : fmtRupee("9,596.5")}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Amount in words */}
          <div
            className="border-b border-t border-black px-[8px] py-[5px]"
            style={{ fontSize: "11px" }}
          >
            <span style={{ fontWeight: 700 }}>Total Amount (in words) </span>
            Nine Thousand Five Hundred Ninety Six Rupees and Fifty Paise
          </div>

          {/* Footer */}
          <div className="flex" style={{ minHeight: px(96) }}>
            <div className="flex-1 border-r border-black p-[8px]">
              <p style={{ fontSize: "11px", fontWeight: 700 }}>Notes</p>
              <p style={{ fontSize: "11px", marginTop: 3 }}>Sample Note</p>
              <InvoiceReceiverSignature enabled={enableReceiverSignature} fontSize={11} />
            </div>
            <div className="border-r border-black p-[8px]" style={{ width: "46%" }}>
              <p style={{ fontSize: "11px", fontWeight: 700 }}>Terms and Conditions</p>
              <p style={{ fontSize: "10px", marginTop: 3, lineHeight: 1.45 }}>
                NOTE:- IF ALL THE GOODS ARE DEFECTIVE, THE SERVICE CENTER WILL BE MADE FROM SERVICE
                CENTER, THERE WILL BE NO RESPOSSIBILITY FOR THE STORE. ALL DISPUTES ARE SUBJECT TO
                LOCAL JURISDICTION ONLY. E. &amp; O.E.
              </p>
            </div>
            <div
              className="flex flex-col items-center justify-end p-[8px]"
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
    </div>
  );
}
