import { Product, WorkshopOrder, ExchangeRateInfo, StoreSettings, MotoBrand, ProductCategory } from '../types';

// Central API URL from environment variable or Cloud Run system
export const MAIN_SYSTEM_URL = 
  import.meta.env.VITE_MAIN_SYSTEM_URL || 
  'https://ais-pre-flhofni32tpb4dwfwnak7d-506340403707.us-west1.run.app';

// Local storage keys
const STORAGE_KEYS = {
  PRODUCTS: 'mercadomoto_products_real_cache',
  CUSTOM_API_URL: 'mercadomoto_custom_api_url',
  WORKSHOP_ORDERS: 'mercadomoto_workshop_orders_cache',
  BCV_RATE: 'mercadomoto_bcv_rate_cache',
  LAST_SYNC: 'mercadomoto_last_sync_timestamp',
};

// Clean legacy mock product cache if it exists
try {
  localStorage.removeItem('mercadomoto_products_cache');
} catch {
  // ignore
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'Mercado Moto CC',
  workshopName: 'Servimotos Cristo Centro',
  rif: 'J-50028472-1',
  phoneWhatsapp: import.meta.env.VITE_STORE_WHATSAPP || '584122242450',
  phoneCall: '0412-2242450',
  address: 'Av. Principal Cristo Centro, Sector El Taller, Local Servimotos CC, Caracas - Venezuela',
  operatingHours: 'Lunes a Sábado: 8:00 AM - 5:30 PM (Horario Corrido)',
  pagoMovil: {
    bank: 'Banesco (0134)',
    phone: '0412-2242450',
    idNumber: 'J-50028472-1',
    accountHolder: 'Servimotos Cristo Centro C.A.',
  },
  binancePayId: '542910384 (Servimotos CC Oficial)',
};

/**
 * Resolves full image URL if the backend stores a relative path or asset path
 */
function resolveImageUrl(rawUrl: any, baseUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    // Elegant fallback SVG for products without an image
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 24 24" fill="none" stroke="%23f59e0b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`;
  }

  const trimmed = rawUrl.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  // Relative path stored in database (e.g. /uploads/image.jpg or assets/image.jpg)
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${cleanBase}${cleanPath}`;
}

/**
 * Normalizes an arbitrary item returned by the central database/API into the Product interface
 */
function normalizeProduct(item: any, baseUrl: string): Product {
  // Extract ID or code
  const id = String(item.id || item._id || item.codigo || item.code || Math.random().toString(36).substring(2, 9));
  const code = String(item.code || item.codigo || item.cod || item.sku || id);
  const name = String(item.name || item.nombre || item.titulo || item.descripcion_corta || 'Repuesto sin título');

  // Extract Brand (detect Venezuelan moto brand)
  const rawBrand = item.brand || item.marca || 'Multimarca';
  const brand: MotoBrand = rawBrand as MotoBrand;

  // Extract Category
  const rawCategory = item.category || item.categoria || item.rubro || item.seccion || 'Motor y Transmisión';
  const category: ProductCategory = rawCategory as ProductCategory;

  // Compatible models
  let compatibleModels: string[] = [];
  if (Array.isArray(item.compatibleModels)) {
    compatibleModels = item.compatibleModels;
  } else if (Array.isArray(item.modelos)) {
    compatibleModels = item.modelos;
  } else if (typeof item.compatibleModels === 'string') {
    compatibleModels = item.compatibleModels.split(/[,;\n]/).map((s: string) => s.trim()).filter(Boolean);
  } else if (typeof item.modelos === 'string') {
    compatibleModels = item.modelos.split(/[,;\n]/).map((s: string) => s.trim()).filter(Boolean);
  } else if (typeof item.compatibilidad === 'string') {
    compatibleModels = item.compatibilidad.split(/[,;\n]/).map((s: string) => s.trim()).filter(Boolean);
  } else {
    compatibleModels = [rawBrand || 'Universal'];
  }

  // Price in USD
  const rawPrice = item.priceUsd ?? item.precioUsd ?? item.price ?? item.precio ?? item.costo ?? item.monto ?? 0;
  const priceUsd = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 0;

  // Stock
  const rawStock = item.stock ?? item.cantidad ?? item.existencia ?? item.inventario ?? 0;
  const stock = typeof rawStock === 'number' ? rawStock : parseInt(String(rawStock), 10) || 0;

  // Image URL from remote database
  const rawImage = item.imageUrl || item.image || item.imagen || item.foto || item.url_imagen || item.foto_url;
  const imageUrl = resolveImageUrl(rawImage, baseUrl);

  // Description
  const description = String(item.description || item.descripcion || item.detalle || item.nota || '');

  // Specs
  const specs = (typeof item.specs === 'object' && item.specs !== null) 
    ? item.specs 
    : (typeof item.especificaciones === 'object' && item.especificaciones !== null) 
    ? item.especificaciones 
    : undefined;

  // Original tag & featured
  const isOriginal = Boolean(item.isOriginal ?? item.original ?? item.es_original ?? false);
  const featured = Boolean(item.featured ?? item.destacado ?? false);

  // Published / Visibility state in the main Servimotos Cristo Centro application
  const rawPublished = item.isPublished ?? item.published ?? item.publicado ?? item.activo ?? item.visible;
  let isPublished = true;
  if (typeof rawPublished === 'boolean') {
    isPublished = rawPublished;
  } else if (typeof rawPublished === 'string') {
    const val = rawPublished.trim().toLowerCase();
    if (['false', 'no', '0', 'inactivo', 'inactive', 'draft', 'borrador', 'oculto', 'hidden', 'pausado', 'paused'].includes(val)) {
      isPublished = false;
    }
  } else if (typeof item.status === 'string') {
    const statusVal = item.status.trim().toLowerCase();
    if (['draft', 'borrador', 'inactivo', 'inactive', 'paused', 'pausado', 'oculto', 'hidden', 'archived', 'archivado'].includes(statusVal)) {
      isPublished = false;
    }
  } else if (typeof item.estado === 'string') {
    const estadoVal = item.estado.trim().toLowerCase();
    if (['borrador', 'inactivo', 'pausado', 'oculto', 'archivado'].includes(estadoVal)) {
      isPublished = false;
    }
  }

  return {
    id,
    code,
    name,
    brand,
    category,
    compatibleModels,
    priceUsd,
    stock,
    imageUrl,
    description,
    specs,
    isOriginal,
    featured,
    isPublished,
  };
}

