import { useState, useEffect } from 'react';
import { apiClient } from '../utils/apiClient';
import { Search, Filter, Plus, Edit, Trash2, AlertCircle, Eye, X, Loader2 } from 'lucide-react';
import ProductoFormModal from './ProductoFormModal';
import ProductoDetailsModal from './ProductoDetailsModal';
import DeleteConfirmModal from './DeleteConfirmModal';



interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  laboratorio: string;
  lote: string;
  stock: number;
  stockMinimo: number;
  precio: number;
  vencimiento: string;
  estado: 'normal' | 'bajo' | 'agotado' | 'vencido';
  categoria?: string;
}

export default function Inventario() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLab, setFilterLab] = useState('todos');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const res = await apiClient('/api/productos');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProductos(data.map((p: any) => ({ ...p, stockMinimo: p.stock_minimo ?? p.stockMinimo })));
    } catch {
      setErrorMessage('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProductos(); }, []);

  const showMsg = (msg: string) => { setSuccessMessage(msg); setTimeout(() => setSuccessMessage(''), 3000); };
  const showErr = (msg: string) => { setErrorMessage(msg); setTimeout(() => setErrorMessage(''), 3000); };

  const determinarEstado = (p: Producto): Producto['estado'] => {
    if (p.stock === 0) return 'agotado';
    if (p.stock < p.stockMinimo) return 'bajo';
    if (Math.ceil((new Date(p.vencimiento).getTime() - Date.now()) / 86400000) <= 12) return 'vencido';
    return 'normal';
  };

  const generarSiguienteIdProducto = () => {
    const numeros = productos
      .map(p => Number(String(p.id).replace(/[^0-9]/g, '')))
      .filter(n => !Number.isNaN(n));
    const siguiente = numeros.length > 0 ? Math.max(...numeros) + 1 : 1;
    return `P${String(siguiente).padStart(3, '0')}`;
  };

  const prepararProductoParaApi = (data: any, id: string, estado: Producto['estado']) => ({
    id,
    nombre: data.nombre,
    descripcion: data.descripcion || '',
    laboratorio: data.laboratorio,
    lote: data.lote,
    stock: Number(data.stock) || 0,
    stock_minimo: Number(data.stockMinimo ?? data.stock_minimo) || 0,
    precio: Number(data.precio) || 0,
    vencimiento: data.vencimiento?.split('T')[0] ?? data.vencimiento,
    estado,
    categoria: data.categoria || '',
  });

  const handleCreate = async (data: Omit<Producto, 'id' | 'estado'>) => {
    const id = generarSiguienteIdProducto();
    const estado = determinarEstado({ ...data, id, estado: 'normal' });
    try {
      const res = await apiClient('/api/productos', {
        method: 'POST',
        body: JSON.stringify(prepararProductoParaApi(data, id, estado)),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Error al crear el producto');
      }
      await fetchProductos();
      showMsg('Producto creado exitosamente');
    } catch (err: any) { showErr(err.message || 'Error al crear el producto'); }
  };

  const handleEdit = async (data: Producto) => {
    const estado = determinarEstado(data);
    try {
      const res = await apiClient(`/api/productos/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(prepararProductoParaApi(data, data.id, estado)),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Error al actualizar el producto');
      }
      await fetchProductos();
      showMsg('Producto actualizado correctamente');
    } catch (err: any) { showErr(err.message || 'Error al actualizar el producto'); }
  };

  const handleDelete = async () => {
    if (!selectedProducto) return;
    try {
      const res = await apiClient(`/api/productos/${selectedProducto.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();
      await fetchProductos();
      setIsDeleteModalOpen(false);
      setSelectedProducto(null);
      showMsg('Producto eliminado');
    } catch { showErr('Error al eliminar el producto'); }
  };

  const handleSave = (producto: any) => formMode === 'create' ? handleCreate(producto) : handleEdit(producto);
  const openCreateModal = () => { setFormMode('create'); setSelectedProducto(null); setIsFormModalOpen(true); };
  const openEditModal = (p: Producto) => { setFormMode('edit'); setSelectedProducto(p); setIsFormModalOpen(true); };
  const openDetailsModal = (p: Producto) => { setSelectedProducto(p); setIsDetailsModalOpen(true); };
  const openDeleteModal = (p: Producto) => { setSelectedProducto(p); setIsDeleteModalOpen(true); };

  const laboratorios = ['todos', ...Array.from(new Set(productos.map(p => p.laboratorio)))];
  const filteredProducts = productos.filter(p => {
    const matchSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch && (filterLab === 'todos' || p.laboratorio === filterLab);
  });

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, string> = {
      normal: 'bg-[oklch(0.696_0.17_162.48)]/20 text-[oklch(0.696_0.17_162.48)]',
      bajo: 'bg-[oklch(0.769_0.188_70.08)]/20 text-[oklch(0.769_0.188_70.08)]',
      agotado: 'bg-[oklch(0.396_0.141_25.723)] text-[oklch(0.645_0.246_16.439)]',
      vencido: 'bg-[oklch(0.396_0.141_25.723)] text-[oklch(0.645_0.246_16.439)]',
    };
    const labels: Record<string, string> = { normal: 'Normal', bajo: 'Stock Bajo', agotado: 'Agotado', vencido: 'Vencido' };
    return <span className={`px-3 py-1 rounded-full text-xs ${badges[estado]}`}>{labels[estado]}</span>;
  };

  const isVencido = (fecha: string) => Math.ceil((new Date(fecha).getTime() - Date.now()) / 86400000) <= 12;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl text-white mb-1">Inventario</h2>
          <p className="text-muted-foreground">Gestión de stock en tiempo real</p>
        </div>
        <button onClick={openCreateModal} className="bg-[oklch(0.488_0.243_264.376)] hover:bg-[oklch(0.438_0.243_264.376)] text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
          <Plus className="w-5 h-5" /> Nuevo Producto
        </button>
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Nombre o código..." className="w-full bg-[oklch(0.269_0_0)] border border-[oklch(0.269_0_0)] rounded-lg pl-11 pr-4 py-2 text-white placeholder:text-muted-foreground focus:outline-none focus:border-[oklch(0.488_0.243_264.376)] transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-2">Laboratorio</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <select value={filterLab} onChange={e => setFilterLab(e.target.value)} className="w-full bg-[oklch(0.269_0_0)] border border-[oklch(0.269_0_0)] rounded-lg pl-11 pr-4 py-2 text-white focus:outline-none focus:border-[oklch(0.488_0.243_264.376)] transition-colors appearance-none">
                {laboratorios.map(lab => <option key={lab} value={lab} className="bg-[oklch(0.269_0_0)]">{lab === 'todos' ? 'Todos los laboratorios' : lab}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3">
            <Loader2 className="w-6 h-6 text-[oklch(0.488_0.243_264.376)] animate-spin" />
            <p className="text-muted-foreground">Cargando productos...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[oklch(0.269_0_0)]">
                <tr>
                  <th className="text-left text-sm text-muted-foreground px-6 py-4">Código</th>
                  <th className="text-left text-sm text-muted-foreground px-6 py-4">Producto</th>
                  <th className="text-left text-sm text-muted-foreground px-6 py-4">Laboratorio</th>
                  <th className="text-left text-sm text-muted-foreground px-6 py-4">Lote</th>
                  <th className="text-center text-sm text-muted-foreground px-6 py-4">Stock</th>
                  <th className="text-right text-sm text-muted-foreground px-6 py-4">Precio</th>
                  <th className="text-left text-sm text-muted-foreground px-6 py-4">Vencimiento</th>
                  <th className="text-center text-sm text-muted-foreground px-6 py-4">Estado</th>
                  <th className="text-center text-sm text-muted-foreground px-6 py-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[oklch(0.269_0_0)]">
                {filteredProducts.map(producto => (
                  <tr key={producto.id} className="hover:bg-[oklch(0.269_0_0)]/50 transition-colors">
                    <td className="px-6 py-4"><span className="text-white text-sm">{producto.id}</span></td>
                    <td className="px-6 py-4"><p className="text-white">{producto.nombre}</p></td>
                    <td className="px-6 py-4"><span className="text-white text-sm">{producto.laboratorio}</span></td>
                    <td className="px-6 py-4"><span className="text-muted-foreground text-sm">{producto.lote}</span></td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-white">{producto.stock}</span>
                        <span className="text-xs text-muted-foreground">mín: {producto.stockMinimo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right"><span className="text-white">S/. {Number(producto.precio).toFixed(2)}</span></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {isVencido(producto.vencimiento) && <AlertCircle className="w-4 h-4 text-[oklch(0.645_0.246_16.439)]" />}
                        <span className={`text-sm ${isVencido(producto.vencimiento) ? 'text-[oklch(0.645_0.246_16.439)]' : 'text-white'}`}>
                          {new Date(producto.vencimiento).toLocaleDateString('es-PE')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">{getEstadoBadge(producto.estado)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openDetailsModal(producto)} className="p-2 text-muted-foreground hover:text-[oklch(0.488_0.243_264.376)] transition-colors" title="Ver detalles"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => openEditModal(producto)} className="p-2 text-muted-foreground hover:text-[oklch(0.769_0.188_70.08)] transition-colors" title="Editar"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => openDeleteModal(producto)} className="p-2 text-muted-foreground hover:text-destructive transition-colors" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr><td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">No se encontraron productos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>Mostrando {filteredProducts.length} de {productos.length} productos</p>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[oklch(0.696_0.17_162.48)]"></div><span>Normal</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[oklch(0.769_0.188_70.08)]"></div><span>Stock Bajo</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[oklch(0.645_0.246_16.439)]"></div><span>Crítico</span></div>
        </div>
      </div>

      <ProductoFormModal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} onSave={handleSave} producto={selectedProducto} mode={formMode} />
      <ProductoDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} producto={selectedProducto} />
      <DeleteConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDelete} productName={selectedProducto?.nombre || ''} />
    </div>
  );
}
