import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Copy, Check, MessageSquare, Truck, CreditCard, Store } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { CustomerData, ShippingAgency, PaymentMethodType } from '../types';
import { formatDualPrice, formatUsd, formatBs, generateWhatsAppOrderLink } from '../utils/formatters';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotalUsd,
    cartTotalBs,
    bcvRateInfo,
    settings,
    showToast,
  } = useStore();

  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Customer form state
  const [customer, setCustomer] = useState<CustomerData>({
    fullName: '',
    phone: '',
    idNumber: '',
    cityState: 'Caracas / Distrito Capital',
    shippingAgency: 'Retiro en Taller (Cristo Centro)',
    agencyOfficeAddress: '',
    paymentMethod: 'pago_movil',
    notes: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  if (!isCartOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    showToast(`Copiado: ${text}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!customer.fullName.trim()) errors.fullName = 'Ingresa tu nombre y apellido';
    if (!customer.phone.trim()) errors.phone = 'Ingresa tu número de teléfono / WhatsApp';
    if (!customer.idNumber.trim()) errors.idNumber = 'Ingresa tu Cédula o RIF';
    if (customer.shippingAgency !== 'Retiro en Taller (Cristo Centro)' && !customer.agencyOfficeAddress.trim()) {
      errors.agencyOfficeAddress = 'Indica la oficina o dirección de la agencia';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProceedToWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const whatsappUrl = generateWhatsAppOrderLink(
      cart,
      customer,
      bcvRateInfo.rateBcv,
      settings.phoneWhatsapp
    );

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    showToast('Redirigiendo a WhatsApp de Servimotos Cristo Centro...');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-neutral-900 border-l border-neutral-800 flex flex-col justify-between shadow-2xl">
          {/* Header */}
          <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">
                {step === 'cart' ? 'Tu Carrito de Repuestos' : 'Finalizar Pedido'}
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <ShoppingBag className="w-12 h-12 text-neutral-600 mx-auto" />
                <h3 className="text-sm font-bold text-white">Tu carrito está vacío</h3>
                <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                  Explora nuestro catálogo con marcas Empire Keeway, Bera, Motos Toro, Suzuki y más.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Ver Catálogo
                </button>
              </div>
            ) : step === 'cart' ? (
              /* STEP 1: Itemized Cart */
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-neutral-400 pb-2 border-b border-neutral-800">
                  <span>{cart.length} artículos agregados</span>
                  <button
                    onClick={clearCart}
                    className="text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                  >
                    Vaciar todo
                  </button>
                </div>

                <div className="divide-y divide-neutral-800/80">
                  {cart.map((item) => {
                    const linePrice = formatDualPrice(
                      item.product.priceUsd * item.quantity,
                      bcvRateInfo.rateBcv
                    );

                    return (
                      <div key={item.product.id} className="py-3.5 flex gap-3">
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-16 h-16 object-contain bg-neutral-950 rounded-lg p-1.5 border border-neutral-800 shrink-0"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 24 24" fill="none" stroke="%23f59e0b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`;
                          }}
                        />
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-1">
                              <h4 className="text-xs font-semibold text-white line-clamp-2">
                                {item.product.name}
                              </h4>
                              <button
                                onClick={() => removeFromCart(item.product.id)}
                                className="text-neutral-500 hover:text-red-400 transition-colors p-1"
                                title="Eliminar del carrito"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              Cod: {item.product.code} · {item.product.brand}
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            {/* Quantity Stepper */}
                            <div className="flex items-center border border-neutral-700 bg-neutral-950 rounded">
                              <button
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                className="px-2 py-0.5 text-xs text-neutral-300 hover:text-white"
                              >
                                -
                              </button>
                              <span className="px-1.5 text-xs font-mono font-bold text-white">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                className="px-2 py-0.5 text-xs text-neutral-300 hover:text-white"
                              >
                                +
                              </button>
                            </div>

                            <div className="text-right">
                              <span className="text-xs font-mono font-bold text-amber-400 block">
                                {linePrice.usd}
                              </span>
                              <span className="text-[10px] font-mono text-neutral-400 block">
                                {linePrice.bs}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* STEP 2: Checkout Form & Payment Info */
              <form onSubmit={handleProceedToWhatsApp} className="space-y-4">
                <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 text-xs">
                  <span className="font-semibold text-white block mb-2">1. Datos del Cliente:</span>
                  <div className="space-y-2">
                    <div>
                      <input
                        type="text"
                        placeholder="Nombre y Apellido *"
                        value={customer.fullName}
                        onChange={(e) => setCustomer({ ...customer, fullName: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                      />
                      {formErrors.fullName && (
                        <span className="text-[10px] text-red-400 block mt-0.5">{formErrors.fullName}</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <input
                          type="text"
                          placeholder="Teléfono / WhatsApp *"
                          value={customer.phone}
                          onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                        />
                        {formErrors.phone && (
                          <span className="text-[10px] text-red-400 block mt-0.5">{formErrors.phone}</span>
                        )}
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Cédula o RIF *"
                          value={customer.idNumber}
                          onChange={(e) => setCustomer({ ...customer, idNumber: e.target.value })}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                        />
                        {formErrors.idNumber && (
                          <span className="text-[10px] text-red-400 block mt-0.5">{formErrors.idNumber}</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Ciudad / Estado"
                        value={customer.cityState}
                        onChange={(e) => setCustomer({ ...customer, cityState: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping Agency */}
                <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 text-xs">
                  <span className="font-semibold text-white block mb-2 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-amber-500" />
                    2. Método de Envío / Entrega:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    {(['Retiro en Taller (Cristo Centro)', 'MRW', 'Zoom', 'Tealca'] as ShippingAgency[]).map((agency) => (
                      <button
                        type="button"
                        key={agency}
                        onClick={() => setCustomer({ ...customer, shippingAgency: agency })}
                        className={`p-2 rounded border text-left text-[11px] transition-colors cursor-pointer ${
                          customer.shippingAgency === agency
                            ? 'bg-amber-400 text-neutral-950 font-bold border-amber-400'
                            : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        {agency}
                      </button>
                    ))}
                  </div>

                  {customer.shippingAgency === 'Retiro en Taller (Cristo Centro)' ? (
                    <p className="text-[10px] text-neutral-400 mt-1">
                      📍 Retiro directo y gratuito en Servimotos Cristo Centro, Caracas.
                    </p>
                  ) : (
                    <div>
                      <input
                        type="text"
                        placeholder={`Dirección u oficina receptora de ${customer.shippingAgency} *`}
                        value={customer.agencyOfficeAddress}
                        onChange={(e) => setCustomer({ ...customer, agencyOfficeAddress: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 mt-1"
                      />
                      {formErrors.agencyOfficeAddress && (
                        <span className="text-[10px] text-red-400 block mt-0.5">{formErrors.agencyOfficeAddress}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Payment Method Details */}
                <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 text-xs">
                  <span className="font-semibold text-white block mb-2 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                    3. Método de Pago:
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 mb-3">
                    {[
                      { id: 'pago_movil', label: 'Pago Móvil Banesco' },
                      { id: 'divisas', label: 'Efectivo Taller' },
                      { id: 'binance', label: 'Binance Pay' },
                    ].map((m) => (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => setCustomer({ ...customer, paymentMethod: m.id as PaymentMethodType })}
                        className={`p-2 rounded border text-center text-[10px] transition-colors cursor-pointer ${
                          customer.paymentMethod === m.id
                            ? 'bg-amber-400 text-neutral-950 font-bold border-amber-400'
                            : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {/* Payment Details Card with Copy Buttons */}
                  {customer.paymentMethod === 'pago_movil' && (
                    <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 space-y-1.5 text-[11px]">
                      <div className="flex justify-between items-center text-neutral-300">
                        <span>Banco:</span>
                        <span className="font-bold text-white">{settings.pagoMovil.bank}</span>
                      </div>
                      <div className="flex justify-between items-center text-neutral-300">
                        <span>Teléfono:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-white">{settings.pagoMovil.phone}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(settings.pagoMovil.phone, 'phone')}
                            className="text-neutral-400 hover:text-amber-400"
                          >
                            {copiedField === 'phone' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-neutral-300">
                        <span>RIF:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-white">{settings.pagoMovil.idNumber}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(settings.pagoMovil.idNumber, 'rif')}
                            className="text-neutral-400 hover:text-amber-400"
                          >
                            {copiedField === 'rif' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                      <div className="text-[10px] text-neutral-500 pt-1">
                        Titular: {settings.pagoMovil.accountHolder}
                      </div>
                    </div>
                  )}

                  {customer.paymentMethod === 'binance' && (
                    <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 space-y-1.5 text-[11px]">
                      <div className="flex justify-between items-center text-neutral-300">
                        <span>Moneda:</span>
                        <span className="font-bold text-amber-400">USDT (Tether)</span>
                      </div>
                      <div className="flex justify-between items-center text-neutral-300">
                        <span>Binance Pay ID:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-white font-bold">{settings.binancePayId}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy('542910384', 'binance')}
                            className="text-neutral-400 hover:text-amber-400"
                          >
                            {copiedField === 'binance' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {customer.paymentMethod === 'divisas' && (
                    <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 text-[11px] text-neutral-300">
                      Pago presencial en divisas en efectivo ($ USD o € EUR) en la caja de Servimotos Cristo Centro al retirar.
                    </div>
                  )}
                </div>

                {/* Additional Notes */}
                <div>
                  <textarea
                    rows={2}
                    placeholder="Notas para el taller (ej. ¿tienen bombillo adicional? ¿color específico?)"
                    value={customer.notes}
                    onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </form>
            )}
          </div>

          {/* Footer Totals & Action */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-neutral-800 bg-neutral-950 space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between items-baseline text-neutral-400 text-xs">
                  <span>Subtotal en Divisas:</span>
                  <span className="font-mono tabular-nums font-bold text-base text-white">
                    {formatUsd(cartTotalUsd)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-neutral-400 text-xs">
                  <span>Equivalente en Bolívares:</span>
                  <span className="font-mono tabular-nums font-extrabold text-base text-amber-400">
                    {formatBs(cartTotalBs)}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500 block text-right">
                  Calculado a Tasa Oficial BCV ({bcvRateInfo.rateBcv.toFixed(2)} Bs./$)
                </span>
              </div>

              {step === 'cart' ? (
                <button
                  onClick={() => setStep('checkout')}
                  className="w-full py-3 px-4 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <span>Continuar al Pago y Envío</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={handleProceedToWhatsApp}
                    className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Enviar Pedido al WhatsApp Oficial (+58 412 2242450)</span>
                  </button>

                  <button
                    onClick={() => setStep('cart')}
                    className="w-full py-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    ← Modificar productos del carrito
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
