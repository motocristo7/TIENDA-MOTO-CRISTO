import React from 'react';
import { Search, Wrench, ShieldCheck, ArrowRight, Truck } from 'lucide-react';
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
  } = useStore();

  return (
    <section className="relative overflow-hidden border-b border-neutral-800 bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Brand copy and quick search */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {/* Trust statement unboxed */}
            <div className="flex items-center gap-2 text-xs text-amber-400 font-medium tracking-wide uppercase mb-3">
              <span>Portal Oficial</span>
              <span aria-hidden="true">·</span>
              <span>Servimotos Cristo Centro</span>
              <span aria-hidden="true">·</span>
              <span>Taller & Repuestos</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white text-balance leading-tight">
              Repuestos garantizados para tu moto en Venezuela.
            </h1>

            <p className="mt-4 text-base text-neutral-300 leading-relaxed max-w-xl">
              Catálogo de repuestos originales y alternativos para Empire Keeway, Bera, Motos Toro, Suzuki y Yamaha. Precios transparentes en dólares y bolívares a tasa oficial BCV, con envíos por MRW, Zoom y Tealca.
            </p>

            {/* Quick Search Input */}
            <div className="mt-6 flex flex-col sm:flex-row gap-2.5 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por repuesto, código o modelo (ej. Pistón Horse, SBR, Pastillas)..."
                  className="w-full bg-neutral-900 border border-neutral-700 focus:border-amber-400 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-white"
                  >
                    Borrar
                  </button>
                )}
              </div>
              <button
                onClick={() => setActiveView('workshop')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-neutral-850 hover:bg-neutral-800 border border-neutral-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer shrink-0"
              >
                <Wrench className="w-4 h-4 text-amber-400" />
                <span>Rastrear Moto en Taller</span>
              </button>
            </div>

            {/* Quick Brand Selector */}
            <div className="mt-6 pt-5 border-t border-neutral-850">
              <span className="text-xs text-neutral-400 block mb-2 font-medium">
                Filtrar por marca venezolana:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedBrand('Todas')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    selectedBrand === 'Todas'
                      ? 'bg-amber-400 text-neutral-950 font-semibold'
                      : 'bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-800'
                  }`}
                >
                  Todas las Marcas
                </button>
                {POPULAR_BRANDS.map((brand) => (
                  <button
                    key={brand}
                    onClick={() => setSelectedBrand(brand)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      selectedBrand === brand
                        ? 'bg-amber-400 text-neutral-950 font-semibold'
                        : 'bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-800'
                    }`}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Hero Showcase Image and Workshop Teaser */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 shadow-xl group aspect-[16/10] sm:aspect-[16/9] lg:aspect-auto lg:h-[340px]">
              <img
                src="/src/assets/images/hero_moto_store_1794424749432.jpg"
                alt="Showroom y taller de repuestos Servimotos Cristo Centro"
                className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-500"
                loading="eager"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-5">
                <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">
                  Servicio Integral y Repuestos
                </span>
                <p className="text-lg font-bold text-white mt-1">
                  Servimotos Cristo Centro
                </p>
                <p className="text-xs text-neutral-300 mt-0.5">
                  Mecánica de precisión, mantenimiento de flota y repuestos originales.
                </p>
              </div>
            </div>

            {/* Quick Highlights Bar */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/80">
                <ShieldCheck className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <span className="text-[11px] text-neutral-300 block font-medium">Repuestos 100% Verificados</span>
              </div>
              <div className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/80">
                <Truck className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <span className="text-[11px] text-neutral-300 block font-medium">MRW / Zoom / Tealca</span>
              </div>
              <div className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/80">
                <span className="text-xs font-mono font-bold text-amber-400 block mb-0.5">BCV</span>
                <span className="text-[11px] text-neutral-300 block font-medium">Tasa Oficial {bcvRateInfo.rateBcv.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
