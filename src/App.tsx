import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Catalog } from './components/Catalog';
import { CustomerPortal } from './components/CustomerPortal';
import { ShippingPaymentInfo } from './components/ShippingPaymentInfo';
import { CartDrawer } from './components/CartDrawer';
import { Footer } from './components/Footer';
import { CheckCircle2, MessageSquare } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeView, toastMessage, settings } = useStore();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between selection:bg-amber-400 selection:text-neutral-950">
      <div>
        <Navbar />

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-neutral-900 border border-amber-500/40 text-white text-xs font-semibold rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Views */}
        <main>
          {activeView === 'catalog' && (
            <>
              <Hero />
              <Catalog />
            </>
          )}

          {activeView === 'workshop' && <CustomerPortal />}

          {activeView === 'shipping-payment' && <ShippingPaymentInfo />}
        </main>
      </div>

      {/* Floating Direct WhatsApp Action */}
      <a
        href={`https://wa.me/${settings.phoneWhatsapp}?text=Hola%20Servimotos%20Cristo%20Centro,%20tengo%20una%20consulta.`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-3.5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs rounded-full shadow-lg transition-transform hover:scale-105 cursor-pointer"
        title="Contactar a Servimotos Cristo Centro por WhatsApp"
      >
        <MessageSquare className="w-4 h-4" />
        <span className="hidden sm:inline">WhatsApp Taller</span>
      </a>

      {/* Slide-out Cart & Checkout Drawer */}
      <CartDrawer />

      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <MainLayout />
    </StoreProvider>
  );
}
