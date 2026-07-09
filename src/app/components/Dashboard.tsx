/**
 * src/app/components/Dashboard.tsx
 * Datos 100% reales desde /api/dashboard
 */

import { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Package, AlertTriangle,
  Calendar, DollarSign, RefreshCw, ShoppingCart,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { apiClient } from '../utils/apiClient';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Metricas {
  ventasDia:       number;
  ventasMes:       number;
  ventasMesAnt:    number;
  cambioPct:       number;
  totalStock:      number;
  totalProductos:  number;
  alertasCriticas: number;
  stockBajoCount:  number;
}

interface ProductoAlerta {
  nombre:      string;
  stock:       number;
  stock_minimo?: number;
  lote?:       string;
  vencimiento?: string;
}

interface DashboardData {
  metricas:        Metricas;
  stockBajo:       ProductoAlerta[];
  proxVencer:      ProductoAlerta[];
  topProductos:    { nombre: string; ventas: number }[];
  ventasMensuales: { mes: string; ventas: number }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  'S/. ' + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtFecha = (iso: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// ── Componente principal ──────────────────────────────────────────────────────

export default function Dashboard() {
  const [data,    setData]    = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const cargar = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient('/api/dashboard');
      if (!res.ok) throw new Error('Error al cargar datos del dashboard.');
      const json: DashboardData = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
        <RefreshCw className="w-8 h-8 animate-spin text-[oklch(0.488_0.243_264.376)]" />
        <p>Cargando datos del dashboard…</p>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full gap-4">
        <AlertTriangle className="w-8 h-8 text-destructive" />
        <p className="text-destructive">{error || 'Sin datos'}</p>
        <button
          onClick={cargar}
          className="px-4 py-2 bg-[oklch(0.488_0.243_264.376)] text-white rounded-lg hover:bg-[oklch(0.438_0.243_264.376)] transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const { metricas, stockBajo, proxVencer, topProductos, ventasMensuales } = data;

  const metrics = [
    {
      label: 'Ventas del Mes',
      value: fmt(metricas.ventasMes),
      change: `${metricas.cambioPct >= 0 ? '+' : ''}${metricas.cambioPct}%`,
      trend: metricas.cambioPct >= 0 ? 'up' : 'down',
      icon: DollarSign,
      sub: 'vs. mes anterior',
    },
    {
      label: 'Ventas del Día',
      value: fmt(metricas.ventasDia),
      change: '',
      trend: 'neutral',
      icon: Calendar,
      sub: 'hoy',
    },
    {
      label: 'Unidades en Stock',
      value: metricas.totalStock.toLocaleString('es-PE'),
      change: `${metricas.totalProductos} productos`,
      trend: 'neutral',
      icon: Package,
      sub: 'unidades totales',
    },
    {
      label: 'Alertas Críticas',
      value: metricas.alertasCriticas.toString(),
      change: `${metricas.stockBajoCount} stock bajo`,
      trend: metricas.alertasCriticas > 0 ? 'alert' : 'ok',
      icon: AlertTriangle,
      sub: 'agotados o vencidos',
    },
  ];

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: '#2a2a2a',
      border: '1px solid #3a3a3a',
      borderRadius: '8px',
      color: 'white',
    },
  };

  return (
    <div className="p-8 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl text-white mb-1">Dashboard</h2>
          <p className="text-muted-foreground">Resumen general del sistema</p>
        </div>
        <button
          onClick={cargar}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[oklch(0.269_0_0)] hover:bg-[oklch(0.3_0_0)] text-white rounded-lg transition-colors text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* ── Métricas ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-[oklch(0.269_0_0)] rounded-lg">
                  <Icon className="w-5 h-5 text-[oklch(0.488_0.243_264.376)]" />
                </div>
                {m.trend === 'up' && (
                  <span className="flex items-center gap-1 text-sm text-[oklch(0.696_0.17_162.48)]">
                    <TrendingUp className="w-4 h-4" />{m.change}
                  </span>
                )}
                {m.trend === 'down' && (
                  <span className="flex items-center gap-1 text-sm text-destructive">
                    <TrendingDown className="w-4 h-4" />{m.change}
                  </span>
                )}
                {m.trend === 'alert' && (
                  <span className="text-sm text-[oklch(0.769_0.188_70.08)]">{m.change}</span>
                )}
                {m.trend === 'neutral' && m.change && (
                  <span className="text-sm text-muted-foreground">{m.change}</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-1">{m.label}</p>
              <p className="text-2xl text-white">{m.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{m.sub}</p>
            </div>
          );
        })}
      </div>

      {/* ── Gráficas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Ventas mensuales */}
        <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl p-6">
          <h3 className="text-lg text-white mb-1">Ventas Mensuales</h3>
          <p className="text-xs text-muted-foreground mb-6">Últimos 6 meses</p>
          {ventasMensuales.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
              Sin ventas registradas aún
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={ventasMensuales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="mes" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={11}
                  tickFormatter={v => 'S/.' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)} />
                <Tooltip {...tooltipStyle}
                  formatter={(v: number) => [fmt(v), 'Ventas']} />
                <Line type="monotone" dataKey="ventas"
                  stroke="oklch(0.488 0.243 264.376)" strokeWidth={2}
                  dot={{ fill: 'oklch(0.488 0.243 264.376)', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top productos */}
        <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-lg text-white">Productos Más Vendidos</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-6">Mes actual · por unidades</p>
          {topProductos.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
              Sin ventas este mes
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topProductos} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis type="number" stroke="#888" fontSize={11} />
                <YAxis dataKey="nombre" type="category" stroke="#888" width={110} fontSize={10} />
                <Tooltip {...tooltipStyle}
                  formatter={(v: number) => [v + ' unid.', 'Vendidos']} />
                <Bar dataKey="ventas" fill="oklch(0.696 0.17 162.48)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Alertas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Próximos a vencer */}
        <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-[oklch(0.645_0.246_16.439)]" />
            <h3 className="text-lg text-white">Próximos a Vencer</h3>
            <span className="ml-auto text-xs text-muted-foreground">Dentro de 90 días</span>
          </div>
          {proxVencer.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              ✓ Ningún producto vence pronto
            </div>
          ) : (
            <div className="space-y-3">
              {proxVencer.map((p, i) => (
                <div key={i} className="bg-[oklch(0.269_0_0)] rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-white mb-1">{p.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        Lote: {p.lote || '—'} · Vence: {fmtFecha(p.vencimiento!)}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs bg-[oklch(0.396_0.141_25.723)] text-[oklch(0.645_0.246_16.439)]">
                      {p.stock} unid.
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock bajo */}
        <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-[oklch(0.769_0.188_70.08)]" />
            <h3 className="text-lg text-white">Stock Bajo</h3>
            <span className="ml-auto text-xs text-muted-foreground">Por debajo del mínimo</span>
          </div>
          {stockBajo.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              ✓ Todos los productos tienen stock suficiente
            </div>
          ) : (
            <div className="space-y-3">
              {stockBajo.map((p, i) => (
                <div key={i} className="bg-[oklch(0.269_0_0)] rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-white mb-1">{p.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        Mínimo: {p.stock_minimo} unidades
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs bg-[oklch(0.769_0.188_70.08)]/20 text-[oklch(0.769_0.188_70.08)]">
                      {p.stock} unid.
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
