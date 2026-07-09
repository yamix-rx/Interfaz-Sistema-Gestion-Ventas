import { useState, useEffect } from 'react';
import { apiClient } from '../utils/apiClient';
import { Search, Plus, Edit, Trash2, Eye, X, Filter, Package, Loader2, AlertTriangle } from 'lucide-react';

interface Compra {
  id: string;
  proveedor: string;
  fecha: string;
  total: number;
  estado: 'Pendiente' | 'Recibido' | 'Cancelado';
  productos?: string;
  notas?: string;
}

const productosToText = (productos?: string) => {
  if (!productos) return '';

  try {
    const parsed = JSON.parse(productos);
    if (Array.isArray(parsed)) {
      return parsed
        .map((p: any) => {
          if (typeof p === 'string') return p;
          return p.descripcion || p.nombre || '';
        })
        .filter(Boolean)
        .join(', ');
    }
  } catch {
    // Datos antiguos de la BD vienen como texto: "Paracetamol x500, Ibuprofeno x300"
  }

  return productos;
};

const productosToJson = (productos: string) => {
  const arr = productos
    .split(',')
    .map(p => p.trim())
    .filter(Boolean)
    .map(descripcion => ({ descripcion }));

  return JSON.stringify(arr);
};

// Modal Formulario
function CompraFormModal({ isOpen, onClose, onSave, compra, mode }: any) {
  const empty = { proveedor: '', fecha: new Date().toISOString().split('T')[0], total: '', estado: 'Pendiente', productos: '', notas: '' };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && compra) {
        setForm({
          proveedor: compra.proveedor,
          fecha: compra.fecha?.split('T')[0] ?? compra.fecha,
          total: String(compra.total),
          estado: compra.estado,
          productos: productosToText(compra.productos),
          notas: compra.notas || ''
        });
      } else {
        setForm(empty);
      }
      setErrors({});
    }
  }, [isOpen, mode, compra]);

  if (!isOpen) return null;

  const s = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.proveedor.trim()) e.proveedor = 'El proveedor es obligatorio';
    if (!form.fecha) e.fecha = 'La fecha es obligatoria';
    if (!form.total || isNaN(Number(form.total)) || Number(form.total) <= 0) e.total = 'Total debe ser mayor a 0';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    onSave({
      ...form,
      total: Number(form.total),
      productos: productosToJson(form.productos),
      ...(mode === 'edit' && compra ? { id: compra.id } : {})
    });
  };

  const inp = 'w-full bg-[oklch(0.269_0_0)] border border-[oklch(0.269_0_0)] rounded-lg px-4 py-2 text-white placeholder:text-muted-foreground focus:outline-none focus:border-[oklch(0.488_0.243_264.376)] transition-colors';
  const lbl = 'block text-sm text-muted-foreground mb-2';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="border-b border-[oklch(0.269_0_0)] px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[oklch(0.488_0.243_264.376)]/10 rounded-lg"><Package className="w-6 h-6 text-[oklch(0.488_0.243_264.376)]" /></div>
            <h2 className="text-xl text-white">{mode === 'create' ? 'Nueva Compra' : 'Editar Compra'}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4">
          <div>
            <label className={lbl}>Proveedor *</label>
            <input className={inp} value={form.proveedor} onChange={e => s('proveedor', e.target.value)} placeholder="Nombre del proveedor" />
            {errors.proveedor && <p className="text-destructive text-xs mt-1">{errors.proveedor}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Fecha *</label>
              <input type="date" className={inp} value={form.fecha} onChange={e => s('fecha', e.target.value)} />
              {errors.fecha && <p className="text-destructive text-xs mt-1">{errors.fecha}</p>}
            </div>
            <div>
              <label className={lbl}>Total (S/.) *</label>
              <input type="number" min="0" step="0.01" className={inp} value={form.total} onChange={e => s('total', e.target.value)} placeholder="0.00" />
              {errors.total && <p className="text-destructive text-xs mt-1">{errors.total}</p>}
            </div>
          </div>
          <div>
            <label className={lbl}>Estado</label>
            <select className={inp + ' appearance-none'} value={form.estado} onChange={e => s('estado', e.target.value)}>
              <option value="Pendiente" className="bg-[oklch(0.269_0_0)]">Pendiente</option>
              <option value="Recibido" className="bg-[oklch(0.269_0_0)]">Recibido</option>
              <option value="Cancelado" className="bg-[oklch(0.269_0_0)]">Cancelado</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Productos</label>
            <input className={inp} value={form.productos} onChange={e => s('productos', e.target.value)} placeholder="Ej: Paracetamol x200..." />
          </div>
          <div>
            <label className={lbl}>Notas</label>
            <textarea className={inp + ' resize-none'} rows={3} value={form.notas} onChange={e => s('notas', e.target.value)} placeholder="Observaciones..." />
          </div>
        </div>
        <div className="border-t border-[oklch(0.269_0_0)] px-6 py-4 flex gap-3 flex-shrink-0">
          <button onClick={handleSubmit} className="flex-1 bg-[oklch(0.488_0.243_264.376)] hover:bg-[oklch(0.438_0.243_264.376)] text-white py-3 rounded-lg transition-colors">
            {mode === 'create' ? 'Crear Compra' : 'Guardar Cambios'}
          </button>
          <button onClick={onClose} className="flex-1 bg-[oklch(0.269_0_0)] hover:bg-[oklch(0.318_0_0)] text-white py-3 rounded-lg transition-colors">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// Modal Detalles
function CompraDetailsModal({ isOpen, onClose, compra }: any) {
  if (!isOpen || !compra) return null;
  const estadoStyle: Record<string, string> = {
    Recibido: 'bg-[oklch(0.696_0.17_162.48)]/20 text-[oklch(0.696_0.17_162.48)]',
    Pendiente: 'bg-[oklch(0.769_0.188_70.08)]/20 text-[oklch(0.769_0.188_70.08)]',
    Cancelado: 'bg-[oklch(0.396_0.141_25.723)] text-[oklch(0.645_0.246_16.439)]',
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl w-full max-w-md">
        <div className="border-b border-[oklch(0.269_0_0)] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[oklch(0.488_0.243_264.376)]/10 rounded-lg"><Package className="w-6 h-6 text-[oklch(0.488_0.243_264.376)]" /></div>
            <h2 className="text-xl text-white">Detalle de Compra</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[oklch(0.269_0_0)] p-4 rounded-lg"><p className="text-xs text-muted-foreground mb-1">Código</p><p className="text-white">{compra.id}</p></div>
            <div className="bg-[oklch(0.269_0_0)] p-4 rounded-lg"><p className="text-xs text-muted-foreground mb-1">Estado</p><span className={`px-3 py-1 rounded-full text-xs ${estadoStyle[compra.estado]}`}>{compra.estado}</span></div>
          </div>
          <div className="bg-[oklch(0.269_0_0)] p-4 rounded-lg"><p className="text-xs text-muted-foreground mb-1">Proveedor</p><p className="text-white">{compra.proveedor}</p></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[oklch(0.269_0_0)] p-4 rounded-lg"><p className="text-xs text-muted-foreground mb-1">Fecha</p><p className="text-white">{new Date(compra.fecha).toLocaleDateString('es-PE')}</p></div>
            <div className="bg-[oklch(0.269_0_0)] p-4 rounded-lg"><p className="text-xs text-muted-foreground mb-1">Total</p><p className="text-white">S/. {Number(compra.total).toFixed(2)}</p></div>
          </div>
          {compra.productos && <div className="bg-[oklch(0.269_0_0)] p-4 rounded-lg"><p className="text-xs text-muted-foreground mb-1">Productos</p><p className="text-white text-sm">{productosToText(compra.productos)}</p></div>}
          {compra.notas && <div className="bg-[oklch(0.269_0_0)] p-4 rounded-lg"><p className="text-xs text-muted-foreground mb-1">Notas</p><p className="text-white text-sm">{compra.notas}</p></div>}
        </div>
        <div className="border-t border-[oklch(0.269_0_0)] px-6 py-4">
          <button onClick={onClose} className="w-full bg-[oklch(0.269_0_0)] hover:bg-[oklch(0.318_0_0)] text-white py-3 rounded-lg transition-colors">Cerrar</button>
        </div>
      </div>
    </div>
  );
}

// Modal Eliminar
function DeleteModal({ isOpen, onClose, onConfirm, nombre }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl max-w-md w-full">
        <div className="border-b border-[oklch(0.269_0_0)] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg"><AlertTriangle className="w-6 h-6 text-destructive" /></div>
            <h2 className="text-xl text-white">Confirmar Eliminación</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          <p className="text-white mb-4">¿Eliminar esta compra?</p>
          <div className="bg-[oklch(0.269_0_0)] p-4 rounded-lg mb-4"><p className="text-white">{nombre}</p></div>
          <p className="text-xs text-muted-foreground">⚠️ Esta acción no se puede deshacer.</p>
        </div>
        <div className="border-t border-[oklch(0.269_0_0)] px-6 py-4 flex gap-3">
          <button onClick={onConfirm} className="flex-1 bg-destructive hover:bg-destructive/90 text-white py-3 rounded-lg transition-colors">Eliminar</button>
          <button onClick={onClose} className="flex-1 bg-[oklch(0.269_0_0)] hover:bg-[oklch(0.318_0_0)] text-white py-3 rounded-lg transition-colors">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// Componente Principal
export default function Compras() {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedCompra, setSelectedCompra] = useState<Compra | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchCompras = async () => {
    try {
      setLoading(true);
      const res = await apiClient('/api/compras');
      if (!res.ok) throw new Error();
      setCompras(await res.json());
    } catch { setErrorMessage('No se pudo conectar con el servidor'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCompras(); }, []);

  const showMsg = (msg: string) => { setSuccessMessage(msg); setTimeout(() => setSuccessMessage(''), 3000); };
  const showErr = (msg: string) => { setErrorMessage(msg); setTimeout(() => setErrorMessage(''), 3000); };

  const generarSiguienteIdCompra = (lista: Compra[]) => {
    const mayor = lista.reduce((max, compra) => {
      const numero = Number(String(compra.id).replace(/\D/g, ''));
      return Number.isFinite(numero) && numero > max ? numero : max;
    }, 0);

    return `C${String(mayor + 1).padStart(3, '0')}`;
  };

  const handleSave = async (data: any) => {
    try {
      if (formMode === 'create') {
        const id = generarSiguienteIdCompra(compras);
        const res = await apiClient('/api/compras', {
          method: 'POST',
          body: JSON.stringify({ ...data, id }),
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error || `Error del servidor (${res.status})`);
        }
        showMsg('Compra registrada exitosamente');
      } else {
        const res = await apiClient(`/api/compras/${data.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error || `Error del servidor (${res.status})`);
        }
        showMsg('Compra actualizada correctamente');
      }
      setIsFormModalOpen(false);
      await fetchCompras();
    } catch (e: any) {
      console.error('Error al guardar compra:', e);
      showErr(e.message || 'Error al guardar la compra');
    }
  };

  const handleDelete = async () => {
    if (!selectedCompra) return;
    try {
      const res = await apiClient(`/api/compras/${selectedCompra.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await fetchCompras();
      setIsDeleteModalOpen(false);
      setSelectedCompra(null);
      showMsg('Compra eliminada');
    } catch { showErr('Error al eliminar la compra'); }
  };

  const estadoStyle: Record<string, string> = {
    Recibido: 'bg-[oklch(0.696_0.17_162.48)]/20 text-[oklch(0.696_0.17_162.48)]',
    Pendiente: 'bg-[oklch(0.769_0.188_70.08)]/20 text-[oklch(0.769_0.188_70.08)]',
    Cancelado: 'bg-[oklch(0.396_0.141_25.723)] text-[oklch(0.645_0.246_16.439)]',
  };

  const filtered = compras.filter(c => {
    const matchSearch = c.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) || c.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch && (filterEstado === 'todos' || c.estado === filterEstado);
  });

  const totalInvertido = compras.reduce((sum, c) => sum + Number(c.total), 0);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div><h2 className="text-2xl text-white mb-1">Compras</h2><p className="text-muted-foreground">Gestión de órdenes de compra</p></div>
        <button onClick={() => { setFormMode('create'); setSelectedCompra(null); setIsFormModalOpen(true); }} className="bg-[oklch(0.488_0.243_264.376)] hover:bg-[oklch(0.438_0.243_264.376)] text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
          <Plus className="w-5 h-5" /> Nueva Compra
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl p-4"><p className="text-sm text-muted-foreground mb-1">Total Invertido</p><p className="text-2xl text-white">S/. {totalInvertido.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p></div>
        <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl p-4"><p className="text-sm text-muted-foreground mb-1">Recibidas</p><p className="text-2xl text-[oklch(0.696_0.17_162.48)]">{compras.filter(c => c.estado === 'Recibido').length}</p></div>
        <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl p-4"><p className="text-sm text-muted-foreground mb-1">Pendientes</p><p className="text-2xl text-[oklch(0.769_0.188_70.08)]">{compras.filter(c => c.estado === 'Pendiente').length}</p></div>
      </div>

      {successMessage && (
        <div className="bg-[oklch(0.696_0.17_162.48)]/20 border border-[oklch(0.696_0.17_162.48)] rounded-lg p-4 flex items-center justify-between">
          <p className="text-[oklch(0.696_0.17_162.48)]">{successMessage}</p>
          <button onClick={() => setSuccessMessage('')}><X className="w-5 h-5 text-[oklch(0.696_0.17_162.48)]" /></button>
        </div>
      )}
      {errorMessage && (
        <div className="bg-destructive/20 border border-destructive rounded-lg p-4 flex items-center justify-between">
          <p className="text-destructive">{errorMessage}</p>
          <button onClick={() => setErrorMessage('')}><X className="w-5 h-5 text-destructive" /></button>
        </div>
      )}

      <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-2">Buscar</label>
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Proveedor o código..." className="w-full bg-[oklch(0.269_0_0)] border border-[oklch(0.269_0_0)] rounded-lg pl-11 pr-4 py-2 text-white placeholder:text-muted-foreground focus:outline-none focus:border-[oklch(0.488_0.243_264.376)] transition-colors" /></div>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-2">Estado</label>
            <div className="relative"><Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className="w-full bg-[oklch(0.269_0_0)] border border-[oklch(0.269_0_0)] rounded-lg pl-11 pr-4 py-2 text-white focus:outline-none focus:border-[oklch(0.488_0.243_264.376)] transition-colors appearance-none"><option value="todos" className="bg-[oklch(0.269_0_0)]">Todos los estados</option><option value="Recibido" className="bg-[oklch(0.269_0_0)]">Recibido</option><option value="Pendiente" className="bg-[oklch(0.269_0_0)]">Pendiente</option><option value="Cancelado" className="bg-[oklch(0.269_0_0)]">Cancelado</option></select></div>
          </div>
        </div>
      </div>

      <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3"><Loader2 className="w-6 h-6 text-[oklch(0.488_0.243_264.376)] animate-spin" /><p className="text-muted-foreground">Cargando compras...</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[oklch(0.269_0_0)]">
                <tr>
                  <th className="text-left text-sm text-muted-foreground px-6 py-4">Código</th>
                  <th className="text-left text-sm text-muted-foreground px-6 py-4">Proveedor</th>
                  <th className="text-left text-sm text-muted-foreground px-6 py-4">Fecha</th>
                  <th className="text-right text-sm text-muted-foreground px-6 py-4">Total</th>
                  <th className="text-center text-sm text-muted-foreground px-6 py-4">Estado</th>
                  <th className="text-center text-sm text-muted-foreground px-6 py-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[oklch(0.269_0_0)]">
                {filtered.map(compra => (
                  <tr key={compra.id} className="hover:bg-[oklch(0.269_0_0)]/50 transition-colors">
                    <td className="px-6 py-4 text-white text-sm">{compra.id}</td>
                    <td className="px-6 py-4 text-white">{compra.proveedor}</td>
                    <td className="px-6 py-4 text-muted-foreground">{new Date(compra.fecha).toLocaleDateString('es-PE')}</td>
                    <td className="px-6 py-4 text-white text-right">S/. {Number(compra.total).toFixed(2)}</td>
                    <td className="px-6 py-4 text-center"><span className={`px-3 py-1 rounded-full text-xs ${estadoStyle[compra.estado]}`}>{compra.estado}</span></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => { setSelectedCompra(compra); setIsDetailsModalOpen(true); }} className="p-2 text-muted-foreground hover:text-[oklch(0.488_0.243_264.376)] transition-colors" title="Ver"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => { setFormMode('edit'); setSelectedCompra(compra); setIsFormModalOpen(true); }} className="p-2 text-muted-foreground hover:text-[oklch(0.769_0.188_70.08)] transition-colors" title="Editar"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => { setSelectedCompra(compra); setIsDeleteModalOpen(true); }} className="p-2 text-muted-foreground hover:text-destructive transition-colors" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">No se encontraron compras</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">Mostrando {filtered.length} de {compras.length} compras</p>

      <CompraFormModal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} onSave={handleSave} compra={selectedCompra} mode={formMode} />
      <CompraDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} compra={selectedCompra} />
      <DeleteModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDelete} nombre={selectedCompra?.proveedor || ''} />
    </div>
  );
}
