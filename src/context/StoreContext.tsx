import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Product, CartItem, MotoBrand, ProductCategory, ExchangeRateInfo, StoreSettings } from '../types';
import { ApiService, DEFAULT_STORE_SETTINGS } from '../services/api';

interface StoreContextType {
  products: Product[];
  isLoading: boolean;
  bcvRateInfo: ExchangeRateInfo;
  refreshBcvRate: () => Promise<void>;
  updateBcvRateManual: (rate: number) => void;
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotalUsd: number;
  cartTotalBs: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  selectedBrand: MotoBrand;
  setSelectedBrand: (brand: MotoBrand) => void;
  selectedCategory: ProductCategory;
  setSelectedCategory: (cat: ProductCategory) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedProduct: Product | null;
  setSelectedProduct: (p: Product | null) => void;
  activeView: 'catalog' | 'workshop' | 'shipping-payment';
  setActiveView: (view: 'catalog' | 'workshop' | 'shipping-payment') => void;
  settings: StoreSettings;
  syncInfo: {
    lastSyncTime: string;
    isSyncing: boolean;
    isRemote: boolean;
    endpoint: string;
    error?: string;
  };
  triggerSync: () => Promise<void>;
  customApiUrl: string;
  setCustomApiUrl: (url: string) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'mercadomoto_cart_items';

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [bcvRateInfo, setBcvRateInfo] = useState<ExchangeRateInfo>({
    rateBcv: 52.85,
    lastUpdated: new Date().toISOString(),
    source: 'Oficial BCV',
    isCustom: false,
  });

  // Cart state persisted to localStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [selectedBrand, setSelectedBrand] = useState<MotoBrand>('Todas');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('Todas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeView, setActiveView] = useState<'catalog' | 'workshop' | 'shipping-payment'>('catalog');
  const [settings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  const [customApiUrl, setCustomApiUrlState] = useState<string>(() => ApiService.getBaseUrl());
  const [syncInfo, setSyncInfo] = useState({
    lastSyncTime: 'Iniciando...',
    isSyncing: true,
    isRemote: false,
    endpoint: ApiService.getBaseUrl(),
    error: undefined as string | undefined,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3200);
  }, []);

  const setCustomApiUrl = useCallback((url: string) => {
    ApiService.setBaseUrl(url);
    const updated = ApiService.getBaseUrl();
    setCustomApiUrlState(updated);
    showToast(`URL de API actualizada: ${updated}`);
  }, [showToast]);

  // Sync products and rate directly from real API
  const triggerSync = useCallback(async () => {
    setSyncInfo((prev) => ({ ...prev, isSyncing: true }));
    try {
      const [rateRes, prodRes] = await Promise.all([
        ApiService.getBcvRate(),
        ApiService.getProducts(),
      ]);

      setBcvRateInfo(rateRes);
      setProducts(prodRes.products);
      setSyncInfo({
        lastSyncTime: new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        isSyncing: false,
        isRemote: prodRes.fromRemote,
        endpoint: prodRes.endpoint,
        error: prodRes.error,
      });

      if (prodRes.fromRemote) {
        showToast(`Catálogo sincronizado: ${prodRes.products.length} repuestos cargados desde Cloud Run.`);
      }
    } catch (err: any) {
      setSyncInfo((prev) => ({
        ...prev,
        isSyncing: false,
        error: err?.message || 'Error de sincronización con la API central',
      }));
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Initial load
  useEffect(() => {
    triggerSync();

    // Auto-sync every 25 seconds
    const interval = setInterval(() => {
      triggerSync();
    }, 25000);

    return () => clearInterval(interval);
  }, [triggerSync]);

  // Persist cart
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // storage error
    }
  }, [cart]);

  const refreshBcvRate = async () => {
    const rate = await ApiService.getBcvRate();
    setBcvRateInfo(rate);
    showToast(`Tasa BCV actualizada: ${rate.rateBcv.toFixed(2)} Bs./$`);
  };

  const updateBcvRateManual = (customRate: number) => {
    if (customRate > 0) {
      const updated = ApiService.setCustomBcvRate(customRate);
      setBcvRateInfo(updated);
      showToast(`Tasa BCV personalizada establecida: ${customRate.toFixed(2)} Bs./$`);
    }
  };

  const addToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, product.stock);
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      return [...prev, { product, quantity: Math.min(quantity, product.stock) }];
    });
    showToast(`Añadido al carrito: ${product.name}`);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const validQty = Math.min(quantity, item.product.stock);
          return { ...item, quantity: validQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotalUsd = cart.reduce((acc, item) => acc + item.product.priceUsd * item.quantity, 0);
  const cartTotalBs = cartTotalUsd * bcvRateInfo.rateBcv;

  return (
    <StoreContext.Provider
      value={{
        products,
        isLoading,
        bcvRateInfo,
        refreshBcvRate,
        updateBcvRateManual,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotalUsd,
        cartTotalBs,
        isCartOpen,
        setIsCartOpen,
        selectedBrand,
        setSelectedBrand,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        selectedProduct,
        setSelectedProduct,
        activeView,
        setActiveView,
        settings,
        syncInfo,
        triggerSync,
        customApiUrl,
        setCustomApiUrl,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
