import React, { useState, useMemo } from 'react';
import { ShoppingBag, Eye, Check, Search, Filter, RefreshCw, AlertCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product, ProductCategory, MotoBrand } from '../types';
import { formatDualPrice } from '../utils/formatters';
import { ProductDetailModal } from './ProductDetailModal';

const CATEGORIES: ProductCategory[] = [
  'Todas',
  'Motor y Transmisión',
  'Frenos y Suspensión',
  'Eléctrico e Iluminación',
  'Cauchos y Rines',
  'Lubricantes y Fluidos',
  'Accesorios y Cascos',
];

const BRANDS: MotoBrand[] = [
  'Todas',
  'Empire Keeway',
  'Bera',
  'Motos Toro',
  'Suzuki',
  'Yamaha',
  'MD Haojin',
  'Ava',
  'Multimarca',
];

type SortOption = 'relevance' | 'price-low' | 'price-high' | 'name-asc';

export const Catalog: React.FC = () => {
  const {
    products,
    isLoading,
    bcvRateInfo,
    addToCart,
    selectedBrand,
    setSelectedBrand,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    selectedProduct,
    setSelectedProduct,
    syncInfo,
    triggerSync,
  } = useStore();

  const [sortOption, setSortOption] = useState<SortOption>('relevance');
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Brand filter
        if (selectedBrand !== 'Todas' && p.brand !== selectedBrand && p.brand !== 'Multimarca') {
          // Check if brand is in compatible models
          const matchesCompatible = p.compatibleModels.some((m) =>
            m.toLowerCase().includes(selectedBrand.toLowerCase())
          );
          if (!matchesCompatible) return false;
        }

        // Category filter
        if (selectedCategory !== 'Todas' && p.category !== selectedCategory) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = p.name.toLowerCase().includes(q);
          const matchCode = p.code.toLowerCase().includes(q);
          const matchBrand = p.brand.toLowerCase().includes(q);
          const matchDesc = p.description.toLowerCase().includes(q);
          const matchCompat = p.compatibleModels.some((m) => m.toLowerCase().includes(q));
          if (!matchName && !matchCode && !matchBrand && !matchDesc && !matchCompat) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'price-low') return a.priceUsd - b.priceUsd;
        if (sortOption === 'price-high') return b.priceUsd - a.priceUsd;
        if (sortOption === 'name-asc') return a.name.localeCompare(b.name);
        // Default relevance: featured first
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [products, selectedBrand, selectedCategory, searchQuery, sortOption]);

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addToCart(product, 1);
    setAddedItemIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-500 font-semibold uppercase tracking-wider">
            <span>Inventario Oficial</span>
            <span aria-hidden="true">·</span>
            <span>Servimotos Cristo Centro</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Catálogo de Repuestos & Accesorios
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            {filteredProducts.length} productos disponibles con precios duales en $ USD y Bs. Oficiales.
          </p>
        </div>

        {/* Sync Status & Sort */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={() => triggerSync()}
            disabled={syncInfo.isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-850 text-xs text-neutral-300 transition-colors cursor-pointer"
            title="Sincronizar inventario con el sistema central"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${syncInfo.isSyncing ? 'animate-spin' : ''}`} />
            <span>Sincronizar</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 whitespace-nowrap">Ordenar:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
            >
              <option value="relevance">Destacados</option>
              <option value="price-low">Precio: Menor a Mayor</option>
              <option value="price-high">Precio: Mayor a Menor</option>
              <option value="name-asc">Nombre (A - Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
              selectedCategory === cat
                ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm'
                : 'bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-850 border border-neutral-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Brand Filter Bar */}
      <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2 text-xs">
        <span className="text-neutral-500 font-medium whitespace-nowrap mr-1 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" />
          Marca:
        </span>
        {BRANDS.map((brand) => (
          <button
            key={brand}
            onClick={() => setSelectedBrand(brand)}
            className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer whitespace-nowrap ${
              selectedBrand === brand
                ? 'bg-neutral-200 text-neutral-950 font-bold'
                : 'text-neutral-400 hover:text-white bg-neutral-950 hover:bg-neutral-900 border border-neutral-850'
            }`}
          >
            {brand}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="mt-12 text-center py-20 bg-neutral-900/40 rounded-2xl border border-neutral-850">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-neutral-300 font-medium">Consultando API de Cloud Run en tiempo real...</p>
          <span className="text-[11px] text-neutral-500 font-mono mt-1 block truncate max-w-md mx-auto">
            {syncInfo.endpoint}
          </span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="mt-12 text-center py-16 bg-neutral-900/50 rounded-2xl border border-neutral-850 px-6 max-w-2xl mx-auto space-y-4">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-white">
              {products.length === 0 ? 'Sin repuestos en la base de datos remota' : 'No encontramos repuestos con los filtros aplicados'}
            </h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto leading-relaxed">
              {products.length === 0
                ? 'El catálogo está configurado para consumir en vivo la API de tu app en Cloud Run sin datos de prueba inventados.'
                : 'Prueba cambiando de marca o categoría o borrando el término de búsqueda.'}
            </p>
          </div>

          {/* Real API Status Diagnostic Box */}
          <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 text-left text-xs space-y-1.5 font-mono">
            <div className="flex items-center justify-between text-neutral-400">
              <span>Endpoint principal:</span>
              <span className="text-amber-400 truncate max-w-[280px]">{syncInfo.endpoint}</span>
            </div>
            <div className="flex items-center justify-between text-neutral-400">
              <span>Estado de conexión:</span>
              <span className={syncInfo.isRemote ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                {syncInfo.isRemote ? '200 OK (En Línea)' : (syncInfo.error || 'Esperando respuesta')}
              </span>
            </div>
            <div className="flex items-center justify-between text-neutral-500 text-[11px]">
              <span>Última comprobación:</span>
              <span>{syncInfo.lastSyncTime}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => triggerSync()}
              disabled={syncInfo.isSyncing}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncInfo.isSyncing ? 'animate-spin' : ''}`} />
              <span>Reintentar Conexión API</span>
            </button>

            {(selectedBrand !== 'Todas' || selectedCategory !== 'Todas' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedBrand('Todas');
                  setSelectedCategory('Todas');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const price = formatDualPrice(product.priceUsd, bcvRateInfo.rateBcv);
            const isAdded = addedItemIds[product.id];

            return (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="group flex flex-col justify-between bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl cursor-pointer"
              >
                {/* Image Container */}
                <div className="relative aspect-[4/3] bg-neutral-950 p-4 flex items-center justify-center overflow-hidden">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 24 24" fill="none" stroke="%23f59e0b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`;
                    }}
                  />
                  {product.isOriginal && (
                    <span className="absolute top-2.5 left-2.5 text-[10px] font-bold tracking-wider text-amber-400 uppercase bg-neutral-900/90 border border-amber-500/30 px-1.5 py-0.5 rounded">
                      Original
                    </span>
                  )}
                  <span className="absolute bottom-2.5 right-2.5 text-[10px] font-mono text-neutral-400 bg-neutral-900/90 px-1.5 py-0.5 rounded border border-neutral-800">
                    {product.code}
                  </span>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Unboxed Metadata Line */}
                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-medium">
                      <span className="text-amber-400 font-semibold">{product.brand}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{product.category}</span>
                    </div>

                    {/* Product Name */}
                    <h3 className="mt-1 text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                      {product.name}
                    </h3>

                    {/* Compatible Models Snippet */}
                    <p className="mt-1.5 text-[11px] text-neutral-400 line-clamp-1">
                      <span className="text-neutral-500 font-medium">Aplica a:</span>{' '}
                      {product.compatibleModels.slice(0, 2).join(', ')}
                      {product.compatibleModels.length > 2 ? '...' : ''}
                    </p>
                  </div>

                  {/* Price & Action Row */}
                  <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-end justify-between gap-2">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-mono tabular-nums font-extrabold text-amber-400">
                          {price.usd}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono tabular-nums text-neutral-300 block">
                        {price.bs}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(product);
                        }}
                        className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                        title="Ver detalles completos y compatibilidad"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => handleQuickAdd(e, product)}
                        className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isAdded
                            ? 'bg-emerald-500 text-neutral-950'
                            : 'bg-amber-400 hover:bg-amber-300 text-neutral-950'
                        }`}
                        title="Añadir 1 unidad al carrito"
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Listo</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Agregar</span>
                          </>
                        )}
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
