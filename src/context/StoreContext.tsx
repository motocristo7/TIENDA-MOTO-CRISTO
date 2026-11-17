import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  Product,
  CartItem,
  MotoBrand,
  ProductCategory,
  ExchangeRateInfo,
  StoreSettings,
  ClientUser,
} from '../types';
import { ApiService } from '../services/api';
import {
  DEFAULT_STORE_SETTINGS,
  subscribeToProducts,
  subscribeToBusinessSettings,
  logoutClientUser,
} from '../services/firebaseStore';

interface StoreContextType {
  products: Product[];
  isLoading: boolean;
  firestoreError: string | null;
  bcvRateInfo: ExchangeRateInfo;
  refreshBcvRate: () => Promise<void>;
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
  clientUser: ClientUser | null;
  setClientUser: (user: ClientUser | null) => void;
  signOutClient: () => Promise<void>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'mercadomoto_cart_items';
const CLIENT_USER_KEY = 'mercadomoto_client_user';

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  const [bcvRateInfo, setBcvRateInfo] = useState<ExchangeRateInfo>({
    rateBcv: 52.85,
    lastUpdated: new Date().toISOString(),
    source: 'Tasa Oficial BCV',
    isCustom: false,
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [clientUser, setClientUserState] = useState<ClientUser | null>(() => {
    try {
      const saved = localStorage.getItem(CLIENT_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [selectedBrand, setSelectedBrand] = useState<MotoBrand>('Todas');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('Todas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeView, setActiveView] = useState<'catalog' | 'workshop' | 'shipping-payment'>('catalog');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3400);
  }, []);

  const setClientUser = useCallback((user: ClientUser | null) => {
    setClientUserState(user);
    try {
      if (user) {
        localStorage.setItem(CLIENT_USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(CLIENT_USER_KEY);
      }
    } catch {
      // ignore
    }
  }, []);

  const signOutClient = useCallback(async () => {
    await logoutClientUser();
    setClientUser(null);
    showToast('Sesión cerrada.');
  }, [setClientUser, showToast]);

  // Real-time Firestore subscription: products + settings/business
  useEffect(() => {
    let mounted = true;

    const unsubProducts = subscribeToProducts(
      (liveProducts) => {
        if (!mounted) return;
        setProducts(liveProducts);
        setFirestoreError(null);
        setIsLoading(false);
      },
      (err) => {
        if (!mounted) return;
        setFirestoreError(err);
        setIsLoading(false);
      }
    );

    const unsubSettings = subscribeToBusinessSettings(
      async (liveSettings, firestoreBcvRate) => {
        if (!mounted) return;
        setSettings(liveSettings);

        if (firestoreBcvRate && firestoreBcvRate > 0) {
          setBcvRateInfo({
            rateBcv: firestoreBcvRate,
            lastUpdated: new Date().toISOString(),
            source: `${liveSettings.workshopName} (Firestore en vivo)`,
            isCustom: false,
          });
        } else {
          // Fallback to live BCV API if settings/business doesn't specify bcvRate
          const apiRate = await ApiService.getBcvRate();
          if (mounted) {
            setBcvRateInfo(apiRate);
          }
        }
      },
      (err) => {
        console.warn('Settings subscription warning:', err);
      }
    );

    return () => {
      mounted = false;
      unsubProducts();
      unsubSettings();
    };
  }, []);

  // Persist cart
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  const refreshBcvRate = async () => {
    if (settings.bcvRate && settings.bcvRate > 0) {
      setBcvRateInfo({
        rateBcv: settings.bcvRate,
        lastUpdated: new Date().toISOString(),
        source: `${settings.workshopName} (Firestore en vivo)`,
        isCustom: false,
      });
      showToast(`Tasa BCV sincronizada: ${settings.bcvRate.toFixed(2)} Bs./$`);
      return;
    }
    const rate = await ApiService.getBcvRate();
    setBcvRateInfo(rate);
    showToast(`Tasa BCV actualizada: ${rate.rateBcv.toFixed(2)} Bs./$`);
  };

  const addToCart = (product: Product, quantity = 1) => {
    if (product.stock <= 0) {
      showToast('Este repuesto no tiene stock disponible.');
      return;
    }
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
        firestoreError,
        bcvRateInfo,
        refreshBcvRate,
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
        clientUser,
        setClientUser,
        signOutClient,
        isAuthModalOpen,
        setIsAuthModalOpen,
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
