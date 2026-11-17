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
} from '../types';

export const RELATIVE_IMAGE_BASE_URL =
  'https://ais-pre-flhofni32tpb4dwfwnak7d-506340403707.us-west1.run.app';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'Mercado Moto CC',
  workshopName: 'Servimotos Cristo Centro',
  rif: 'J-50028472-1',
  phoneWhatsapp: import.meta.env.VITE_STORE_WHATSAPP || '584122242450',
  phoneCall: '0412-2242450',
  address: 'Av. Principal Cristo Centro, Mérida / Caracas - Venezuela',
  operatingHours: 'Lunes a Sábado: 8:00 AM - 5:30 PM (Horario Corrido)',
  bankDetails: {
    pagoMovil: {
      bank: 'Banesco (0134)',
      phone: '0412-2242450',
      idNumber: 'J-50028472-1',
      accountHolder: 'Servimotos Cristo Centro',
    },
    transferencia: {
      bank: 'Banesco (0134)',
      accountNumber: '0134-0000-00-0000000000',
      accountType: 'Corriente',
      idNumber: 'J-50028472-1',
      accountHolder: 'Servimotos Cristo Centro',
    },
    binance: {
      payId: '542910384',
      email: 'servimotoscristocentro@gmail.com',
      holder: 'Servimotos Cristo Centro',
    },
  },
  pagoMovil: {
    bank: 'Banesco (0134)',
    phone: '0412-2242450',
    idNumber: 'J-50028472-1',
    accountHolder: 'Servimotos Cristo Centro',
  },
  binancePayId: '542910384',
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

  // Respect full URLs like https://lh3.googleusercontent.com/... or data URIs
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  // Relative paths starting with / use the specified Cloud Run base URL
  const cleanBase = RELATIVE_IMAGE_BASE_URL.replace(/\/+$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${cleanBase}${cleanPath}`;
}

function normalizeCompatibility(raw: unknown, fallbackBrand: string): { text: string; list: string[] } {
  if (Array.isArray(raw)) {
    const list = raw.map((x) => String(x).trim()).filter(Boolean);
    return { text: list.join(', '), list: list.length > 0 ? list : [fallbackBrand] };
  }
  if (typeof raw === 'string' && raw.trim()) {
    const list = raw
      .split(/[,;\n|]/)
      .map((s) => s.trim())
      .filter(Boolean);
    return { text: raw.trim(), list: list.length > 0 ? list : [fallbackBrand] };
  }
  return { text: fallbackBrand || 'Multimarca', list: [fallbackBrand || 'Multimarca'] };
}

function mapFirestoreProduct(docId: string, data: Record<string, any>): Product {
  const sku = String(data.sku || data.code || data.codigo || docId);
  const name = String(data.name || data.nombre || data.title || 'Repuesto').trim();
  const brand = String(data.brand || data.marca || 'Multimarca').trim();
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
          pm.bank || pm.banco || rawBank.pagoMovilBank || DEFAULT_STORE_SETTINGS.pagoMovil.bank
        ),
        phone: String(
          pm.phone || pm.telefono || rawBank.pagoMovilPhone || data.phone || DEFAULT_STORE_SETTINGS.pagoMovil.phone
        ),
        idNumber: String(
          pm.idNumber || pm.document || pm.rif || pm.cedula || rawBank.pagoMovilDocument || data.rif || DEFAULT_STORE_SETTINGS.pagoMovil.idNumber
        ),
        accountHolder: String(
          pm.accountHolder || pm.titular || data.commercialName || DEFAULT_STORE_SETTINGS.pagoMovil.accountHolder
        ),
      };

      const transferencia = {
        bank: String(
          tr.bank || tr.banco || rawBank.transferBank || pagoMovil.bank
        ),
        accountNumber: String(
          tr.accountNumber || tr.numero || tr.account || rawBank.transferAccount || ''
        ),
        accountType: String(tr.accountType || tr.tipo || 'Corriente'),
        idNumber: String(
          tr.idNumber || tr.rif || tr.document || pagoMovil.idNumber
        ),
        accountHolder: String(
          tr.accountHolder || tr.titular || data.commercialName || pagoMovil.accountHolder
        ),
      };

      const binancePayId = String(
        bn.payId ||
          bn.id ||
          rawBank.binancePayId ||
          rawBank.binanceId ||
          (typeof rawBank.binance === 'string' ? rawBank.binance : '') ||
          DEFAULT_STORE_SETTINGS.binancePayId
      );

      const binance = {
        payId: binancePayId,
        email: bn.email || rawBank.binanceEmail || '',
        holder: bn.holder || data.commercialName || DEFAULT_STORE_SETTINGS.workshopName,
      };

      const parsedBcv = Number(data.bcvRate ?? data.tasaBcv ?? data.exchangeRate);

      const mappedSettings: StoreSettings = {
        storeName: String(data.onlineStoreName || DEFAULT_STORE_SETTINGS.storeName),
        workshopName: String(data.commercialName || DEFAULT_STORE_SETTINGS.workshopName),
        rif: String(data.rif || data.document || pagoMovil.idNumber || DEFAULT_STORE_SETTINGS.rif),
        phoneWhatsapp: normalizedWhatsapp,
        phoneCall: String(data.phone || DEFAULT_STORE_SETTINGS.phoneCall),
        address: String(data.address || DEFAULT_STORE_SETTINGS.address),
        operatingHours: String(data.operatingHours || DEFAULT_STORE_SETTINGS.operatingHours),
        bcvRate: !isNaN(parsedBcv) && parsedBcv > 0 ? parsedBcv : undefined,
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
  if (s.includes('list') || s.includes('complet') || s.includes('terminad')) return 'lista_entrega';
  if (s.includes('calidad') || s.includes('prueba')) return 'control_calidad';
  if (s.includes('repar') || s.includes('proceso') || s.includes('trabaj')) return 'en_reparacion';
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

function matchesSearchTerm(queryClean: string, queryDigits: string, candidate: unknown): boolean {
  if (!candidate) return false;
  const candClean = cleanCompareString(candidate);
  if (!candClean) return false;
  if (candClean.includes(queryClean) || (candClean.length >= 5 && queryClean.includes(candClean))) {
    return true;
  }
  if (queryDigits.length >= 6) {
    const candDigits = digitsOnly(candidate);
    if (candDigits && (candDigits.includes(queryDigits) || queryDigits.includes(candDigits))) {
      return true;
    }
  }
  return false;
}

/**
 * Searches `serviceOrders` and `sales` collections in Firestore by phone, cédula/RIF, or motorcycle plate.
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
    const [ordersSnap, salesSnap] = await Promise.all([
      getDocs(collection(db, 'serviceOrders')),
      getDocs(collection(db, 'sales')),
    ]);

    ordersSnap.forEach((docSnap) => {
      const d = docSnap.data() as Record<string, any>;
      const moto = d.motorcycle || {};

      const isMatch =
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
        quantity: Number(p.quantity ?? p.qty ?? 1),
        priceUsd: Number(p.priceUsd ?? p.unitPrice ?? p.price ?? 0),
      }));

      const rawWorkDone = Array.isArray(d.workDone)
        ? d.workDone.map(String)
        : Array.isArray(d.tasks)
        ? d.tasks.map((t: any) => String(t.description || t.name || t))
        : d.diagnosis
        ? [String(d.diagnosis)]
        : [];

      const laborUsd = Number(d.laborUsd ?? d.laborCost ?? d.manoDeObra ?? 0);
      const totalUsd = Number(
        d.totalUsd ??
          d.total ??
          partsUsed.reduce((sum: number, p: any) => sum + p.priceUsd * p.quantity, 0) + laborUsd
      );

      serviceOrders.push({
        id: docSnap.id,
        orderNumber: String(d.orderNumber || d.code || docSnap.id.slice(-8).toUpperCase()),
        clientName: String(d.customerName || d.clientName || 'Cliente'),
        clientPhone: String(d.customerPhone || d.clientPhone || ''),
        clientIdNumber: String(d.customerDocument || d.clientIdNumber || ''),
        bikeBrand: String(moto.brand || d.bikeBrand || ''),
        bikeModel: String(moto.model || d.bikeModel || 'Motocicleta'),
        bikePlate: String(moto.plate || d.bikePlate || d.plate || 'S/P'),
        bikeColor: String(moto.color || d.bikeColor || 'No especificado'),
        entryDate: formatFirestoreDate(d.entryDate || d.createdAt),
        estimatedDeliveryDate: d.estimatedDeliveryDate
          ? formatFirestoreDate(d.estimatedDeliveryDate)
          : 'Por confirmar en taller',
        status: normalizeStatusKey(rawStatus),
        statusLabel: rawStatus,
        mechanicInCharge: String(d.mechanicInCharge || d.mechanic || d.technician || 'Equipo Técnico Servimotos CC'),
        issueReported: String(d.issueReported || d.problemDescription || d.notes || 'Servicio técnico general'),
        workDone: rawWorkDone.length > 0 ? rawWorkDone : ['Revisión técnica en curso'],
        partsUsed,
        laborUsd,
        totalUsd,
        notes: d.notes ? String(d.notes) : undefined,
        mileageKm: Number(moto.mileage ?? d.mileageKm ?? 0),
      });
    });

    salesSnap.forEach((docSnap) => {
      const d = docSnap.data() as Record<string, any>;
      const moto = d.motorcycle || {};

      const isMatch =
        matchesSearchTerm(queryClean, queryDigits, d.customerPhone) ||
        matchesSearchTerm(queryClean, queryDigits, d.customerDocument) ||
        matchesSearchTerm(queryClean, queryDigits, moto.plate) ||
        matchesSearchTerm(queryClean, queryDigits, d.motorcyclePlate) ||
        matchesSearchTerm(queryClean, queryDigits, d.plate) ||
        matchesSearchTerm(queryClean, queryDigits, d.invoiceNumber) ||
        matchesSearchTerm(queryClean, queryDigits, docSnap.id);

      if (!isMatch) return;

      const rawItems = Array.isArray(d.items) ? d.items : Array.isArray(d.products) ? d.products : [];
      const items = rawItems.map((it: any) => {
        const qty = Number(it.quantity ?? it.qty ?? 1);
        const unit = Number(it.unitPriceUsd ?? it.salePrice ?? it.price ?? it.unitPrice ?? 0);
        return {
          name: String(it.name || it.productName || 'Artículo'),
          sku: it.sku ? String(it.sku) : undefined,
          quantity: qty,
          unitPriceUsd: unit,
          totalUsd: Number(it.subtotalUsd ?? it.total ?? unit * qty),
        };
      });

      const totalUsd = Number(d.totalUsd ?? d.total ?? d.amountUsd ?? 0);
      const bcvUsed = Number(d.bcvRate ?? d.exchangeRate ?? 0);
      const totalBs = Number(d.totalBs ?? (bcvUsed > 0 ? totalUsd * bcvUsed : 0));

      sales.push({
        id: docSnap.id,
        invoiceNumber: String(d.invoiceNumber || d.number || docSnap.id.slice(-8).toUpperCase()),
        date: formatFirestoreDate(d.date || d.createdAt),
        customerName: String(d.customerName || 'Cliente'),
        customerPhone: String(d.customerPhone || ''),
        customerDocument: String(d.customerDocument || ''),
        motorcyclePlate: moto.plate || d.motorcyclePlate || d.plate,
        motorcycleInfo: moto.brand || moto.model ? `${moto.brand || ''} ${moto.model || ''}`.trim() : undefined,
        items,
        totalUsd,
        totalBs,
        bcvRateUsed: bcvUsed > 0 ? bcvUsed : undefined,
        paymentMethod: String(d.paymentMethod || 'Efectivo / Pago Móvil'),
        status: String(d.status || 'Completada'),
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'serviceOrders|sales');
    throw error;
  }

  return { serviceOrders, sales };
}

/**
 * Places a new online order in `onlineOrders/onl-${Date.now()}`,
 * creates/updates the customer in `customers`, and deducts `stock` in `products` atomically.
 */
export async function placeOnlineOrder(
  cart: CartItem[],
  customer: CustomerData,
  rateBcv: number
): Promise<{ orderId: string; totalUsd: number; totalBs: number }> {
  const orderId = `onl-${Date.now()}`;
  const totalUsd = Number(
    cart.reduce((acc, item) => acc + item.product.priceUsd * item.quantity, 0).toFixed(2)
  );
  const totalBs = Number((totalUsd * rateBcv).toFixed(2));

  const customerDocId =
    customer.idNumber.trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase() ||
    customer.phone.replace(/\D/g, '') ||
    `cli-${Date.now()}`;

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Read and verify stock for all products first (Firestore requires all reads before writes)
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

      // 2. Deduct stock in `products`
      for (const upd of productUpdates) {
        transaction.update(upd.ref, {
          stock: upd.newStock,
          updatedAt: serverTimestamp(),
        });
      }

      // 3. Upsert customer in `customers`
      const customerRef = doc(db, 'customers', customerDocId);
      transaction.set(
        customerRef,
        {
          id: customerDocId,
          name: customer.fullName.trim(),
          document: customer.idNumber.trim().toUpperCase(),
          phone: customer.phone.trim(),
          email: customer.email?.trim() || '',
          cityState: customer.cityState.trim(),
          lastOrderId: orderId,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // 4. Create new order in `onlineOrders` with ID `onl-${Date.now()}`
      const orderRef = doc(db, 'onlineOrders', orderId);
      transaction.set(orderRef, {
        id: orderId,
        orderNumber: orderId.toUpperCase(),
        customerId: customerDocId,
        customerName: customer.fullName.trim(),
        customerPhone: customer.phone.trim(),
        customerDocument: customer.idNumber.trim().toUpperCase(),
        customerEmail: customer.email?.trim() || '',
        cityState: customer.cityState.trim(),
        shippingMethod: customer.shippingAgency,
        shippingAddress:
          customer.shippingAgency === 'Retiro en tienda'
            ? 'Retiro en tienda Servimotos Cristo Centro'
            : customer.agencyOfficeAddress.trim(),
        paymentMethod: customer.paymentMethod,
        paymentReference: customer.paymentReference?.trim() || '',
        notes: customer.notes?.trim() || '',
        items: cart.map((item) => ({
          productId: item.product.id,
          sku: item.product.sku,
          name: item.product.name,
          brand: item.product.brand,
          quantity: item.quantity,
          unitPriceUsd: item.product.priceUsd,
          subtotalUsd: Number((item.product.priceUsd * item.quantity).toFixed(2)),
          imageUrl: item.product.imageUrl,
        })),
        totalUsd,
        totalBs,
        bcvRate: rateBcv,
        status: 'Pendiente',
        source: 'Mercado Moto CC',
        createdAt: new Date().toISOString(),
        serverCreatedAt: serverTimestamp(),
      });
    });

    return { orderId, totalUsd, totalBs };
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
 * Registers a client user in `users` collection with `role: "CLIENTE"`.
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

  let userId = `cli-${Date.now()}`;

  // Try Firebase Auth first; if Email/Password isn't enabled on console, fallback gracefully to Firestore users collection
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
    if (code !== 'auth/operation-not-allowed') {
      // Check if user already exists in Firestore users collection
      const existingSnap = await getDocs(
        query(collection(db, 'users'), where('email', '==', cleanEmail))
      );
      if (!existingSnap.empty) {
        throw new Error('Este correo electrónico ya está registrado.');
      }
    } else {
      // Check duplicate in Firestore when auth/operation-not-allowed
      const existingSnap = await getDocs(
        query(collection(db, 'users'), where('email', '==', cleanEmail))
      );
      if (!existingSnap.empty) {
        throw new Error('Este correo electrónico ya está registrado. Intenta iniciar sesión.');
      }
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
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'users', userId), {
      ...clientProfile,
      passwordHash,
      updatedAt: serverTimestamp(),
    });

    // Also register in customers collection for seamless checkout & workshop lookup
    const customerDocId = cleanDoc.replace(/[^a-zA-Z0-9]/g, '') || cleanPhone.replace(/\D/g, '') || userId;
    await setDoc(
      doc(db, 'customers', customerDocId),
      {
        id: customerDocId,
        userId,
        name: cleanName,
        document: cleanDoc,
        phone: cleanPhone,
        email: cleanEmail,
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
        document: String(d.document || ''),
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
    if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      // Still verify Firestore hash fallback if created without Firebase Email Auth
      const snap = await getDocs(
        query(collection(db, 'users'), where('email', '==', cleanEmail))
      );
      if (snap.empty) {
        throw new Error('Correo o clave incorrectos.');
      }
      const userDoc = snap.docs[0];
      const d = userDoc.data();
      const inputHash = await hashSecret(payload.password);
      if (d.passwordHash && d.passwordHash === inputHash) {
        return {
          id: userDoc.id,
          name: String(d.name || 'Cliente'),
          document: String(d.document || ''),
          phone: String(d.phone || ''),
          email: cleanEmail,
          role: 'CLIENTE',
          createdAt: d.createdAt,
        };
      }
      throw new Error('Correo o clave incorrectos.');
    }

    if (code === 'auth/operation-not-allowed' || code === 'auth/user-not-found') {
      const snap = await getDocs(
        query(collection(db, 'users'), where('email', '==', cleanEmail))
      );
      if (snap.empty) {
        throw new Error('No encontramos una cuenta registrada con ese correo.');
      }
      const userDoc = snap.docs[0];
      const d = userDoc.data();
      const inputHash = await hashSecret(payload.password);
      if (d.passwordHash !== inputHash) {
        throw new Error('Clave incorrecta.');
      }
      return {
        id: userDoc.id,
        name: String(d.name || 'Cliente'),
        document: String(d.document || ''),
        phone: String(d.phone || ''),
        email: cleanEmail,
        role: 'CLIENTE',
        createdAt: d.createdAt,
      };
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
