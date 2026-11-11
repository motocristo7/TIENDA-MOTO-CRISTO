import React, { useState } from 'react';
import { ShoppingBag, RefreshCw, Wrench, ShieldCheck, ChevronDown } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatBs } from '../utils/formatters';

export const Navbar: React.FC = () => {
  const {
    cartCount,
    setIsCartOpen,
    bcvRateInfo,
    refreshBcvRate,
    updateBcvRateManual,
    activeView,
    setActiveView,
    syncInfo,
  } = useStore();

  const [showRateModal, setShowRateModal] = useState(false);
  const [customRateInput, setCustomRateInput] = useState('');

  const handleRateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customRateInput);
    if (!isNaN(val) && val > 0) {
      updateBcvRateManual(val);
      setShowRateModal(false);
      setCustomRateInput('');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-950/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 lg:px-8 h-16">
          {/* Zone 1: Single text wordmark */}
          <button
            onClick={() => setActiveView('catalog')}
            className="flex items-center gap-2 text-left group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold text-lg group-hover:border-amber-400 group-hover:bg-amber-500/20 transition-all">
              CC
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap group-hover:text-amber-400 transition-colors">
                Mercado Moto CC
              </span>
              <span className="text-[10px] text-neutral-400 tracking-wider uppercase font-medium">
                Servimotos Cristo Centro
              </span>
            </div>
          </button>

          {/* Zone 2: Clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-neutral-300">
            <button
              onClick={() => setActiveView('catalog')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeView === 'catalog' ? 'text-amber-400 font-semibold' : ''
              }`}
            >
              Catálogo de Repuestos
            </button>
            <button
              onClick={() => setActiveView('workshop')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeView === 'workshop' ? 'text-amber-400 font-semibold' : ''
              }`}
            >
              <Wrench className="w-4 h-4 text-amber-500" />
              <span>Consultar Moto en Taller</span>
            </button>
            <button
              onClick={() => setActiveView('shipping-payment')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeView === 'shipping-payment' ? 'text-amber-400 font-semibold' : ''
              }`}
            >
              Envíos & Pagos
            </button>
          </nav>

          {/* Zone 3: 1 primary action cluster */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Live BCV Rate Indicator */}
            <button
              onClick={() => setShowRateModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-850 hover:border-neutral-700 text-xs text-neutral-300 transition-colors cursor-pointer"
              title="Haz clic para ver o ajustar la tasa de cambio oficial BCV"
            >
              <span className="text-[11px] text-neutral-400 font-medium">BCV:</span>
              <span className="font-mono tabular-nums font-semibold text-amber-400">
                {bcvRateInfo.rateBcv.toFixed(2)} Bs.
              </span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all shadow-sm cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Carrito</span>
              {cartCount > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1 text-[11px] font-bold text-white bg-neutral-950 rounded-full">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* BCV Rate Modal */}
      {showRateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-white">Tasa Oficial BCV</h3>
              </div>
              <button
                onClick={() => setShowRateModal(false)}
                className="text-neutral-400 hover:text-white text-sm cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="bg-neutral-950 p-3.5 rounded-lg border border-neutral-800/80">
                <span className="text-xs text-neutral-400 block">Tasa aplicada actual</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-mono tabular-nums font-bold text-amber-400">
                    {bcvRateInfo.rateBcv.toFixed(2)}
                  </span>
                  <span className="text-sm text-neutral-400">Bs. por cada 1 USD</span>
                </div>
                <div className="mt-2 text-[11px] text-neutral-400 space-y-0.5">
                  <p>• Fuente: {bcvRateInfo.source}</p>
                  <p>
                    • Ejemplo: $10.00 = {formatBs(10 * bcvRateInfo.rateBcv)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-neutral-400">
                  {syncInfo.isRemote ? 'Sincronizado con sistema central' : 'Actualización automática'}
                </span>
                <button
                  onClick={async () => {
                    await refreshBcvRate();
                  }}
                  className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Actualizar en vivo
                </button>
              </div>

              {/* Custom rate override for workshop admin */}
              <form onSubmit={handleRateSubmit} className="pt-3 border-t border-neutral-800">
                <label className="text-xs text-neutral-300 block mb-1 font-medium">
                  Ajustar tasa manual si el BCV emitió nuevo cierre:
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ej. 53.20"
                    value={customRateInput}
                    onChange={(e) => setCustomRateInput(e.target.value)}
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Fijar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
