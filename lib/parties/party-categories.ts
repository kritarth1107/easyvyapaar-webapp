/** 25 party categories — #21 is always "Other". */
export const PARTY_CATEGORIES = [
  "Retail Customer",
  "Wholesale Buyer",
  "Distributor",
  "Dealer / Reseller",
  "Corporate / B2B",
  "Walk-in Regular",
  "Mobile & Accessories Shop",
  "Electronics Retailer",
  "Home Appliances Dealer",
  "Contractor / Builder",
  "Electrician",
  "Plumber / Hardware",
  "Interior Designer",
  "Hospital / Clinic",
  "School / College",
  "Government / PSU",
  "Online Marketplace Seller",
  "Export Customer",
  "Franchise Partner",
  "Commission Agent",
  "Other",
  "Supplier — Manufacturer",
  "Supplier — Wholesaler",
  "Supplier — Importer",
  "Service Provider",
] as const;

export type PartyCategory = (typeof PARTY_CATEGORIES)[number];

export const PARTY_CATEGORY_OTHER: PartyCategory = "Other";

export const PARTY_CATEGORY_OTHER_INDEX = PARTY_CATEGORIES.indexOf(PARTY_CATEGORY_OTHER);

export function getPartyCategoryOptions(): { value: string; label: string }[] {
  return PARTY_CATEGORIES.map((name) => ({
    value: name,
    label: name,
  }));
}
