import React from 'react';
import { MapPin, Phone, MessageSquare, Clock, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const Footer: React.FC = () => {
  const { settings, setActiveView, setSelectedBrand } = useStore();

  return (
    <footer className="border-t border-neutral-800 bg-neutral-950 text-neutral-400 text-xs mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold text-sm">
                CC
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                Mercado Moto CC
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Tienda online de repuestos y portal de autoservicio para clientes de Servimotos Cristo Centro C.A.
            </p>
            <div className="text-[11px] text-neutral-500 space-y-0.5 font-mono">
              <p>RIF: {settings.rif}</p>
              <p>Caracas · Venezuela</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Navegación
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setActiveView('catalog')}
                  className="hover:text-amber-400 transition-colors cursor-pointer"
                >
                  Catálogo de Repuestos
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveView('workshop')}
                  className="hover:text-amber-400 transition-colors cursor-pointer"
                >
                  Consultar Moto en Taller
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveView('shipping-payment')}
                  className="hover:text-amber-400 transition-colors cursor-pointer"
                >
                  Envíos Nacionales & Pagos
                </button>
              </li>
            </ul>
          </div>

          {/* Supported Moto Brands */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Marcas Principales
            </h4>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              {['Empire Keeway', 'Bera', 'Motos Toro', 'Suzuki', 'Yamaha', 'MD Haojin', 'Ava'].map((brand) => (
                <button
                  key={brand}
                  onClick={() => {
                    setSelectedBrand(brand as any);
                    setActiveView('catalog');
                  }}
                  className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-850 hover:text-white transition-colors cursor-pointer"
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>

          {/* Contact & Hours */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Taller & Atención
            </h4>
            <div className="space-y-2 text-[11px]">
              <div className="flex items-start gap-2 text-neutral-300">
                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>{settings.address}</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-300">
                <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{settings.operatingHours}</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <a
                  href={`https://wa.me/${settings.phoneWhatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:underline font-mono"
                >
                  WhatsApp: +58 412 2242450
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-neutral-850 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-500">
          <p>© {new Date().getFullYear()} Mercado Moto CC · Servimotos Cristo Centro C.A. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <span>Tasa Oficial BCV en vivo</span>
            <span>Envíos MRW / Zoom / Tealca</span>
            <span>Pago Móvil Banesco</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
