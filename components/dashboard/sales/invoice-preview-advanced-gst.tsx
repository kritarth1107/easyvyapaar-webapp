"use client";

import { getHeaderTextColor } from "@/lib/sales/invoice-settings-config";
import {
  COL,
  fmtRupee,
  GST_ROWS,
  LINES,
  PAGE_SIZES,
  pageScale,
  type InvoicePageSize,
  type InvoicePreviewProps,
} from "@/lib/sales/invoice-preview-data";

export type GstAdvancePreviewProps = InvoicePreviewProps & {
  pageSize: InvoicePageSize;
};

const VC =
  "border-l border-r border-black border-b-0 border-t-0 align-top px-[5px] py-[4px] text-[11px]";
const FC = "border border-black px-[5px] py-[4px] text-[11px]";
const SB = "border border-black px-[5px] py-[4px] text-[11px]";
const SBL = `${SB} border-l-0`;
const SBR = `${SB} border-r-0`;

export function InvoicePreviewAdvancedGst({
  businessName,
  accentHex,
  showPartyBalance,
  showPhoneOnInvoice,
  showItemDescription,
  pageSize,
}: GstAdvancePreviewProps) {
  const displayName = businessName.toUpperCase() || "MAYANK ELECTRONICS";
  const signInitial = displayName.charAt(0) || "M";
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
            <div className="flex flex-1 items-center pl-[8px]">
              <span style={{ fontSize: "15px", fontWeight: 700 }}>TAX INVOICE</span>
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
            <div className="flex flex-1 gap-[8px] border-r border-black p-[8px]">
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
                <p style={{ fontSize: "11px", marginTop: 4, lineHeight: 1.4 }}>
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
                    <td className={`${FC} border-t-0 border-r-0`}>AABBCCDD/202</td>
                  </tr>
                  <tr>
                    <td className={`${headerCell("border-l-0 border-t-0")}`} style={headerStyle}>
                      Invoice Date
                    </td>
                    <td className={`${FC} border-t-0 border-r-0`}>17/01/2023</td>
                  </tr>
                  <tr>
                    <td
                      className={`${headerCell("border-b-0 border-l-0 border-t-0")}`}
                      style={headerStyle}
                    >
                      Due Date
                    </td>
                    <td className={`${FC} border-b-0 border-r-0 border-t-0`}>16/02/2023</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Bill To */}
          <div className="flex border-b border-black" style={{ minHeight: px(80) }}>
            <div className="flex-1 border-r border-black p-[8px]">
              <p style={{ fontSize: "11px", fontWeight: 700 }}>BILL TO</p>
              <p style={{ fontSize: "12px", fontWeight: 700, marginTop: 3 }}>SAMPLE PARTY</p>
              <p style={{ fontSize: "11px", marginTop: 3, lineHeight: 1.4 }}>
                No F2, Outer Circle, Connaught Circus,
                <br />
                New Delhi, DELHI, 110001
                <br />
                GSTIN: 07ABCCH2702H4ZZ
                <br />
                Place of Supply: Karnataka
                <br />
                Mobile: 7400417400
              </p>
            </div>
            <div className="p-[8px]" style={{ width: px(198) }}>
              <p style={{ fontSize: "11px", fontWeight: 700 }}>Address:</p>
              <p style={{ fontSize: "11px", marginTop: 3, lineHeight: 1.4 }}>
                1234123 324324234,
                <br />
                Bengaluru,
              </p>
            </div>
          </div>

          {/* Items */}
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
              {LINES.map((line, idx) => (
                <tr key={`${line.name}-${idx}`}>
                  <td className={`${VC} border-l-0 text-center`}>{idx + 1}</td>
                  <td className={VC}>
                    <p style={{ fontWeight: 700, fontSize: "11px" }}>{line.name}</p>
                    {showItemDescription && line.desc && (
                      <p style={{ fontSize: "10px", color: "#444", marginTop: 2 }}>{line.desc}</p>
                    )}
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
              <tr style={{ height: page.itemsBodyMinH }}>
                <td className={`${VC} border-l-0`} />
                <td className={VC} />
                <td className={VC} />
                <td className={VC} />
                <td className={VC} />
                <td className={VC} />
                <td className={VC} />
                <td className={`${VC} border-r-0`} />
              </tr>
              <tr>
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
              <tr>
                <td className={SBL} colSpan={7} style={{ textAlign: "right", fontWeight: 700 }}>
                  TOTAL
                </td>
                <td className={`${SBR} text-right`} style={{ fontWeight: 700 }}>
                  {fmtRupee("9,596.5")}
                </td>
              </tr>
              <tr>
                <td className={SBL} colSpan={7} style={{ textAlign: "right" }}>
                  RECEIVED AMOUNT
                </td>
                <td className={`${SBR} text-right`}>{fmtRupee("0")}</td>
              </tr>
              {showPartyBalance && (
                <tr>
                  <td className={SBL} colSpan={7} style={{ textAlign: "right" }}>
                    PREVIOUS BALANCE
                  </td>
                  <td className={`${SBR} text-right`}>{fmtRupee("-1,92,050.15")}</td>
                </tr>
              )}
              <tr>
                <td className={SBL} colSpan={7} style={{ textAlign: "right", fontWeight: 700 }}>
                  CURRENT BALANCE
                </td>
                <td className={`${SBR} text-right`} style={{ fontWeight: 700 }}>
                  {showPartyBalance ? fmtRupee("-1,82,453.65") : fmtRupee("9,596.5")}
                </td>
              </tr>
            </tbody>
          </table>

          {/* GST breakdown */}
          <table
            className="w-full border-collapse border-t border-black"
            style={{ fontSize: "11px", tableLayout: "fixed" }}
          >
            <colgroup>
              <col style={{ width: "18%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "32%" }} />
            </colgroup>
            <thead>
              <tr>
                <th
                  className={`${headerCell("border-l-0 border-t-0 text-left")}`}
                  style={headerStyle}
                  rowSpan={2}
                >
                  HSN/SAC
                </th>
                <th
                  className={`${headerCell("border-t-0 text-right")}`}
                  style={headerStyle}
                  rowSpan={2}
                >
                  Taxable Value
                </th>
                <th
                  className={`${headerCell("border-t-0 text-center")}`}
                  style={headerStyle}
                  colSpan={2}
                >
                  IGST
                </th>
                <th
                  className={`${headerCell("border-t-0 border-r-0 text-right")}`}
                  style={headerStyle}
                  rowSpan={2}
                >
                  Total Tax Amount
                </th>
              </tr>
              <tr>
                <th className={`${headerCell("border-t-0 text-center")}`} style={headerStyle}>
                  Rate
                </th>
                <th className={`${headerCell("border-t-0 text-center")}`} style={headerStyle}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {GST_ROWS.map((row) => (
                <tr key={row.hsn}>
                  <td className={`${FC} border-l-0 border-t-0`}>{row.hsn}</td>
                  <td className={`${FC} border-t-0 text-right`}>{row.taxable}</td>
                  <td className={`${FC} border-t-0 text-center`}>{row.rate}</td>
                  <td className={`${FC} border-t-0 text-right`}>{row.tax}</td>
                  <td className={`${FC} border-t-0 border-r-0 text-right`}>{fmtRupee(row.tax)}</td>
                </tr>
              ))}
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
              className="flex flex-col items-center justify-end p-[8px] text-center"
              style={{ width: px(168) }}
            >
              <p
                className="font-serif italic text-[#999]"
                style={{ fontSize: 32, fontWeight: 700, lineHeight: 1 }}
              >
                {signInitial}
              </p>
              <p style={{ fontSize: "10px", marginTop: 8, lineHeight: 1.35 }}>
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
