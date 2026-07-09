import { useState, useEffect } from 'react';
import { apiClient } from '../utils/apiClient';
import {
  Search, Plus, Edit, Trash2, Eye, X, Filter,
  UserCircle2, Users, UserCheck, UserX, Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Cliente {
  id: number;
  nombre: string;
  dni?: string;
  direccion?: string;
  telefono?: string;
  estado: 'Activo' | 'Inactivo';
  fecha_registro?: string;
}

const inp = 'w-full bg-[oklch(0.269_0_0)] border border-[oklch(0.269_0_0)] rounded-lg px-4 py-2 text-white placeholder:text-muted-foreground focus:outline-none focus:border-[oklch(0.488_0.243_264.376)] transition-colors';
const lbl = 'block text-sm text-muted-foreground mb-2';

// Modal Formulario 
function ClienteFormModal({ isOpen, onClose, onSave, cliente, mode }: any) {
  const empty = { nombre: '', dni: '', direccion: '', telefono: '', estado: 'Activo' };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && cliente) {
        setForm({
          nombre: cliente.nombre ?? '',
          dni: cliente.dni ?? '',
          direccion: cliente.direccion ?? '',
          telefono: cliente.telefono ?? '',
          estado: cliente.estado ?? 'Activo',
        });
      } else {
        setForm(empty);
      }
      setErrors({});
    }
  }, [isOpen, mode, cliente]);

  if (!isOpen) return null;

  const s = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio';
    if (form.dni && !/^\d{8}$/.test(form.dni.trim())) e.dni = 'El DNI debe tener 8 dígitos';
    if (form.telefono && !/^[\d\s+\-()]{7,20}$/.test(form.telefono))
      e.telefono = 'Teléfono inválido';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setSaving(true);
    await onSave({ ...form, ...(mode === 'edit' && cliente ? { id: cliente.id } : {}) });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-[oklch(0.269_0_0)] px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[oklch(0.696_0.17_162.48)]/10 rounded-lg">
              <UserCircle2 className="w-6 h-6 text-[oklch(0.696_0.17_162.48)]" />
            </div>
            <h2 className="text-xl text-white">{mode === 'create' ? 'Nuevo Cliente' : 'Editar Cliente'}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div>
            <label className={lbl}>Nombre completo *</label>
            <input className={inp} value={form.nombre} onChange={e => s('nombre', e.target.value)} placeholder="Ej: Juan García López" />
            {errors.nombre && <p className="text-destructive text-xs mt-1">{errors.nombre}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>DNI</label>
              <input className={inp} value={form.dni} onChange={e => s('dni', e.target.value)} placeholder="12345678" maxLength={8} />
              {errors.dni && <p className="text-destructive text-xs mt-1">{errors.dni}</p>}
            </div>
            <div>
              <label className={lbl}>Teléfono</label>
              <input className={inp} value={form.telefono} onChange={e => s('telefono', e.target.value)} placeholder="+51 999 000 000" />
              {errors.telefono && <p className="text-destructive text-xs mt-1">{errors.telefono}</p>}
            </div>
          </div>

          <div>
            <label className={lbl}>Dirección</label>
            <input className={inp} value={form.direccion} onChange={e => s('direccion', e.target.value)} placeholder="Av. Los Pinos 123, Trujillo" />
          </div>

          <div>
            <label className={lbl}>Estado</label>
            <select className={inp + ' appearance-none'} value={form.estado} onChange={e => s('estado', e.target.value)}>
              <option value="Activo" className="bg-[oklch(0.269_0_0)]">Activo</option>
              <option value="Inactivo" className="bg-[oklch(0.269_0_0)]">Inactivo</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[oklch(0.269_0_0)] px-6 py-4 flex gap-3 flex-shrink-0">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 bg-[oklch(0.696_0.17_162.48)] hover:bg-[oklch(0.646_0.17_162.48)] disabled:opacity-50 text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'create' ? 'Crear Cliente' : 'Guardar Cambios'}
          </button>
          <button onClick={onClose} className="flex-1 bg-[oklch(0.269_0_0)] hover:bg-[oklch(0.318_0_0)] text-white py-3 rounded-lg transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal Detalles 
function ClienteDetailsModal({ isOpen, onClose, cliente }: any) {
  if (!isOpen || !cliente) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl w-full max-w-md">
        {/* Header */}
        <div className="border-b border-[oklch(0.269_0_0)] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[oklch(0.696_0.17_162.48)]/20 flex items-center justify-center">
              <UserCircle2 className="w-6 h-6 text-[oklch(0.696_0.17_162.48)]" />
            </div>
            <div>
              <h2 className="text-white font-medium">{cliente.nombre}</h2>
              <p className="text-xs text-muted-foreground">
                {cliente.dni ? `DNI: ${cliente.dni}` : 'Sin DNI registrado'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[oklch(0.269_0_0)] p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Estado</p>
              <span className={`px-3 py-1 rounded-full text-xs ${cliente.estado === 'Activo'
                ? 'bg-[oklch(0.696_0.17_162.48)]/20 text-[oklch(0.696_0.17_162.48)]'
                : 'bg-[oklch(0.269_0_0)] text-muted-foreground border border-[oklch(0.318_0_0)]'}`}>
                {cliente.estado}
              </span>
            </div>
            <div className="bg-[oklch(0.269_0_0)] p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Fecha de registro</p>
              <p className="text-white text-sm">
                {cliente.fecha_registro
                  ? new Date(cliente.fecha_registro).toLocaleDateString('es-PE')
                  : '—'}
              </p>
            </div>
          </div>
          {cliente.telefono && (
            <div className="bg-[oklch(0.269_0_0)] p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Teléfono</p>
              <p className="text-white">{cliente.telefono}</p>
            </div>
          )}
          {cliente.direccion && (
            <div className="bg-[oklch(0.269_0_0)] p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Dirección</p>
              <p className="text-white">{cliente.direccion}</p>
            </div>
          )}
        </div>

        <div className="border-t border-[oklch(0.269_0_0)] px-6 py-4">
          <button onClick={onClose} className="w-full bg-[oklch(0.269_0_0)] hover:bg-[oklch(0.318_0_0)] text-white py-3 rounded-lg transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal Confirmación Eliminar 
function DeleteModal({ isOpen, onClose, onConfirm, nombre }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-destructive/10 rounded-lg">
            <Trash2 className="w-6 h-6 text-destructive" />
          </div>
          <h2 className="text-white text-lg">Eliminar cliente</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          ¿Estás seguro de que deseas eliminar a <span className="text-white font-medium">{nombre}</span>? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button onClick={onConfirm} className="flex-1 bg-destructive hover:bg-destructive/80 text-white py-3 rounded-lg transition-colors">
            Eliminar
          </button>
          <button onClick={onClose} className="flex-1 bg-[oklch(0.269_0_0)] hover:bg-[oklch(0.318_0_0)] text-white py-3 rounded-lg transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente principal
export default function Clientes() {
  const { usuario } = useAuth();
  const rol = usuario?.rol ?? 'Vendedor';

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');

  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isFormOpen, setIsFormOpen]     = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [formMode, setFormMode]         = useState<'create' | 'edit'>('create');

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage]     = useState('');

  const showMsg = (msg: string) => { setSuccessMessage(msg); setTimeout(() => setSuccessMessage(''), 4000); };
  const showErr = (msg: string) => { setErrorMessage(msg);   setTimeout(() => setErrorMessage(''),   5000); };

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const res = await apiClient('/api/clientes');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setClientes(data);
    } catch {
      showErr('Error al cargar los clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClientes(); }, []);

  const handleSave = async (data: any) => {
    try {
      if (data.id) {
        const res = await apiClient(`/api/clientes/${data.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? 'Error desconocido');
        }
        showMsg('Cliente actualizado correctamente');
      } else {
        const res = await apiClient('/api/clientes', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? 'Error desconocido');
        }
        showMsg('Cliente creado correctamente');
      }
      setIsFormOpen(false);
      setSelectedCliente(null);
      await fetchClientes();
    } catch (e: any) {
      showErr(e.message || 'Error al guardar el cliente');
    }
  };

  const handleDelete = async () => {
    if (!selectedCliente) return;
    try {
      const res = await apiClient(`/api/clientes/${selectedCliente.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await fetchClientes();
      setIsDeleteOpen(false);
      setSelectedCliente(null);
      showMsg('Cliente eliminado correctamente');
    } catch {
      showErr('Error al eliminar el cliente');
    }
  };

  const filtered = clientes.filter(c => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      c.nombre.toLowerCase().includes(q) ||
      (c.dni ?? '').includes(q) ||
      (c.telefono ?? '').includes(q);
    return matchSearch && (filterEstado === 'todos' || c.estado === filterEstado);
  });

  const canEdit   = rol === 'Administrador' || rol === 'Supervisor';
  const canDelete = rol === 'Administrador';

  return (
    <div className="p-8 space-y-6">
      {/* Encabezado */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl text-white mb-1">Clientes</h2>
          <p className="text-muted-foreground">Gestión del directorio de clientes</p>
        </div>
        {canEdit && (
          <button
            onClick={() => { setFormMode('create'); setSelectedCliente(null); setIsFormOpen(true); }}
            className="bg-[oklch(0.696_0.17_162.48)] hover:bg-[oklch(0.646_0.17_162.48)] text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nuevo Cliente
          </button>
        )}
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Total</p>
          </div>
          <p className="text-2xl text-white">{clientes.length}</p>
        </div>
        <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Activos</p>
          </div>
          <p className="text-2xl text-[oklch(0.696_0.17_162.48)]">
            {clientes.filter(c => c.estado === 'Activo').length}
          </p>
        </div>
        <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <UserX className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Inactivos</p>
          </div>
          <p className="text-2xl text-muted-foreground">
            {clientes.filter(c => c.estado === 'Inactivo').length}
          </p>
        </div>
      </div>

      {/* Mensajes */}
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

      {/* Filtros */}
      <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Nombre, DNI o teléfono..."
                className="w-full bg-[oklch(0.269_0_0)] border border-[oklch(0.269_0_0)] rounded-lg pl-11 pr-4 py-2 text-white placeholder:text-muted-foreground focus:outline-none focus:border-[oklch(0.488_0.243_264.376)] transition-colors"
              />
            </div>
          </div>
          <div>
            <label className={lbl}>Estado</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <select
                value={filterEstado}
                onChange={e => setFilterEstado(e.target.value)}
                className="w-full bg-[oklch(0.269_0_0)] border border-[oklch(0.269_0_0)] rounded-lg pl-11 pr-4 py-2 text-white focus:outline-none focus:border-[oklch(0.488_0.243_264.376)] transition-colors appearance-none"
              >
                <option value="todos" className="bg-[oklch(0.269_0_0)]">Todos</option>
                <option value="Activo" className="bg-[oklch(0.269_0_0)]">Activo</option>
                <option value="Inactivo" className="bg-[oklch(0.269_0_0)]">Inactivo</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3">
            <Loader2 className="w-6 h-6 text-[oklch(0.696_0.17_162.48)] animate-spin" />
            <p className="text-muted-foreground">Cargando clientes...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[oklch(0.269_0_0)]">
                <tr>
                  <th className="text-left text-sm text-muted-foreground px-6 py-4">Cliente</th>
                  <th className="text-left text-sm text-muted-foreground px-6 py-4">DNI</th>
                  <th className="text-left text-sm text-muted-foreground px-6 py-4">Teléfono</th>
                  <th className="text-left text-sm text-muted-foreground px-6 py-4">Dirección</th>
                  <th className="text-center text-sm text-muted-foreground px-6 py-4">Estado</th>
                  <th className="text-center text-sm text-muted-foreground px-6 py-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[oklch(0.269_0_0)]">
                {filtered.map(cliente => (
                  <tr key={cliente.id} className="hover:bg-[oklch(0.269_0_0)]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[oklch(0.696_0.17_162.48)]/20 flex items-center justify-center flex-shrink-0">
                          <UserCircle2 className="w-4 h-4 text-[oklch(0.696_0.17_162.48)]" />
                        </div>
                        <span className="text-white">{cliente.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{cliente.dni || '—'}</td>
                    <td className="px-6 py-4 text-muted-foreground">{cliente.telefono || '—'}</td>
                    <td className="px-6 py-4 text-muted-foreground max-w-[180px] truncate">
                      {cliente.direccion || '—'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        cliente.estado === 'Activo'
                          ? 'bg-[oklch(0.696_0.17_162.48)]/20 text-[oklch(0.696_0.17_162.48)]'
                          : 'bg-[oklch(0.269_0_0)] text-muted-foreground border border-[oklch(0.318_0_0)]'
                      }`}>
                        {cliente.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => { setSelectedCliente(cliente); setIsDetailsOpen(true); }}
                          className="p-2 text-muted-foreground hover:text-[oklch(0.488_0.243_264.376)] transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => { setFormMode('edit'); setSelectedCliente(cliente); setIsFormOpen(true); }}
                            className="p-2 text-muted-foreground hover:text-[oklch(0.769_0.188_70.08)] transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => { setSelectedCliente(cliente); setIsDeleteOpen(true); }}
                            className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      {searchTerm || filterEstado !== 'todos'
                        ? 'No se encontraron clientes con esos filtros'
                        : 'Aún no hay clientes registrados'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Mostrando {filtered.length} de {clientes.length} clientes
      </p>

      {/* Modales */}
      <ClienteFormModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setSelectedCliente(null); }}
        onSave={handleSave}
        cliente={selectedCliente}
        mode={formMode}
      />
      <ClienteDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        cliente={selectedCliente}
      />
      <DeleteModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        nombre={selectedCliente?.nombre || ''}
      />
    </div>
  );
}
