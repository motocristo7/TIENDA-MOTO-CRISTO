export type MotoBrand = 
  | 'Todas'
  | 'Empire Keeway'
  | 'Bera'
  | 'Motos Toro'
  | 'Suzuki'
  | 'Yamaha'
  | 'MD Haojin'
  | 'Ava'
  | 'Multimarca';

export type ProductCategory = 
  | 'Todas'
  | 'Motor y Transmisión'
  | 'Frenos y Suspensión'
  | 'Eléctrico e Iluminación'
  | 'Cauchos y Rines'
  | 'Lubricantes y Fluidos'
  | 'Accesorios y Cascos';

export interface Product {
  id: string;
  code: string;
  name: string;
  brand: MotoBrand;
  category: ProductCategory;
  compatibleModels: string[];
  priceUsd: number;
  stock: number;
  imageUrl: string;
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

export type ShippingAgency = 'MRW' | 'Zoom' | 'Tealca' | 'Retiro en Taller (Cristo Centro)';

export type PaymentMethodType = 'pago_movil' | 'divisas' | 'binance';

export interface CustomerData {
  fullName: string;
  phone: string;
  idNumber: string; // Cédula o RIF
  cityState: string;
  shippingAgency: ShippingAgency;
  agencyOfficeAddress: string;
  paymentMethod: PaymentMethodType;
  notes?: string;
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
  bikeBrand: MotoBrand;
  bikePlate: string;
  bikeColor: string;
  entryDate: string;
  estimatedDeliveryDate: string;
  status: WorkshopServiceStatus;
  statusLabel: string;
  mechanicInCharge: string;
  issueReported: string;
  workDone: string[];
  partsUsed: Array<{
    name: string;
    quantity: number;
    priceUsd: number;
  }>;
  laborUsd: number;
  totalUsd: number;
  notes?: string;
  mileageKm: number;
}

export interface ExchangeRateInfo {
  rateBcv: number; // e.g. 52.40
  lastUpdated: string;
  source: string;
  isCustom?: boolean;
}

export interface StoreSettings {
  storeName: string;
  workshopName: string;
  rif: string;
  phoneWhatsapp: string;
  phoneCall: string;
  address: string;
  operatingHours: string;
  pagoMovil: {
    bank: string;
    phone: string;
    idNumber: string;
    accountHolder: string;
  };
  binancePayId: string;
}
