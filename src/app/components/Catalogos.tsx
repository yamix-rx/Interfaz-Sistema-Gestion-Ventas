import { useState, useEffect } from 'react';
import { apiClient } from '../utils/apiClient';
import { Plus, Edit, Trash2, X, Building2, Pill, Globe, AlertTriangle, Loader2 } from 'lucide-react';


interface Laboratorio { id: number; nombre: string; pais: string; contacto?: string; telefono?: string; productos: number; }
interface Categoria { id: number; nombre: string; descripcion?: string; productos: number; }

const inp = 'w-full bg-[oklch(0.269_0_0)] border border-[oklch(0.269_0_0)] rounded-lg px-4 py-2 text-white placeholder:text-muted-foreground focus:outline-none focus:border-[oklch(0.488_0.243_264.376)] transition-colors';
const lbl = 'block text-sm text-muted-foreground mb-2';

// Modal Laboratorio 
function LabModal({ isOpen, onClose, onSave, item, mode }: any) {
  const [form, setForm] = useState({ nombre: '', pais: '', contacto: '', telefono: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setForm(mode === 'edit' && item ? { nombre: item.nombre, pais: item.pais, contacto: item.contacto || '', telefono: item.telefono || '' } : { nombre: '', pais: '', contacto: '', telefono: '' });
      setErrors({});
    }
  }, [isOpen, mode, item]);

  if (!isOpen) return null;
  const s = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio';
    if (!form.pais.trim()) e.pais = 'El país es obligatorio';
    return e;
  };
  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    onSave({ ...form, ...(mode === 'edit' && item ? { id: item.id, productos: item.productos } : { productos: 0 }) });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl w-full max-w-md">
        <div className="border-b border-[oklch(0.269_0_0)] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="p-2 bg-[oklch(0.488_0.243_264.376)]/10 rounded-lg"><Building2 className="w-6 h-6 text-[oklch(0.488_0.243_264.376)]" /></div><h2 className="text-xl text-white">{mode === 'create' ? 'Nuevo Laboratorio' : 'Editar Laboratorio'}</h2></div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div><label className={lbl}>Nombre *</label><input className={inp} value={form.nombre} onChange={e => s('nombre', e.target.value)} placeholder="Ej: Bayer" />{errors.nombre && <p className="text-destructive text-xs mt-1">{errors.nombre}</p>}</div>
          <div><label className={lbl}>País *</label><div className="relative"><Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input className={inp + ' pl-10'} value={form.pais} onChange={e => s('pais', e.target.value)} placeholder="Ej: Alemania" /></div>{errors.pais && <p className="text-destructive text-xs mt-1">{errors.pais}</p>}</div>
          <div><label className={lbl}>Contacto</label><input className={inp} value={form.contacto} onChange={e => s('contacto', e.target.value)} placeholder="Nombre del representante" /></div>
          <div><label className={lbl}>Teléfono</label><input className={inp} value={form.telefono} onChange={e => s('telefono', e.target.value)} placeholder="+51 999 000 000" /></div>
        </div>
        <div className="border-t border-[oklch(0.269_0_0)] px-6 py-4 flex gap-3">
          <button onClick={handleSubmit} className="flex-1 bg-[oklch(0.488_0.243_264.376)] hover:bg-[oklch(0.438_0.243_264.376)] text-white py-3 rounded-lg transition-colors">{mode === 'create' ? 'Crear' : 'Guardar'}</button>
          <button onClick={onClose} className="flex-1 bg-[oklch(0.269_0_0)] hover:bg-[oklch(0.318_0_0)] text-white py-3 rounded-lg transition-colors">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// Modal Categoría 
