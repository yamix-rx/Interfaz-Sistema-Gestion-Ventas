import {
  createContext, useContext, useState, useEffect,
  useRef, useCallback, ReactNode,
} from 'react';

export type Rol = 'Administrador' | 'Supervisor' | 'Vendedor';

export interface Usuario {
  id:     number;
  nombre: string;
  email:  string;
  rol:    Rol;
}

interface AuthContextValue {
  usuario:        Usuario | null;
  token:          string  | null;
  isLoading:      boolean;
  onlineSeconds:  number;        
  login:          (email: string, password: string) => Promise<void>;
  logout:         () => void;
  hasRole:        (...roles: Rol[]) => boolean;
}

const TOKEN_KEY   = 'fs_token';
const USUARIO_KEY = 'fs_usuario';
const LOGIN_AT_KEY = 'fs_login_at';   
const API         = 'http://localhost:3001/api';

const INACTIVITY_LIMIT_MS = 5 * 60 * 1000; 

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click',
];

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token,          setToken]          = useState<string  | null>(null);
  const [usuario,        setUsuario]        = useState<Usuario | null>(null);
  const [isLoading,      setIsLoading]      = useState(true);
  const [onlineSeconds,  setOnlineSeconds]  = useState(0);

  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onlineIntervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  // logout (useCallback para usarlo en efectos sin ciclos)
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
    localStorage.removeItem(LOGIN_AT_KEY);
    setToken(null);
    setUsuario(null);
    setOnlineSeconds(0);

    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (onlineIntervalRef.current)  clearInterval(onlineIntervalRef.current);
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      // Cierra sesión y avisa al usuario
      logout();
      // Pequeño delay para que React termine de limpiar el estado
      setTimeout(() => {
        alert('⏱️ Sesión cerrada por inactividad. Por favor vuelve a iniciar sesión.');
      }, 100);
    }, INACTIVITY_LIMIT_MS);
  }, [logout]);

  const startSession = useCallback((loginAt: number) => {
    // Timer de tiempo en línea
    if (onlineIntervalRef.current) clearInterval(onlineIntervalRef.current);
    const updateSeconds = () => {
      setOnlineSeconds(Math.floor((Date.now() - loginAt) / 1000));
    };
    updateSeconds();
    onlineIntervalRef.current = setInterval(updateSeconds, 1000);

    // Escuchar actividad del usuario
    ACTIVITY_EVENTS.forEach((ev) =>
      window.addEventListener(ev, resetInactivityTimer, { passive: true })
    );
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  // Restaurar sesión al montar 
  useEffect(() => {
    const storedToken   = localStorage.getItem(TOKEN_KEY);
    const storedUsuario = localStorage.getItem(USUARIO_KEY);
    const storedLoginAt = localStorage.getItem(LOGIN_AT_KEY);

    if (storedToken && storedUsuario) {
      setToken(storedToken);
      setUsuario(JSON.parse(storedUsuario));
      const loginAt = storedLoginAt ? parseInt(storedLoginAt, 10) : Date.now();
      startSession(loginAt);
    }
    setIsLoading(false);

    // Cleanup al desmontar
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (onlineIntervalRef.current)  clearInterval(onlineIntervalRef.current);
      ACTIVITY_EVENTS.forEach((ev) =>
        window.removeEventListener(ev, resetInactivityTimer)
      );
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // login 
  const login = async (email: string, password: string): Promise<void> => {
    const res = await fetch(`${API}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Error al iniciar sesión.');
    }

    const loginAt = Date.now();
    localStorage.setItem(TOKEN_KEY,    data.token);
    localStorage.setItem(USUARIO_KEY,  JSON.stringify(data.usuario));
    localStorage.setItem(LOGIN_AT_KEY, String(loginAt));

    setToken(data.token);
    setUsuario(data.usuario);
    startSession(loginAt);
  };

  // hasRole 
  const hasRole = (...roles: Rol[]): boolean => {
    if (!usuario) return false;
    return roles.includes(usuario.rol);
  };

  return (
    <AuthContext.Provider value={{ usuario, token, isLoading, onlineSeconds, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook 

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
