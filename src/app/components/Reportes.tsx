/**
 * src/app/components/Reportes.tsx
 * Genera y descarga PDFs para los 4 tipos de reporte.
 */

import { useState } from 'react';
import {
  BarChart3, TrendingUp, FileText, Calendar,
  Download, Loader2, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { apiClient } from '../utils/apiClient';

// ── Helpers ───────────────────────────────────────────────────────────────────
const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

const anioActual  = new Date().getFullYear();
const mesActual   = new Date().getMonth() + 1;
const ANIOS       = Array.from({ length: 5 }, (_, i) => anioActual - i);
const TIPO_FOLDER: Record<string, string> = {
  'ventas-mensuales':      'ventas_mensuales',
  'productos-vendidos':    'productos_vendidos',
  'inventario-valorizado': 'inventario_valorizado',
  'vencimientos':          'vencimientos',
};

type Estado = 'idle' | 'loading' | 'ok' | 'error';

interface ReporteState {
  estado:  Estado;
  archivo: string;
  tipo:    string;
  mensaje: string;
}

const estadoInicial = (): ReporteState =>
  ({ estado: 'idle', archivo: '', tipo: '', mensaje: '' });

// ── Componente ────────────────────────────────────────────────────────────────
export default function Reportes() {
  const [mes,  setMes]  = useState(mesActual);
  const [anio, setAnio] = useState(anioActual);
  const [dias, setDias] = useState(90);

  // Estado individual por reporte
  const [estados, setEstados] = useState<Record<string, ReporteState>>({
    'ventas-mensuales':      estadoInicial(),
    'productos-vendidos':    estadoInicial(),
    'inventario-valorizado': estadoInicial(),
    'vencimientos':          estadoInicial(),
  });

  const setEstado = (id: string, val: Partial<ReporteState>) =>
    setEstados(prev => ({ ...prev, [id]: { ...prev[id], ...val } }));

  // ── Generar PDF ──────────────────────────────────────────────────────────────
  const generar = async (id: string) => {
    setEstado(id, { estado: 'loading', mensaje: '', archivo: '' });
    try {
      const body: Record<string, any> = {};
      if (id === 'ventas-mensuales' || id === 'productos-vendidos') {
        body.mes  = mes;
        body.anio = anio;
      }
      if (id === 'vencimientos') body.dias = dias;

      const res = await apiClient(`/api/reportes/${id}`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al generar el reporte.');

      setEstado(id, {
        estado:  'ok',
        archivo: data.archivo,
        tipo:    TIPO_FOLDER[id],
        mensaje: `PDF generado: ${data.archivo}`,
      });
    } catch (e: any) {
      setEstado(id, { estado: 'error', mensaje: e.message });
    }
  };

  // ── Descargar PDF ────────────────────────────────────────────────────────────
  const descargar = async (id: string) => {
    const e = estados[id];
    if (!e.archivo) return;
    try {
      const res = await apiClient(
        `/api/reportes/descargar?file=${encodeURIComponent(e.archivo)}&tipo=${e.tipo}`
      );
      if (!res.ok) throw new Error('No se pudo descargar el archivo.');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = e.archivo;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setEstado(id, { mensaje: err.message });
    }
  };

  // ── Definición de reportes ────────────────────────────────────────────────────
  const reportes = [
    {
      id:          'ventas-mensuales',
      nombre:      'Ventas Mensuales',
      descripcion: 'Detalle de todas las ventas del mes: cliente, vendedor, monto y tipo de comprobante.',
      icon:        TrendingUp,
      color:       'text-[oklch(0.488_0.243_264.376)]',
      bg:          'bg-[oklch(0.488_0.243_264.376)]/10',
      filtros:     'mes-anio',
    },
    {
      id:          'productos-vendidos',
      nombre:      'Productos Más Vendidos',
      descripcion: 'Ranking de los 20 productos con mayor rotación en unidades e ingreso generado.',
      icon:        BarChart3,
      color:       'text-[oklch(0.696_0.17_162.48)]',
      bg:          'bg-[oklch(0.696_0.17_162.48)]/10',
      filtros:     'mes-anio',
    },
    {
      id:          'inventario-valorizado',
      nombre:      'Inventario Valorizado',
      descripcion: 'Valor económico del stock actual por producto: precio unitario × unidades.',
      icon:        FileText,
      color:       'text-[oklch(0.769_0.188_70.08)]',
      bg:          'bg-[oklch(0.769_0.188_70.08)]/10',
      filtros:     'ninguno',
    },
    {
      id:          'vencimientos',
      nombre:      'Vencimientos Próximos',
      descripcion: 'Productos que vencen dentro del rango de días configurado, ordenados por urgencia.',
      icon:        Calendar,
      color:       'text-[oklch(0.645_0.246_16.439)]',
      bg:          'bg-[oklch(0.645_0.246_16.439)]/10',
      filtros:     'dias',
    },
  ];

  const inp = 'bg-[oklch(0.269_0_0)] border border-[oklch(0.32_0_0)] rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[oklch(0.488_0.243_264.376)] transition-colors';

  return (
    <div className="p-8 space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-2xl text-white mb-1">Reportes</h2>
        <p className="text-muted-foreground">
          Genera y descarga reportes en PDF.
        </p>
      </div>

      {/* Filtros globales (mes/año) */}
      <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl p-4 flex flex-wrap items-center gap-4">
        <span className="text-sm text-muted-foreground">Filtros:</span>

        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Mes</label>
          <select value={mes} onChange={e => setMes(+e.target.value)} className={inp}>
            {MESES.map((m, i) => (
              <option key={i} value={i + 1} className="bg-[oklch(0.269_0_0)]">{m}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Año</label>
          <select value={anio} onChange={e => setAnio(+e.target.value)} className={inp}>
            {ANIOS.map(a => (
              <option key={a} value={a} className="bg-[oklch(0.269_0_0)]">{a}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Días vencimiento</label>
          <select value={dias} onChange={e => setDias(+e.target.value)} className={inp}>
            {[30, 60, 90, 120].map(d => (
              <option key={d} value={d} className="bg-[oklch(0.269_0_0)]">{d} días</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tarjetas de reporte */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportes.map(r => {
          const Icon = r.icon;
          const est  = estados[r.id];
          const cargando = est.estado === 'loading';

          return (
            <div key={r.id}
              className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl p-6 flex flex-col gap-4">

              {/* Icono + nombre */}
              <div className="flex items-start gap-4">
                <div className={`p-3 ${r.bg} rounded-xl flex-shrink-0`}>
                  <Icon className={`w-6 h-6 ${r.color}`} />
                </div>
                <div>
                  <h3 className="text-lg text-white mb-1">{r.nombre}</h3>
                  <p className="text-sm text-muted-foreground">{r.descripcion}</p>
                </div>
              </div>

              {/* Filtros activos (informativo) */}
              {r.filtros === 'mes-anio' && (
                <p className="text-xs text-muted-foreground">
                  Período: <span className="text-white">{MESES[mes - 1]} {anio}</span>
                </p>
              )}
              {r.filtros === 'dias' && (
                <p className="text-xs text-muted-foreground">
                  Rango: <span className="text-white">próximos {dias} días</span>
                </p>
              )}

              {/* Feedback */}
              {est.estado === 'ok' && (
                <div className="flex items-center gap-2 bg-[oklch(0.696_0.17_162.48)]/10 border border-[oklch(0.696_0.17_162.48)]/30 rounded-lg px-3 py-2">
                  <CheckCircle2 className="w-4 h-4 text-[oklch(0.696_0.17_162.48)] flex-shrink-0" />
                  <p className="text-xs text-[oklch(0.696_0.17_162.48)] truncate">{est.mensaje}</p>
                </div>
              )}
              {est.estado === 'error' && (
                <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                  <p className="text-xs text-destructive">{est.mensaje}</p>
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3 mt-auto">
                <button
                  onClick={() => generar(r.id)}
                  disabled={cargando}
                  className="flex-1 flex items-center justify-center gap-2 bg-[oklch(0.488_0.243_264.376)] hover:bg-[oklch(0.438_0.243_264.376)] disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg transition-colors text-sm"
                >
                  {cargando
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando…</>
                    : <><FileText className="w-4 h-4" /> Generar PDF</>
                  }
                </button>

                {est.estado === 'ok' && (
                  <button
                    onClick={() => descargar(r.id)}
                    className="flex items-center gap-2 bg-[oklch(0.269_0_0)] hover:bg-[oklch(0.3_0_0)] text-white px-4 py-2.5 rounded-lg transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Descargar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