function CatModal({ isOpen, onClose, onSave, item, mode }: any) {
  const [form, setForm] = useState({ nombre: '', descripcion: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setForm(mode === 'edit' && item ? { nombre: item.nombre, descripcion: item.descripcion || '' } : { nombre: '', descripcion: '' });
      setErrors({});
    }
  }, [isOpen, mode, item]);

  if (!isOpen) return null;
  const s = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));
  const handleSubmit = () => {
    if (!form.nombre.trim()) { setErrors({ nombre: 'El nombre es obligatorio' }); return; }
    onSave({ ...form, ...(mode === 'edit' && item ? { id: item.id, productos: item.productos } : { productos: 0 }) });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl w-full max-w-md">
        <div className="border-b border-[oklch(0.269_0_0)] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="p-2 bg-[oklch(0.488_0.243_264.376)]/10 rounded-lg"><Pill className="w-6 h-6 text-[oklch(0.488_0.243_264.376)]" /></div><h2 className="text-xl text-white">{mode === 'create' ? 'Nueva Categoría' : 'Editar Categoría'}</h2></div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div><label className={lbl}>Nombre *</label><input className={inp} value={form.nombre} onChange={e => s('nombre', e.target.value)} placeholder="Ej: Analgésicos" />{errors.nombre && <p className="text-destructive text-xs mt-1">{errors.nombre}</p>}</div>
          <div><label className={lbl}>Descripción</label><textarea className={inp + ' resize-none'} rows={3} value={form.descripcion} onChange={e => s('descripcion', e.target.value)} placeholder="Descripción..." /></div>
        </div>
        <div className="border-t border-[oklch(0.269_0_0)] px-6 py-4 flex gap-3">
          <button onClick={handleSubmit} className="flex-1 bg-[oklch(0.488_0.243_264.376)] hover:bg-[oklch(0.438_0.243_264.376)] text-white py-3 rounded-lg transition-colors">{mode === 'create' ? 'Crear' : 'Guardar'}</button>
          <button onClick={onClose} className="flex-1 bg-[oklch(0.269_0_0)] hover:bg-[oklch(0.318_0_0)] text-white py-3 rounded-lg transition-colors">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function DelModal({ isOpen, onClose, onConfirm, nombre }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl max-w-md w-full">
        <div className="border-b border-[oklch(0.269_0_0)] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="p-2 bg-destructive/10 rounded-lg"><AlertTriangle className="w-6 h-6 text-destructive" /></div><h2 className="text-xl text-white">Confirmar Eliminación</h2></div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6"><p className="text-white mb-4">¿Eliminar <strong>{nombre}</strong>?</p><p className="text-xs text-muted-foreground">⚠️ Esta acción no se puede deshacer.</p></div>
        <div className="border-t border-[oklch(0.269_0_0)] px-6 py-4 flex gap-3">
          <button onClick={onConfirm} className="flex-1 bg-destructive hover:bg-destructive/90 text-white py-3 rounded-lg transition-colors">Eliminar</button>
          <button onClick={onClose} className="flex-1 bg-[oklch(0.269_0_0)] hover:bg-[oklch(0.318_0_0)] text-white py-3 rounded-lg transition-colors">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

export default function Catalogos() {
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loadingLab, setLoadingLab] = useState(true);
  const [loadingCat, setLoadingCat] = useState(true);

  const [labModal, setLabModal] = useState(false);
  const [labDelModal, setLabDelModal] = useState(false);
  const [labMode, setLabMode] = useState<'create' | 'edit'>('create');
  const [selLab, setSelLab] = useState<Laboratorio | null>(null);

  const [catModal, setCatModal] = useState(false);
  const [catDelModal, setCatDelModal] = useState(false);
  const [catMode, setCatMode] = useState<'create' | 'edit'>('create');
  const [selCat, setSelCat] = useState<Categoria | null>(null);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const showMsg = (msg: string) => { setSuccessMessage(msg); setTimeout(() => setSuccessMessage(''), 3000); };
  const showErr = (msg: string) => { setErrorMessage(msg); setTimeout(() => setErrorMessage(''), 3000); };

  const fetchLabs = async () => {
    try {
      setLoadingLab(true);

      const r = await apiClient('/api/laboratorios');

      setLaboratorios(await r.json());

    } catch {
      showErr('Error al cargar laboratorios');
    } finally {
      setLoadingLab(false);
    }
  };

  const fetchCats = async () => {
    try {
      setLoadingCat(true);

      const r = await apiClient('/api/categorias');

      setCategorias(await r.json());

    } catch {
      showErr('Error al cargar categorías');
    } finally {
      setLoadingCat(false);
    }
  };

  useEffect(() => { fetchLabs(); fetchCats(); }, []);

  // CRUD Laboratorios
  const saveLab = async (data: any) => {
    try {

      if (labMode === 'create') {

        await apiClient('/api/laboratorios', {
          method: 'POST',
          body: JSON.stringify(data),
        });

        showMsg('Laboratorio creado');

      } else {

        await apiClient(`/api/laboratorios/${data.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });

        showMsg('Laboratorio actualizado');
      }

      setLabModal(false);

      await fetchLabs();

    } catch {
      showErr('Error al guardar laboratorio');
    }
  };

  const deleteLab = async () => {
    if (!selLab) return;

    try {

      await apiClient(`/api/laboratorios/${selLab.id}`, {
        method: 'DELETE',
      });

      await fetchLabs();

      setLabDelModal(false);

      setSelLab(null);

      showMsg('Laboratorio eliminado');

    } catch {
      showErr('Error al eliminar laboratorio');
    }
  };

  // CRUD Categorías
  const saveCat = async (data: any) => {
    try {

      if (catMode === 'create') {

        await apiClient('/api/categorias', {
          method: 'POST',
          body: JSON.stringify(data),
        });

        showMsg('Categoría creada');

      } else {

        await apiClient(`/api/categorias/${data.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });

        showMsg('Categoría actualizada');
      }

      setCatModal(false);

      await fetchCats();

    } catch {
      showErr('Error al guardar categoría');
    }
  };

  const deleteCat = async () => {
    if (!selCat) return;

    try {

      await apiClient(`/api/categorias/${selCat.id}`, {
        method: 'DELETE',
      });

      await fetchCats();

      setCatDelModal(false);

      setSelCat(null);

      showMsg('Categoría eliminada');

    } catch {
      showErr('Error al eliminar categoría');
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div><h2 className="text-2xl text-white mb-1">Catálogos</h2><p className="text-muted-foreground">Gestión de laboratorios y categorías</p></div>

      {successMessage && <div className="bg-[oklch(0.696_0.17_162.48)]/20 border border-[oklch(0.696_0.17_162.48)] rounded-lg p-4 flex items-center justify-between"><p className="text-[oklch(0.696_0.17_162.48)]">{successMessage}</p><button onClick={() => setSuccessMessage('')}><X className="w-5 h-5 text-[oklch(0.696_0.17_162.48)]" /></button></div>}
      {errorMessage && <div className="bg-destructive/20 border border-destructive rounded-lg p-4 flex items-center justify-between"><p className="text-destructive">{errorMessage}</p><button onClick={() => setErrorMessage('')}><X className="w-5 h-5 text-destructive" /></button></div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Laboratorios */}
        <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2"><Building2 className="w-5 h-5 text-[oklch(0.488_0.243_264.376)]" /><h3 className="text-lg text-white">Laboratorios</h3><span className="px-2 py-0.5 bg-[oklch(0.269_0_0)] text-muted-foreground rounded-full text-xs">{laboratorios.length}</span></div>
            <button onClick={() => { setLabMode('create'); setSelLab(null); setLabModal(true); }} className="flex items-center gap-1 px-3 py-1.5 bg-[oklch(0.488_0.243_264.376)] hover:bg-[oklch(0.438_0.243_264.376)] text-white rounded-lg transition-colors text-sm"><Plus className="w-4 h-4" />Nuevo</button>
          </div>
          {loadingLab ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-[oklch(0.488_0.243_264.376)] animate-spin" /></div> : (
            <div className="space-y-3">
              {laboratorios.map(lab => (
                <div key={lab.id} className="bg-[oklch(0.269_0_0)] rounded-lg p-4 hover:bg-[oklch(0.318_0_0)] transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0"><p className="text-white mb-0.5">{lab.nombre}</p><p className="text-xs text-muted-foreground">{lab.pais}</p>{lab.contacto && <p className="text-xs text-muted-foreground mt-0.5">{lab.contacto}</p>}</div>
                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      <span className="px-3 py-1 bg-[oklch(0.488_0.243_264.376)]/20 text-[oklch(0.488_0.243_264.376)] rounded-full text-xs whitespace-nowrap">{lab.productos} productos</span>
                      <button onClick={() => { setLabMode('edit'); setSelLab(lab); setLabModal(true); }} className="p-1.5 text-muted-foreground hover:text-[oklch(0.769_0.188_70.08)] transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { setSelLab(lab); setLabDelModal(true); }} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              ))}
              {laboratorios.length === 0 && <p className="text-center text-muted-foreground py-8">No hay laboratorios registrados</p>}
            </div>
          )}
        </div>

        {/* Categorías */}
        <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2"><Pill className="w-5 h-5 text-[oklch(0.488_0.243_264.376)]" /><h3 className="text-lg text-white">Categorías</h3><span className="px-2 py-0.5 bg-[oklch(0.269_0_0)] text-muted-foreground rounded-full text-xs">{categorias.length}</span></div>
            <button onClick={() => { setCatMode('create'); setSelCat(null); setCatModal(true); }} className="flex items-center gap-1 px-3 py-1.5 bg-[oklch(0.488_0.243_264.376)] hover:bg-[oklch(0.438_0.243_264.376)] text-white rounded-lg transition-colors text-sm"><Plus className="w-4 h-4" />Nueva</button>
          </div>
          {loadingCat ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-[oklch(0.488_0.243_264.376)] animate-spin" /></div> : (
            <div className="space-y-3">
              {categorias.map(cat => (
                <div key={cat.id} className="bg-[oklch(0.269_0_0)] rounded-lg p-4 hover:bg-[oklch(0.318_0_0)] transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0"><p className="text-white mb-0.5">{cat.nombre}</p>{cat.descripcion && <p className="text-xs text-muted-foreground">{cat.descripcion}</p>}</div>
                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      <span className="px-3 py-1 bg-[oklch(0.488_0.243_264.376)]/20 text-[oklch(0.488_0.243_264.376)] rounded-full text-xs whitespace-nowrap">{cat.productos} productos</span>
                      <button onClick={() => { setCatMode('edit'); setSelCat(cat); setCatModal(true); }} className="p-1.5 text-muted-foreground hover:text-[oklch(0.769_0.188_70.08)] transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { setSelCat(cat); setCatDelModal(true); }} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              ))}
              {categorias.length === 0 && <p className="text-center text-muted-foreground py-8">No hay categorías registradas</p>}
            </div>
          )}
        </div>
      </div>

      <LabModal isOpen={labModal} onClose={() => { setLabModal(false); setSelLab(null); }} onSave={saveLab} item={selLab} mode={labMode} />
      <DelModal isOpen={labDelModal} onClose={() => setLabDelModal(false)} onConfirm={deleteLab} nombre={selLab?.nombre || ''} />
      <CatModal isOpen={catModal} onClose={() => { setCatModal(false); setSelCat(null); }} onSave={saveCat} item={selCat} mode={catMode} />
      <DelModal isOpen={catDelModal} onClose={() => setCatDelModal(false)} onConfirm={deleteCat} nombre={selCat?.nombre || ''} />
    </div>
  );
}
