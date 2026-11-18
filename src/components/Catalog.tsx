import React, { useState, useMemo } from 'react';
import { ShoppingBag, Check, RefreshCw, AlertCircle, Zap } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product, ProductCategory } from '../types';
import { formatDualPrice } from '../utils/formatters';
import { ProductDetailModal } from './ProductDetailModal';

type SortOption = 'name-asc' | 'featured' | 'price-low' | 'price-high';

export const Catalog: React.FC = () => {
  const {
    products,
    isLoading,
    firestoreError,
    bcvRateInfo,
    addToCart,
    buyNow,
    selectedBrand,
    setSelectedBrand,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    selectedProduct,
    setSelectedProduct,
    settings,
  } = useStore();

  const [sortOption, setSortOption] = useState<SortOption>('name-asc');
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

  // Derive categories dynamically from live Firestore inventory & customCategories
  const availableCategories = useMemo<ProductCategory[]>(() => {
    const set = new Set<string>(['Todas']);
    if (Array.isArray(settings.customCategories)) {
      settings.customCategories.forEach((c) => {
        if (c && c.trim()) set.add(c.trim());
      });
    }
    products.forEach((p) => {
      if (p.category && p.category.trim()) {
        set.add(p.category.trim());
      }
    });
    return Array.from(set);
  }, [products, settings.customCategories]);

  // Filter and sort products (stock > 0 enforced, alphabetical A-Z default)
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (p.stock <= 0 || p.isPublished === false) {
          return false;
        }

        if (selectedBrand !== 'Todas') {
          const targetBrand = selectedBrand.toLowerCase();
          const prodBrand = p.brand.toLowerCase();
          const matchesBrand =
            prodBrand === targetBrand ||
            prodBrand.includes(targetBrand) ||
            prodBrand === 'multimarca' ||
            prodBrand === 'universal';
          const matchesCompat =
            p.compatibility.toLowerCase().includes(targetBrand) ||
            p.compatibleModels.some((m) => m.toLowerCase().includes(targetBrand));

          if (!matchesBrand && !matchesCompat) {
            return false;
          }
        }

        if (selectedCategory !== 'Todas') {
          if (p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
            return false;
          }
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = p.name.toLowerCase().includes(q);
          const matchSku = (p.sku || p.code).toLowerCase().includes(q);
          const matchBarcode = (p.barcode || '').toLowerCase().includes(q);
          const matchBrand = p.brand.toLowerCase().includes(q);
          const matchDesc = p.description.toLowerCase().includes(q);
          const matchCompat =
            p.compatibility.toLowerCase().includes(q) ||
            p.compatibleModels.some((m) => m.toLowerCase().includes(q));
          if (!matchName && !matchSku && !matchBarcode && !matchBrand && !matchDesc && !matchCompat) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'price-low') return a.priceUsd - b.priceUsd;
        if (sortOption === 'price-high') return b.priceUsd - a.priceUsd;
        if (sortOption === 'featured') {
          const featDiff = (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
          if (featDiff !== 0) return featDiff;
        }
        return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
      });
  }, [products, selectedBrand, selectedCategory, searchQuery, sortOption]);

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addToCart(product, 1);
    setAddedItemIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1400);
  };

  const handleBuyNow = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    buyNow(product, 1);
  };

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Compact Header & Sort Bar */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div className="min-w-0">
          <h2 className="text-base sm:text-xl font-extrabold text-white truncate">
            Catálogo de Repuestos
          </h2>
          <p className="text-[11px] sm:text-xs text-neutral-400">
            {filteredProducts.length} disponibles en stock
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] text-neutral-400 hidden sm:inline">Ordenar:</span>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1.5 text-[11px] sm:text-xs text-white focus:outline-none focus:border-amber-400"
          >
            <option value="name-asc">Nombre (A - Z)</option>
            <option value="featured">Destacados</option>
            <option value="price-low">Menor Precio</option>
            <option value="price-high">Mayor Precio</option>
          </select>
        </div>
      </div>

      {/* Compact Horizontal Category Strip */}
      {availableCategories.length > 1 && (
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                selectedCategory === cat
                  ? 'bg-amber-400 text-neutral-950 font-bold'
                  : 'bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Product Grid: 2 columns on mobile phones, 3-4 on tablets/desktop */}
      {isLoading ? (
        <div className="mt-8 text-center py-16 bg-neutral-900/40 rounded-xl border border-neutral-850">
          <RefreshCw className="w-7 h-7 text-amber-500 animate-spin mx-auto mb-2.5" />
          <p className="text-xs sm:text-sm text-neutral-300 font-medium">
            Cargando catálogo en tiempo real desde {settings.workshopName}...
          </p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="mt-8 text-center py-12 bg-neutral-900/50 rounded-xl border border-neutral-800 px-5 max-w-lg mx-auto space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          {products.length === 0 ? (
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                {firestoreError
                  ? 'No se pudo conectar con el inventario en este momento'
                  : 'Actualmente no hay repuestos con stock disponible'}
              </h3>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                {firestoreError
                  ? 'Verifica tu conexión a internet o consulta directamente por nuestro WhatsApp oficial.'
                  : 'Tan pronto ingresen repuestos al inventario con stock positivo, aparecerán aquí automáticamente.'}
              </p>
            </div>
          ) : (
            <>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  No encontramos repuestos con esos filtros
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Prueba limpiando los filtros o el texto de búsqueda.
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedBrand('Todas');
                  setSelectedCategory('Todas');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Ver todos los repuestos
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="mt-3 sm:mt-4 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {filteredProducts.map((product) => {
            const price = formatDualPrice(product.priceUsd, bcvRateInfo.rateBcv);
            const isAdded = addedItemIds[product.id];

            return (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="group flex flex-col justify-between bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl overflow-hidden transition-all duration-150 hover:shadow-lg cursor-pointer"
              >
                {/* Compact Image Container */}
                <div className="relative aspect-square sm:aspect-[4/3] bg-neutral-950 p-2 sm:p-3 flex items-center justify-center overflow-hidden">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = `data:image/svg+xml;utf8,${encodeURIComponent(
                        '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>'
                      )}`;
                    }}
                  />
                  <span className="absolute bottom-1.5 right-1.5 text-[9px] sm:text-[10px] font-mono text-neutral-400 bg-neutral-900/90 px-1.5 py-0.5 rounded border border-neutral-800 max-w-[75%] truncate">
                    {product.sku || product.code}
                  </span>
                </div>

                {/* Compact Card Body */}
                <div className="p-2.5 sm:p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-neutral-400 font-medium truncate">
                      <span className="text-amber-400 font-semibold shrink-0">{product.brand}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{product.category}</span>
                    </div>

                    <h3 className="mt-0.5 text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug min-h-[2.1rem] sm:min-h-[2.5rem]">
                      {product.name}
                    </h3>

                    {product.compatibility && (
                      <p className="mt-1 text-[10px] sm:text-[11px] text-neutral-400 line-clamp-1">
                        {product.compatibility}
                      </p>
                    )}
                  </div>

                  {/* Dual Price + Stock + 2 Action Buttons */}
                  <div className="mt-2 pt-2 border-t border-neutral-800/80">
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="text-sm sm:text-base font-mono tabular-nums font-extrabold text-amber-400">
                        {price.usd}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-medium tabular-nums">
                        Stock: {product.stock}
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-mono tabular-nums text-neutral-300 block truncate">
                      {price.bs}
                    </span>

                    {/* Two Clear Action Buttons: "Al carrito" & "Comprar" */}
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      <button
                        onClick={(e) => handleQuickAdd(e, product)}
                        className={`flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap border ${
                          isAdded
                            ? 'bg-emerald-500 text-neutral-950 border-emerald-500'
                            : 'bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700'
                        }`}
                        title="Añadir 1 unidad al carrito"
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3 h-3 shrink-0" />
                            <span>Listo</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3 h-3 shrink-0" />
                            <span>Al carrito</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={(e) => handleBuyNow(e, product)}
                        className="flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-[11px] font-bold bg-amber-400 hover:bg-amber-300 text-neutral-950 transition-colors cursor-pointer whitespace-nowrap"
                        title="Comprar ahora"
                      >
                        <Zap className="w-3 h-3 shrink-0" />
                        <span>Comprar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </section>
  );
};
