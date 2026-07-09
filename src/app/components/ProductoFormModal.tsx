import { useState, useEffect } from 'react';
import { apiClient } from '../utils/apiClient';
import { X, Loader2 } from 'lucide-react';


interface Producto {
  id?: string;
  nombre: string;
  descripcion?: string;
  laboratorio: string;
  lote: string;
  precio: number;
  stock: number;
  stockMinimo: number;
  vencimiento: string;
  categoria?: string;
}

interface ProductoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (producto: Producto) => void | Promise<void>;
  producto?: Producto | null;
  mode: 'create' | 'edit';
}

export default function ProductoFormModal({ isOpen, onClose, onSave, producto, mode }: ProductoFormModalProps) {
  const emptyForm: Producto = { nombre: '', descripcion: '', laboratorio: '', lote: '', precio: 0, stock: 0, stockMinimo: 0, vencimiento: '', categoria: '' };

  const [formData, setFormData] = useState<Producto>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [laboratorios, setLaboratorios] = useState<{ id: number; nombre: string }[]>([]);
  const [categorias, setCategorias] = useState<{ id: number; nombre: string }[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);

  // Cargar laboratorios y categorías
  useEffect(() => {
    if (!isOpen) return;
    const fetchCatalogos = async () => {
      setLoadingCatalogos(true);
      try {
        const [resLabs, resCats] = await Promise.all([
          apiClient('/api/laboratorios'),
          apiClient('/api/categorias'),
        ]);
        const labs = await resLabs.json();
        const cats = await resCats.json();
        setLaboratorios(labs);
        setCategorias(cats);
      } catch {
      } finally {
        setLoadingCatalogos(false);
      }
    };
    fetchCatalogos();
  }, [isOpen]);

  // Rellenar formulario al editar
  useEffect(() => {
    if (producto && mode === 'edit') {
      setFormData({
        ...producto,
        vencimiento: producto.vencimiento?.split('T')[0] ?? producto.vencimiento,
      });
    } else {
      setFormData(emptyForm);
    }
    setErrors({});
  }, [producto, mode, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
    else if (formData.nombre.length > 100) newErrors.nombre = 'Máximo 100 caracteres';
    if (!formData.laboratorio.trim()) newErrors.laboratorio = 'El laboratorio es obligatorio';
    if (!formData.lote.trim()) newErrors.lote = 'El lote es obligatorio';
    if (formData.precio <= 0) newErrors.precio = 'El precio debe ser mayor a 0';
    if (formData.stock < 0) newErrors.stock = 'El stock no puede ser negativo';
    if (formData.stockMinimo < 0) newErrors.stockMinimo = 'El stock mínimo no puede ser negativo';
    if (!formData.vencimiento) newErrors.vencimiento = 'La fecha de vencimiento es obligatoria';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'precio' || name === 'stock' || name === 'stockMinimo' ? parseFloat(value) || 0 : value,
    }));
    if (errors[name]) setErrors(prev => { const e = { ...prev }; delete e[name]; return e; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await onSave(formData);
      onClose();
    } catch {
      // El componente padre muestra el mensaje de error.
    }
  };

  if (!isOpen) return null;

  const inputClass = (field: string) =>
    `w-full bg-[oklch(0.269_0_0)] border ${errors[field] ? 'border-destructive' : 'border-[oklch(0.269_0_0)]'} rounded-lg px-4 py-2 text-white placeholder:text-muted-foreground focus:outline-none focus:border-[oklch(0.488_0.243_264.376)] transition-colors`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[oklch(0.205_0_0)] border-b border-[oklch(0.269_0_0)] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl text-white">{mode === 'create' ? 'Nuevo Producto' : 'Editar Producto'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Nombre */}
            <div className="md:col-span-2">
              <label className="block text-sm text-muted-foreground mb-2">Nombre del Producto <span className="text-destructive">*</span></label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className={inputClass('nombre')} placeholder="Ej: Paracetamol 500mg" />
              {errors.nombre && <p className="text-destructive text-xs mt-1">{errors.nombre}</p>}
            </div>

            {/* Descripción */}
            <div className="md:col-span-2">
              <label className="block text-sm text-muted-foreground mb-2">Descripción</label>
              <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} rows={3} maxLength={500} className="w-full bg-[oklch(0.269_0_0)] border border-[oklch(0.269_0_0)] rounded-lg px-4 py-2 text-white placeholder:text-muted-foreground focus:outline-none focus:border-[oklch(0.488_0.243_264.376)] transition-colors resize-none" placeholder="Descripción del producto (opcional)" />
            </div>

            {/* Laboratorio */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                Laboratorio <span className="text-destructive">*</span>
              </label>
              {loadingCatalogos ? (
                <div className="flex items-center gap-2 bg-[oklch(0.269_0_0)] border border-[oklch(0.269_0_0)] rounded-lg px-4 py-2">
                  <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                  <span className="text-muted-foreground text-sm">Cargando...</span>
                </div>
              ) : (
                <select name="laboratorio" value={formData.laboratorio} onChange={handleChange} className={inputClass('laboratorio')}>
                  <option value="">Seleccionar laboratorio</option>
                  {laboratorios.map(lab => (
                    <option key={lab.id} value={lab.nombre} className="bg-[oklch(0.269_0_0)]">
                      {lab.nombre}
                    </option>
                  ))}
                </select>
              )}
              {errors.laboratorio && <p className="text-destructive text-xs mt-1">{errors.laboratorio}</p>}
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Categoría</label>
              {loadingCatalogos ? (
                <div className="flex items-center gap-2 bg-[oklch(0.269_0_0)] border border-[oklch(0.269_0_0)] rounded-lg px-4 py-2">
                  <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                  <span className="text-muted-foreground text-sm">Cargando...</span>
                </div>
              ) : (
                <select name="categoria" value={formData.categoria} onChange={handleChange} className={inputClass('categoria')}>
                  <option value="">Seleccionar categoría</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.nombre} className="bg-[oklch(0.269_0_0)]">
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Lote */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Lote <span className="text-destructive">*</span></label>
              <input type="text" name="lote" value={formData.lote} onChange={handleChange} className={inputClass('lote')} placeholder="Ej: L2024-089" />
              {errors.lote && <p className="text-destructive text-xs mt-1">{errors.lote}</p>}
            </div>

            {/* Fecha de Vencimiento */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Fecha de Vencimiento <span className="text-destructive">*</span></label>
              <input type="date" name="vencimiento" value={formData.vencimiento} onChange={handleChange} className={inputClass('vencimiento')} />
              {errors.vencimiento && <p className="text-destructive text-xs mt-1">{errors.vencimiento}</p>}
            </div>

            {/* Precio */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Precio (S/.) <span className="text-destructive">*</span></label>
              <input type="number" name="precio" value={formData.precio} onChange={handleChange} step="0.01" min="0" className={inputClass('precio')} placeholder="0.00" />
              {errors.precio && <p className="text-destructive text-xs mt-1">{errors.precio}</p>}
            </div>

            {/* Stock */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Stock Disponible <span className="text-destructive">*</span></label>
              <input type="number" name="stock" value={formData.stock} onChange={handleChange} min="0" className={inputClass('stock')} placeholder="0" />
              {errors.stock && <p className="text-destructive text-xs mt-1">{errors.stock}</p>}
            </div>

            {/* Stock Mínimo */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Stock Mínimo <span className="text-destructive">*</span></label>
              <input type="number" name="stockMinimo" value={formData.stockMinimo} onChange={handleChange} min="0" className={inputClass('stockMinimo')} placeholder="0" />
              {errors.stockMinimo && <p className="text-destructive text-xs mt-1">{errors.stockMinimo}</p>}
            </div>
          </div>

          {/* Error summary */}
          {Object.keys(errors).length > 0 && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive rounded-lg">
              <p className="text-destructive text-sm">Por favor, corrija los errores antes de guardar.</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 mt-6">
            <button type="submit" className="flex-1 bg-[oklch(0.488_0.243_264.376)] hover:bg-[oklch(0.438_0.243_264.376)] text-white py-3 rounded-lg transition-colors">
              {mode === 'create' ? 'Crear Producto' : 'Actualizar Producto'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-[oklch(0.269_0_0)] hover:bg-[oklch(0.318_0_0)] text-white py-3 rounded-lg transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
