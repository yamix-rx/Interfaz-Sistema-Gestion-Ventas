/**
 * src/app/components/Sidebar.tsx
 * Con panel de accesibilidad:
 *  - Toggle alto contraste (WCAG 2.1)
 *  - Control de tamaño de fuente
 *  - Botón lector de voz del menú actual
 */

import {
  LayoutDashboard, ShoppingCart, Package,
  ShoppingBag, BookOpen, BarChart3, Users, LogOut, Shield,
  UserCircle2, Clock, History,
  Eye, EyeOff, Type, Volume2, Glasses,
} from 'lucide-react';
import { useAuth, Rol } from '../context/AuthContext';
import { useAccesibilidad } from '../context/AccesibilidadContext';
import { puedeAcceder } from '../config/permisos';
import LectorVoz from './LectorVoz';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  onLogout:   () => void;
}

const ALL_MENU_ITEMS = [
  { id: 'dashboard',       label: 'Dashboard',            icon: LayoutDashboard },
  { id: 'ventas',          label: 'Ventas',               icon: ShoppingCart    },
  { id: 'inventario',      label: 'Inventario',           icon: Package         },
  { id: 'compras',         label: 'Compras',              icon: ShoppingBag     },
  { id: 'catalogos',       label: 'Catálogos',            icon: BookOpen        },
  { id: 'reportes',        label: 'Reportes',             icon: BarChart3       },
  { id: 'clientes',        label: 'Clientes',             icon: UserCircle2     },
  { id: 'usuarios',        label: 'Usuarios',             icon: Users           },
  { id: 'historial_login', label: 'Historial de Accesos', icon: History         },
];

const ROL_BADGE: Record<Rol, { label: string; color: string }> = {
  Administrador: { label: 'Admin',      color: 'text-[oklch(0.488_0.243_264.376)] bg-[oklch(0.488_0.243_264.376)]/10' },
  Supervisor:    { label: 'Supervisor', color: 'text-[oklch(0.769_0.188_70.08)] bg-[oklch(0.769_0.188_70.08)]/10'     },
  Vendedor:      { label: 'Vendedor',   color: 'text-[oklch(0.696_0.17_162.48)] bg-[oklch(0.696_0.17_162.48)]/10'     },
};

type TamañoFuente = 'normal' | 'grande' | 'extra-grande';

const TAMAÑOS: { valor: TamañoFuente; label: string }[] = [
  { valor: 'normal',       label: 'A'  },
  { valor: 'grande',       label: 'A+' },
  { valor: 'extra-grande', label: 'A++'},
];

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

