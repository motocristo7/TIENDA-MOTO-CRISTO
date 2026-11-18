import React, { useState } from 'react';
import { ShoppingBag, RefreshCw, Wrench, ShieldCheck, ChevronDown, User } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatBs } from '../utils/formatters';
import { ClientAuthModal } from './ClientAuthModal';

export const Navbar: React.FC = () => {
  const {
    cartCount,
    setIsCartOpen,
    setCartStep,
    bcvRateInfo,
    refreshBcvRate,
    activeView,
    setActiveView,
    settings,
    clientUser,
    isAuthModalOpen,
    setIsAuthModalOpen,
  } = useStore();

  const [showRateModal, setShowRateModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-950/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-6 px-3 sm:px-6 lg:px-8 h-14">
          {/* Zone 1: Brand wordmark */}
          <button
            onClick={() => setActiveView('catalog')}
            className="flex items-center gap-2 text-left group cursor-pointer shrink-0 min-w-0"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold text-sm shrink-0 group-hover:border-amber-400 group-hover:bg-amber-500/20 transition-all">
              CC
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm sm:text-base font-bold tracking-tight text-white whitespace-nowrap truncate group-hover:text-amber-400 transition-colors">
                {settings.storeName}
              </span>
              <span className="hidden sm:block text-[10px] text-neutral-400 tracking-wider uppercase font-medium truncate">
                {settings.workshopName}
              </span>
            </div>
          </button>

          {/* Zone 2: Clean single-line text navigation links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-neutral-300">
            <button
              onClick={() => setActiveView('catalog')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeView === 'catalog' ? 'text-amber-400 font-semibold' : ''
              }`}
            >
              Catálogo
            </button>
            <button
              onClick={() => setActiveView('workshop')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeView === 'workshop' ? 'text-amber-400 font-semibold' : ''
              }`}
            >
              <Wrench className="w-3.5 h-3.5 text-amber-500" />
              <span>Mi Moto & Facturas</span>
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

          {/* Zone 3: Compact action cluster */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                clientUser
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                  : 'border-neutral-800 bg-neutral-900/80 hover:border-neutral-700 text-neutral-300 hover:text-white'
              }`}
              title={clientUser ? `Conectado como ${clientUser.name}` : 'Ingresar o registrarse como cliente'}
            >
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline text-[11px] font-medium max-w-[90px] truncate">
                {clientUser ? clientUser.name.split(' ')[0] : 'Cuenta'}
              </span>
            </button>

            <button
              onClick={() => setShowRateModal(true)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900/80 hover:border-neutral-700 text-[11px] text-neutral-300 transition-colors cursor-pointer"
              title="Ver tasa oficial BCV"
            >
              <span className="text-neutral-400 font-medium hidden sm:inline">BCV:</span>
              <span className="font-mono tabular-nums font-semibold text-amber-400">
                {bcvRateInfo.rateBcv.toFixed(2)}
              </span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            <button
              onClick={() => {
                setCartStep('cart');
                setIsCartOpen(true);
              }}
              className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all shadow-sm cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Carrito</span>
              {cartCount > 0 && (
                <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-neutral-950 rounded-full tabular-nums">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Non-sticky Mobile Navigation Strip (keeps sticky header compact <= 56px) */}
      <div className="md:hidden border-b border-neutral-800/80 bg-neutral-950 px-3 py-1.5 flex items-center justify-between gap-1 text-[11px] font-medium text-neutral-300">
        <button
          onClick={() => setActiveView('catalog')}
          className={`flex-1 py-1.5 px-2 rounded-md text-center transition-colors cursor-pointer whitespace-nowrap ${
            activeView === 'catalog'
              ? 'bg-neutral-900 text-amber-400 font-bold border border-neutral-800'
              : 'hover:text-white'
          }`}
        >
          Catálogo
        </button>
        <button
          onClick={() => setActiveView('workshop')}
          className={`flex-1 py-1.5 px-2 rounded-md text-center transition-colors cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap ${
            activeView === 'workshop'
              ? 'bg-neutral-900 text-amber-400 font-bold border border-neutral-800'
              : 'hover:text-white'
          }`}
        >
          <Wrench className="w-3 h-3 text-amber-500" />
          <span>Mi Moto</span>
        </button>
        <button
          onClick={() => setActiveView('shipping-payment')}
          className={`flex-1 py-1.5 px-2 rounded-md text-center transition-colors cursor-pointer whitespace-nowrap ${
            activeView === 'shipping-payment'
              ? 'bg-neutral-900 text-amber-400 font-bold border border-neutral-800'
              : 'hover:text-white'
          }`}
        >
          Envíos & Pagos
        </button>
      </div>

      {/* BCV Rate Modal */}
      {showRateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 max-w-sm w-full shadow-2xl">
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
                <span className="text-xs text-neutral-400 block">Tasa aplicada en tiempo real</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-mono tabular-nums font-bold text-amber-400">
                    {bcvRateInfo.rateBcv.toFixed(2)}
                  </span>
                  <span className="text-sm text-neutral-400">Bs. por cada 1 USD</span>
                </div>
                <div className="mt-2 text-[11px] text-neutral-400 space-y-0.5">
                  <p>• Fuente: {bcvRateInfo.source}</p>
                  {bcvRateInfo.officialDate && (
                    <p>• Fecha BCV: {bcvRateInfo.officialDate}</p>
                  )}
                  <p>• Ejemplo: $10.00 = {formatBs(10 * bcvRateInfo.rateBcv)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-neutral-400">Sincronizada con {settings.workshopName}</span>
                <button
                  onClick={async () => {
                    await refreshBcvRate();
                  }}
                  className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Actualizar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Client Auth / Registration Modal */}
      <ClientAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
};
