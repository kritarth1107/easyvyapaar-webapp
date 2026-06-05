export type InventoryItemStatus = "in_stock" | "low_stock" | "out_of_stock";

export type InventoryItem = {
  id: string;
  name: string;
  sku: string;
  hsn: string;
  category: string;
  stock: number;
  unit: string;
  salePrice: number;
  purchasePrice: number;
  gstPercent: number;
  serialised: boolean;
  status: InventoryItemStatus;
};

export const MOCK_INVENTORY_ITEMS: InventoryItem[] = [
  {
    id: "1",
    name: "Samsung Galaxy A15",
    sku: "SAM-A15-128",
    hsn: "8517",
    category: "Mobiles",
    stock: 24,
    unit: "Pcs",
    salePrice: 14999,
    purchasePrice: 13200,
    gstPercent: 18,
    serialised: true,
    status: "in_stock",
  },
  {
    id: "2",
    name: "Boat Rockerz 450",
    sku: "BOAT-RZ450",
    hsn: "8518",
    category: "Accessories",
    stock: 8,
    unit: "Pcs",
    salePrice: 1999,
    purchasePrice: 1450,
    gstPercent: 18,
    serialised: false,
    status: "low_stock",
  },
  {
    id: "3",
    name: "LG 7 kg Washing Machine",
    sku: "LG-WM-7KG",
    hsn: "8450",
    category: "Appliances",
    stock: 5,
    unit: "Pcs",
    salePrice: 22990,
    purchasePrice: 20100,
    gstPercent: 18,
    serialised: true,
    status: "low_stock",
  },
  {
    id: "4",
    name: "Duracell AA Battery (Pack of 4)",
    sku: "DUR-AA-4",
    hsn: "8506",
    category: "General",
    stock: 120,
    unit: "Pack",
    salePrice: 89,
    purchasePrice: 62,
    gstPercent: 18,
    serialised: false,
    status: "in_stock",
  },
  {
    id: "5",
    name: "Mi TV Stick 4K",
    sku: "MI-STICK-4K",
    hsn: "8528",
    category: "Electronics",
    stock: 0,
    unit: "Pcs",
    salePrice: 4999,
    purchasePrice: 4200,
    gstPercent: 18,
    serialised: false,
    status: "out_of_stock",
  },
  {
    id: "6",
    name: "OnePlus Nord CE 4",
    sku: "OP-NCE4-256",
    hsn: "8517",
    category: "Mobiles",
    stock: 11,
    unit: "Pcs",
    salePrice: 24999,
    purchasePrice: 22100,
    gstPercent: 18,
    serialised: true,
    status: "in_stock",
  },
];

/** Stock value = Σ (current stock × purchase price without tax). */
export function getInventorySummary(items: InventoryItem[]) {
  const lowStock = items.filter((i) => i.status === "low_stock").length;
  const stockValue = items.reduce((sum, i) => sum + i.stock * i.purchasePrice, 0);
  return { lowStock, stockValue };
}
