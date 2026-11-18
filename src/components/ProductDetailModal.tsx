import React, { useState } from 'react';
import { X, Check, ShieldCheck, ShoppingBag, Truck, Zap } from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { formatDualPrice } from '../utils/formatters';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  const { bcvRateInfo, addToCart, buyNow, settings } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const price = formatDualPrice(product.priceUsd, bcvRateInfo.rateBcv);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleBuyNow = () => {
    buyNow(product, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl my-4">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 p-1.5 rounded-full bg-neutral-950/80 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Product Media */}
          <div className="relative bg-neutral-950 p-4 sm:p-6 flex items-center justify-center border-b md:border-b-0 md:border-r border-neutral-800">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="max-h-52 sm:max-h-72 w-full object-contain rounded-lg"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = `data:image/svg+xml;utf8,${encodeURIComponent(
                  '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>'
                )}`;
              }}
            />
          </div>

          {/* Product Info & Action */}
          <div className="p-4 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-400 font-medium">
                <span className="text-amber-400 font-semibold">{product.brand}</span>
                <span aria-hidden="true">·</span>
                <span>{product.category}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">SKU: {product.sku || product.code}</span>
              </div>

              <h2 className="mt-1.5 text-lg sm:text-xl font-bold text-white text-balance leading-snug">
                {product.name}
              </h2>

              <div className="mt-3 p-3 bg-neutral-950 rounded-xl border border-neutral-800/80">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xl sm:text-2xl font-mono tabular-nums font-bold text-amber-400">
                    {price.usd}
                  </span>
                  <span className="text-xs sm:text-sm font-mono tabular-nums text-neutral-300">
                    {price.bs}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500 mt-0.5 block">
                  Tasa oficial BCV: {bcvRateInfo.rateBcv.toFixed(2)} Bs./$
                </span>
              </div>

              {product.compatibleModels.length > 0 && (
                <div className="mt-3">
                  <span className="text-[11px] font-semibold text-neutral-300 block mb-1">
                    Compatibilidad:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {product.compatibleModels.map((model, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] text-neutral-300 bg-neutral-800/90 px-2 py-0.5 rounded"
                      >
                        {model}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {product.description && (
                <p className="mt-3 text-xs text-neutral-400 leading-relaxed">
                  {product.description}
                </p>
              )}

              {product.barcode && (
                <p className="mt-1.5 text-[10px] font-mono text-neutral-500">
                  Cód. Barras: {product.barcode}
                </p>
              )}
            </div>

            {/* Purchase Controls */}
            <div className="mt-5 pt-3 border-t border-neutral-800">
              <div className="flex items-center justify-between mb-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400 text-[11px]">Cantidad:</span>
                  <div className="flex items-center border border-neutral-700 bg-neutral-950 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-2.5 py-1 text-neutral-300 hover:text-white cursor-pointer font-bold"
                    >
                      -
                    </button>
                    <span className="px-2 text-xs font-mono font-semibold text-white">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="px-2.5 py-1 text-neutral-300 hover:text-white cursor-pointer font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
                <span className="font-medium text-emerald-400 text-[11px]">
                  {product.stock} en stock
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer border ${
                    added
                      ? 'bg-emerald-500 text-neutral-950 border-emerald-500'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700'
                  }`}
                >
                  {added ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Listo</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Al carrito</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={product.stock <= 0}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg font-bold text-xs bg-amber-400 hover:bg-amber-300 text-neutral-950 transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>Comprar</span>
                </button>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[10px] text-neutral-400">
                <span className="flex items-center gap-1">
                  <Truck className="w-3 h-3 text-amber-500" />
                  Delivery Mérida / MRW / Zoom / Tealca
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-500" />
                  {settings.workshopName}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
