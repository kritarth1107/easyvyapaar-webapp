import { formatInr } from "@/lib/sales/create-invoice-form";

export type PaymentReminderShareInput = {
  partyName: string;
  partyPhone?: string | null;
  invoiceNumber: string;
  balanceAmount: number;
  dueDate?: string | null;
  businessName: string;
  businessPhone?: string | null;
};

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Last 10 digits for Indian mobile numbers. */
export function normalizeIndianMobilePhone(phone?: string | null): string {
  const digits = digitsOnly(phone ?? "");
  if (digits.length < 10) return "";
  return digits.slice(-10);
}

function formatDueDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function buildPaymentReminderMessage(input: PaymentReminderShareInput): string {
  const lines = [
    `*${input.businessName}*`,
    "",
    `Hi ${input.partyName},`,
    "",
    `This is a payment reminder for invoice *${input.invoiceNumber}*.`,
    `Outstanding amount: *${formatInr(input.balanceAmount)}*`,
  ];

  if (input.dueDate?.trim()) {
    lines.push(`Due date: ${formatDueDate(input.dueDate.trim())}`);
  }

  const businessPhone = normalizeIndianMobilePhone(input.businessPhone);
  if (businessPhone) {
    lines.push("", `Pay via UPI: ${businessPhone}@paytm`);
  }

  lines.push("", "— Sent via EasyDukaan");
  return lines.join("\n");
}

export type SharePaymentReminderResult =
  | { ok: true }
  | { ok: false; reason: "no_party_phone" };

export function sharePaymentReminderWhatsApp(
  input: PaymentReminderShareInput,
): SharePaymentReminderResult {
  const partyPhone = normalizeIndianMobilePhone(input.partyPhone);
  if (!partyPhone) {
    return { ok: false, reason: "no_party_phone" };
  }

  const text = encodeURIComponent(buildPaymentReminderMessage(input));
  window.open(`https://wa.me/91${partyPhone}?text=${text}`, "_blank", "noopener,noreferrer");
  return { ok: true };
}