export default function Sidebar({ activeView, onNavigate, onLogout }: SidebarProps) {
  const { usuario, onlineSeconds } = useAuth();
  const { altoContraste, tamañoFuente, modoDaltonico, toggleAltoContraste, setTamañoFuente, toggleModoDaltonico } = useAccesibilidad();
  const rol = usuario?.rol as Rol;

  const menuItems = ALL_MENU_ITEMS.filter((item) => puedeAcceder(rol, item.id));
  const badge = ROL_BADGE[rol] ?? { label: rol, color: 'text-muted-foreground bg-muted' };

  // Texto del menú actual para el lector de voz
  const vistaActual = ALL_MENU_ITEMS.find(m => m.id === activeView)?.label ?? activeView;
  const textoMenuVoz = `Menú del sistema. Módulo actual: ${vistaActual}. Módulos disponibles: ${menuItems.map(m => m.label).join(', ')}.`;

  return (
    <aside className="w-64 bg-[oklch(0.205_0_0)] border-r border-[oklch(0.269_0_0)] flex flex-col h-screen"
      role="navigation" aria-label="Menú principal">

      {/* Header */}
      <div className="p-6 border-b border-[oklch(0.269_0_0)]">
        <h1 className="text-xl text-white">Farmacia Sanet</h1>
        <p className="text-xs text-muted-foreground mt-1">Sistema de Gestión</p>
      </div>

      {/* Usuario + Timer */}
      {usuario && (
        <div className="px-4 py-3 border-b border-[oklch(0.269_0_0)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[oklch(0.488_0.243_264.376)]/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-[oklch(0.488_0.243_264.376)]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-white truncate">{usuario.nombre}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
                {badge.label}
              </span>
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-2 bg-[oklch(0.269_0_0)] rounded-lg px-3 py-1.5">
            <Clock className="w-3.5 h-3.5 text-[oklch(0.488_0.243_264.376)] flex-shrink-0" aria-hidden="true" />
            <div className="flex flex-col leading-none">
              <span className="text-[10px] text-muted-foreground">Tiempo en línea</span>
              <span className="font-mono text-sm text-white tracking-wider" aria-live="off">
                {formatDuration(onlineSeconds)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── PANEL DE ACCESIBILIDAD ── */}
      <div className="px-4 py-3 border-b border-[oklch(0.269_0_0)] space-y-2">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Accesibilidad</p>

        {/* Fila: alto contraste + lector voz */}
        <div className="flex items-center gap-2">

          {/* Toggle Alto Contraste */}
          <button
            onClick={toggleAltoContraste}
            title={altoContraste ? 'Desactivar alto contraste' : 'Activar alto contraste (WCAG 2.1)'}
            aria-pressed={altoContraste}
            aria-label={altoContraste ? 'Desactivar alto contraste' : 'Activar alto contraste'}
            className={`
              flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-all
              ${altoContraste
                ? 'bg-[oklch(0.488_0.243_264.376)] text-white'
                : 'bg-[oklch(0.269_0_0)] text-muted-foreground hover:text-white'}
            `}
          >
            {altoContraste
              ? <EyeOff className="w-3.5 h-3.5" />
              : <Eye    className="w-3.5 h-3.5" />
            }
            <span>{altoContraste ? 'Contraste ✓' : 'Contraste'}</span>
          </button>

          {/* Lector de voz */}
          <LectorVoz
            texto={textoMenuVoz}
            label="Leer menú en voz alta"
            size="sm"
          />
        </div>

        {/* Modo Daltónico */}
        <button
          onClick={toggleModoDaltonico}
          title={modoDaltonico ? 'Desactivar modo daltónico' : 'Activar modo daltónico (deuteranopia/protanopia)'}
          aria-pressed={modoDaltonico}
          aria-label={modoDaltonico ? 'Desactivar modo daltónico' : 'Activar modo daltónico'}
          className={`
            w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-all
            ${modoDaltonico
              ? 'bg-[#0077BB] text-white'
              : 'bg-[oklch(0.269_0_0)] text-muted-foreground hover:text-white'}
          `}
        >
          <Glasses className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{modoDaltonico ? 'Daltónico ✓' : 'Modo Daltónico'}</span>
        </button>

        {/* Tamaño de fuente */}
        <div className="flex items-center gap-1">
          <Type className="w-3 h-3 text-muted-foreground flex-shrink-0" aria-hidden="true" />
          <span className="text-[10px] text-muted-foreground mr-1">Texto:</span>
          {TAMAÑOS.map(t => (
            <button
              key={t.valor}
              onClick={() => setTamañoFuente(t.valor)}
              title={`Tamaño de fuente: ${t.label}`}
              aria-pressed={tamañoFuente === t.valor}
              aria-label={`Tamaño de texto ${t.label}`}
              className={`
                flex-1 py-1 rounded text-xs font-bold transition-all
                ${tamañoFuente === t.valor
                  ? 'bg-[oklch(0.488_0.243_264.376)] text-white'
                  : 'bg-[oklch(0.269_0_0)] text-muted-foreground hover:text-white'}
              `}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Módulos del sistema">
        {menuItems.map((item) => {
          const Icon     = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                ${isActive
                  ? 'bg-[oklch(0.488_0.243_264.376)] text-white'
                  : 'text-muted-foreground hover:bg-[oklch(0.269_0_0)] hover:text-white'}
              `}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[oklch(0.269_0_0)]">
        <button
          onClick={onLogout}
          aria-label="Cerrar sesión del sistema"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-[oklch(0.269_0_0)] hover:text-destructive transition-all"
        >
          <LogOut className="w-5 h-5" aria-hidden="true" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
