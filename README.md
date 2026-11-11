# Mercado Moto CC

Tienda online de repuestos y portal de autoservicio para clientes de **Servimotos Cristo Centro C.A.** (Caracas, Venezuela).

---

## 🚀 Características Principales

1. **Catálogo Especializado para Venezuela**:
   - Marcas nacionales e importadas: **Empire Keeway**, **Bera**, **Motos Toro**, **Suzuki**, **Yamaha**, **MD Haojin**, **Ava** y Multimarca.
   - Categorías: Motor y Transmisión, Frenos y Suspensión, Eléctrico e Iluminación, Cauchos y Rines, Lubricantes, Accesorios y Cascos certificados.
   - Compatibilidad técnica detallada por modelo (Horse, Owen, Arsen, SBR 150, Merú, GN 125, DT 175, etc.).

2. **Precios Duales en Tiempo Real ($ USD y Bs.)**:
   - Conexión a la tasa oficial del **Banco Central de Venezuela (BCV)** con actualización automática y en vivo.
   - Opción para ajuste de tasa manual si el taller necesita aplicar un cierre específico.

3. **Portal de Autoservicio de Taller ("Rastrear Moto en Taller")**:
   - Consulta instantánea por **número de teléfono** (ej. `04122242450`) o **placa del vehículo** (ej. `AA1B23C`, `AC4D77E`).
   - Muestra las 6 fases de servicio: Recepción, Diagnóstico, Repuestos, En Reparación, Control de Calidad, Lista para Entrega.
   - Detalle de mecánico a cargo, repuestos instalados, mano de obra y presupuesto dual ($ USD y Bs.).
   - Botón directo para consultar al mecánico por WhatsApp con datos precargados.

4. **Carrito y Checkout para Venezuela**:
   - Envíos nacionales con las agencias líderes: **MRW**, **Zoom** y **Tealca**, o **Retiro gratuito en taller Servimotos Cristo Centro**.
   - Métodos de pago venezolanos:
     - **Pago Móvil Banesco** (0134, 0412-2242450, RIF J-50028472-1) con botones de copiado rápido en 1 clic.
     - **Divisas en efectivo** ($ USD / € EUR en caja).
     - **Binance Pay** (USDT Pay ID: 542910384).
   - Generación de pedido formateado y despacho directo al WhatsApp oficial: **+58 412 2242450**.

5. **Sincronización con Sistema Central**:
   - Conexión al backend de Servimotos Cristo Centro en `https://ais-pre-flhofni32tpb4dwfwnak7d-506340403707.us-west1.run.app`.
   - Soporta sincronización en segundo plano con caché local para disponibilidad permanente (Zero-Downtime).

---

## 🛠️ Tecnologías

- **React 19**
- **Vite 6**
- **Tailwind CSS v4**
- **Lucide Icons**
- **TypeScript**

---

## ⚙️ Variables de Entorno (.env)

```env
VITE_MAIN_SYSTEM_URL="https://ais-pre-flhofni32tpb4dwfwnak7d-506340403707.us-west1.run.app"
VITE_STORE_WHATSAPP="584122242450"
```
