import React from 'react';
import { Search, Wrench } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { MotoBrand } from '../types';

const POPULAR_BRANDS: MotoBrand[] = [
  'Empire Keeway',
  'Bera',
  'Motos Toro',
  'Suzuki',
  'Yamaha',
  'MD Haojin',
];

export const Hero: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    selectedBrand,
    setSelectedBrand,
    setActiveView,
    bcvRateInfo,
    settings,
  } = useStore();

  return (
    <section className="border-b border-neutral-800 bg-neutral-950">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-center">
          {/* Search & Brand Filter Strip (Compact Mobile-First) */}
          <div className="lg:col-span-8 flex flex-col justify-center">
            <div className="flex items-center justify-between gap-2 text-[11px] text-amber-400 font-medium tracking-wide uppercase mb-1.5">
              <div className="flex items-center gap-1.5 truncate">
                <span>{settings.workshopName}</span>
                <span aria-hidden="true">·</span>
                <span className="text-neutral-400 normal-case">
                  BCV {bcvRateInfo.rateBcv.toFixed(2)} Bs./$
                </span>
              </div>
              <button
                onClick={() => setActiveView('workshop')}
                className="hidden sm:inline-flex items-center gap-1 text-neutral-300 hover:text-amber-400 transition-colors cursor-pointer whitespace-nowrap shrink-0 normal-case"
              >
                <Wrench className="w-3 h-3 text-amber-400" />
                <span>Consultar moto o factura</span>
              </button>
            </div>

            <h1 className="text-lg sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white text-balance leading-tight">
              Repuestos garantizados para tu moto
            </h1>

            {/* Quick Search Input */}
            <div className="mt-2.5 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar repuesto, SKU o modelo (ej. Horse, SBR, Bera)..."
                  className="w-full bg-neutral-900 border border-neutral-700 focus:border-amber-400 rounded-lg pl-9 pr-14 py-2 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-neutral-400 hover:text-white cursor-pointer"
                  >
                    Borrar
                  </button>
                )}
              </div>
            </div>

            {/* Single-line Horizontal Brand Selector */}
            <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedBrand('Todas')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedBrand === 'Todas'
                    ? 'bg-amber-400 text-neutral-950 font-bold'
                    : 'bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800'
                }`}
              >
                Todas
              </button>
              {POPULAR_BRANDS.map((brand) => (
                <button
                  key={brand}
                  onClick={() => setSelectedBrand(brand)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    selectedBrand === brand
                      ? 'bg-amber-400 text-neutral-950 font-bold'
                      : 'bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Compact Desktop Showcase Image (hidden on small phones to save space) */}
          <div className="hidden lg:block lg:col-span-4">
            <div className="relative rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 shadow-lg h-[164px]">
              <img
                src="/src/assets/images/hero_moto_store_1794424749432.jpg"
                alt={`Showroom y taller de repuestos ${settings.workshopName}`}
                className="w-full h-full object-cover object-center"
                loading="eager"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex flex-col justify-end p-3.5">
                <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
                  Delivery Mérida · MRW · Zoom · Tealca
                </span>
                <p className="text-sm font-bold text-white leading-snug">
                  {settings.workshopName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
