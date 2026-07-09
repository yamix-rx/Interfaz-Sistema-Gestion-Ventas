/**
 * src/app/components/LectorVoz.tsx
 *
 * Componente de lectura en voz alta usando la Web Speech API (SpeechSynthesis).
 * Implementa la inclusividad para usuarios con discapacidad visual.
 *
 * Uso:
 *   <LectorVoz texto="El texto que quieres que se lea en voz alta" />
 *
 * También exporta el hook useLectorVoz() para uso programático.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Square } from 'lucide-react';

// ── Hook base ─────────────────────────────────────────────────────────────────

export function useLectorVoz() {
  const [hablando,   setHablando]   = useState(false);
  const [disponible, setDisponible] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setDisponible('speechSynthesis' in window);
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const leer = useCallback((texto: string) => {
    if (!('speechSynthesis' in window) || !texto.trim()) return;

    // Cancela cualquier lectura en curso
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(texto);
    utter.lang  = 'es-PE';   // Español Perú
    utter.rate  = 0.95;
    utter.pitch = 1;
    utter.volume = 1;

    utter.onstart = () => setHablando(true);
    utter.onend   = () => setHablando(false);
    utter.onerror = () => setHablando(false);

    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, []);

  const detener = useCallback(() => {
    window.speechSynthesis?.cancel();
    setHablando(false);
  }, []);

  return { leer, detener, hablando, disponible };
}

// ── Componente botón ──────────────────────────────────────────────────────────

interface LectorVozProps {
  texto:       string;
  label?:      string;    // texto del tooltip
  className?:  string;
  size?:       'sm' | 'md';
}

export default function LectorVoz({
  texto,
  label    = 'Leer en voz alta',
  className = '',
  size     = 'md',
}: LectorVozProps) {
  const { leer, detener, hablando, disponible } = useLectorVoz();

  if (!disponible) return null;

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const padSize  = size === 'sm' ? 'p-1.5'        : 'p-2';

  return (
    <button
      type="button"
      onClick={() => hablando ? detener() : leer(texto)}
      title={hablando ? 'Detener lectura' : label}
      aria-label={hablando ? 'Detener lectura' : label}
      className={`
        inline-flex items-center justify-center rounded-lg transition-all
        ${padSize}
        ${hablando
          ? 'bg-[oklch(0.488_0.243_264.376)] text-white animate-pulse'
          : 'bg-[oklch(0.269_0_0)] text-muted-foreground hover:text-white hover:bg-[oklch(0.32_0_0)]'
        }
        ${className}
      `}
    >
      {hablando
        ? <Square className={iconSize} />
        : <Volume2 className={iconSize} />
      }
    </button>
  );
}

// ── Componente barra flotante (para el Login) ─────────────────────────────────

/**
 * Barra flotante que lee el contenido de la pantalla de login.
 * Incluye botón de activar/desactivar y describe la aplicación.
 */
export function LectorVozLogin() {
  const { leer, detener, hablando, disponible } = useLectorVoz();

  const TEXTO_LOGIN = `
    Bienvenido al Sistema de Gestión Farmacia Sanet.
    Para iniciar sesión, ingrese su correo electrónico y contraseña.
    Si olvida su contraseña, contacte al administrador del sistema.
    Este sistema cuenta con tres roles de usuario: Administrador, Supervisor y Vendedor.
    Tiene un máximo de tres intentos de inicio de sesión antes de que la cuenta sea bloqueada temporalmente.
  `.replace(/\s+/g, ' ').trim();

  if (!disponible) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        type="button"
        onClick={() => hablando ? detener() : leer(TEXTO_LOGIN)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all
          ${hablando
            ? 'bg-[oklch(0.488_0.243_264.376)] text-white'
            : 'bg-[oklch(0.269_0_0)] text-muted-foreground hover:text-white'}
        `}
        aria-label={hablando ? 'Detener lectura' : 'Leer instrucciones en voz alta'}
      >
        {hablando
          ? <><Square className="w-3 h-3" /> Detener lectura</>
          : <><Volume2 className="w-3 h-3" /> Leer instrucciones</>
        }
      </button>
    </div>
  );
}
