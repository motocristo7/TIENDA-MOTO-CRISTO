import React, { useState } from 'react';
import {
  Search,
  Wrench,
  CheckCircle2,
  Clock,
  ShieldCheck,
  MessageSquare,
  AlertCircle,
  User,
  Receipt,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { searchCustomerPortal } from '../services/firebaseStore';
import { WorkshopOrder, WorkshopServiceStatus, SaleRecord } from '../types';
import {
  formatDualPrice,
  formatUsd,
  formatBs,
  generateWhatsAppConsultLink,
} from '../utils/formatters';

const STATUS_STEPS: Array<{ key: WorkshopServiceStatus; label: string }> = [
  { key: 'recepcion', label: 'Recepción' },
  { key: 'diagnostico', label: 'Diagnóstico' },
  { key: 'espera_repuestos', label: 'Repuestos' },
  { key: 'en_reparacion', label: 'En Reparación' },
  { key: 'control_calidad', label: 'Control Calidad' },
  { key: 'lista_entrega', label: 'Lista para Entrega' },
];

export const CustomerPortal: React.FC = () => {
  const { bcvRateInfo, settings, clientUser } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [serviceOrders, setServiceOrders] = useState<WorkshopOrder[]>([]);
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'service' | 'sales'>('service');
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async (queryToUse?: string) => {
    const q = (queryToUse !== undefined ? queryToUse : searchQuery).trim();
    if (!q) return;

    setIsSearching(true);
    setHasSearched(true);
    setSearchError(null);
    try {
      const { serviceOrders: orders, sales } = await searchCustomerPortal(q);
      setServiceOrders(orders);
      setSalesHistory(sales);

      // Automatically switch to sales tab if there are sales but no service orders
      if (orders.length === 0 && sales.length > 0) {
        setActiveTab('sales');
      } else {
        setActiveTab('service');
      }
    } catch (err: any) {
      setServiceOrders([]);
      setSalesHistory([]);
      setSearchError(
        err?.message || 'Ocurrió un error al consultar el historial.'
      );
    } finally {
      setIsSearching(false);
    }
  };

  const getStepIndex = (status: WorkshopServiceStatus): number => {
    const map: Record<WorkshopServiceStatus, number> = {
      recepcion: 0,
      diagnostico: 1,
      espera_repuestos: 2,
      en_reparacion: 3,
      control_calidad: 4,
      lista_entrega: 5,
      entregada: 6,
    };
    return map[status] ?? 0;
  };

  const totalFound = serviceOrders.length + salesHistory.length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
          <Wrench className="w-3.5 h-3.5" />
          <span>Portal de Autoservicio · {settings.workshopName}</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Consulta tu Moto en Taller y Facturas
        </h2>
        <p className="text-sm text-neutral-300">
          Ingresa tu número de teléfono, cédula de identidad o la placa de tu moto para consultar en tiempo real el estado de tu reparación y tu historial de facturas.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="mt-8 max-w-xl mx-auto bg-neutral-900 p-3 rounded-2xl border border-neutral-800 shadow-xl">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Teléfono (ej. 0412...), Cédula o Placa de Moto..."
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-400 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none transition-colors"
            />
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={isSearching}
            className="px-5 py-3 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-neutral-950 font-bold text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
          >
            {isSearching ? 'Consultando...' : 'Consultar'}
          </button>
        </div>

        {/* Logged-in client shortcut */}
        {clientUser && (clientUser.document || clientUser.phone) && (
          <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-neutral-500 text-[11px]">Tu cuenta:</span>
            {clientUser.document && (
              <button
                onClick={() => {
                  setSearchQuery(clientUser.document);
                  handleSearch(clientUser.document);
                }}
                className="px-2.5 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-medium cursor-pointer"
              >
                Buscar por mi Cédula ({clientUser.document})
              </button>
            )}
            {clientUser.phone && (
              <button
                onClick={() => {
                  setSearchQuery(clientUser.phone);
                  handleSearch(clientUser.phone);
                }}
                className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] cursor-pointer"
              >
                Buscar por mi Teléfono ({clientUser.phone})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results Tabs */}
      {hasSearched && totalFound > 0 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setActiveTab('service')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'service'
                ? 'bg-amber-400 text-neutral-950'
                : 'bg-neutral-900 text-neutral-300 border border-neutral-800 hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Órdenes de Taller ({serviceOrders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'sales'
                ? 'bg-amber-400 text-neutral-950'
                : 'bg-neutral-900 text-neutral-300 border border-neutral-800 hover:text-white'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Historial de Facturas ({salesHistory.length})</span>
          </button>
        </div>
      )}

      {/* Results Section */}
      <div className="mt-8 space-y-6">
        {hasSearched && !isSearching && totalFound === 0 && (
          <div className="text-center py-12 bg-neutral-900/60 rounded-2xl border border-neutral-800 p-6">
            <AlertCircle className="w-10 h-10 text-neutral-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-white">
              {searchError
                ? 'No pudimos consultar la base de datos'
                : 'No encontramos órdenes ni facturas con ese dato'}
            </h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
              {searchError
                ? searchError
                : 'Verifica haber ingresado correctamente tu teléfono, cédula de identidad o la placa de tu moto.'}
            </p>
            <a
              href={`https://wa.me/${settings.phoneWhatsapp}?text=${encodeURIComponent(
                `Hola ${settings.workshopName}, quisiera consultar el estatus de mi moto o factura (${searchQuery}).`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold rounded-lg transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Preguntar por WhatsApp al Taller</span>
            </a>
          </div>
        )}

        {/* Service Orders List */}
        {activeTab === 'service' &&
          serviceOrders.map((order) => {
            const currentStepIdx = getStepIndex(order.status);
            const totalDual = formatDualPrice(order.totalUsd, bcvRateInfo.rateBcv);
            const laborDual = formatDualPrice(order.laborUsd, bcvRateInfo.rateBcv);
            const whatsappLink = generateWhatsAppConsultLink(
              order,
              settings.phoneWhatsapp,
              settings.workshopName
            );

            return (
              <div
                key={order.id}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6"
              >
                {/* Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
                      <span>ORDEN #{order.orderNumber}</span>
                      <span aria-hidden="true">·</span>
                      <span>Ingreso: {order.entryDate}</span>
                    </div>
                    <h3 className="text-2xl font-black text-white mt-1">
                      {order.bikeBrand} {order.bikeModel}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-neutral-300">
                      <span className="font-mono bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                        Placa: {order.bikePlate}
                      </span>
                      <span>Cliente: {order.clientName}</span>
                      {order.mileageKm > 0 && (
                        <span>Kilometraje: {order.mileageKm.toLocaleString()} km</span>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="sm:text-right">
                    <span className="text-[11px] text-neutral-400 uppercase tracking-wider block font-medium">
                      Estatus Actual:
                    </span>
                    <span className="inline-block mt-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-400/10 border border-amber-400/30 text-amber-400">
                      {order.statusLabel}
                    </span>
                    <span className="text-[11px] text-neutral-500 block mt-1">
                      Estimada: {order.estimatedDeliveryDate}
                    </span>
                  </div>
                </div>

                {/* Progress Timeline Stepper */}
                <div>
                  <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-3">
                    Fases del Servicio Técnico en Taller:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                    {STATUS_STEPS.map((s, idx) => {
                      const isCompleted = currentStepIdx > idx;
                      const isCurrent = currentStepIdx === idx;

                      return (
                        <div
                          key={s.key}
                          className={`p-2.5 rounded-xl border text-center transition-colors ${
                            isCurrent
                              ? 'bg-amber-400/15 border-amber-400 text-amber-300 font-bold'
                              : isCompleted
                              ? 'bg-neutral-950 border-neutral-800 text-emerald-400'
                              : 'bg-neutral-950/50 border-neutral-850 text-neutral-600'
                          }`}
                        >
                          <div className="flex items-center justify-center mb-1">
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : isCurrent ? (
                              <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-neutral-700" />
                            )}
                          </div>
                          <span className="text-[11px] block leading-tight">{s.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mechanic & Diagnosis Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                    <div className="flex items-center gap-2 text-xs font-bold text-neutral-300 mb-2">
                      <User className="w-4 h-4 text-amber-400" />
                      <span>Mecánico Asignado:</span>
                    </div>
                    <p className="text-sm font-semibold text-white">
                      {order.mechanicInCharge}
                    </p>
                    <p className="text-xs text-neutral-400 mt-2">
                      <span className="text-neutral-500 font-medium">
                        Motivo / Observación:
                      </span>{' '}
                      {order.issueReported}
                    </p>
                  </div>

                  <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                    <div className="flex items-center gap-2 text-xs font-bold text-neutral-300 mb-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>Trabajos / Diagnóstico:</span>
                    </div>
                    <ul className="text-xs text-neutral-300 space-y-1 list-disc list-inside">
                      {order.workDone.map((w, i) => (
                        <li key={i} className="leading-relaxed">
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Parts Used & Budget Breakdown */}
                <div className="bg-neutral-950 p-5 rounded-xl border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-xs font-semibold text-neutral-400 uppercase">
                    <span>Detalle de Repuestos y Mano de Obra</span>
                    <span>Subtotal ($ USD / Bs.)</span>
                  </div>

                  <div className="divide-y divide-neutral-900 text-xs">
                    {order.partsUsed.map((part, i) => {
                      const partPrice = formatDualPrice(
                        part.priceUsd * part.quantity,
                        bcvRateInfo.rateBcv
                      );
                      return (
                        <div
                          key={i}
                          className="py-2 flex items-center justify-between text-neutral-300"
                        >
                          <div>
                            <span className="font-medium text-white">{part.name}</span>
                            <span className="text-neutral-500 text-[11px] ml-2">
                              x{part.quantity}
                            </span>
                          </div>
                          <div className="text-right font-mono">
                            <span className="text-white font-bold">{partPrice.usd}</span>
                            <span className="text-neutral-500 text-[10px] ml-1.5">
                              {partPrice.bs}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {order.laborUsd > 0 && (
                      <div className="py-2 flex items-center justify-between text-neutral-300">
                        <span>Mano de obra técnica especializada</span>
                        <div className="text-right font-mono">
                          <span className="text-white font-bold">{laborDual.usd}</span>
                          <span className="text-neutral-500 text-[10px] ml-1.5">
                            {laborDual.bs}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Total Box */}
                  <div className="pt-3 border-t border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs text-neutral-400 block">
                        Total Estimado / Facturado:
                      </span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-2xl font-mono tabular-nums font-extrabold text-amber-400">
                          {totalDual.usd}
                        </span>
                        <span className="text-sm font-mono tabular-nums text-neutral-300">
                          {totalDual.bs}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-500">
                        A tasa oficial BCV: {bcvRateInfo.rateBcv.toFixed(2)} Bs./$
                      </span>
                    </div>

                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Consultar al Mecánico por WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}

        {/* Sales Invoices History */}
        {activeTab === 'sales' &&
          salesHistory.map((sale) => {
            const totalBsDisplay =
              sale.totalBs > 0
                ? formatBs(sale.totalBs)
                : formatBs(sale.totalUsd * bcvRateInfo.rateBcv);

            return (
              <div
                key={sale.id}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
                      <Receipt className="w-4 h-4" />
                      <span>FACTURA #{sale.invoiceNumber}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-neutral-400">{sale.date}</span>
                    </div>
                    <h4 className="text-base font-bold text-white mt-1">
                      {sale.customerName}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 mt-0.5">
                      {sale.customerDocument && <span>Cédula/RIF: {sale.customerDocument}</span>}
                      {sale.customerPhone && <span>Tlf: {sale.customerPhone}</span>}
                      {sale.motorcyclePlate && (
                        <span className="font-mono text-neutral-300">
                          Moto: {sale.motorcycleInfo ? `${sale.motorcycleInfo} · ` : ''}
                          Placa {sale.motorcyclePlate}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <span className="inline-block px-2.5 py-1 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                      {sale.status}
                    </span>
                    <span className="text-[11px] text-neutral-400 block mt-1">
                      Pago: {sale.paymentMethod}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 divide-y divide-neutral-900 text-xs">
                  {sale.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="py-2 flex items-center justify-between gap-2 text-neutral-300"
                    >
                      <div>
                        <span className="font-medium text-white">{item.name}</span>
                        <span className="text-neutral-500 ml-2">x{item.quantity}</span>
                      </div>
                      <span className="font-mono font-bold text-white">
                        {formatUsd(item.totalUsd)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-neutral-400">Total Facturado:</span>
                  <div className="text-right">
                    <span className="text-lg font-mono font-extrabold text-amber-400">
                      {formatUsd(sale.totalUsd)}
                    </span>
                    <span className="text-xs font-mono text-neutral-400 ml-2">
                      ({totalBsDisplay})
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
