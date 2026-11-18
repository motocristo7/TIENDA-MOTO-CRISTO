import React, { useState } from 'react';
import { Truck, CreditCard, Copy, Check, MessageSquare, MapPin, Clock } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const ShippingPaymentInfo: React.FC = () => {
  const { settings, showToast } = useStore();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    showToast(`Copiado al portapapeles: ${text}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const { pagoMovil, transferencia, binance } = settings.bankDetails;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Métodos de Pago y Envíos
        </h2>
        <p className="text-sm text-neutral-300">
          En {settings.workshopName} facilitamos tu compra de repuestos con métodos de pago oficiales en Venezuela, Delivery en Mérida y envíos nacionales.
        </p>
      </div>

      {/* Grid: Payments & Shipping */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Venezuelan Payment Methods */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-neutral-800">
            <CreditCard className="w-6 h-6 text-amber-400" />
            <div>
              <h3 className="text-lg font-bold text-white">Métodos de Pago Aceptados</h3>
              <p className="text-xs text-neutral-400">Tasa oficial BCV sincronizada en tiempo real</p>
            </div>
          </div>

          {/* Pago Movil */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-sm text-amber-400">
              <span>Pago Móvil</span>
              <span className="text-[11px] text-neutral-400">Bolívares (Bs.)</span>
            </div>
            <div className="pt-1 space-y-1.5 text-neutral-300 font-mono text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Banco:</span>
                <span className="font-bold text-white">{pagoMovil.bank}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Teléfono:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-bold">{pagoMovil.phone}</span>
                  <button
                    onClick={() => handleCopy(pagoMovil.phone, 'phone')}
                    className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-amber-400 cursor-pointer"
                    title="Copiar teléfono"
                  >
                    {copiedField === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Cédula / RIF:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-bold">{pagoMovil.idNumber}</span>
                  <button
                    onClick={() => handleCopy(pagoMovil.idNumber, 'rif')}
                    className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-amber-400 cursor-pointer"
                    title="Copiar RIF"
                  >
                    {copiedField === 'rif' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              {pagoMovil.accountHolder && (
                <div className="text-[10px] text-neutral-400 pt-1 font-sans">
                  Titular: {pagoMovil.accountHolder}
                </div>
              )}
            </div>
          </div>

          {/* Transferencia Bancaria */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-sm text-white">
              <span>Transferencia Bancaria</span>
              <span className="text-[11px] text-neutral-400">{transferencia.bank}</span>
            </div>
            <div className="pt-1 space-y-1.5 text-neutral-300 font-mono text-[11px]">
              {transferencia.accountNumber && (
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">Cuenta:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-bold">{transferencia.accountNumber}</span>
                    <button
                      onClick={() => handleCopy(transferencia.accountNumber, 'acct')}
                      className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-amber-400 cursor-pointer"
                      title="Copiar número de cuenta"
                    >
                      {copiedField === 'acct' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Cédula / RIF:</span>
                <span className="text-white font-bold">{transferencia.idNumber}</span>
              </div>
              <div className="text-[10px] text-neutral-400 pt-1 font-sans">
                Titular: {transferencia.accountHolder}
              </div>
            </div>
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
              <span className="font-mono text-xs text-white font-bold">{binance.payId}</span>
              <button
                onClick={() => handleCopy(binance.payId, 'binance')}
                className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
              >
                {copiedField === 'binance' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copiar Pay ID</span>
              </button>
            </div>
          </div>

          {/* Divisas en Efectivo */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-bold text-sm text-emerald-400">
              <span>Divisas en Efectivo ($ USD / € EUR)</span>
              <span className="text-[11px] text-neutral-400">Presencial / Delivery</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Aceptamos billetes en buen estado al retirar en tienda o recibir tu Delivery en Mérida.
            </p>
          </div>
        </div>

        {/* Right: Shipping Agencies */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-neutral-800">
            <Truck className="w-6 h-6 text-amber-400" />
            <div>
              <h3 className="text-lg font-bold text-white">Envíos, Delivery y Retiros</h3>
              <p className="text-xs text-neutral-400">Despachos diarios locales y nacionales</p>
            </div>
          </div>

          {/* Retiro en tienda */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-400">
              <MapPin className="w-4 h-4" />
              <span>Retiro en Tienda ({settings.workshopName})</span>
            </div>
            <p className="text-[11px] text-neutral-300">{settings.address}</p>
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>{settings.operatingHours}</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold block">
              ✓ Gratuito e inmediato una vez confirmado el pedido
            </span>
          </div>

          {/* Delivery Mérida */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-bold text-sm text-white">
              <span>Delivery Mérida</span>
              <span className="text-[11px] text-emerald-400">Entrega Express</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Entregas motorizadas puerta a puerta en la ciudad de Mérida y zonas aledañas el mismo día.
            </p>
          </div>

          {/* MRW */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-bold text-sm text-white">
              <span>MRW (Nacional)</span>
              <span className="text-[11px] text-amber-400">Cobro en Destino (COD)</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Enviamos a cualquier agencia MRW del país. Recibe tu número de guía por WhatsApp el mismo día hábil.
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

      {/* Warranty & Invoice Disclaimer from settings/business */}
      {(settings.warrantyPolicy || settings.invoiceDisclaimer) && (
        <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-5 text-xs text-neutral-400 space-y-2">
          {settings.invoiceDisclaimer && (
            <p>
              <span className="text-neutral-200 font-semibold">Condiciones de venta y tasa:</span>{' '}
              {settings.invoiceDisclaimer}
            </p>
          )}
          {settings.warrantyPolicy && (
            <p>
              <span className="text-neutral-200 font-semibold">Política de garantía:</span>{' '}
              {settings.warrantyPolicy}
            </p>
          )}
        </div>
      )}

      {/* Direct Contact Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h4 className="text-lg font-bold text-white">
            ¿Tienes dudas con la compatibilidad de un repuesto?
          </h4>
          <p className="text-xs text-neutral-300 mt-1 max-w-xl">
            Nuestros mecánicos especialistas en motos venezolanas te asesoran de forma personalizada antes de despachar tu pedido.
          </p>
        </div>
        <a
          href={`https://wa.me/${settings.phoneWhatsapp}?text=${encodeURIComponent(
            `Hola ${settings.workshopName}, tengo una consulta técnica sobre un repuesto.`
          )}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition-all shadow-sm cursor-pointer whitespace-nowrap shrink-0"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Escribir al WhatsApp ({settings.phoneCall})</span>
        </a>
      </div>
    </div>
  );
};
