import {
  collection,
  doc,
  getDocs,
  getDoc,
  onSnapshot,
  setDoc,
  query,
  where,
  runTransaction,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import {
  Product,
  StoreSettings,
  WorkshopOrder,
  WorkshopServiceStatus,
  SaleRecord,
  CartItem,
  CustomerData,
  ClientUser,
  ShippingAgency,
  PaymentMethodType,
} from '../types';

export const RELATIVE_IMAGE_BASE_URL =
  'https://ais-pre-flhofni32tpb4dwfwnak7d-506340403707.us-west1.run.app';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'Mercado Moto CC',
  workshopName: 'Servimotos Cristo Centro',
  rif: 'V-19996141-8',
  email: 'SERVIMOTOSCRISTOCENTRO@gmail.com',
  city: 'Mérida',
  state: 'Mérida',
  phoneWhatsapp: import.meta.env.VITE_STORE_WHATSAPP || '584127860509',
  phoneCall: '0412-7860509',
  address: 'Mérida, Venezuela',
  operatingHours: 'Lunes a Sábado: 8:00 AM - 5:30 PM (Horario Corrido)',
  bankDetails: {
    pagoMovil: {
      bank: '0134 - Banesco',
      phone: '0412-2242450',
      idNumber: 'V-19996141',
      accountHolder: 'Servimotos Cristo Centro',
    },
    transferencia: {
      bank: 'Banesco Banco Universal',
      accountNumber: '0134-0030-08-0301034334',
      accountType: 'Cuenta Corriente',
      idNumber: 'V-19996141-8',
      accountHolder: 'Servimotos Cristo Centro C.A.',
    },
    binance: {
      payId: '66195935',
      email: 'SERVIMOTOSCRISTOCENTRO@gmail.com',
      holder: 'Servimotos Cristo Centro',
    },
  },
  pagoMovil: {
    bank: '0134 - Banesco',
    phone: '0412-2242450',
    idNumber: 'V-19996141',
    accountHolder: 'Servimotos Cristo Centro',
  },
  binancePayId: '66195935',
};

const FALLBACK_SVG =
  `data:image/svg+xml;utf8,` +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>`
  );

export function resolveProductImageUrl(rawUrl: unknown): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return FALLBACK_SVG;
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) return FALLBACK_SVG;

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  const cleanBase = RELATIVE_IMAGE_BASE_URL.replace(/\/+$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${cleanBase}${cleanPath}`;
}

