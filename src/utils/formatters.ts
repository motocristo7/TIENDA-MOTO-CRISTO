import { CartItem, CustomerData, WorkshopOrder } from '../types';

/**
 * Formats a number to Venezuelan currency style: 1.250,50 Bs.
 */
export function formatBs(amountBs: number): string {
  const rounded = Number(amountBs.toFixed(2));
  return (
    new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rounded) + ' Bs.'
  );
}

/**
 * Formats a number in USD currency: $12.50
 */
export function formatUsd(amountUsd: number): string {
  return (
    '$' +
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amountUsd)
  );
}

/**
 * Formats dual price string: "$15.00 · 786,00 Bs."
 */
export function formatDualPrice(
  amountUsd: number,
  rateBcv: number
): {
  usd: string;
  bs: string;
  combined: string;
} {
  const usdFormatted = formatUsd(amountUsd);
  const bsAmount = amountUsd * rateBcv;
  const bsFormatted = formatBs(bsAmount);
  return {
    usd: usdFormatted,
    bs: bsFormatted,
    combined: `${usdFormatted} · ${bsFormatted}`,
  };
}

/**
 * Generates official WhatsApp checkout link with formatted order & payment receipt details
 */
export function generateWhatsAppOrderLink(
  items: CartItem[],
  customer: CustomerData,
  rateBcv: number,
  storeWhatsapp: string,
  orderId?: string,
  commercialName = 'Servimotos Cristo Centro',
  onlineStoreName = 'Mercado Moto CC'
): string {
  const totalUsd = items.reduce(
    (acc, item) => acc + item.product.priceUsd * item.quantity,
    0
  );
  const totalBs = totalUsd * rateBcv;

  const paymentLabels: Record<string, string> = {
    pago_movil: 'Pago Móvil',
    transferencia: 'Transferencia Bancaria',
    binance: 'Binance Pay (USDT)',
    divisas: 'Divisas en Efectivo',
  };

  const lines: string[] = [
    `🏍️ *NUEVO PEDIDO - ${onlineStoreName.toUpperCase()}*`,
    `_(${commercialName})_`,
    orderId ? `🆔 *Pedido:* ${orderId.toUpperCase()}` : '',
    '',
    '*DATOS DEL CLIENTE:*',
    `• Nombre: ${customer.fullName}`,
    `• Teléfono: ${customer.phone}`,
    `• Cédula/RIF: ${customer.idNumber}`,
    `• Ciudad / Estado: ${customer.cityState}`,
    '',
    '*MÉTODO DE ENVÍO / ENTREGA:*',
    `• Entrega: ${customer.shippingAgency}`,
    customer.agencyOfficeAddress
      ? `• Dirección / Oficina: ${customer.agencyOfficeAddress}`
      : '',
    '',
    '*MÉTODO DE PAGO:*',
    `• ${paymentLabels[customer.paymentMethod] || customer.paymentMethod}`,
    customer.paymentReference
      ? `• Nro. de Referencia / Comprobante: *${customer.paymentReference}*`
      : '',
    '',
    '*DETALLE DE REPUESTOS:*',
  ];

  items.forEach((item, index) => {
    const itemTotalUsd = item.product.priceUsd * item.quantity;
    const itemTotalBs = itemTotalUsd * rateBcv;
    lines.push(
      `${index + 1}. *${item.product.name}* (x${item.quantity})`,
      `   SKU: ${item.product.sku || item.product.code} | Marca: ${item.product.brand}`,
      `   Subtotal: ${formatUsd(itemTotalUsd)} / ${formatBs(itemTotalBs)}`
    );
  });

  lines.push(
    '',
    '-----------------------------',
    '*TOTAL A PAGAR:*',
    `💵 *${formatUsd(totalUsd)} USD*`,
    `🇻🇪 *${formatBs(totalBs)}* _(Tasa BCV: ${rateBcv.toFixed(2)} Bs./$)_`,
    '-----------------------------'
  );

  if (customer.notes && customer.notes.trim()) {
    lines.push('', `*Notas:* ${customer.notes.trim()}`);
  }

  lines.push(
    '',
    'Adjunto mi comprobante para confirmar el despacho de este pedido. ¡Gracias!'
  );

  const cleanText = lines.filter((l) => l !== '').join('\n');
  const encodedText = encodeURIComponent(cleanText);
  const cleanPhone = storeWhatsapp.replace(/\D/g, '');

  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

/**
 * Generates WhatsApp inquiry link for a workshop service order
 */
export function generateWhatsAppConsultLink(
  order: WorkshopOrder,
  storeWhatsapp: string,
  commercialName = 'Servimotos Cristo Centro'
): string {
  const text = `Hola ${commercialName}, quisiera consultar información sobre el servicio de mi moto:
• Orden: #${order.orderNumber}
• Vehículo: ${order.bikeBrand} ${order.bikeModel} (${order.bikePlate})
• Propietario: ${order.clientName}
• Estado actual: ${order.statusLabel}

¿Podrían darme más detalles o tiempo estimado de entrega? Gracias.`;

  const cleanPhone = storeWhatsapp.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}