export interface ProductsResponse {
  products: Product[];
  fromRemote: boolean;
  endpoint: string;
  error?: string;
}

export const ApiService = {
  /**
   * Retrieves active base URL (supports user override stored in localStorage)
   */
  getBaseUrl(): string {
    try {
      const custom = localStorage.getItem(STORAGE_KEYS.CUSTOM_API_URL);
      if (custom && custom.trim().startsWith('http')) {
        return custom.trim().replace(/\/+$/, '');
      }
    } catch {
      // ignore
    }
    return MAIN_SYSTEM_URL.replace(/\/+$/, '');
  },

  /**
   * Updates custom API URL for testing or alternate Cloud Run deployments
   */
  setBaseUrl(url: string): void {
    if (url && url.trim().startsWith('http')) {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_API_URL, url.trim().replace(/\/+$/, ''));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_API_URL);
    }
  },

  /**
   * Fetches the real inventory directly from Cloud Run API
   * Zero hardcoded mock products.
   */
  async getProducts(): Promise<ProductsResponse> {
    const baseUrl = this.getBaseUrl();
    const candidateEndpoints = [
      `${baseUrl}/api/products`,
      `${baseUrl}/api/inventory`,
      `${baseUrl}/api/repuestos`,
      `${baseUrl}/products.json`,
      // Vite dev proxy fallback if configured
      `/api-main/api/products`,
    ];

    let lastError = '';

    for (const endpoint of candidateEndpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(endpoint, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          mode: 'cors',
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          let rawList: any[] = [];

          if (Array.isArray(data)) {
            rawList = data;
          } else if (data && typeof data === 'object') {
            // Check if wrapped in data, products, repuestos, or items
            if (Array.isArray(data.products)) rawList = data.products;
            else if (Array.isArray(data.data)) rawList = data.data;
            else if (Array.isArray(data.repuestos)) rawList = data.repuestos;
            else if (Array.isArray(data.items)) rawList = data.items;
            else if (Array.isArray(data.inventory)) rawList = data.inventory;
          }

          if (Array.isArray(rawList)) {
            // Filter strictly: ONLY published articles with positive stock (> 0) from the other app
            const mappedProducts: Product[] = rawList
              .map((item) => normalizeProduct(item, baseUrl))
              .filter((product) => product.stock > 0 && product.isPublished !== false);

            // Persist verified real products in local cache for offline resilience
            try {
              localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(mappedProducts));
              localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
            } catch {
              // ignore
            }

            return {
              products: mappedProducts,
              fromRemote: true,
              endpoint,
            };
          }
        } else {
          lastError = `HTTP ${response.status} en ${endpoint}`;
        }
      } catch (err: any) {
        lastError = err?.message || 'Error de red o CORS al conectar con la API';
      }
    }

    // If remote API is currently unavailable or returning 404, check if there's any previously synced real products
    let cachedRealProducts: Product[] = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (stored) {
        const parsed: Product[] = JSON.parse(stored);
        cachedRealProducts = parsed.filter((p) => p.stock > 0 && p.isPublished !== false);
      }
    } catch {
      cachedRealProducts = [];
    }

    return {
      products: cachedRealProducts,
      fromRemote: false,
      endpoint: candidateEndpoints[0],
      error: lastError || 'No se pudo conectar a la API del sistema central en Cloud Run.',
    };
  },

  /**
   * Fetches official BCV rate: first checks central system API, then live Venezuelan official rate
   */
  async getBcvRate(): Promise<ExchangeRateInfo> {
    const baseUrl = this.getBaseUrl();

    // 1. Try fetching rate from main Cloud Run system
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${baseUrl}/api/bcv`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const rate = Number(data.rate || data.tasa || data.precio || data.bcv);
        if (rate && rate > 0) {
          const rateInfo: ExchangeRateInfo = {
            rateBcv: rate,
            lastUpdated: new Date().toISOString(),
            source: 'Sistema Central Servimotos CC',
            isCustom: false,
          };
          localStorage.setItem(STORAGE_KEYS.BCV_RATE, JSON.stringify(rateInfo));
          return rateInfo;
        }
      }
    } catch {
      // ignore and proceed to live BCV providers
    }

    // 2. Fetch from official public Venezuelan BCV rate API (DolarApi)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const rate = Number(data.promedio || data.precio || 52.85);
        const rateInfo: ExchangeRateInfo = {
          rateBcv: rate,
          lastUpdated: new Date().toISOString(),
          source: 'Banco Central de Venezuela (BCV Oficial en Vivo)',
          isCustom: false,
        };
        localStorage.setItem(STORAGE_KEYS.BCV_RATE, JSON.stringify(rateInfo));
        return rateInfo;
      }
    } catch {
      // 3. Secondary provider
      try {
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 2500);
        const res2 = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar?page=bcv', {
          signal: controller2.signal,
        });
        clearTimeout(timeoutId2);

        if (res2.ok) {
          const data2 = await res2.json();
          const rate = Number(data2.monitors?.usd?.price || 52.85);
          const rateInfo: ExchangeRateInfo = {
            rateBcv: rate,
            lastUpdated: new Date().toISOString(),
            source: 'BCV Oficial (PyDolar en Vivo)',
            isCustom: false,
          };
          localStorage.setItem(STORAGE_KEYS.BCV_RATE, JSON.stringify(rateInfo));
          return rateInfo;
        }
      } catch {
        // fallback
      }
    }

    // 4. Return cached rate from localStorage if available
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.BCV_RATE);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // ignore
    }

    return {
      rateBcv: 52.85,
      lastUpdated: new Date().toISOString(),
      source: 'Referencial Oficial BCV',
      isCustom: false,
    };
  },

  /**
   * Sets custom BCV rate
   */
  setCustomBcvRate(rate: number): ExchangeRateInfo {
    const rateInfo: ExchangeRateInfo = {
      rateBcv: rate,
      lastUpdated: new Date().toISOString(),
      source: 'Ajustado Manualmente en Taller',
      isCustom: true,
    };
    localStorage.setItem(STORAGE_KEYS.BCV_RATE, JSON.stringify(rateInfo));
    return rateInfo;
  },

  /**
   * Queries workshop orders from the central system
   */
  async searchWorkshopOrder(query: string): Promise<WorkshopOrder[]> {
    const cleanQuery = query.trim().toUpperCase().replace(/[\s-]/g, '');
    if (!cleanQuery) return [];

    const baseUrl = this.getBaseUrl();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${baseUrl}/api/orders?query=${encodeURIComponent(cleanQuery)}`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const remoteData = await res.json();
        if (Array.isArray(remoteData)) {
          return remoteData;
        }
        if (remoteData && Array.isArray(remoteData.orders)) {
          return remoteData.orders;
        }
      }
    } catch {
      // ignore
    }

    // Check cached orders
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.WORKSHOP_ORDERS);
      if (stored) {
        const allOrders: WorkshopOrder[] = JSON.parse(stored);
        return allOrders.filter((order) => {
          const orderPhone = order.clientPhone.replace(/[\s-]/g, '');
          const orderPlate = order.bikePlate.toUpperCase().replace(/[\s-]/g, '');
          const orderNumber = order.orderNumber.toUpperCase().replace(/[\s-]/g, '');
          return (
            orderPhone.includes(cleanQuery) ||
            cleanQuery.includes(orderPhone) ||
            orderPlate.includes(cleanQuery) ||
            orderNumber.includes(cleanQuery)
          );
        });
      }
    } catch {
      // ignore
    }

    return [];
  },

  /**
   * Tests connection to the central Cloud Run system
   */
  async testConnection(): Promise<{ ok: boolean; statusMessage: string; timestamp: string }> {
    const baseUrl = this.getBaseUrl();
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${baseUrl}/api/products`, {
        method: 'GET',
        signal: controller.signal,
      }).catch(() => null);
      clearTimeout(timeoutId);

      const elapsed = Date.now() - start;
      if (res && (res.ok || res.status === 200 || res.status === 304)) {
        return {
          ok: true,
          statusMessage: `Conectado exitosamente a ${baseUrl} (${elapsed}ms).`,
          timestamp: new Date().toLocaleTimeString('es-VE'),
        };
      } else if (res) {
        return {
          ok: false,
          statusMessage: `Respuesta de ${baseUrl}: HTTP ${res.status}.`,
          timestamp: new Date().toLocaleTimeString('es-VE'),
        };
      }
    } catch (e: any) {
      return {
        ok: false,
        statusMessage: `Error al conectar con ${baseUrl}: ${e?.message || 'CORS o servicio no accesible'}`,
        timestamp: new Date().toLocaleTimeString('es-VE'),
      };
    }

    return {
      ok: false,
      statusMessage: `No se obtuvo respuesta de ${baseUrl}.`,
      timestamp: new Date().toLocaleTimeString('es-VE'),
    };
  }
};
