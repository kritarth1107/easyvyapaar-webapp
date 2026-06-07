import { formatInr } from "@/lib/sales/create-invoice-form";
import { normalizeIndianMobilePhone } from "@/lib/sales/share-payment-reminder";

export type QuotationShareInput = {
  partyName: string;
  partyPhone?: string | null;
  partyEmail?: string | null;
  quotationNumber: string;
  totalAmount: number;
  quotationDate: string;
  validUntil?: string | null;
  businessName: string;
  notes?: string | null;
};

function formatDisplayDate(iso: string): string {
  return new Date(`${iso.trim()}T12:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function buildQuotationShareMessage(input: QuotationShareInput): string {
  const lines = [
    `*${input.businessName}*`,
    "",
    `Hi ${input.partyName},`,
    "",
    `Please find your quotation *${input.quotationNumber}*.`,
    `Amount: *${formatInr(input.totalAmount)}*`,
    `Quotation date: ${formatDisplayDate(input.quotationDate)}`,
  ];

  if (input.validUntil?.trim()) {
    lines.push(`Valid until: ${formatDisplayDate(input.validUntil.trim())}`);
  }

  if (input.notes?.trim()) {
    lines.push("", input.notes.trim());
  }

  lines.push("", "— Sent via Mahajaan");
  return lines.join("\n");
}

export type ShareQuotationResult =
  | { ok: true }
  | { ok: false; reason: "no_party_phone" | "no_party_email" };

export function shareQuotationWhatsApp(input: QuotationShareInput): ShareQuotationResult {
  const partyPhone = normalizeIndianMobilePhone(input.partyPhone);
  if (!partyPhone) {
    return { ok: false, reason: "no_party_phone" };
  }

  const text = encodeURIComponent(buildQuotationShareMessage(input));
  window.open(`https://wa.me/91${partyPhone}?text=${text}`, "_blank", "noopener,noreferrer");
  return { ok: true };
}

export function shareQuotationEmail(input: QuotationShareInput): ShareQuotationResult {
  const partyEmail = input.partyEmail?.trim().toLowerCase() ?? "";
  if (!partyEmail || !partyEmail.includes("@")) {
    return { ok: false, reason: "no_party_email" };
  }

  const subject = encodeURIComponent(`Quotation ${input.quotationNumber} from ${input.businessName}`);
  const body = encodeURIComponent(buildQuotationShareMessage(input));
  window.location.href = `mailto:${partyEmail}?subject=${subject}&body=${body}`;
  return { ok: true };
}