export function resolveOptionalAssetUrl(rawUrl: unknown): string | undefined {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) return undefined;
  const trimmed = rawUrl.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }
  const cleanBase = RELATIVE_IMAGE_BASE_URL.replace(/\/+$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${cleanBase}${cleanPath}`;
}

function normalizeCompatibility(
  raw: unknown,
  fallbackBrand: string
): { text: string; list: string[] } {
  if (Array.isArray(raw)) {
    const list = raw.map((x) => String(x).trim()).filter(Boolean);
    return {
      text: list.join(', '),
      list: list.length > 0 ? list : [fallbackBrand || 'Multimarca'],
    };
  }
  if (typeof raw === 'string' && raw.trim()) {
    const list = raw
      .split(/[,;\n|]/)
      .map((s) => s.trim())
      .filter(Boolean);
    return {
      text: raw.trim(),
      list: list.length > 0 ? list : [fallbackBrand || 'Multimarca'],
    };
  }
  return {
    text: fallbackBrand || 'Multimarca',
    list: [fallbackBrand || 'Multimarca'],
  };
}

function mapFirestoreProduct(docId: string, data: Record<string, any>): Product {
  const sku = String(data.sku || data.code || data.codigo || docId);
  const name = String(data.name || data.nombre || data.title || 'Repuesto').trim();
  const brand = String(data.brand || data.marca || '').trim() || 'Multimarca';
  const category = String(data.category || data.categoria || 'General').trim();
  const { text: compatibilityText, list: compatibleModels } = normalizeCompatibility(
    data.compatibility ?? data.compatibleModels ?? data.modelos ?? data.aplicacion,
    brand
  );

  const rawPrice = data.salePrice ?? data.priceUsd ?? data.price ?? data.precio ?? 0;
  const salePrice =
    typeof rawPrice === 'number'
      ? rawPrice
      : parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 0;

  const rawStock = data.stock ?? data.quantity ?? data.cantidad ?? data.existencia ?? 0;
  const stock =
    typeof rawStock === 'number'
      ? rawStock
      : parseInt(String(rawStock), 10) || 0;

  const imageUrl = resolveProductImageUrl(
    data.imageUrl ?? data.image ?? data.imagen ?? data.foto ?? data.url_imagen
  );

  const description = String(data.description || data.descripcion || '').trim();
  const barcode = data.barcode ? String(data.barcode) : undefined;
  const warehouseLocation = data.warehouseLocation ? String(data.warehouseLocation) : undefined;
  const featured = Boolean(data.featured);
  const isOriginal = Boolean(data.isOriginal ?? data.original ?? false);

  let isPublished = true;
  if (data.isPublished === false || data.published === false || data.active === false) {
    isPublished = false;
  }

  return {
    id: docId,
    sku,
    code: sku,
    name,
    brand,
    category,
    compatibility: compatibilityText,
    compatibleModels,
    salePrice,
    priceUsd: salePrice,
    stock,
    imageUrl,
    barcode,
    warehouseLocation,
    description,
    specs:
      typeof data.specs === 'object' && data.specs !== null ? data.specs : undefined,
    isOriginal,
    featured,
    isPublished,
  };
}

/**
 * Subscribes in real time to Firestore `products` collection.
 * Filters `stock > 0` and sorts alphabetically A-Z.
 */
export function subscribeToProducts(
  onUpdate: (products: Product[]) => void,
  onError?: (errMsg: string) => void
): Unsubscribe {
  const productsRef = collection(db, 'products');
  return onSnapshot(
    productsRef,
    (snapshot) => {
      const list: Product[] = [];
      snapshot.forEach((docSnap) => {
        const mapped = mapFirestoreProduct(docSnap.id, docSnap.data());
        if (mapped.stock > 0 && mapped.isPublished !== false) {
          list.push(mapped);
        }
      });

      list.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
      onError?.(error.message || 'No se pudo conectar en tiempo real al inventario.');
    }
  );
}

/**
 * Subscribes in real time to Firestore `settings/business` document.
 * Matches exact schema from the primary app (`bankDetails.pagoMovilBank`, `pagoMovilId`, `bankTransferName`, `bankTransferAccount`, etc.)
 */
export function subscribeToBusinessSettings(
  onUpdate: (settings: StoreSettings, bcvRate?: number) => void,
  onError?: (errMsg: string) => void
): Unsubscribe {
  const settingsRef = doc(db, 'settings', 'business');
  return onSnapshot(
    settingsRef,
    (docSnap) => {
      if (!docSnap.exists()) {
        onUpdate(DEFAULT_STORE_SETTINGS);
        return;
      }

      const data = docSnap.data() as Record<string, any>;
      const rawWhatsapp = String(
        data.whatsapp || data.phone || DEFAULT_STORE_SETTINGS.phoneWhatsapp
      ).replace(/\D/g, '');
      const normalizedWhatsapp =
        rawWhatsapp.startsWith('0') && rawWhatsapp.length === 11
          ? `58${rawWhatsapp.slice(1)}`
          : rawWhatsapp || DEFAULT_STORE_SETTINGS.phoneWhatsapp;

      const rawBank = data.bankDetails || {};
      const pm = rawBank.pagoMovil || rawBank.pago_movil || {};
      const tr = rawBank.transferencia || rawBank.transfer || {};
      const bn = rawBank.binance || rawBank.binancePay || {};

      const pagoMovil = {
        bank: String(
          rawBank.pagoMovilBank ||
            pm.bank ||
            pm.banco ||
            DEFAULT_STORE_SETTINGS.pagoMovil.bank
        ),
        phone: String(
          rawBank.pagoMovilPhone ||
            pm.phone ||
            pm.telefono ||
            data.phone ||
            DEFAULT_STORE_SETTINGS.pagoMovil.phone
        ),
        idNumber: String(
          rawBank.pagoMovilId ||
            rawBank.pagoMovilDocument ||
            pm.idNumber ||
            pm.document ||
            pm.rif ||
            data.rif ||
            DEFAULT_STORE_SETTINGS.pagoMovil.idNumber
        ),
        accountHolder: String(
          rawBank.pagoMovilHolder ||
            pm.accountHolder ||
            pm.titular ||
            data.commercialName ||
            DEFAULT_STORE_SETTINGS.pagoMovil.accountHolder
        ),
        qrUrl: resolveOptionalAssetUrl(rawBank.pagoMovilQrUrl || pm.qrUrl),
      };

      const transferencia = {
        bank: String(
          rawBank.bankTransferName ||
            rawBank.transferBank ||
            tr.bank ||
            tr.banco ||
            DEFAULT_STORE_SETTINGS.bankDetails.transferencia.bank
        ),
        accountNumber: String(
          rawBank.bankTransferAccount ||
            rawBank.transferAccount ||
            tr.accountNumber ||
            tr.numero ||
            DEFAULT_STORE_SETTINGS.bankDetails.transferencia.accountNumber
        ),
        accountType: String(
          rawBank.bankTransferType || tr.accountType || tr.tipo || 'Cuenta Corriente'
        ),
        idNumber: String(
          rawBank.bankTransferRif ||
            tr.idNumber ||
            tr.rif ||
            data.rif ||
            pagoMovil.idNumber
        ),
        accountHolder: String(
          rawBank.bankTransferHolder ||
            tr.accountHolder ||
            tr.titular ||
            data.name ||
            data.commercialName ||
            DEFAULT_STORE_SETTINGS.bankDetails.transferencia.accountHolder
        ),
      };

      const binancePayId = String(
        rawBank.binancePayId ||
          rawBank.binanceId ||
          bn.payId ||
          bn.id ||
          (typeof rawBank.binance === 'string' ? rawBank.binance : '') ||
          DEFAULT_STORE_SETTINGS.binancePayId
      );

      const binance = {
        payId: binancePayId,
        email: rawBank.binanceEmail || bn.email || data.email || '',
        holder: bn.holder || data.commercialName || DEFAULT_STORE_SETTINGS.workshopName,
      };

      const parsedBcv = Number(data.bcvRate ?? data.tasaBcv ?? data.exchangeRate);

      const mappedSettings: StoreSettings = {
        storeName: String(data.onlineStoreName || DEFAULT_STORE_SETTINGS.storeName),
        workshopName: String(
          data.commercialName || data.name || DEFAULT_STORE_SETTINGS.workshopName
        ),
        rif: String(data.rif || data.document || pagoMovil.idNumber || DEFAULT_STORE_SETTINGS.rif),
        email: data.email ? String(data.email) : DEFAULT_STORE_SETTINGS.email,
        city: data.city ? String(data.city) : DEFAULT_STORE_SETTINGS.city,
        state: data.state ? String(data.state) : DEFAULT_STORE_SETTINGS.state,
        phoneWhatsapp: normalizedWhatsapp,
        phoneCall: String(data.phone || DEFAULT_STORE_SETTINGS.phoneCall),
        address: String(data.address || DEFAULT_STORE_SETTINGS.address),
        operatingHours: String(
          data.operatingHours || DEFAULT_STORE_SETTINGS.operatingHours
        ),
        bcvRate: !isNaN(parsedBcv) && parsedBcv > 0 ? parsedBcv : undefined,
        bcvOfficialDate: data.bcvOfficialDate ? String(data.bcvOfficialDate) : undefined,
        bcvLastUpdated: data.bcvLastUpdated ? String(data.bcvLastUpdated) : undefined,
        bcvSource: data.bcvSource ? String(data.bcvSource) : undefined,
        customCategories: Array.isArray(data.customCategories)
          ? data.customCategories.map(String)
          : undefined,
        warrantyPolicy: data.warrantyPolicy ? String(data.warrantyPolicy) : undefined,
        invoiceDisclaimer: data.invoiceDisclaimer
          ? String(data.invoiceDisclaimer)
          : undefined,
        bankDetails: {
          pagoMovil,
          transferencia,
          binance,
        },
        pagoMovil,
        binancePayId,
      };

      onUpdate(
        mappedSettings,
        !isNaN(parsedBcv) && parsedBcv > 0 ? parsedBcv : undefined
      );
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/business');
      onError?.(error.message || 'No se pudo cargar la configuración del negocio.');
    }
  );
}

function formatFirestoreDate(val: unknown): string {
  if (!val) return new Date().toLocaleDateString('es-VE');
  if (val instanceof Timestamp) {
    return val.toDate().toLocaleDateString('es-VE');
  }
  if (typeof val === 'object' && val !== null && 'seconds' in (val as any)) {
    return new Date((val as any).seconds * 1000).toLocaleDateString('es-VE');
  }
  if (typeof val === 'string') {
    const d = new Date(val);
    if (!isNaN(d.getTime()) && val.includes('T')) {
      return d.toLocaleDateString('es-VE');
    }
    return val;
  }
  return String(val);
}

function normalizeStatusKey(rawStatus: string): WorkshopServiceStatus {
  const s = rawStatus.toLowerCase().trim();
  if (s.includes('entregad')) return 'entregada';
  if (s.includes('list') || s.includes('complet') || s.includes('terminad'))
    return 'lista_entrega';
  if (s.includes('calidad') || s.includes('prueba')) return 'control_calidad';
  if (s.includes('repar') || s.includes('proceso') || s.includes('trabaj'))
    return 'en_reparacion';
  if (s.includes('repuest') || s.includes('espera')) return 'espera_repuestos';
  if (s.includes('diagn')) return 'diagnostico';
  return 'recepcion';
}

function cleanCompareString(val: unknown): string {
  return String(val ?? '')
    .toUpperCase()
    .replace(/[\s\-_.+]/g, '');
}

function digitsOnly(val: unknown): string {
  return String(val ?? '').replace(/\D/g, '');
}

function matchesSearchTerm(
  queryClean: string,
  queryDigits: string,
  candidate: unknown
): boolean {
  if (!candidate) return false;
  const candClean = cleanCompareString(candidate);
  if (!candClean) return false;
  if (
    candClean.includes(queryClean) ||
    (candClean.length >= 5 && queryClean.includes(candClean))
  ) {
    return true;
  }
  if (queryDigits.length >= 6) {
    const candDigits = digitsOnly(candidate);
    if (
      candDigits &&
      (candDigits.includes(queryDigits) || queryDigits.includes(candDigits))
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Searches `customers`, `serviceOrders`, and `sales` in Firestore by phone, cédula/documentId, or motorcycle plate.
 */
export async function searchCustomerPortal(rawQuery: string): Promise<{
  serviceOrders: WorkshopOrder[];
  sales: SaleRecord[];
}> {
  const queryClean = cleanCompareString(rawQuery);
  const queryDigits = digitsOnly(rawQuery);
  if (!queryClean) {
    return { serviceOrders: [], sales: [] };
  }

  const serviceOrders: WorkshopOrder[] = [];
  const sales: SaleRecord[] = [];

  try {
    const [customersSnap, ordersSnap, salesSnap] = await Promise.all([
      getDocs(collection(db, 'customers')),
      getDocs(collection(db, 'serviceOrders')),
      getDocs(collection(db, 'sales')),
    ]);

    // Find matching customer IDs so searching by cédula also matches serviceOrders linked by customerId
    const matchedCustomerIds = new Set<string>();
    const customerDocMap = new Map<string, string>();
    customersSnap.forEach((docSnap) => {
      const c = docSnap.data() as Record<string, any>;
      if (c.documentId) customerDocMap.set(docSnap.id, String(c.documentId));

      const custMatch =
        matchesSearchTerm(queryClean, queryDigits, c.documentId) ||
        matchesSearchTerm(queryClean, queryDigits, c.document) ||
        matchesSearchTerm(queryClean, queryDigits, c.phone) ||
        matchesSearchTerm(queryClean, queryDigits, docSnap.id);

      if (custMatch) {
        matchedCustomerIds.add(docSnap.id);
        if (c.id) matchedCustomerIds.add(String(c.id));
      }
    });

    ordersSnap.forEach((docSnap) => {
      const d = docSnap.data() as Record<string, any>;
      const moto = d.motorcycle || {};

      const isMatch =
        (d.customerId && matchedCustomerIds.has(String(d.customerId))) ||
        matchesSearchTerm(queryClean, queryDigits, d.customerPhone) ||
        matchesSearchTerm(queryClean, queryDigits, d.clientPhone) ||
        matchesSearchTerm(queryClean, queryDigits, d.customerDocument) ||
        matchesSearchTerm(queryClean, queryDigits, d.clientIdNumber) ||
        matchesSearchTerm(queryClean, queryDigits, moto.plate) ||
        matchesSearchTerm(queryClean, queryDigits, d.bikePlate) ||
        matchesSearchTerm(queryClean, queryDigits, d.plate) ||
        matchesSearchTerm(queryClean, queryDigits, d.orderNumber) ||
        matchesSearchTerm(queryClean, queryDigits, docSnap.id);

      if (!isMatch) return;

      const rawStatus = String(d.statusLabel || d.status || 'Recepción');
      const rawParts = Array.isArray(d.partsUsed)
        ? d.partsUsed
        : Array.isArray(d.parts)
        ? d.parts
        : Array.isArray(d.items)
        ? d.items
        : [];

      const partsUsed = rawParts.map((p: any) => ({
        name: String(p.name || p.productName || p.description || 'Repuesto'),
        sku: p.sku ? String(p.sku) : undefined,
        quantity: Number(p.quantity ?? p.qty ?? 1),
        priceUsd: Number(p.unitPrice ?? p.priceUsd ?? p.price ?? 0),
      }));

      const rawWorkDone = Array.isArray(d.workDone)
        ? d.workDone.map(String)
        : Array.isArray(d.tasks)
        ? d.tasks.map((t: any) => String(t.description || t.name || t))
        : d.diagnosis
        ? [String(d.diagnosis)]
        : [];

      const laborUsd = Number(d.laborCost ?? d.laborUsd ?? d.manoDeObra ?? 0);
      const totalUsd = Number(
        d.totalCost ??
          d.totalUsd ??
          d.total ??
          partsUsed.reduce((sum: number, p: any) => sum + p.priceUsd * p.quantity, 0) +
            laborUsd
      );

      serviceOrders.push({
        id: docSnap.id,
        orderNumber: String(d.orderNumber || d.code || docSnap.id.slice(-8).toUpperCase()),
        clientName: String(d.customerName || d.clientName || 'Cliente'),
        clientPhone: String(d.customerPhone || d.clientPhone || ''),
        clientIdNumber: String(
          d.customerDocument ||
            d.clientIdNumber ||
            (d.customerId ? customerDocMap.get(String(d.customerId)) || '' : '')
        ),
        bikeBrand: String(moto.brand || d.bikeBrand || ''),
        bikeModel: String(moto.model || d.bikeModel || 'Motocicleta'),
        bikePlate: String(moto.plate || d.bikePlate || d.plate || 'S/P'),
        bikeColor: String(moto.color || d.bikeColor || 'No especificado'),
        bikeYear: moto.year ? String(moto.year) : undefined,
        serviceType: d.serviceType ? String(d.serviceType) : undefined,
        fuelLevel: d.fuelLevel ? String(d.fuelLevel) : undefined,
        entryDate: formatFirestoreDate(d.entryDate || d.createdAt),
        estimatedDeliveryDate:
          d.estimatedDelivery || d.estimatedDeliveryDate
            ? formatFirestoreDate(d.estimatedDelivery || d.estimatedDeliveryDate)
            : 'Por confirmar en taller',
        status: normalizeStatusKey(rawStatus),
        statusLabel: rawStatus.replace(/_/g, ' '),
        mechanicInCharge: String(
          d.assignedTechnician ||
            d.mechanicInCharge ||
            d.mechanic ||
            'Equipo Técnico Servimotos CC'
        ),
        mechanicPhone: d.assignedTechnicianPhone
          ? String(d.assignedTechnicianPhone)
          : undefined,
        issueReported: String(
          d.reportedIssue ||
            d.issueReported ||
            d.problemDescription ||
            d.serviceType ||
            'Servicio técnico general'
        ),
        workDone:
          rawWorkDone.length > 0
            ? rawWorkDone
            : [d.serviceType ? `Servicio: ${d.serviceType}` : 'Revisión técnica en curso'],
        partsUsed,
        laborUsd,
        totalUsd,
        totalBs: d.totalCostBs ? Number(d.totalCostBs) : undefined,
        notes: d.notes ? String(d.notes) : undefined,
        mileageKm: Number(moto.mileage ?? d.mileageKm ?? 0),
      });
    });

    salesSnap.forEach((docSnap) => {
      const d = docSnap.data() as Record<string, any>;
      const moto = d.motorcycle || {};

      const isMatch =
        (d.customerId && matchedCustomerIds.has(String(d.customerId))) ||
        matchesSearchTerm(queryClean, queryDigits, d.customerPhone) ||
        matchesSearchTerm(queryClean, queryDigits, d.customerDocument) ||
        matchesSearchTerm(queryClean, queryDigits, moto.plate) ||
        matchesSearchTerm(queryClean, queryDigits, d.motorcyclePlate) ||
        matchesSearchTerm(queryClean, queryDigits, d.plate) ||
        matchesSearchTerm(queryClean, queryDigits, d.invoiceNumber) ||
        matchesSearchTerm(queryClean, queryDigits, docSnap.id);

      if (!isMatch) return;

      const rawItems = Array.isArray(d.items)
        ? d.items
        : Array.isArray(d.products)
        ? d.products
        : [];
      const items = rawItems.map((it: any) => {
        const qty = Number(it.quantity ?? it.qty ?? 1);
        const unit = Number(it.unitPrice ?? it.unitPriceUsd ?? it.salePrice ?? it.price ?? 0);
        return {
          name: String(it.name || it.productName || 'Artículo'),
          sku: it.sku ? String(it.sku) : undefined,
          quantity: qty,
          unitPriceUsd: unit,
          totalUsd: Number(it.total ?? it.subtotalUsd ?? unit * qty),
        };
      });

      const totalUsd = Number(d.total ?? d.totalUsd ?? d.amountUsd ?? 0);
      const bcvUsed = Number(d.bcvRate ?? d.exchangeRate ?? 0);
      const totalBs = Number(d.totalBs ?? (bcvUsed > 0 ? totalUsd * bcvUsed : 0));

      sales.push({
        id: docSnap.id,
        invoiceNumber: String(d.invoiceNumber || d.number || docSnap.id.slice(-8).toUpperCase()),
        date: formatFirestoreDate(d.date || d.createdAt),
        customerName: String(d.customerName || 'Cliente'),
        customerPhone: String(d.customerPhone || ''),
        customerDocument: String(
          d.customerDocument ||
            (d.customerId ? customerDocMap.get(String(d.customerId)) || '' : '')
        ),
        motorcyclePlate: moto.plate || d.motorcyclePlate || d.plate,
        motorcycleInfo:
          moto.brand || moto.model
            ? `${moto.brand || ''} ${moto.model || ''}`.trim()
            : undefined,
        items,
        subtotalUsd: d.subtotal !== undefined ? Number(d.subtotal) : undefined,
        discountUsd: d.discount !== undefined ? Number(d.discount) : undefined,
        taxUsd: d.tax !== undefined ? Number(d.tax) : undefined,
        totalUsd,
        totalBs,
        bcvRateUsed: bcvUsed > 0 ? bcvUsed : undefined,
        paymentMethod: String(d.paymentMethod || 'Efectivo / Pago Móvil'),
        status: String(d.status || 'Completada'),
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'customers|serviceOrders|sales');
    throw error;
  }

  return { serviceOrders, sales };
}

function mapDeliveryTypeEnum(agency: ShippingAgency): string {
  switch (agency) {
    case 'Retiro en tienda':
      return 'RETIRO_TIENDA';
    case 'Delivery Mérida':
      return 'DELIVERY_MERIDA';
    case 'MRW':
      return 'MRW';
    case 'Zoom':
      return 'ZOOM';
    case 'Tealca':
      return 'TEALCA';
    default:
      return 'RETIRO_TIENDA';
  }
}

function mapPaymentMethodLabel(method: PaymentMethodType): string {
  switch (method) {
    case 'pago_movil':
      return 'Pago Móvil';
    case 'transferencia':
      return 'Transferencia Bancaria';
    case 'binance':
      return 'Binance Pay';
    case 'divisas':
      return 'Divisas Efectivo';
    default:
      return 'Pago Móvil';
  }
}

/**
 * Places a new online order in `onlineOrders/onl-${Date.now()}` matching the exact schema of the main app,
 * creates/updates the customer in `customers`, and deducts `stock` in `products` atomically.
 */
export async function placeOnlineOrder(
  cart: CartItem[],
  customer: CustomerData,
  rateBcv: number
): Promise<{ orderId: string; orderCode: string; totalUsd: number; totalBs: number }> {
  const nowTs = Date.now();
  const orderId = `onl-${nowTs}`;
  const orderCode = `PED-${String(nowTs).slice(-4)}`;
  const totalUsd = Number(
    cart.reduce((acc, item) => acc + item.product.priceUsd * item.quantity, 0).toFixed(2)
  );
  const totalBs = Number((totalUsd * rateBcv).toFixed(2));

  const cleanDocument = customer.idNumber.trim().toUpperCase();
  const cleanPhone = customer.phone.trim();

  // Check if customer already exists in `customers` by documentId or phone so we don't duplicate
  let customerDocId = `cust-${nowTs}`;
  try {
    const byDoc = await getDocs(
      query(collection(db, 'customers'), where('documentId', '==', cleanDocument))
    );
    if (!byDoc.empty) {
      customerDocId = byDoc.docs[0].id;
    } else if (cleanPhone) {
      const byPhone = await getDocs(
        query(collection(db, 'customers'), where('phone', '==', cleanPhone))
      );
      if (!byPhone.empty) {
        customerDocId = byPhone.docs[0].id;
      }
    }
  } catch {
    // fallback to cust-${nowTs}
  }

  try {
    await runTransaction(db, async (transaction) => {
      const productUpdates: Array<{ ref: ReturnType<typeof doc>; newStock: number }> = [];

      for (const item of cart) {
        const prodRef = doc(db, 'products', item.product.id);
        const prodSnap = await transaction.get(prodRef);
        if (!prodSnap.exists()) {
          throw new Error(`El repuesto "${item.product.name}" ya no está disponible.`);
        }
        const currentStock = Number(prodSnap.data().stock ?? 0);
        if (currentStock < item.quantity) {
          throw new Error(
            `Stock insuficiente para "${item.product.name}". Disponible: ${currentStock} unidad(es).`
          );
        }
        productUpdates.push({
          ref: prodRef,
          newStock: Math.max(0, currentStock - item.quantity),
        });
      }

      // 1. Deduct stock in `products`
      for (const upd of productUpdates) {
        transaction.update(upd.ref, {
          stock: upd.newStock,
          updatedAt: serverTimestamp(),
        });
      }

      // 2. Upsert customer in `customers` matching main app schema
      const customerRef = doc(db, 'customers', customerDocId);
      transaction.set(
        customerRef,
        {
          id: customerDocId,
          name: customer.fullName.trim(),
          documentId: cleanDocument,
          phone: cleanPhone,
          email: customer.email?.trim() || '',
          city: customer.city.trim() || 'Mérida',
          state: customer.state.trim() || 'Mérida',
          address:
            customer.shippingAgency === 'Retiro en tienda'
              ? 'Retiro en tienda'
              : customer.agencyOfficeAddress.trim(),
          notes: customer.notes?.trim() || '',
          createdAt: new Date(nowTs).toISOString(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // 3. Create order in `onlineOrders` with exact main-app schema
      const orderRef = doc(db, 'onlineOrders', orderId);
      transaction.set(orderRef, {
        id: orderId,
        orderCode,
        customerId: customerDocId,
        customerName: customer.fullName.trim(),
        customerPhone: cleanPhone,
        customerDocument: cleanDocument,
        customerCity: customer.city.trim() || 'Mérida',
        customerState: customer.state.trim() || 'Mérida',
        deliveryType: mapDeliveryTypeEnum(customer.shippingAgency),
        shippingAddress:
          customer.shippingAgency === 'Retiro en tienda'
            ? 'Retiro en tienda Servimotos Cristo Centro'
            : customer.agencyOfficeAddress.trim(),
        paymentMethod: mapPaymentMethodLabel(customer.paymentMethod),
        paymentProofReference: customer.paymentReference?.trim() || '',
        notes: customer.notes?.trim() || '',
        items: cart.map((item) => ({
          productId: item.product.id,
          sku: item.product.sku || item.product.code,
          name: item.product.name,
          category: item.product.category,
          quantity: item.quantity,
          unitPrice: item.product.priceUsd,
          total: Number((item.product.priceUsd * item.quantity).toFixed(2)),
        })),
        total: totalUsd,
        totalBs,
        bcvRate: rateBcv,
        status: 'PENDIENTE',
        source: 'Mercado Moto CC',
        createdAt: new Date(nowTs).toISOString(),
        serverCreatedAt: serverTimestamp(),
      });
    });

    return { orderId, orderCode, totalUsd, totalBs };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `onlineOrders/${orderId}`);
    throw error;
  }
}

async function hashSecret(secret: string): Promise<string> {
  const data = new TextEncoder().encode(secret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Registers a client user in `users` collection with `role: "CLIENTE"` and syncs `customers`.
 */
export async function registerClientUser(payload: {
  name: string;
  document: string;
  phone: string;
  email: string;
  password: string;
}): Promise<ClientUser> {
  const cleanEmail = payload.email.trim().toLowerCase();
  const cleanDoc = payload.document.trim().toUpperCase();
  const cleanPhone = payload.phone.trim();
  const cleanName = payload.name.trim();
  const nowTs = Date.now();

  let userId = `usr-cli-${nowTs}`;

  try {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, payload.password);
    userId = cred.user.uid;
    await updateProfile(cred.user, { displayName: cleanName }).catch(() => {});
  } catch (authErr: any) {
    const code = authErr?.code || '';
    if (code === 'auth/email-already-in-use') {
      throw new Error('Este correo electrónico ya está registrado. Intenta iniciar sesión.');
    }
    if (code === 'auth/weak-password') {
      throw new Error('La clave debe tener al menos 6 caracteres.');
    }
    const existingSnap = await getDocs(
      query(collection(db, 'users'), where('email', '==', cleanEmail))
    );
    if (!existingSnap.empty) {
      throw new Error('Este correo electrónico ya está registrado. Intenta iniciar sesión.');
    }
  }

  const passwordHash = await hashSecret(payload.password);

  const clientProfile: ClientUser = {
    id: userId,
    name: cleanName,
    document: cleanDoc,
    phone: cleanPhone,
    email: cleanEmail,
    role: 'CLIENTE',
    createdAt: new Date(nowTs).toISOString(),
  };

  try {
    await setDoc(doc(db, 'users', userId), {
      id: userId,
      name: cleanName,
      documentId: cleanDoc,
      phone: cleanPhone,
      email: cleanEmail,
      role: 'CLIENTE',
      hasCustomPassword: true,
      passwordHash,
      createdAt: clientProfile.createdAt,
      passwordUpdatedAt: clientProfile.createdAt,
      updatedAt: serverTimestamp(),
    });

    // Upsert customer in `customers`
    let customerDocId = `cust-${nowTs}`;
    const byDoc = await getDocs(
      query(collection(db, 'customers'), where('documentId', '==', cleanDoc))
    );
    if (!byDoc.empty) {
      customerDocId = byDoc.docs[0].id;
    }

    await setDoc(
      doc(db, 'customers', customerDocId),
      {
        id: customerDocId,
        userId,
        name: cleanName,
        documentId: cleanDoc,
        phone: cleanPhone,
        email: cleanEmail,
        city: 'Mérida',
        state: 'Mérida',
        createdAt: clientProfile.createdAt,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
    throw error;
  }

  return clientProfile;
}

/**
 * Logs in an existing client user from `users` collection.
 */
export async function loginClientUser(payload: {
  email: string;
  password: string;
}): Promise<ClientUser> {
  const cleanEmail = payload.email.trim().toLowerCase();

  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, payload.password);
    const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
    if (userDoc.exists()) {
      const d = userDoc.data();
      return {
        id: cred.user.uid,
        name: String(d.name || cred.user.displayName || 'Cliente'),
        document: String(d.documentId || d.document || ''),
        phone: String(d.phone || ''),
        email: cleanEmail,
        role: 'CLIENTE',
        createdAt: d.createdAt,
      };
    }
    return {
      id: cred.user.uid,
      name: cred.user.displayName || 'Cliente',
      document: '',
      phone: '',
      email: cleanEmail,
      role: 'CLIENTE',
    };
  } catch (authErr: any) {
    const code = authErr?.code || '';
    if (
      code === 'auth/wrong-password' ||
      code === 'auth/invalid-credential' ||
      code === 'auth/operation-not-allowed' ||
      code === 'auth/user-not-found'
    ) {
      const snap = await getDocs(
        query(collection(db, 'users'), where('email', '==', cleanEmail))
      );
      if (snap.empty) {
        throw new Error('No encontramos una cuenta registrada con ese correo.');
      }
      const userDoc = snap.docs[0];
      const d = userDoc.data();
      const inputHash = await hashSecret(payload.password);
      if (d.passwordHash && d.passwordHash === inputHash) {
        return {
          id: userDoc.id,
          name: String(d.name || 'Cliente'),
          document: String(d.documentId || d.document || ''),
          phone: String(d.phone || ''),
          email: cleanEmail,
          role: 'CLIENTE',
          createdAt: d.createdAt,
        };
      }
      throw new Error('Correo o clave incorrectos.');
    }

    throw new Error(authErr?.message || 'Error al iniciar sesión.');
  }
}

export async function logoutClientUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch {
    // ignore
  }
}
