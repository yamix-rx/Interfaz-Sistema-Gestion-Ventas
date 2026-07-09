import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../utils/apiClient';
import {
  Search, Plus, Edit, Trash2, Eye, X, Filter,
  User, AlertTriangle, Shield, Users, Loader2,
  Eye as EyeIcon, EyeOff, KeyRound, CheckCircle2, XCircle, Loader,
} from 'lucide-react';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'Administrador' | 'Supervisor' | 'Vendedor';
  estado: 'Activo' | 'Inactivo';
  telefono?: string;
  fecha_ingreso?: string;
}

const inp = 'w-full bg-[oklch(0.269_0_0)] border border-[oklch(0.269_0_0)] rounded-lg px-4 py-2 text-white placeholder:text-muted-foreground focus:outline-none focus:border-[oklch(0.488_0.243_264.376)] transition-colors';
const lbl = 'block text-sm text-muted-foreground mb-2';

const rolBadge: Record<string, string> = {
  Administrador: 'bg-[oklch(0.488_0.243_264.376)]/20 text-[oklch(0.488_0.243_264.376)]',
  Supervisor: 'bg-[oklch(0.769_0.188_70.08)]/20 text-[oklch(0.769_0.188_70.08)]',
  Vendedor: 'bg-[oklch(0.696_0.17_162.48)]/20 text-[oklch(0.696_0.17_162.48)]',
};

// Campo de contraseña con ojo 
function PasswordInput({ value, onChange, placeholder, className }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={(className ?? inp) + ' pr-11'}
      />
      <button
        type="button"
        onClick={() => setShow(p => !p)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
        tabIndex={-1}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
      </button>
    </div>
  );
}

// Hook: verificación de email con debounce
type EmailStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

function useEmailCheck(email: string, excludeId?: number) {
  const [status, setStatus] = useState<EmailStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const trimmed = email.trim();

    // Sin email o muy corto → idle
    if (!trimmed || trimmed.length < 4) {
      setStatus('idle');
      return;
    }

    // Formato inválido → marcar inválido sin consultar
    if (!/\S+@\S+\.\S+/.test(trimmed)) {
      setStatus('invalid');
      return;
    }

    // Debounce de 500ms para no disparar en cada tecla
    setStatus('checking');
    timerRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ email: trimmed });
        if (excludeId) params.set('excludeId', String(excludeId));
        const res = await apiClient(`/api/usuarios/check-email?${params}`);
        if (!res.ok) { setStatus('idle'); return; }
        const data = await res.json();
        setStatus(data.disponible ? 'available' : 'taken');
      } catch {
        setStatus('idle');
      }
    }, 500);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [email, excludeId]);

  return status;
}

// Indicador visual del estado del email
function EmailStatusIcon({ status }: { status: EmailStatus }) {
  if (status === 'checking') return <Loader className="w-4 h-4 animate-spin text-muted-foreground" />;
  if (status === 'available') return <CheckCircle2 className="w-4 h-4 text-[oklch(0.696_0.17_162.48)]" />;
  if (status === 'taken')   return <XCircle className="w-4 h-4 text-destructive" />;
  return null;
}

