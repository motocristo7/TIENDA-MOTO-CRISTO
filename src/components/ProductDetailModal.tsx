import React, { useState } from 'react';
import { X, Check, ShieldCheck, ShoppingBag, Truck, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { formatDualPrice } from '../utils/formatters';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  const { bcvRateInfo, addToCart } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const price = formatDualPrice(product.priceUsd, bcvRateInfo.rateBcv);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 p-2 rounded-full bg-neutral-950/70 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Product Media */}
          <div className="relative bg-neutral-950 p-6 flex items-center justify-center border-b md:border-b-0 md:border-r border-neutral-800">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="max-h-72 w-full object-contain rounded-lg"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 24 24" fill="none" stroke="%23f59e0b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`;
              }}
            />
            {product.isOriginal && (
              <span className="absolute top-4 left-4 text-[11px] font-semibold tracking-wider text-amber-400 uppercase bg-neutral-900/90 border border-amber-500/30 px-2 py-0.5 rounded">
                Repuesto Original
              </span>
            )}
          </div>

          {/* Product Info & Action */}
          <div className="p-6 flex flex-col justify-between">
            <div>
              {/* Unboxed Metadata */}
              <div className="flex items-center gap-2 text-xs text-neutral-400 font-medium">
                <span>{product.brand}</span>
                <span aria-hidden="true">·</span>
                <span>{product.category}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{product.code}</span>
              </div>

              <h2 className="mt-2 text-xl font-bold text-white text-balance leading-snug">
                {product.name}
              </h2>

              {/* Dual Price Block */}
              <div className="mt-4 p-3 bg-neutral-950 rounded-xl border border-neutral-800/80">
                <span className="text-[11px] text-neutral-400 uppercase tracking-wider block font-medium">
                  Precio al detal
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-mono tabular-nums font-bold text-amber-400">
                    {price.usd}
                  </span>
                  <span className="text-sm font-mono tabular-nums text-neutral-300">
                    {price.bs}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500 mt-0.5 block">
                  Tasa oficial BCV: {bcvRateInfo.rateBcv.toFixed(2)} Bs./$
                </span>
              </div>

              {/* Compatibility */}
              <div className="mt-4">
                <span className="text-xs font-semibold text-neutral-300 block mb-1">
                  Modelos de motos compatibles:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {product.compatibleModels.map((model, idx) => (
                    <span
                      key={idx}
                      className="text-xs text-neutral-300 bg-neutral-800/90 px-2.5 py-1 rounded"
                    >
                      {model}
                    </span>
                  ))}
                </div>
              </div>

              {/* Description */}
              <p className="mt-4 text-xs text-neutral-400 leading-relaxed">
                {product.description}
              </p>

              {/* Technical Specs */}
              {product.specs && Object.keys(product.specs).length > 0 && (
                <div className="mt-4 pt-3 border-t border-neutral-800 text-xs space-y-1.5">
                  <span className="font-semibold text-neutral-300 block mb-1">
                    Ficha Técnica:
                  </span>
                  {Object.entries(product.specs).map(([key, val]) => (
                    <div key={key} className="flex justify-between text-neutral-400">
                      <span>{key}:</span>
                      <span className="font-medium text-neutral-200 text-right">{val}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Purchase Controls */}
            <div className="mt-6 pt-4 border-t border-neutral-800">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="text-neutral-400">Disponibilidad:</span>
                <span className="font-medium text-emerald-400">
                  {product.stock} unidades en stock
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Quantity Stepper */}
                <div className="flex items-center border border-neutral-700 bg-neutral-950 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-neutral-300 hover:text-white cursor-pointer font-bold"
                  >
                    -
                  </button>
                  <span className="px-2 text-sm font-mono font-semibold text-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-3 py-2 text-neutral-300 hover:text-white cursor-pointer font-bold"
                  >
                    +
                  </button>
                </div>

                {/* Add Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                    added
                      ? 'bg-emerald-500 text-neutral-950'
                      : 'bg-amber-400 hover:bg-amber-300 text-neutral-950'
                  }`}
                >
                  {added ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>¡Agregado al Carrito!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Añadir al Carrito</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-400">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-amber-500" />
                  MRW / Zoom / Tealca / Taller
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  Garantía Servimotos CC
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
