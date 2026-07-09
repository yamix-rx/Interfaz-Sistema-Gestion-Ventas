import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, ShieldX, RefreshCw, Search,
  ChevronLeft, ChevronRight, Monitor, Clock, User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Tipos 

interface RegistroLogin {
  id:          number;
  usuario_id:  number | null;
  email:       string;
  nombre:      string | null;
  rol:         string | null;
  resultado:   'Exitoso' | 'Fallido';
  ip_address:  string | null;
  detalle:     string | null;
  fecha_hora:  string;
}

interface Respuesta {
  total:      number;
  pagina:     number;
  limite:     number;
  registros:  RegistroLogin[];
}

const API = 'http://localhost:3001/api';
const LIMITE = 15;

// Helpers 

function formatFecha(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('es-PE', {
    day:    '2-digit', month: '2-digit', year: 'numeric',
    hour:   '2-digit', minute: '2-digit', second: '2-digit',
  });
}

const ROL_COLOR: Record<string, string> = {
  Administrador: 'text-[oklch(0.488_0.243_264.376)] bg-[oklch(0.488_0.243_264.376)]/10',
  Supervisor:    'text-[oklch(0.769_0.188_70.08)]   bg-[oklch(0.769_0.188_70.08)]/10',
  Vendedor:      'text-[oklch(0.696_0.17_162.48)]   bg-[oklch(0.696_0.17_162.48)]/10',
};

// Componente

export default function HistorialLogin() {
  const { token } = useAuth();

  const [data,       setData]       = useState<Respuesta | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [pagina,     setPagina]     = useState(1);
  const [filtroEmail,   setFiltroEmail]   = useState('');
  const [filtroResultado, setFiltroResultado] = useState('');

  // Carga de datos
  const cargar = useCallback(async (pag: number, email: string, resultado: string) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        pagina:  String(pag),
        limite:  String(LIMITE),
        ...(email     ? { email }     : {}),
        ...(resultado ? { resultado } : {}),
      });

      const res = await fetch(`${API}/auth/historial?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Error al cargar historial.');
      }
      const json: Respuesta = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    cargar(pagina, filtroEmail, filtroResultado);
  }, [pagina, cargar, filtroEmail, filtroResultado]);

  const totalPaginas = data ? Math.ceil(data.total / LIMITE) : 1;

  const aplicarFiltros = () => {
    setPagina(1);
    cargar(1, filtroEmail, filtroResultado);
  };

  // Estadísticas rápidas
  const exitosos = data?.registros.filter(r => r.resultado === 'Exitoso').length ?? 0;
  const fallidos = data?.registros.filter(r => r.resultado === 'Fallido').length ?? 0;

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl text-white">Historial de Accesos</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Registro de todos los intentos de inicio de sesión al sistema
          </p>
        </div>
        <button
          onClick={() => cargar(pagina, filtroEmail, filtroResultado)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[oklch(0.269_0_0)] hover:bg-[oklch(0.3_0_0)] text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Tarjetas resumen */}
      {data && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[oklch(0.488_0.243_264.376)]/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-[oklch(0.488_0.243_264.376)]" />
            </div>
            <div>
              <p className="text-2xl text-white font-semibold">{data.total}</p>
              <p className="text-xs text-muted-foreground">Total registros</p>
            </div>
          </div>
          <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl text-white font-semibold">{exitosos}</p>
              <p className="text-xs text-muted-foreground">Exitosos (pág. actual)</p>
            </div>
          </div>
          <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <ShieldX className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl text-white font-semibold">{fallidos}</p>
              <p className="text-xs text-muted-foreground">Fallidos (pág. actual)</p>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-muted-foreground mb-1.5">Buscar por email</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={filtroEmail}
              onChange={(e) => setFiltroEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && aplicarFiltros()}
              placeholder="usuario@farmacia.com"
              className="w-full bg-[oklch(0.269_0_0)] border border-[oklch(0.269_0_0)] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-[oklch(0.488_0.243_264.376)] transition-colors"
            />
          </div>
        </div>
        <div className="min-w-[160px]">
          <label className="block text-xs text-muted-foreground mb-1.5">Resultado</label>
          <select
            value={filtroResultado}
            onChange={(e) => setFiltroResultado(e.target.value)}
            className="w-full bg-[oklch(0.269_0_0)] border border-[oklch(0.269_0_0)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[oklch(0.488_0.243_264.376)] transition-colors"
          >
            <option value="">Todos</option>
            <option value="Exitoso">Exitoso</option>
            <option value="Fallido">Fallido</option>
          </select>
        </div>
        <button
          onClick={aplicarFiltros}
          className="px-4 py-2 bg-[oklch(0.488_0.243_264.376)] hover:bg-[oklch(0.438_0.243_264.376)] text-white text-sm rounded-lg transition-colors"
        >
          Buscar
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Tabla */}
      <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[oklch(0.269_0_0)]">
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Fecha / Hora</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Usuario</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Rol</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Resultado</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">IP</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Cargando registros…
                  </td>
                </tr>
              ) : data?.registros.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    No se encontraron registros con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                data?.registros.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-[oklch(0.269_0_0)] hover:bg-[oklch(0.23_0_0)] transition-colors"
                  >
                    {/* Fecha */}
                    <td className="px-4 py-3 text-white whitespace-nowrap font-mono text-xs">
                      {formatFecha(r.fecha_hora)}
                    </td>

                    {/* Usuario */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <div>
                          {r.nombre && (
                            <p className="text-white text-xs font-medium">{r.nombre}</p>
                          )}
                          <p className="text-muted-foreground text-xs">{r.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Rol */}
                    <td className="px-4 py-3">
                      {r.rol ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROL_COLOR[r.rol] ?? 'text-muted-foreground bg-muted'}`}>
                          {r.rol}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Resultado */}
                    <td className="px-4 py-3">
                      {r.resultado === 'Exitoso' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full">
                          <ShieldCheck className="w-3 h-3" />
                          Exitoso
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full">
                          <ShieldX className="w-3 h-3" />
                          Fallido
                        </span>
                      )}
                    </td>

                    {/* IP */}
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                        <Monitor className="w-3 h-3" />
                        {r.ip_address || '—'}
                      </span>
                    </td>

                    {/* Detalle */}
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {r.detalle || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {data && totalPaginas > 1 && (
          <div className="px-4 py-3 border-t border-[oklch(0.269_0_0)] flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Mostrando {((pagina - 1) * LIMITE) + 1}–{Math.min(pagina * LIMITE, data.total)} de {data.total} registros
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={pagina <= 1}
                onClick={() => setPagina(p => p - 1)}
                className="p-1.5 rounded-lg hover:bg-[oklch(0.269_0_0)] text-muted-foreground disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-white px-2">
                {pagina} / {totalPaginas}
              </span>
              <button
                disabled={pagina >= totalPaginas}
                onClick={() => setPagina(p => p + 1)}
                className="p-1.5 rounded-lg hover:bg-[oklch(0.269_0_0)] text-muted-foreground disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
