import type { SelectedInvoiceParty } from "@/components/dashboard/sales/party-select-modal";
import { WALK_IN_PARTY_ID } from "@/lib/parties/constants";
import {
  calcInvoiceTotals,
  createInitialInvoiceForm,
  type CreateInvoiceFormState,
  type InvoiceLineItem,
} from "@/lib/sales/create-invoice-form";
import type { PosSettings } from "@/lib/pos/pos-settings";
import { posPrinterToTheme } from "@/lib/pos/pos-settings";

export type PosBillTab = {
  id: string;
  title: string;
  form: CreateInvoiceFormState;
  party: SelectedInvoiceParty | null;
  selectedLineId: string | null;
};

export function createPosBill(index: number, settings: PosSettings): PosBillTab {
  const form = createInitialInvoiceForm();
  form.cashSaleDefault = settings.hideCustomer;
  form.fullyPaid = settings.fullyPaid;
  form.autoRoundOff = settings.roundOff;
  form.settings.theme = posPrinterToTheme(settings.printerType);

  const party: SelectedInvoiceParty | null = settings.hideCustomer
    ? {
        partyId: WALK_IN_PARTY_ID,
        name: "Cash Sale",
        balance: 0,
        isCashSale: true,
      }
    : null;

  if (party) {
    form.partyId = party.partyId;
  }

  return {
    id: `pos-bill-${Date.now()}-${index}`,
    title: `Billing Screen ${index}`,
    form,
    party,
    selectedLineId: null,
  };
}

export function applyPosSettingsToBill(bill: PosBillTab, settings: PosSettings): PosBillTab {
  const totals = calcInvoiceTotals(bill.form);
  const nextForm: CreateInvoiceFormState = {
    ...bill.form,
    cashSaleDefault: settings.hideCustomer,
    fullyPaid: settings.fullyPaid,
    autoRoundOff: settings.roundOff,
    settings: { ...bill.form.settings, theme: posPrinterToTheme(settings.printerType) },
    amountReceived: settings.fullyPaid ? totals.totalAmount : bill.form.amountReceived,
  };

  let party = bill.party;
  if (settings.hideCustomer) {
    party = {
      partyId: WALK_IN_PARTY_ID,
      name: party?.name ?? "Cash Sale",
      balance: 0,
      isCashSale: true,
    };
    nextForm.partyId = WALK_IN_PARTY_ID;
  }

  return { ...bill, form: nextForm, party };
}

export function syncBillAmountReceived(bill: PosBillTab): PosBillTab {
  if (!bill.form.fullyPaid) return bill;
  const totals = calcInvoiceTotals(bill.form);
  if (bill.form.amountReceived === totals.totalAmount) return bill;
  return {
    ...bill,
    form: { ...bill.form, amountReceived: totals.totalAmount },
  };
}

export function patchBillForm(
  bill: PosBillTab,
  patch: Partial<CreateInvoiceFormState>,
): PosBillTab {
  const next = { ...bill, form: { ...bill.form, ...patch } };
  return syncBillAmountReceived(next);
}

export function updateBillLineItems(
  bill: PosBillTab,
  lineItems: InvoiceLineItem[],
  selectedLineId?: string | null,
): PosBillTab {
  return syncBillAmountReceived({
    ...bill,
    form: { ...bill.form, lineItems },
    selectedLineId: selectedLineId !== undefined ? selectedLineId : bill.selectedLineId,
  });
}

export function getCustomerLabel(bill: PosBillTab): string {
  if (bill.party?.isCashSale || bill.form.cashSaleDefault) {
    return bill.party?.name ?? "Cash Sale";
  }
  return bill.party?.name ?? "Select customer";
}
