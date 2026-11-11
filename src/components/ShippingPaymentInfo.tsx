import React, { useState } from 'react';
import { Truck, CreditCard, ShieldCheck, Copy, Check, MessageSquare, MapPin, Clock } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const ShippingPaymentInfo: React.FC = () => {
  const { settings, showToast, setActiveView } = useStore();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    showToast(`Copiado al portapapeles: ${text}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Métodos de Pago y Envíos Nacionales
        </h2>
        <p className="text-sm text-neutral-300">
          En Servimotos Cristo Centro facilitamos tu compra de repuestos con métodos de pago oficiales en Venezuela y envíos seguros a todo el país.
        </p>
      </div>

      {/* Grid: Payments & Shipping */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Venezuelan Payment Methods */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-neutral-800">
            <CreditCard className="w-6 h-6 text-amber-400" />
            <div>
              <h3 className="text-lg font-bold text-white">Métodos de Pago Aceptados</h3>
              <p className="text-xs text-neutral-400">Tasa oficial BCV calculada al día</p>
            </div>
          </div>

          {/* Pago Movil Banesco */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-sm text-amber-400">
              <span>Pago Móvil Banesco</span>
              <span className="text-[11px] text-neutral-400">Bolívares (Bs.)</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Transfiere con tu app de banca móvil a nuestra cuenta jurídica Banesco:
            </p>
            <div className="pt-2 space-y-1.5 text-neutral-300 font-mono text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Banco:</span>
                <span className="font-bold text-white">{settings.pagoMovil.bank}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Teléfono:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-bold">{settings.pagoMovil.phone}</span>
                  <button
                    onClick={() => handleCopy(settings.pagoMovil.phone, 'phone')}
                    className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-amber-400"
                    title="Copiar teléfono"
                  >
                    {copiedField === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">RIF:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-bold">{settings.pagoMovil.idNumber}</span>
                  <button
                    onClick={() => handleCopy(settings.pagoMovil.idNumber, 'rif')}
                    className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-amber-400"
                    title="Copiar RIF"
                  >
                    {copiedField === 'rif' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="text-[10px] text-neutral-400 pt-1 font-sans">
                Titular: {settings.pagoMovil.accountHolder}
              </div>
            </div>
          </div>

          {/* Divisas en Efectivo */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-sm text-emerald-400">
              <span>Divisas en Efectivo ($ USD / € EUR)</span>
              <span className="text-[11px] text-neutral-400">Presencial</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Aceptamos billetes en buen estado sin tachaduras ni roturas al retirar tus repuestos o servicio en el taller.
            </p>
          </div>

          {/* Binance Pay */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-sm text-amber-400">
              <span>Binance Pay (USDT)</span>
              <span className="text-[11px] text-neutral-400">Cripto al instante</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Envía tu pago sin comisión mediante Binance Pay ID directo:
            </p>
            <div className="flex items-center justify-between bg-neutral-900 p-2.5 rounded-lg border border-neutral-800">
              <span className="font-mono text-xs text-white font-bold">{settings.binancePayId}</span>
              <button
                onClick={() => handleCopy('542910384', 'binance')}
                className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
              >
                {copiedField === 'binance' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copiar Pay ID</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Venezuelan Shipping Agencies */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-neutral-800">
            <Truck className="w-6 h-6 text-amber-400" />
            <div>
              <h3 className="text-lg font-bold text-white">Envíos y Retiros</h3>
              <p className="text-xs text-neutral-400">Despachos diarios a nivel nacional</p>
            </div>
          </div>

          {/* Retiro en Taller */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-400">
              <MapPin className="w-4 h-4" />
              <span>Retiro en Taller Servimotos Cristo Centro</span>
            </div>
            <p className="text-[11px] text-neutral-300">
              {settings.address}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>{settings.operatingHours}</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold block">
              ✓ Gratuito e inmediato una vez confirmado el pedido
            </span>
          </div>

          {/* MRW */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-bold text-sm text-white">
              <span>MRW (Nacional)</span>
              <span className="text-[11px] text-amber-400">Cobro en Destino (COD)</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Enviamos a cualquier agencia MRW del país. Recibe tu número de guía de rastreo por WhatsApp el mismo día hábil.
            </p>
          </div>

          {/* Zoom */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-bold text-sm text-white">
              <span>Grupo Zoom</span>
              <span className="text-[11px] text-amber-400">Envío Asegurado</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Ideal para repuestos de mayor valor (cilindros, carburadores, cascos). Encomienda con cobertura total.
            </p>
          </div>

          {/* Tealca */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-bold text-sm text-white">
              <span>Tealca</span>
              <span className="text-[11px] text-amber-400">Tracking Digital</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Despacho puntual y entrega directa en agencia u oficina comercial en las principales ciudades de Venezuela.
            </p>
          </div>
        </div>
      </div>

      {/* Direct Contact Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h4 className="text-lg font-bold text-white">¿Tienes dudas con la compatibilidad de un repuesto?</h4>
          <p className="text-xs text-neutral-300 mt-1 max-w-xl">
            Nuestros mecánicos especialistas en motos venezolanas te asesoran de forma personalizada antes de despachar tu pedido.
          </p>
        </div>
        <a
          href={`https://wa.me/${settings.phoneWhatsapp}?text=Hola%20Servimotos%20Cristo%20Centro,%20tengo%20una%20consulta%20técnica%20sobre%20un%20repuesto.`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition-all shadow-sm cursor-pointer whitespace-nowrap shrink-0"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Escribir al WhatsApp (+58 412 2242450)</span>
        </a>
      </div>
    </div>
  );
};
