export type MotoBrand = string;

export type ProductCategory = string;

export interface Product {
  id: string;
  sku: string;
  code: string;
  name: string;
  brand: MotoBrand;
  category: ProductCategory;
  compatibility: string;
  compatibleModels: string[];
  salePrice: number;
  priceUsd: number;
  stock: number;
  imageUrl: string;
  barcode?: string;
  warehouseLocation?: string;
  description: string;
  specs?: Record<string, string>;
  isOriginal: boolean;
  featured?: boolean;
  isPublished?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type ShippingAgency =
  | 'Retiro en tienda'
  | 'Delivery Mérida'
  | 'MRW'
  | 'Zoom'
  | 'Tealca';

export type PaymentMethodType =
  | 'pago_movil'
  | 'transferencia'
  | 'binance'
  | 'divisas';

export interface CustomerData {
  fullName: string;
  phone: string;
  idNumber: string; // Cédula o RIF
  email?: string;
  city: string;
  state: string;
  shippingAgency: ShippingAgency;
  agencyOfficeAddress: string;
  paymentMethod: PaymentMethodType;
  paymentReference?: string;
  notes?: string;
}

export interface BankDetails {
  pagoMovil: {
    bank: string;
    phone: string;
    idNumber: string;
    accountHolder?: string;
    qrUrl?: string;
  };
  transferencia: {
    bank: string;
    accountNumber: string;
    accountType?: string;
    idNumber: string;
    accountHolder: string;
  };
  binance: {
    payId: string;
    email?: string;
    holder?: string;
  };
}

export interface StoreSettings {
  storeName: string;
  workshopName: string;
  rif: string;
  email?: string;
  city?: string;
  state?: string;
  phoneWhatsapp: string;
  phoneCall: string;
  address: string;
  operatingHours: string;
  bcvRate?: number;
  bcvOfficialDate?: string;
  bcvLastUpdated?: string;
  bcvSource?: string;
  customCategories?: string[];
  warrantyPolicy?: string;
  invoiceDisclaimer?: string;
  bankDetails: BankDetails;
  pagoMovil: {
    bank: string;
    phone: string;
    idNumber: string;
    accountHolder: string;
    qrUrl?: string;
  };
  binancePayId: string;
}

export type WorkshopServiceStatus =
  | 'recepcion'
  | 'diagnostico'
  | 'espera_repuestos'
  | 'en_reparacion'
  | 'control_calidad'
  | 'lista_entrega'
  | 'entregada';

export interface WorkshopOrder {
  id: string;
  orderNumber: string;
  clientName: string;
  clientPhone: string;
  clientIdNumber: string;
  bikeModel: string;
  bikeBrand: string;
  bikePlate: string;
  bikeColor: string;
  bikeYear?: string | number;
  serviceType?: string;
  fuelLevel?: string;
  entryDate: string;
  estimatedDeliveryDate: string;
  status: WorkshopServiceStatus;
  statusLabel: string;
  mechanicInCharge: string;
  mechanicPhone?: string;
  issueReported: string;
  workDone: string[];
  partsUsed: Array<{
    name: string;
    sku?: string;
    quantity: number;
    priceUsd: number;
  }>;
  laborUsd: number;
  totalUsd: number;
  totalBs?: number;
  notes?: string;
  mileageKm: number;
}

export interface SaleRecord {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerDocument: string;
  motorcyclePlate?: string;
  motorcycleInfo?: string;
  items: Array<{
    name: string;
    sku?: string;
    quantity: number;
    unitPriceUsd: number;
    totalUsd: number;
  }>;
  subtotalUsd?: number;
  discountUsd?: number;
  taxUsd?: number;
  totalUsd: number;
  totalBs: number;
  bcvRateUsed?: number;
  paymentMethod: string;
  status: string;
}

export interface ClientUser {
  id: string;
  name: string;
  document: string;
  phone: string;
  email: string;
  role: 'CLIENTE';
  createdAt?: string;
}

export interface ExchangeRateInfo {
  rateBcv: number;
  lastUpdated: string;
  officialDate?: string;
  source: string;
  isCustom?: boolean;
}
