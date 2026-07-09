/**
 * src/app/context/AccesibilidadContext.tsx
 *
 * Contexto global de accesibilidad con:
 *  1. Modo Alto Contraste (WCAG 2.1 — ratio ≥ 4.5:1)
 *  2. Tamaño de fuente ajustable (100% / 115% / 130%)
 *  3. Modo Daltónico (deuteranopia/protanopia — reemplaza rojo/verde por azul/naranja)
 *
 * Persiste las preferencias en localStorage.
 */

import {
  createContext, useContext, useState, useEffect,
  useCallback, ReactNode,
} from 'react';

// ── Tipos ─────────────────────────────────────────────────────────────────────

type TamañoFuente = 'normal' | 'grande' | 'extra-grande';

interface AccesibilidadContextValue {
  altoContraste:       boolean;
  tamañoFuente:        TamañoFuente;
  modoDaltonico:       boolean;
  toggleAltoContraste: () => void;
  setTamañoFuente:     (t: TamañoFuente) => void;
  toggleModoDaltonico: () => void;
}

// ── Constantes ────────────────────────────────────────────────────────────────

const ALTO_CONTRASTE_KEY = 'fs_alto_contraste';
const TAMAÑO_FUENTE_KEY  = 'fs_tamaño_fuente';
const DALTONICO_KEY      = 'fs_modo_daltonico';

const ESCALA: Record<TamañoFuente, string> = {
  'normal':       '100%',
  'grande':       '115%',
  'extra-grande': '130%',
};

// ── Contexto ──────────────────────────────────────────────────────────────────

const AccesibilidadContext = createContext<AccesibilidadContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AccesibilidadProvider({ children }: { children: ReactNode }) {

  const [altoContraste, setAltoContraste] = useState<boolean>(() =>
    localStorage.getItem(ALTO_CONTRASTE_KEY) === 'true'
  );

  const [tamañoFuente, setTamañoFuenteState] = useState<TamañoFuente>(() =>
    (localStorage.getItem(TAMAÑO_FUENTE_KEY) as TamañoFuente) || 'normal'
  );

  const [modoDaltonico, setModoDaltonico] = useState<boolean>(() =>
    localStorage.getItem(DALTONICO_KEY) === 'true'
  );

  // ── Alto contraste ──────────────────────────────────────────────────────────
  useEffect(() => {
    const html = document.documentElement;
    altoContraste
      ? html.classList.add('alto-contraste')
      : html.classList.remove('alto-contraste');
    localStorage.setItem(ALTO_CONTRASTE_KEY, String(altoContraste));
  }, [altoContraste]);

  // ── Tamaño de fuente ────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.style.fontSize = ESCALA[tamañoFuente];
    localStorage.setItem(TAMAÑO_FUENTE_KEY, tamañoFuente);
  }, [tamañoFuente]);

  // ── Modo daltónico ──────────────────────────────────────────────────────────
  useEffect(() => {
    const html = document.documentElement;
    modoDaltonico
      ? html.classList.add('modo-daltonico')
      : html.classList.remove('modo-daltonico');
    localStorage.setItem(DALTONICO_KEY, String(modoDaltonico));
  }, [modoDaltonico]);

  const toggleAltoContraste  = useCallback(() => setAltoContraste(p  => !p), []);
  const toggleModoDaltonico  = useCallback(() => setModoDaltonico(p  => !p), []);
  const setTamañoFuente      = useCallback((t: TamañoFuente) => setTamañoFuenteState(t), []);

  return (
    <AccesibilidadContext.Provider value={{
      altoContraste,
      tamañoFuente,
      modoDaltonico,
      toggleAltoContraste,
      setTamañoFuente,
      toggleModoDaltonico,
    }}>
      {children}
    </AccesibilidadContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAccesibilidad(): AccesibilidadContextValue {
  const ctx = useContext(AccesibilidadContext);
  if (!ctx) throw new Error('useAccesibilidad debe usarse dentro de <AccesibilidadProvider>');
  return ctx;
}
