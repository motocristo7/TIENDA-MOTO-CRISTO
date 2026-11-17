import React, { useState, useMemo } from 'react';
import { ShoppingBag, Eye, Check, Filter, RefreshCw, AlertCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product, ProductCategory, MotoBrand } from '../types';
import { formatDualPrice } from '../utils/formatters';
import { ProductDetailModal } from './ProductDetailModal';

const DEFAULT_BRANDS: MotoBrand[] = [
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

type SortOption = 'name-asc' | 'featured' | 'price-low' | 'price-high';

export const Catalog: React.FC = () => {
  const {
    products,
    isLoading,
    firestoreError,
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
    settings,
  } = useStore();

  const [sortOption, setSortOption] = useState<SortOption>('name-asc');
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

  // Derive categories dynamically from live Firestore inventory
  const availableCategories = useMemo<ProductCategory[]>(() => {
    const set = new Set<string>(['Todas']);
    products.forEach((p) => {
      if (p.category && p.category.trim()) {
        set.add(p.category.trim());
      }
    });
    return Array.from(set);
  }, [products]);

  // Merge Venezuelan moto brands with any additional brands found in Firestore
  const availableBrands = useMemo<MotoBrand[]>(() => {
    const set = new Set<string>(DEFAULT_BRANDS);
    products.forEach((p) => {
      if (p.brand && p.brand.trim()) {
        set.add(p.brand.trim());
      }
    });
    return Array.from(set);
  }, [products]);

  // Filter and sort products (stock > 0 enforced, alphabetical A-Z default)
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (p.stock <= 0 || p.isPublished === false) {
          return false;
        }

        // Brand filter (matches brand, Multimarca, or compatibility)
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

        // Category filter
        if (selectedCategory !== 'Todas') {
          if (p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
            return false;
          }
        }

        // Search query (name, sku, barcode, brand, compatibility, description)
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
    }, 1500);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-500 font-semibold uppercase tracking-wider">
            <span>Inventario en Tiempo Real</span>
            <span aria-hidden="true">·</span>
            <span>{settings.workshopName}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Catálogo de Repuestos & Accesorios
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            {filteredProducts.length} repuestos disponibles en stock listos para entrega o envío nacional.
          </p>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs text-neutral-400 whitespace-nowrap">Ordenar:</span>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
          >
            <option value="name-asc">Alfabético (A - Z)</option>
            <option value="featured">Destacados primero</option>
            <option value="price-low">Precio: Menor a Mayor</option>
            <option value="price-high">Precio: Mayor a Menor</option>
          </select>
        </div>
      </div>

      {/* Category Tabs */}
      {availableCategories.length > 1 && (
        <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {availableCategories.map((cat) => (
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
      )}

      {/* Brand Filter Bar */}
      <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2 text-xs">
        <span className="text-neutral-500 font-medium whitespace-nowrap mr-1 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" />
          Marca:
        </span>
        {availableBrands.map((brand) => (
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
          <p className="text-sm text-neutral-300 font-medium">
            Cargando catálogo en tiempo real desde {settings.workshopName}...
          </p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="mt-12 text-center py-16 bg-neutral-900/50 rounded-2xl border border-neutral-800 px-6 max-w-xl mx-auto space-y-4">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          {products.length === 0 ? (
            <div>
              <h3 className="text-base font-bold text-white">
                {firestoreError
                  ? 'No se pudo conectar con el inventario en este momento'
                  : 'Actualmente no hay repuestos con stock disponible'}
              </h3>
              <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                {firestoreError
                  ? 'Verifica tu conexión a internet o consulta directamente por nuestro WhatsApp oficial.'
                  : 'Tan pronto ingresen repuestos al inventario con stock positivo, aparecerán aquí automáticamente.'}
              </p>
            </div>
          ) : (
            <>
              <div>
                <h3 className="text-base font-bold text-white">
                  No encontramos repuestos que coincidan con los filtros
                </h3>
                <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                  Prueba seleccionando "Todas" en marcas y categorías o limpiando el texto del buscador.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                <button
                  onClick={() => {
                    setSelectedBrand('Todas');
                    setSelectedCategory('Todas');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Ver todos los repuestos disponibles
                </button>
              </div>
            </>
          )}
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
                      (e.currentTarget as HTMLImageElement).src = `data:image/svg+xml;utf8,${encodeURIComponent(
                        '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>'
                      )}`;
                    }}
                  />
                  {product.featured && (
                    <span className="absolute top-2.5 left-2.5 text-[10px] font-bold tracking-wider text-amber-400 uppercase bg-neutral-900/90 border border-amber-500/30 px-1.5 py-0.5 rounded">
                      Destacado
                    </span>
                  )}
                  <span className="absolute bottom-2.5 right-2.5 text-[10px] font-mono text-neutral-400 bg-neutral-900/90 px-1.5 py-0.5 rounded border border-neutral-800">
                    {product.sku || product.code}
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

                    {/* Compatibility Snippet */}
                    <p className="mt-1.5 text-[11px] text-neutral-400 line-clamp-1">
                      <span className="text-neutral-500 font-medium">Aplica a:</span>{' '}
                      {product.compatibility || product.compatibleModels.join(', ')}
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
                      <span className="text-[10px] text-emerald-400/90 block mt-0.5">
                        Disp: {product.stock} und.
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
