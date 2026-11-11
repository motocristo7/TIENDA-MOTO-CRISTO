import { CartItem, CustomerData, WorkshopOrder } from '../types';

/**
 * Formats a number to Venezuelan currency style: 1.250,50
 */
export function formatBs(amountBs: number): string {
  const rounded = Number(amountBs.toFixed(2));
  return new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rounded) + ' Bs.';
}

/**
 * Formats a number in USD currency: $12.50
 */
export function formatUsd(amountUsd: number): string {
  return '$' + new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountUsd);
}

/**
 * Formats dual price string: "$15.00 | Bs. 786,00"
 */
export function formatDualPrice(amountUsd: number, rateBcv: number): {
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
 * Generates official WhatsApp checkout link with formatted order details
 */
export function generateWhatsAppOrderLink(
  items: CartItem[],
  customer: CustomerData,
  rateBcv: number,
  storeWhatsapp: string
): string {
  const totalUsd = items.reduce((acc, item) => acc + item.product.priceUsd * item.quantity, 0);
  const totalBs = totalUsd * rateBcv;

  const paymentLabels: Record<string, string> = {
    pago_movil: 'Pago Móvil Banesco',
    divisas: 'Divisas en Efectivo (Taller)',
    binance: 'Binance Pay (USDT)',
  };

  const lines: string[] = [
    '🏍️ *NUEVO PEDIDO - MERCADO MOTO CC*',
    '_(Servimotos Cristo Centro)_',
    '',
    '*DATOS DEL CLIENTE:*',
    `• Nombre: ${customer.fullName}`,
    `• Teléfono: ${customer.phone}`,
    `• Cédula/RIF: ${customer.idNumber}`,
    `• Ciudad / Estado: ${customer.cityState}`,
    '',
    '*MÉTODO DE ENVÍO / RETIRO:*',
    `• Entrega: ${customer.shippingAgency}`,
    customer.agencyOfficeAddress ? `• Oficina / Dirección: ${customer.agencyOfficeAddress}` : '',
    '',
    '*MÉTODO DE PAGO:*',
    `• ${paymentLabels[customer.paymentMethod] || customer.paymentMethod}`,
    '',
    '*DETALLE DE REPUESTOS:*',
  ];

  items.forEach((item, index) => {
    const itemTotalUsd = item.product.priceUsd * item.quantity;
    const itemTotalBs = itemTotalUsd * rateBcv;
    lines.push(
      `${index + 1}. *${item.product.name}* (x${item.quantity})`,
      `   Cod: ${item.product.code} | Marca: ${item.product.brand}`,
      `   Subtotal: ${formatUsd(itemTotalUsd)} / ${formatBs(itemTotalBs)}`
    );
  });

  lines.push(
    '',
    '-----------------------------',
    `*TOTAL A PAGAR:*`,
    `💵 *${formatUsd(totalUsd)} USD*`,
    `🇻🇪 *${formatBs(totalBs)}* _(Tasa Oficial BCV: ${rateBcv.toFixed(2)} Bs./$)_`,
    '-----------------------------'
  );

  if (customer.notes && customer.notes.trim()) {
    lines.push('', `*Notas adicionales:* ${customer.notes.trim()}`);
  }

  lines.push('', 'Hola, deseo procesar y confirmar este pedido. ¿Tienen disponibilidad inmediata para despacho?');

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
  storeWhatsapp: string
): string {
  const text = 
`Hola Servimotos Cristo Centro, quisiera consultar información sobre el servicio de mi moto:
• Orden: #${order.orderNumber}
• Vehículo: ${order.bikeBrand} ${order.bikeModel} (${order.bikePlate})
• Propietario: ${order.clientName}
• Estado actual: ${order.statusLabel}

¿Podrían darme más detalles o tiempo estimado de entrega? Gracias.`;

  const cleanPhone = storeWhatsapp.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}
