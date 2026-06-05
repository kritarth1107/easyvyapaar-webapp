export type InventoryItemStockStatus = "in_stock" | "low_stock" | "out_of_stock";

export type InventoryItemSummary = {
  itemId: string;
  name: string;
  sku: string;
  hsn?: string;
  category: string;
  stock: number;
  unit: string;
  salePrice: number;
  purchasePrice: number;
  gstPercent: number;
  serialised: boolean;
  status: InventoryItemStockStatus;
};

export type InventoryCategory = {
  categoryId: string;
  organisationId: string;
  name: string;
  isActive: boolean;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type InventorySerialNumber = {
  serialNumber: string;
  dateCreated: string;
  status: "in_stock" | "sold" | "returned" | "damaged" | "reserved";
};

export type InventoryPartyPrice = {
  partyId: string;
  price: number;
};

export type InventoryCustomField = {
  field: string;
  value: string;
};

export type InventoryItemDetail = {
  itemId: string;
  organisationId: string;
  categoryId: string;
  categoryName: string;
  itemType: "product" | "service";
  name: string;
  showInOnlineStore: boolean;
  salesPrice: number;
  salesTaxMode: "with_tax" | "without_tax";
  purchasePrice: number;
  purchaseTaxMode: "with_tax" | "without_tax";
  gstRate: string;
  salesDiscountPercent: number;
  unit: string;
  openingStock: number;
  currentStock: number;
  serialised: boolean;
  serialNumbers: InventorySerialNumber[];
  itemCode: string;
  hsn?: string;
  asOfDate: string;
  lowStockWarning: boolean;
  lowStockQty: number;
  description?: string;
  partyPrices: InventoryPartyPrice[];
  customFields: InventoryCustomField[];
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  createdByUserId: string;
  updatedByUserId?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateInventoryItemRequest = {
  organisationId: string;
  categoryId: string;
  itemType?: "product" | "service";
  name: string;
  showInOnlineStore?: boolean;
  salesPrice?: number;
  salesTaxMode?: "with_tax" | "without_tax";
  purchasePrice?: number;
  purchaseTaxMode?: "with_tax" | "without_tax";
  gstRate?: string;
  salesDiscountPercent?: number;
  unit: string;
  openingStock?: number;
  serialised?: boolean;
  serialNumbers?: { serialNumber: string; dateCreated: string }[];
  itemCode: string;
  hsn?: string;
  asOfDate: string;
  lowStockWarning?: boolean;
  lowStockQty?: number;
  description?: string;
  partyPrices?: InventoryPartyPrice[];
  customFields?: InventoryCustomField[];
};

export type InventorySuccessResponse<T> = {
  success: true;
  message: string;
  details: string;
  data: T;
};
