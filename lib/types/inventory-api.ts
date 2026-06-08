export type InventoryItemStockStatus = "in_stock" | "low_stock" | "out_of_stock";

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type InventoryItemListParams = {
  search?: string;
  category?: string;
  stockStatus?: InventoryItemStockStatus;
  page?: number;
  limit?: number;
};

export type InventoryItemListResponse = {
  items: InventoryItemSummary[];
  pagination: PaginationMeta;
};

export type InventoryStockStats = {
  stockValue: number;
  lowStockCount: number;
  totalItems: number;
};

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
  salesTaxMode: "with_tax" | "without_tax";
  serialised: boolean;
  status: InventoryItemStockStatus;
  lowStockWarning?: boolean;
  lowStockQty?: number;
  availableSerialNumbers?: string[];
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

export type InventoryPurchaseSupplier = {
  partyId: string;
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
  purchaseSuppliers: InventoryPurchaseSupplier[];
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
  purchaseSuppliers?: InventoryPurchaseSupplier[];
};

export type StockAdjustmentType = "add" | "reduce";

export type InventoryStockAdjustment = {
  adjustmentId: string;
  organisationId: string;
  itemId: string;
  itemName: string;
  unit: string;
  adjustmentDate: string;
  type: StockAdjustmentType;
  quantity: number;
  serialNumbers?: string[];
  remarks?: string;
  stockBefore: number;
  stockAfter: number;
  createdByUserId: string;
  createdAt: string;
};

export type CreateStockAdjustmentRequest = {
  organisationId: string;
  adjustmentDate: string;
  type: StockAdjustmentType;
  quantity?: number;
  serialNumbers?: string[];
  remarks?: string;
};

export type StockAdjustmentResult = {
  adjustment: InventoryStockAdjustment;
  item: InventoryItemDetail;
};

export type InventorySuccessResponse<T> = {
  success: true;
  message: string;
  details: string;
  data: T;
};
