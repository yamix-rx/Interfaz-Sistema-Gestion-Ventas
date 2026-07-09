import { useState, useEffect, useRef } from 'react';
import { Lock, User, AlertCircle, Loader2, ShieldOff, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LectorVozLogin } from './LectorVoz';

const MAX_ATTEMPTS   = 3;
const LOCKOUT_SECS   = 30; 

export default function Login() {
  const { login } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  // Control de intentos fallidos
  const [attempts,     setAttempts]     = useState(0);      
  const [lockedOut,    setLockedOut]    = useState(false);  
  const [countdown,    setCountdown]    = useState(0);       

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Iniciar bloqueo 
  const startLockout = () => {
    setLockedOut(true);
    setCountdown(LOCKOUT_SECS);
    setError('');

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          setLockedOut(false);
          setAttempts(0);
          setError('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Limpiar interval al desmontar
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // Submit 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockedOut) return;

    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Por favor ingresa tu email y contraseña.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      setAttempts(0);
    } catch (err: any) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        startLockout();
      } else {
        setError(err.message || 'Credenciales incorrectas.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Intentos restantes antes de bloqueo 
  const attemptsLeft = MAX_ATTEMPTS - attempts;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[oklch(0.488_0.243_264.376)] mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h1 className="text-3xl text-white mb-2">Farmacia Sanet</h1>
          <p className="text-muted-foreground">Sistema de Gestión de Ventas e Inventario</p>
        </div>

        {/* Login Form */}
        <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ── Bloqueo activo ─────────────────────────────────────────── */}
            {lockedOut && (
              <div className="flex flex-col items-center gap-3 bg-orange-500/10 border border-orange-500/40 rounded-lg px-4 py-5 text-center">
                <ShieldOff className="w-8 h-8 text-orange-400" />
                <div>
                  <p className="text-sm font-semibold text-orange-300">Cuenta bloqueada temporalmente</p>
                  <p className="text-xs text-orange-400/80 mt-1">
                    Demasiados intentos fallidos. Espera antes de intentarlo de nuevo.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-orange-500/20 rounded-full px-4 py-2 mt-1">
                  <Clock className="w-4 h-4 text-orange-300" />
                  <span className="text-lg font-mono font-bold text-orange-200">
                    {countdown}s
                  </span>
                </div>
              </div>
            )}

            {/* ── Error normal ───────────────────────────────────────────── */}
            {error && !lockedOut && (
              <div className="flex flex-col gap-1 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
                {attempts > 0 && attempts < MAX_ATTEMPTS && (
                  <p className="text-xs text-red-400/70 pl-8">
                    Intentos restantes: <span className="font-semibold text-red-300">{attemptsLeft}</span> de {MAX_ATTEMPTS}
                  </p>
                )}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Email</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@farmacia.com"
                  disabled={loading || lockedOut}
                  className="w-full bg-[oklch(0.269_0_0)] border border-[oklch(0.269_0_0)] rounded-lg pl-11 pr-4 py-3 text-white placeholder:text-muted-foreground focus:outline-none focus:border-[oklch(0.488_0.243_264.376)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  disabled={loading || lockedOut}
                  className="w-full bg-[oklch(0.269_0_0)] border border-[oklch(0.269_0_0)] rounded-lg pl-11 pr-4 py-3 text-white placeholder:text-muted-foreground focus:outline-none focus:border-[oklch(0.488_0.243_264.376)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Indicador de intentos (solo tras el primer fallo) */}
            {attempts > 0 && !lockedOut && (
              <div className="flex gap-1.5 justify-center">
                {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      i < attempts ? 'bg-red-500' : 'bg-[oklch(0.269_0_0)]'
                    }`}
                  />
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || lockedOut}
              className="w-full flex items-center justify-center gap-2 bg-[oklch(0.488_0.243_264.376)] hover:bg-[oklch(0.438_0.243_264.376)] text-white py-3 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Iniciando sesión…</span>
                </>
              ) : lockedOut ? (
                <>
                  <Clock className="w-5 h-5" />
                  <span>Bloqueado ({countdown}s)</span>
                </>
              ) : (
                <span>Iniciar Sesión</span>
              )}
            </button>
          </form>
        </div>

        {/* Lector de voz para usuarios con discapacidad visual */}
        <LectorVozLogin />

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2026 Farmacia Sanet. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
