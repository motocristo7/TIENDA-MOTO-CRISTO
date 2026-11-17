import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Copy,
  Check,
  MessageSquare,
  Truck,
  CreditCard,
  CheckCircle2,
  User,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { CustomerData, ShippingAgency, PaymentMethodType } from '../types';
import {
  formatDualPrice,
  formatUsd,
  formatBs,
  generateWhatsAppOrderLink,
} from '../utils/formatters';
import { placeOnlineOrder } from '../services/firebaseStore';

const SHIPPING_OPTIONS: ShippingAgency[] = [
  'Retiro en tienda',
  'Delivery Mérida',
  'MRW',
  'Zoom',
  'Tealca',
];

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
    clientUser,
    setIsAuthModalOpen,
    showToast,
  } = useStore();

  const [step, setStep] = useState<'cart' | 'checkout' | 'confirmed'>('cart');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderId: string;
    totalUsd: number;
    totalBs: number;
    whatsappUrl: string;
  } | null>(null);

  const [customer, setCustomer] = useState<CustomerData>({
    fullName: '',
    phone: '',
    idNumber: '',
    email: '',
    cityState: 'Mérida',
    shippingAgency: 'Retiro en tienda',
    agencyOfficeAddress: '',
    paymentMethod: 'pago_movil',
    paymentReference: '',
    notes: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Pre-fill customer data when logged in
  useEffect(() => {
    if (clientUser) {
      setCustomer((prev) => ({
        ...prev,
        fullName: prev.fullName || clientUser.name || '',
        phone: prev.phone || clientUser.phone || '',
        idNumber: prev.idNumber || clientUser.document || '',
        email: prev.email || clientUser.email || '',
      }));
    }
  }, [clientUser]);

  if (!isCartOpen) return null;

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
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
    if (
      customer.shippingAgency !== 'Retiro en tienda' &&
      !customer.agencyOfficeAddress.trim()
    ) {
      errors.agencyOfficeAddress =
        customer.shippingAgency === 'Delivery Mérida'
          ? 'Indica la dirección exacta de entrega en Mérida'
          : `Indica la oficina o dirección de ${customer.shippingAgency}`;
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const result = await placeOnlineOrder(cart, customer, bcvRateInfo.rateBcv);

      const whatsappUrl = generateWhatsAppOrderLink(
        cart,
        customer,
        bcvRateInfo.rateBcv,
        settings.phoneWhatsapp,
        result.orderId,
        settings.workshopName,
        settings.storeName
      );

      setConfirmedOrder({
        orderId: result.orderId,
        totalUsd: result.totalUsd,
        totalBs: result.totalBs,
        whatsappUrl,
      });

      clearCart();
      setStep('confirmed');
      showToast(`¡Pedido ${result.orderId.toUpperCase()} registrado con éxito!`);
    } catch (err: any) {
      setSubmitError(
        err?.message ||
          'No se pudo registrar el pedido. Verifica tu conexión o disponibilidad de stock.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseDrawer = () => {
    setIsCartOpen(false);
    if (step === 'confirmed') {
      setStep('cart');
      setConfirmedOrder(null);
    }
  };

  const { pagoMovil, transferencia, binance } = settings.bankDetails;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={handleCloseDrawer}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-neutral-900 border-l border-neutral-800 flex flex-col justify-between shadow-2xl">
          {/* Header */}
          <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">
                {step === 'cart'
                  ? 'Tu Carrito de Repuestos'
                  : step === 'checkout'
                  ? 'Finalizar Pedido'
                  : '¡Pedido Registrado!'}
              </h2>
            </div>
            <button
              onClick={handleCloseDrawer}
              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {step === 'confirmed' && confirmedOrder ? (
              <div className="py-8 space-y-5 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>

                <div>
                  <span className="text-xs font-mono text-amber-400 uppercase tracking-wider font-bold">
                    Orden #{confirmedOrder.orderId.toUpperCase()}
                  </span>
                  <h3 className="text-xl font-extrabold text-white mt-1">
                    ¡Pedido guardado en sistema!
                  </h3>
                  <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                    Tu pedido ya fue enviado al panel de {settings.workshopName} y tus repuestos fueron reservados del inventario.
                  </p>
                </div>

                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-xs space-y-1.5">
                  <div className="flex justify-between text-neutral-400">
                    <span>Total en Divisas:</span>
                    <span className="font-mono font-bold text-white">
                      {formatUsd(confirmedOrder.totalUsd)}
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Equivalente en Bs.:</span>
                    <span className="font-mono font-bold text-amber-400">
                      {formatBs(confirmedOrder.totalBs)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  <a
                    href={confirmedOrder.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Enviar Comprobante por WhatsApp</span>
                  </a>

                  <button
                    onClick={handleCloseDrawer}
                    className="w-full py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Seguir viendo el catálogo
                  </button>
                </div>
              </div>
            ) : cart.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <ShoppingBag className="w-12 h-12 text-neutral-600 mx-auto" />
                <h3 className="text-sm font-bold text-white">Tu carrito está vacío</h3>
                <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                  Explora nuestro catálogo sincronizado con repuestos para tu moto.
                </p>
                <button
                  onClick={handleCloseDrawer}
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
                            (e.currentTarget as HTMLImageElement).src = `data:image/svg+xml;utf8,${encodeURIComponent(
                              '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>'
                            )}`;
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
                                className="text-neutral-500 hover:text-red-400 transition-colors p-1 cursor-pointer"
                                title="Eliminar del carrito"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              SKU: {item.product.sku || item.product.code} · {item.product.brand}
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center border border-neutral-700 bg-neutral-950 rounded">
                              <button
                                onClick={() =>
                                  updateQuantity(item.product.id, item.quantity - 1)
                                }
                                className="px-2 py-0.5 text-xs text-neutral-300 hover:text-white cursor-pointer"
                              >
                                -
                              </button>
                              <span className="px-1.5 text-xs font-mono font-bold text-white">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.product.id, item.quantity + 1)
                                }
                                className="px-2 py-0.5 text-xs text-neutral-300 hover:text-white cursor-pointer"
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
              <form id="checkout-form" onSubmit={handleConfirmOrder} className="space-y-4">
                {submitError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                    {submitError}
                  </div>
                )}

                {!clientUser && (
                  <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-xl px-3.5 py-2.5 text-xs">
                    <span className="text-amber-200 text-[11px]">
                      ¿Ya tienes cuenta de cliente?
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAuthModalOpen(true)}
                      className="flex items-center gap-1 text-amber-400 font-bold hover:underline cursor-pointer text-[11px]"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Ingresar / Registrarme</span>
                    </button>
                  </div>
                )}

                <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 text-xs">
                  <span className="font-semibold text-white block mb-2">
                    1. Datos del Cliente:
                  </span>
                  <div className="space-y-2">
                    <div>
                      <input
                        type="text"
                        placeholder="Nombre y Apellido *"
                        value={customer.fullName}
                        onChange={(e) =>
                          setCustomer({ ...customer, fullName: e.target.value })
                        }
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                      />
                      {formErrors.fullName && (
                        <span className="text-[10px] text-red-400 block mt-0.5">
                          {formErrors.fullName}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <input
                          type="text"
                          placeholder="Teléfono / WhatsApp *"
                          value={customer.phone}
                          onChange={(e) =>
                            setCustomer({ ...customer, phone: e.target.value })
                          }
                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                        />
                        {formErrors.phone && (
                          <span className="text-[10px] text-red-400 block mt-0.5">
                            {formErrors.phone}
                          </span>
                        )}
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Cédula o RIF *"
                          value={customer.idNumber}
                          onChange={(e) =>
                            setCustomer({ ...customer, idNumber: e.target.value })
                          }
                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                        />
                        {formErrors.idNumber && (
                          <span className="text-[10px] text-red-400 block mt-0.5">
                            {formErrors.idNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Ciudad / Estado"
                        value={customer.cityState}
                        onChange={(e) =>
                          setCustomer({ ...customer, cityState: e.target.value })
                        }
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping Method */}
                <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 text-xs">
                  <span className="font-semibold text-white mb-2 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-amber-500" />
                    2. Método de Envío / Entrega:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    {SHIPPING_OPTIONS.map((agency) => (
                      <button
                        type="button"
                        key={agency}
                        onClick={() =>
                          setCustomer({ ...customer, shippingAgency: agency })
                        }
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

                  {customer.shippingAgency === 'Retiro en tienda' ? (
                    <p className="text-[10px] text-neutral-400 mt-1">
                      📍 Retiro directo y gratuito en {settings.workshopName}: {settings.address}
                    </p>
                  ) : (
                    <div>
                      <input
                        type="text"
                        placeholder={
                          customer.shippingAgency === 'Delivery Mérida'
                            ? 'Dirección exacta y punto de referencia en Mérida *'
                            : `Oficina receptora o dirección de ${customer.shippingAgency} *`
                        }
                        value={customer.agencyOfficeAddress}
                        onChange={(e) =>
                          setCustomer({
                            ...customer,
                            agencyOfficeAddress: e.target.value,
                          })
                        }
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 mt-1"
                      />
                      {formErrors.agencyOfficeAddress && (
                        <span className="text-[10px] text-red-400 block mt-0.5">
                          {formErrors.agencyOfficeAddress}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Payment Method Details */}
                <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 text-xs">
                  <span className="font-semibold text-white mb-2 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                    3. Método de Pago:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 mb-3">
                    {[
                      { id: 'pago_movil', label: 'Pago Móvil' },
                      { id: 'transferencia', label: 'Transferencia' },
                      { id: 'binance', label: 'Binance Pay' },
                      { id: 'divisas', label: 'Divisas Efectivo' },
                    ].map((m) => (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() =>
                          setCustomer({
                            ...customer,
                            paymentMethod: m.id as PaymentMethodType,
                          })
                        }
                        className={`p-2 rounded border text-center text-[11px] transition-colors cursor-pointer ${
                          customer.paymentMethod === m.id
                            ? 'bg-amber-400 text-neutral-950 font-bold border-amber-400'
                            : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {/* Payment Details Card */}
                  {customer.paymentMethod === 'pago_movil' && (
                    <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 space-y-1.5 text-[11px]">
                      <div className="flex justify-between items-center text-neutral-300">
                        <span>Banco:</span>
                        <span className="font-bold text-white">{pagoMovil.bank}</span>
                      </div>
                      <div className="flex justify-between items-center text-neutral-300">
                        <span>Teléfono:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-white">{pagoMovil.phone}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(pagoMovil.phone, 'phone')}
                            className="text-neutral-400 hover:text-amber-400 cursor-pointer"
                          >
                            {copiedField === 'phone' ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-neutral-300">
                        <span>Cédula / RIF:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-white">{pagoMovil.idNumber}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(pagoMovil.idNumber, 'rif')}
                            className="text-neutral-400 hover:text-amber-400 cursor-pointer"
                          >
                            {copiedField === 'rif' ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                      {pagoMovil.accountHolder && (
                        <div className="text-[10px] text-neutral-500 pt-1">
                          Titular: {pagoMovil.accountHolder}
                        </div>
                      )}
                    </div>
                  )}

                  {customer.paymentMethod === 'transferencia' && (
                    <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 space-y-1.5 text-[11px]">
                      <div className="flex justify-between items-center text-neutral-300">
                        <span>Banco:</span>
                        <span className="font-bold text-white">{transferencia.bank}</span>
                      </div>
                      {transferencia.accountNumber && (
                        <div className="flex justify-between items-center text-neutral-300">
                          <span>Cuenta ({transferencia.accountType || 'Corriente'}):</span>
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-white text-[10px]">
                              {transferencia.accountNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(transferencia.accountNumber, 'acct')
                              }
                              className="text-neutral-400 hover:text-amber-400 cursor-pointer"
                            >
                              {copiedField === 'acct' ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-neutral-300">
                        <span>Cédula / RIF:</span>
                        <span className="font-mono text-white">{transferencia.idNumber}</span>
                      </div>
                      <div className="text-[10px] text-neutral-500 pt-1">
                        Titular: {transferencia.accountHolder}
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
                          <span className="font-mono text-white font-bold">
                            {binance.payId}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(binance.payId, 'binance')}
                            className="text-neutral-400 hover:text-amber-400 cursor-pointer"
                          >
                            {copiedField === 'binance' ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                      {binance.email && (
                        <div className="flex justify-between items-center text-neutral-300">
                          <span>Correo Binance:</span>
                          <span className="font-mono text-white text-[10px]">
                            {binance.email}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {customer.paymentMethod === 'divisas' && (
                    <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 text-[11px] text-neutral-300">
                      Pago presencial en divisas en efectivo ($ USD o € EUR) al retirar o recibir tu Delivery.
                    </div>
                  )}

                  {customer.paymentMethod !== 'divisas' && (
                    <input
                      type="text"
                      placeholder="Nro. de referencia del pago (opcional)"
                      value={customer.paymentReference || ''}
                      onChange={(e) =>
                        setCustomer({ ...customer, paymentReference: e.target.value })
                      }
                      className="w-full mt-2.5 bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                    />
                  )}
                </div>

                {/* Additional Notes */}
                <div>
                  <textarea
                    rows={2}
                    placeholder="Notas adicionales para el taller o despacho..."
                    value={customer.notes}
                    onChange={(e) =>
                      setCustomer({ ...customer, notes: e.target.value })
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </form>
            )}
          </div>

          {/* Footer Totals & Action */}
          {cart.length > 0 && step !== 'confirmed' && (
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
                    type="submit"
                    form="checkout-form"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-neutral-950 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>
                      {isSubmitting
                        ? 'Registrando Pedido...'
                        : 'Confirmar Pedido y Enviar Comprobante'}
                    </span>
                  </button>

                  <button
                    type="button"
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
