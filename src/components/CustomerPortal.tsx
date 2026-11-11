import React, { useState } from 'react';
import { Search, Wrench, CheckCircle2, Clock, ShieldCheck, MessageSquare, AlertCircle, Calendar, User, Phone, Tag } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ApiService } from '../services/api';
import { WorkshopOrder, WorkshopServiceStatus } from '../types';
import { formatDualPrice, formatUsd, formatBs, generateWhatsAppConsultLink } from '../utils/formatters';

const STATUS_STEPS: Array<{ key: WorkshopServiceStatus; label: string }> = [
  { key: 'recepcion', label: 'Recepción' },
  { key: 'diagnostico', label: 'Diagnóstico' },
  { key: 'espera_repuestos', label: 'Repuestos' },
  { key: 'en_reparacion', label: 'En Reparación' },
  { key: 'control_calidad', label: 'Control Calidad' },
  { key: 'lista_entrega', label: 'Lista para Entrega' },
];

export const CustomerPortal: React.FC = () => {
  const { bcvRateInfo, settings } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<WorkshopOrder[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (queryToUse?: string) => {
    const q = (queryToUse !== undefined ? queryToUse : searchQuery).trim();
    if (!q) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const results = await ApiService.searchWorkshopOrder(q);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuickLookup = (val: string) => {
    setSearchQuery(val);
    handleSearch(val);
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
          <Wrench className="w-3.5 h-3.5" />
          <span>Portal Exclusivo de Autoservicio Servimotos Cristo Centro</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Consulta el Estatus de tu Moto en Taller
        </h2>
        <p className="text-sm text-neutral-300">
          Ingresa tu número de teléfono celular o la placa de tu moto para conocer en tiempo real la fase de reparación, repuestos montados y presupuesto.
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
              placeholder="Escribe tu placa (ej. AA1B23C) o teléfono (ej. 04122242450)..."
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-400 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none transition-colors"
            />
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={isSearching}
            className="px-5 py-3 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
          >
            {isSearching ? 'Consultando...' : 'Consultar'}
          </button>
        </div>

        {/* Quick test chips */}
        <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-neutral-500 text-[11px]">Pruebas rápidas:</span>
          <button
            onClick={() => handleQuickLookup('AA1B23C')}
            className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] cursor-pointer"
          >
            Placa: AA1B23C (Empire Horse)
          </button>
          <button
            onClick={() => handleQuickLookup('AC4D77E')}
            className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] cursor-pointer"
          >
            Placa: AC4D77E (Bera SBR)
          </button>
          <button
            onClick={() => handleQuickLookup('04122242450')}
            className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] cursor-pointer"
          >
            Tlf: 0412-2242450
          </button>
        </div>
      </div>

      {/* Results Section */}
      <div className="mt-10 space-y-6">
        {hasSearched && searchResults && searchResults.length === 0 && (
          <div className="text-center py-12 bg-neutral-900/60 rounded-2xl border border-neutral-800 p-6">
            <AlertCircle className="w-10 h-10 text-neutral-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-white">No se encontró orden activa con ese dato</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
              Verifica haber ingresado los números completos de tu teléfono o las letras y dígitos de la placa de tu moto. Si recién dejaste tu moto en taller, puede tomar unos minutos en registrarse en el sistema central.
            </p>
            <a
              href={`https://wa.me/${settings.phoneWhatsapp}?text=Hola%20Servimotos%20Cristo%20Centro,%20quisiera%20consultar%20el%20estatus%20de%20mi%20moto.`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold rounded-lg transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Preguntar por WhatsApp al Taller</span>
            </a>
          </div>
        )}

        {searchResults &&
          searchResults.map((order) => {
            const currentStepIdx = getStepIndex(order.status);
            const totalDual = formatDualPrice(order.totalUsd, bcvRateInfo.rateBcv);
            const laborDual = formatDualPrice(order.laborUsd, bcvRateInfo.rateBcv);
            const whatsappLink = generateWhatsAppConsultLink(order, settings.phoneWhatsapp);

            return (
              <div
                key={order.id}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6"
              >
                {/* Top Bar: Order & Bike Banner */}
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
                      <span>Color: {order.bikeColor}</span>
                      <span>Kilometraje: {order.mileageKm.toLocaleString()} km</span>
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
                    <p className="text-sm font-semibold text-white">{order.mechanicInCharge}</p>
                    <p className="text-xs text-neutral-400 mt-2">
                      <span className="text-neutral-500 font-medium">Motivo de ingreso:</span>{' '}
                      {order.issueReported}
                    </p>
                  </div>

                  <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                    <div className="flex items-center gap-2 text-xs font-bold text-neutral-300 mb-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>Trabajos Realizados:</span>
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
                    <span>Repuestos Instalados</span>
                    <span>Subtotal ($ USD / Bs.)</span>
                  </div>

                  <div className="divide-y divide-neutral-900 text-xs">
                    {order.partsUsed.map((part, i) => {
                      const partPrice = formatDualPrice(part.priceUsd * part.quantity, bcvRateInfo.rateBcv);
                      return (
                        <div key={i} className="py-2 flex items-center justify-between text-neutral-300">
                          <div>
                            <span className="font-medium text-white">{part.name}</span>
                            <span className="text-neutral-500 text-[11px] ml-2">x{part.quantity}</span>
                          </div>
                          <div className="text-right font-mono">
                            <span className="text-white font-bold">{partPrice.usd}</span>
                            <span className="text-neutral-500 text-[10px] ml-1.5">{partPrice.bs}</span>
                          </div>
                        </div>
                      );
                    })}

                    <div className="py-2 flex items-center justify-between text-neutral-300">
                      <span>Mano de obra técnica especializada</span>
                      <div className="text-right font-mono">
                        <span className="text-white font-bold">{laborDual.usd}</span>
                        <span className="text-neutral-500 text-[10px] ml-1.5">{laborDual.bs}</span>
                      </div>
                    </div>
                  </div>

                  {/* Total Box */}
                  <div className="pt-3 border-t border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs text-neutral-400 block">Total a Cancelar (Repuestos + Mano de Obra):</span>
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

                {order.notes && (
                  <div className="p-3 bg-neutral-950/60 rounded-lg border border-neutral-850 text-xs text-neutral-400">
                    <span className="font-semibold text-neutral-300">Observaciones del taller:</span>{' '}
                    {order.notes}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};
