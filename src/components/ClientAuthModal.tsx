import React, { useState } from 'react';
import { X, UserCheck, LogIn, UserPlus, LogOut, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { registerClientUser, loginClientUser } from '../services/firebaseStore';

interface ClientAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClientAuthModal: React.FC<ClientAuthModalProps> = ({ isOpen, onClose }) => {
  const { clientUser, setClientUser, signOutClient, showToast } = useStore();
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === 'register') {
      if (!name.trim() || !document.trim() || !phone.trim() || !email.trim() || !password.trim()) {
        setErrorMsg('Completa todos los campos para registrarte.');
        return;
      }
      if (password.trim().length < 6) {
        setErrorMsg('La clave debe tener al menos 6 caracteres.');
        return;
      }
    } else {
      if (!email.trim() || !password.trim()) {
        setErrorMsg('Ingresa tu correo y clave.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === 'register') {
        const created = await registerClientUser({
          name,
          document,
          phone,
          email,
          password,
        });
        setClientUser(created);
        showToast(`¡Bienvenido, ${created.name}! Cuenta de cliente creada.`);
      } else {
        const logged = await loginClientUser({ email, password });
        setClientUser(logged);
        showToast(`¡Hola de nuevo, ${logged.name}!`);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'No se pudo completar la operación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              {clientUser ? 'Mi Cuenta de Cliente' : 'Portal de Clientes'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {clientUser ? (
          <div className="p-6 space-y-5 text-xs">
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Nombre:</span>
                <span className="font-bold text-white">{clientUser.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Cédula / RIF:</span>
                <span className="font-mono text-white">{clientUser.document || 'No registrada'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Teléfono:</span>
                <span className="font-mono text-white">{clientUser.phone || 'No registrado'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Correo:</span>
                <span className="text-neutral-200">{clientUser.email}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                <span className="text-neutral-400">Tipo de cuenta:</span>
                <span className="text-amber-400 font-bold uppercase tracking-wider">
                  {clientUser.role}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Tus datos se completarán automáticamente al realizar pedidos en el carrito y al consultar tu historial de facturas o moto en taller.
            </p>

            <button
              onClick={async () => {
                await signOutClient();
                onClose();
              }}
              className="w-full py-2.5 px-4 bg-neutral-800 hover:bg-red-500/20 hover:text-red-300 border border-neutral-700 text-neutral-200 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        ) : (
          <div>
            {/* Mode Switcher */}
            <div className="flex border-b border-neutral-800 bg-neutral-950/60 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-3 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                  mode === 'register'
                    ? 'border-amber-400 text-amber-400 bg-neutral-900'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Registrarme</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-3 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                  mode === 'login'
                    ? 'border-amber-400 text-amber-400 bg-neutral-900'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Ya tengo cuenta</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-xs">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                  {errorMsg}
                </div>
              )}

              {mode === 'register' && (
                <>
                  <div>
                    <label className="text-neutral-300 font-medium block mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej. Carlos Pérez"
                      className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-400 rounded-lg px-3 py-2 text-white placeholder-neutral-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-neutral-300 font-medium block mb-1">
                        Cédula / RIF *
                      </label>
                      <input
                        type="text"
                        value={document}
                        onChange={(e) => setDocument(e.target.value)}
                        placeholder="Ej. V-24501234"
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-400 rounded-lg px-3 py-2 text-white placeholder-neutral-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-neutral-300 font-medium block mb-1">
                        Teléfono / WhatsApp *
                      </label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ej. 04121234567"
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-400 rounded-lg px-3 py-2 text-white placeholder-neutral-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="text-neutral-300 font-medium block mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-400 rounded-lg px-3 py-2 text-white placeholder-neutral-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-neutral-300 font-medium block mb-1">
                  Clave de Acceso *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-400 rounded-lg px-3 py-2 text-white placeholder-neutral-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-neutral-950 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Procesando...'
                    : mode === 'register'
                    ? 'Crear Cuenta de Cliente'
                    : 'Iniciar Sesión'}
                </span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