// Modal Formulario
function UsuarioFormModal({ isOpen, onClose, onSave, usuario, mode }: any) {
  const emptyForm = {
    nombre: '', email: '', rol: 'Vendedor', estado: 'Activo',
    telefono: '', fecha_ingreso: new Date().toISOString().split('T')[0],
  };
  const [form, setForm]         = useState(emptyForm);
  const [password, setPassword] = useState('');
  const [passConf, setPassConf] = useState('');
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [saving, setSaving]     = useState(false);
  const [modalError, setModalError] = useState('');

  const isEdit = mode === 'edit';

  // Verificación de email en tiempo real
  const emailStatus = useEmailCheck(form.email, isEdit ? usuario?.id : undefined);

  useEffect(() => {
    if (isOpen) {
      if (isEdit && usuario) {
        setForm({
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          estado: usuario.estado,
          telefono: usuario.telefono || '',
          fecha_ingreso: usuario.fecha_ingreso?.split('T')[0] ?? '',
        });
      } else {
        setForm(emptyForm);
      }
      setPassword('');
      setPassConf('');
      setErrors({});
      setModalError('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode, usuario]);

  if (!isOpen) return null;

  const s = (f: string, v: string) => {
    setForm(p => ({ ...p, [f]: v }));
    if (errors[f]) setErrors(p => ({ ...p, [f]: '' }));
    setModalError('');
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio';
    if (!form.email.trim()) e.email = 'El email es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email inválido';
    else if (emailStatus === 'taken') e.email = '✗ Este email ya está registrado en el sistema';
    else if (emailStatus === 'checking') e.email = 'Espera un momento, verificando disponibilidad...';

    if (!isEdit) {
      if (!password) e.password = 'La contraseña es obligatoria';
      else if (password.length < 6) e.password = 'Mínimo 6 caracteres';
      if (password !== passConf) e.passConf = 'Las contraseñas no coinciden';
    } else {
      if (password) {
        if (password.length < 6) e.password = 'Mínimo 6 caracteres';
        if (password !== passConf) e.passConf = 'Las contraseñas no coinciden';
      }
    }
    return e;
  };

  const handleSubmit = async () => {
    setModalError('');
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setSaving(true);
    const payload: any = { ...form };
    if (!isEdit || password) payload.password = password;
    if (isEdit && usuario) payload.id = usuario.id;
    const err = await onSave(payload);
    if (err) {
      // El padre devuelve el mensaje de error → mostrarlo dentro del modal
      setModalError(err);
    }
    setSaving(false);
  };

  // Mensaje y color del estado del email
  const emailMsg: Record<EmailStatus, { text: string; color: string } | null> = {
    idle:      null,
    invalid:   null,
    checking:  { text: 'Verificando disponibilidad...', color: 'text-muted-foreground' },
    available: { text: '✓ Email disponible',            color: 'text-[oklch(0.696_0.17_162.48)]' },
    taken:     { text: '✗ Este email ya está registrado', color: 'text-destructive' },
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="border-b border-[oklch(0.269_0_0)] px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[oklch(0.488_0.243_264.376)]/10 rounded-lg">
              <User className="w-6 h-6 text-[oklch(0.488_0.243_264.376)]" />
            </div>
            <h2 className="text-xl text-white">{isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">

          {/* Nombre */}
          <div>
            <label className={lbl}>Nombre completo *</label>
            <input className={inp} value={form.nombre} onChange={e => s('nombre', e.target.value)} placeholder="Ej: María González" />
            {errors.nombre && <p className="text-destructive text-xs mt-1">{errors.nombre}</p>}
          </div>

          {/* Email con verificación en tiempo real */}
          <div>
            <label className={lbl}>Email *</label>
            <div className="relative">
              <input
                type="email"
                value={form.email}
                onChange={e => s('email', e.target.value)}
                placeholder="usuario@farmacia.com"
                className={`${inp} pr-10 ${
                  emailStatus === 'taken'
                    ? 'border-destructive focus:border-destructive'
                    : emailStatus === 'available'
                    ? 'border-[oklch(0.696_0.17_162.48)] focus:border-[oklch(0.696_0.17_162.48)]'
                    : ''
                }`}
              />
              {/* Ícono de estado en el campo */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <EmailStatusIcon status={emailStatus} />
              </div>
            </div>

            {/* Mensaje de estado del email */}
            {emailMsg[emailStatus] && (
              <p className={`text-xs mt-1.5 ${emailMsg[emailStatus]!.color}`}>
                {emailMsg[emailStatus]!.text}
              </p>
            )}
            {/* Error de validación al intentar guardar */}
            {errors.email && emailStatus !== 'taken' && emailStatus !== 'checking' && (
              <p className="text-destructive text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Rol / Estado */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Rol</label>
              <select className={inp + ' appearance-none'} value={form.rol} onChange={e => s('rol', e.target.value)}>
                <option value="Vendedor"      className="bg-[oklch(0.269_0_0)]">Vendedor</option>
                <option value="Supervisor"    className="bg-[oklch(0.269_0_0)]">Supervisor</option>
                <option value="Administrador" className="bg-[oklch(0.269_0_0)]">Administrador</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Estado</label>
              <select className={inp + ' appearance-none'} value={form.estado} onChange={e => s('estado', e.target.value)}>
                <option value="Activo"   className="bg-[oklch(0.269_0_0)]">Activo</option>
                <option value="Inactivo" className="bg-[oklch(0.269_0_0)]">Inactivo</option>
              </select>
            </div>
          </div>

          {/* Teléfono / Fecha */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Teléfono</label>
              <input className={inp} value={form.telefono} onChange={e => s('telefono', e.target.value)} placeholder="+51 999 000 000" />
            </div>
            <div>
              <label className={lbl}>Fecha de ingreso</label>
              <input type="date" className={inp} value={form.fecha_ingreso} onChange={e => s('fecha_ingreso', e.target.value)} />
            </div>
          </div>

          {/* Separador contraseña */}
          <div className="border-t border-[oklch(0.269_0_0)] pt-4">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="w-4 h-4 text-[oklch(0.488_0.243_264.376)]" />
              <p className="text-sm text-white">
                {isEdit ? 'Cambiar contraseña' : 'Contraseña'}
              </p>
              {isEdit && (
                <span className="text-xs text-muted-foreground">(dejar en blanco para no cambiar)</span>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className={lbl}>{isEdit ? 'Nueva contraseña' : 'Contraseña *'}</label>
                <PasswordInput
                  value={password}
                  onChange={setPassword}
                  placeholder={isEdit ? 'Nueva contraseña...' : 'Mínimo 6 caracteres'}
                />
                {errors.password && <p className="text-destructive text-xs mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className={lbl}>{isEdit ? 'Confirmar nueva contraseña' : 'Confirmar contraseña *'}</label>
                <PasswordInput
                  value={passConf}
                  onChange={setPassConf}
                  placeholder="Repetir contraseña"
                />
                {errors.passConf && <p className="text-destructive text-xs mt-1">{errors.passConf}</p>}
              </div>

              {/* Indicador de fortaleza */}
              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1,2,3,4].map(n => (
                      <div
                        key={n}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          password.length >= n * 3
                            ? n <= 1 ? 'bg-destructive'
                            : n <= 2 ? 'bg-[oklch(0.769_0.188_70.08)]'
                            : n <= 3 ? 'bg-[oklch(0.769_0.188_70.08)]'
                            : 'bg-[oklch(0.696_0.17_162.48)]'
                            : 'bg-[oklch(0.269_0_0)]'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {password.length < 6 ? 'Muy corta' : password.length < 9 ? 'Aceptable' : password.length < 12 ? 'Buena' : 'Fuerte'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error interno del modal */}
        {modalError && (
          <div className="mx-6 mb-2 flex items-start gap-3 bg-destructive/10 border border-destructive/40 rounded-lg px-4 py-3">
            <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{modalError}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-[oklch(0.269_0_0)] px-6 py-4 flex gap-3 flex-shrink-0">
          <button
            onClick={handleSubmit}
            disabled={saving || emailStatus === 'taken' || emailStatus === 'checking'}
            className="flex-1 bg-[oklch(0.488_0.243_264.376)] hover:bg-[oklch(0.438_0.243_264.376)] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Guardar Cambios' : 'Crear Usuario'}
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
function UsuarioDetailsModal({ isOpen, onClose, usuario }: any) {
  if (!isOpen || !usuario) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl w-full max-w-md">
        <div className="border-b border-[oklch(0.269_0_0)] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[oklch(0.488_0.243_264.376)] flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-medium">{usuario.nombre}</h2>
              <p className="text-xs text-muted-foreground">{usuario.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[oklch(0.269_0_0)] p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Rol</p>
              <span className={`px-3 py-1 rounded-full text-xs ${rolBadge[usuario.rol]}`}>{usuario.rol}</span>
            </div>
            <div className="bg-[oklch(0.269_0_0)] p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Estado</p>
              <span className={`px-3 py-1 rounded-full text-xs ${usuario.estado === 'Activo' ? 'bg-[oklch(0.696_0.17_162.48)]/20 text-[oklch(0.696_0.17_162.48)]' : 'bg-[oklch(0.269_0_0)] text-muted-foreground'}`}>
                {usuario.estado}
              </span>
            </div>
          </div>
          {usuario.telefono && (
            <div className="bg-[oklch(0.269_0_0)] p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Teléfono</p>
              <p className="text-white">{usuario.telefono}</p>
            </div>
          )}
          {usuario.fecha_ingreso && (
            <div className="bg-[oklch(0.269_0_0)] p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Fecha de ingreso</p>
              <p className="text-white">{new Date(usuario.fecha_ingreso).toLocaleDateString('es-PE')}</p>
            </div>
          )}
        </div>
        <div className="border-t border-[oklch(0.269_0_0)] px-6 py-4">
          <button onClick={onClose} className="w-full bg-[oklch(0.269_0_0)] hover:bg-[oklch(0.318_0_0)] text-white py-3 rounded-lg transition-colors">Cerrar</button>
        </div>
      </div>
    </div>
  );
}

// Modal Eliminar 
function DelModal({ isOpen, onClose, onConfirm, nombre }: any) {
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
          <p className="text-white mb-4">¿Eliminar al usuario <strong>{nombre}</strong>?</p>
          <p className="text-xs text-muted-foreground">⚠️ El usuario perderá acceso al sistema.</p>
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
export default function Usuarios() {
  const [usuarios, setUsuarios]       = useState<Usuario[]>([]);
  const [loading, setLoading]         = useState(true);
  const [searchTerm, setSearchTerm]   = useState('');
  const [filterRol, setFilterRol]     = useState('todos');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [isFormOpen, setIsFormOpen]   = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen]   = useState(false);
  const [formMode, setFormMode]       = useState<'create' | 'edit'>('create');
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage]     = useState('');

  const showMsg = (msg: string) => { setSuccessMessage(msg); setTimeout(() => setSuccessMessage(''), 3000); };
  const showErr = (msg: string) => { setErrorMessage(msg);   setTimeout(() => setErrorMessage(''), 4000); };

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const res = await apiClient('/api/usuarios');
      if (!res.ok) throw new Error();
      setUsuarios(await res.json());
    } catch { showErr('No se pudo conectar con el servidor'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsuarios(); }, []);

  const handleSave = async (data: any): Promise<string | null> => {
    try {
      if (formMode === 'create') {
        const res = await apiClient('/api/usuarios', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json();
          return err.error ?? 'Error al crear el usuario';
        }
        showMsg('Usuario creado exitosamente');
      } else {
        const res = await apiClient(`/api/usuarios/${data.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json();
          return err.error ?? 'Error al actualizar el usuario';
        }
        if (data.password) {
          const resP = await apiClient(`/api/usuarios/${data.id}/password`, {
            method: 'PUT',
            body: JSON.stringify({ password: data.password }),
          });
          if (!resP.ok) return 'Error al actualizar la contraseña';
        }
        showMsg('Usuario actualizado correctamente');
      }
      setIsFormOpen(false);
      setSelectedUsuario(null);
      await fetchUsuarios();
      return null;
    } catch (e: any) {
      return e.message || 'Error inesperado al guardar el usuario';
    }
  };

  const handleDelete = async () => {
    if (!selectedUsuario) return;
    try {
      const res = await apiClient(`/api/usuarios/${selectedUsuario.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await fetchUsuarios();
      setIsDeleteOpen(false);
      setSelectedUsuario(null);
      showMsg('Usuario eliminado');
    } catch { showErr('Error al eliminar el usuario'); }
  };

  const filtered = usuarios.filter(u => {
    const q = searchTerm.toLowerCase();
    const matchSearch = u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return matchSearch && (filterRol === 'todos' || u.rol === filterRol) && (filterEstado === 'todos' || u.estado === filterEstado);
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl text-white mb-1">Usuarios</h2>
          <p className="text-muted-foreground">Gestión de usuarios y permisos</p>
        </div>
        <button
          onClick={() => { setFormMode('create'); setSelectedUsuario(null); setIsFormOpen(true); }}
          className="bg-[oklch(0.488_0.243_264.376)] hover:bg-[oklch(0.438_0.243_264.376)] text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />Nuevo Usuario
        </button>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-muted-foreground" /><p className="text-sm text-muted-foreground">Total</p></div>
          <p className="text-2xl text-white">{usuarios.length}</p>
        </div>
        <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><User className="w-4 h-4 text-muted-foreground" /><p className="text-sm text-muted-foreground">Activos</p></div>
          <p className="text-2xl text-[oklch(0.696_0.17_162.48)]">{usuarios.filter(u => u.estado === 'Activo').length}</p>
        </div>
        <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Shield className="w-4 h-4 text-muted-foreground" /><p className="text-sm text-muted-foreground">Admins</p></div>
          <p className="text-2xl text-[oklch(0.488_0.243_264.376)]">{usuarios.filter(u => u.rol === 'Administrador').length}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-2">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Nombre o email..." className="w-full bg-[oklch(0.269_0_0)] border border-[oklch(0.269_0_0)] rounded-lg pl-11 pr-4 py-2 text-white placeholder:text-muted-foreground focus:outline-none focus:border-[oklch(0.488_0.243_264.376)] transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-2">Rol</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <select value={filterRol} onChange={e => setFilterRol(e.target.value)} className="w-full bg-[oklch(0.269_0_0)] border border-[oklch(0.269_0_0)] rounded-lg pl-11 pr-4 py-2 text-white focus:outline-none focus:border-[oklch(0.488_0.243_264.376)] transition-colors appearance-none">
                <option value="todos" className="bg-[oklch(0.269_0_0)]">Todos los roles</option>
                <option value="Administrador" className="bg-[oklch(0.269_0_0)]">Administrador</option>
                <option value="Supervisor" className="bg-[oklch(0.269_0_0)]">Supervisor</option>
                <option value="Vendedor" className="bg-[oklch(0.269_0_0)]">Vendedor</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-2">Estado</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className="w-full bg-[oklch(0.269_0_0)] border border-[oklch(0.269_0_0)] rounded-lg pl-11 pr-4 py-2 text-white focus:outline-none focus:border-[oklch(0.488_0.243_264.376)] transition-colors appearance-none">
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
            <Loader2 className="w-6 h-6 text-[oklch(0.488_0.243_264.376)] animate-spin" />
            <p className="text-muted-foreground">Cargando usuarios...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[oklch(0.269_0_0)]">
                <tr>
                  <th className="text-left text-sm text-muted-foreground px-6 py-4">Usuario</th>
                  <th className="text-left text-sm text-muted-foreground px-6 py-4">Email</th>
                  <th className="text-center text-sm text-muted-foreground px-6 py-4">Rol</th>
                  <th className="text-center text-sm text-muted-foreground px-6 py-4">Estado</th>
                  <th className="text-center text-sm text-muted-foreground px-6 py-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[oklch(0.269_0_0)]">
                {filtered.map(usuario => (
                  <tr key={usuario.id} className="hover:bg-[oklch(0.269_0_0)]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[oklch(0.488_0.243_264.376)] flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-white">{usuario.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{usuario.email}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs ${rolBadge[usuario.rol]}`}>{usuario.rol}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs ${usuario.estado === 'Activo' ? 'bg-[oklch(0.696_0.17_162.48)]/20 text-[oklch(0.696_0.17_162.48)]' : 'bg-[oklch(0.269_0_0)] text-muted-foreground'}`}>
                        {usuario.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => { setSelectedUsuario(usuario); setIsDetailsOpen(true); }} className="p-2 text-muted-foreground hover:text-[oklch(0.488_0.243_264.376)] transition-colors" title="Ver"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => { setFormMode('edit'); setSelectedUsuario(usuario); setIsFormOpen(true); }} className="p-2 text-muted-foreground hover:text-[oklch(0.769_0.188_70.08)] transition-colors" title="Editar"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => { setSelectedUsuario(usuario); setIsDeleteOpen(true); }} className="p-2 text-muted-foreground hover:text-destructive transition-colors" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">No se encontraron usuarios</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">Mostrando {filtered.length} de {usuarios.length} usuarios</p>

      <UsuarioFormModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setSelectedUsuario(null); }}
        onSave={handleSave}
        usuario={selectedUsuario}
        mode={formMode}
      />
      <UsuarioDetailsModal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} usuario={selectedUsuario} />
      <DelModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete} nombre={selectedUsuario?.nombre || ''} />
    </div>
  );
}
