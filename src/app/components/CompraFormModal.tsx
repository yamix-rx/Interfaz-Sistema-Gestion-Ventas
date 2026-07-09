import { useState, useEffect } from 'react';
import { X, Package } from 'lucide-react';

interface Compra {
  id: string;
  proveedor: string;
  fecha: string;
  total: number;
  estado: 'Pendiente' | 'Recibido' | 'Cancelado';
  productos?: string;
  notas?: string;
}

interface CompraFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (compra: any) => void;
  compra: Compra | null;
  mode: 'create' | 'edit';
}

const inputClass =
  'w-full bg-[oklch(0.269_0_0)] border border-[oklch(0.269_0_0)] rounded-lg px-4 py-2 text-white placeholder:text-muted-foreground focus:outline-none focus:border-[oklch(0.488_0.243_264.376)] transition-colors';
const labelClass = 'block text-sm text-muted-foreground mb-2';

export default function CompraFormModal({ isOpen, onClose, onSave, compra, mode }: CompraFormModalProps) {
  const [form, setForm] = useState({
    proveedor: '',
    fecha: new Date().toISOString().split('T')[0],
    total: '',
    estado: 'Pendiente' as 'Pendiente' | 'Recibido' | 'Cancelado',
    productos: '',
    notas: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (mode === 'edit' && compra) {
      // El campo "productos" viene de la BD como JSON string, ej:
      // '[{"descripcion":"Paracetamol x200"},{"descripcion":"Ibuprofeno x100"}]'
      // Lo convertimos de vuelta a texto legible para mostrarlo en el input.
      let productosTexto = '';
      try {
        const arr = JSON.parse(compra.productos || '[]');
        productosTexto = Array.isArray(arr)
          ? arr.map((p: any) => (typeof p === 'string' ? p : p.descripcion || p.nombre || '')).join(', ')
          : '';
      } catch {
        // Si no es JSON (datos antiguos guardados como texto plano), se usa tal cual.
        productosTexto = compra.productos || '';
      }

      setForm({
        proveedor: compra.proveedor,
        fecha: compra.fecha,
        total: String(compra.total),
        estado: compra.estado,
        productos: productosTexto,
        notas: compra.notas || '',
      });
    } else {
      setForm({ proveedor: '', fecha: new Date().toISOString().split('T')[0], total: '', estado: 'Pendiente', productos: '', notas: '' });
    }
    setErrors({});
  }, [mode, compra, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.proveedor.trim()) e.proveedor = 'El proveedor es obligatorio';
    if (!form.fecha) e.fecha = 'La fecha es obligatoria';
    if (!form.total || isNaN(Number(form.total)) || Number(form.total) <= 0)
      e.total = 'El total debe ser un número mayor a 0';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    // Convierte el texto descriptivo de productos (ej: "Paracetamol x200, Ibuprofeno x100")
    // en un arreglo JSON válido antes de enviarlo al backend, ya que CompraBuilder
    // exige que el campo "productos" sea JSON parseable.
    const productosArray = form.productos
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map(p => ({ descripcion: p }));

    onSave({
      ...form,
      total: Number(form.total),
      productos: JSON.stringify(productosArray), // siempre JSON válido, incluso si está vacío ("[]")
      ...(mode === 'edit' && compra ? { id: compra.id } : {}),
    });
    onClose();
  };

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-[oklch(0.269_0_0)] px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[oklch(0.488_0.243_264.376)]/10 rounded-lg">
              <Package className="w-6 h-6 text-[oklch(0.488_0.243_264.376)]" />
            </div>
            <h2 className="text-xl text-white">{mode === 'create' ? 'Nueva Compra' : 'Editar Compra'}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div>
            <label className={labelClass}>Proveedor *</label>
            <input className={inputClass} value={form.proveedor} onChange={e => set('proveedor', e.target.value)} placeholder="Nombre del proveedor" />
            {errors.proveedor && <p className="text-destructive text-xs mt-1">{errors.proveedor}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Fecha *</label>
              <input type="date" className={inputClass} value={form.fecha} onChange={e => set('fecha', e.target.value)} />
              {errors.fecha && <p className="text-destructive text-xs mt-1">{errors.fecha}</p>}
            </div>
            <div>
              <label className={labelClass}>Total (S/.) *</label>
              <input type="number" min="0" step="0.01" className={inputClass} value={form.total} onChange={e => set('total', e.target.value)} placeholder="0.00" />
              {errors.total && <p className="text-destructive text-xs mt-1">{errors.total}</p>}
            </div>
          </div>

          <div>
            <label className={labelClass}>Estado</label>
            <select
              className={inputClass + ' appearance-none'}
              value={form.estado}
              onChange={e => set('estado', e.target.value)}
            >
              <option value="Pendiente" className="bg-[oklch(0.269_0_0)]">Pendiente</option>
              <option value="Recibido" className="bg-[oklch(0.269_0_0)]">Recibido</option>
              <option value="Cancelado" className="bg-[oklch(0.269_0_0)]">Cancelado</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Productos (descripción)</label>
            <input className={inputClass} value={form.productos} onChange={e => set('productos', e.target.value)} placeholder="Ej: Paracetamol x200, Ibuprofeno x100..." />
          </div>

          <div>
            <label className={labelClass}>Notas</label>
            <textarea
              className={inputClass + ' resize-none'}
              rows={3}
              value={form.notas}
              onChange={e => set('notas', e.target.value)}
              placeholder="Observaciones adicionales..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[oklch(0.269_0_0)] px-6 py-4 flex gap-3 flex-shrink-0">
          <button
            onClick={handleSubmit}
            className="flex-1 bg-[oklch(0.488_0.243_264.376)] hover:bg-[oklch(0.438_0.243_264.376)] text-white py-3 rounded-lg transition-colors"
          >
            {mode === 'create' ? 'Crear Compra' : 'Guardar Cambios'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-[oklch(0.269_0_0)] hover:bg-[oklch(0.318_0_0)] text-white py-3 rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
