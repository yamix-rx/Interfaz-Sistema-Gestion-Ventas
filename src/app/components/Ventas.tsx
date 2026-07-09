import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../utils/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  Search, Plus, Trash2, User, FileText, Receipt,
  Loader2, X, CreditCard, Banknote, Smartphone,
  CheckCircle2, ShoppingCart, UserCheck, Phone, MapPin, Download,
} from 'lucide-react';

// Interfaces 
interface Producto {
  id: string; nombre: string; precio: number; stock: number; estado: string;
}
interface CartItem {
  id: string; nombre: string; precio: number; cantidad: number; stock: number;
}
interface Cliente {
  id: number; nombre: string; dni?: string; telefono?: string; direccion?: string; estado: string;
}
type MetodoPago = 'Efectivo' | 'Yape/Plin';
type TipoDoc    = 'Boleta'   | 'Factura';

const METODOS: { value: MetodoPago; label: string; icon: any }[] = [
  { value: 'Efectivo',  label: 'Efectivo',  icon: Banknote   },
  { value: 'Yape/Plin', label: 'Yape/Plin', icon: Smartphone },
];

const inputCls = 'w-full bg-[oklch(0.269_0_0)] border border-[oklch(0.269_0_0)] rounded-lg px-4 py-2 text-white placeholder:text-muted-foreground focus:outline-none focus:border-[oklch(0.488_0.243_264.376)] transition-colors';

// Modal confirmación
function ConfirmVentaModal({ isOpen, onClose, onConfirm, cartItems, total, igv, subtotal, clienteNombre, metodoPago, tipoDoc, saving }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl w-full max-w-md">
        <div className="border-b border-[oklch(0.269_0_0)] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[oklch(0.696_0.17_162.48)]/10 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-[oklch(0.696_0.17_162.48)]" />
            </div>
            <h2 className="text-xl text-white">Confirmar Venta</h2>
          </div>
          <button onClick={onClose} disabled={saving} className="text-muted-foreground hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Lista de productos */}
          <div className="bg-[oklch(0.269_0_0)] rounded-lg p-4 space-y-2 max-h-40 overflow-y-auto">
            {cartItems.map((item: CartItem) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-white">
                  {item.nombre} <span className="text-muted-foreground">×{item.cantidad}</span>
                </span>
                <span className="text-white flex-shrink-0 ml-2">
                  S/. {(item.precio * item.cantidad).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Resumen */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cliente</span>
              <span className="text-white">{clienteNombre || 'Consumidor final'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Comprobante</span>
              <span className="text-white">{tipoDoc}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pago</span>
              <span className="text-white">{metodoPago}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-white">S/. {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IGV (18%)</span>
              <span className="text-white">S/. {igv.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[oklch(0.318_0_0)]">
              <span className="text-white font-medium">Total a cobrar</span>
              <span className="text-[oklch(0.696_0.17_162.48)] text-lg font-semibold">
                S/. {total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-[oklch(0.269_0_0)] px-6 py-4 flex gap-3">
          <button
            onClick={onConfirm}
            disabled={saving}
            className="flex-1 bg-[oklch(0.696_0.17_162.48)] hover:bg-[oklch(0.646_0.17_162.48)] disabled:opacity-60 text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {saving ? 'Procesando...' : 'Confirmar y Cobrar'}
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 bg-[oklch(0.269_0_0)] hover:bg-[oklch(0.318_0_0)] disabled:opacity-50 text-white py-3 rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente principal
export default function Ventas() {
  const { usuario } = useAuth();

  // Carrito
  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems,  setCartItems]  = useState<CartItem[]>([]);
  const [productos,  setProductos]  = useState<Producto[]>([]);
  const [loading,    setLoading]    = useState(true);

  // Cliente
  const [clienteNombre,       setClienteNombre]       = useState('');
  const [clienteDocumento,    setClienteDocumento]     = useState('');
  const [clienteTelefono,     setClienteTelefono]      = useState('');
  const [clienteDireccion,    setClienteDireccion]     = useState('');
  const [clienteSeleccionado, setClienteSeleccionado]  = useState<Cliente | null>(null);

  // Autocompletado
  const [clientes,             setClientes]             = useState<Cliente[]>([]);
  const [sugerencias,          setSugerencias]          = useState<Cliente[]>([]);
  const [mostrarSugerencias,   setMostrarSugerencias]   = useState(false);
  const [busquedaActiva,       setBusquedaActiva]       = useState<'nombre' | 'dni' | null>(null);
  const refNombre    = useRef<HTMLDivElement>(null);
  const refDocumento = useRef<HTMLDivElement>(null);

  // Pago / comprobante
  const [metodoPago,  setMetodoPago]  = useState<MetodoPago>('Efectivo');
  const [tipoDoc,     setTipoDoc]     = useState<TipoDoc>('Boleta');
  const [montoPagado, setMontoPagado] = useState('');

  // QR Yape/Plin
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [pdfVentaId,  setPdfVentaId]  = useState<number | null>(null);
  const [pdfNombre,   setPdfNombre]   = useState<string | null>(null);
  const [pdfTipo,     setPdfTipo]     = useState<string>('');

  // UI
  const [saving,          setSaving]          = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [errorMessage,    setErrorMessage]    = useState('');
  const [successMessage,  setSuccessMessage]  = useState('');

  const showErr = (m: string) => { setErrorMessage(m);   setTimeout(() => setErrorMessage(''),   5000); };
  const showMsg = (m: string) => { setSuccessMessage(m); setTimeout(() => setSuccessMessage(''), 6000); };

  // Carga inicial
  const cargarProductos = async () => {
    const res = await apiClient('/api/productos');
    if (!res.ok) throw new Error();
    const data = await res.json();
    setProductos(
      data
        .filter((p: any) => p.stock > 0 && p.estado !== 'vencido' && p.estado !== 'agotado')
        .map((p: any) => ({ id: p.id, nombre: p.nombre, precio: Number(p.precio), stock: p.stock, estado: p.estado }))
    );
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [, resC] = await Promise.all([
          cargarProductos(),
          apiClient('/api/clientes'),
        ]);
        if (resC.ok) {
          const data = await resC.json();
          setClientes(data.filter((c: any) => c.estado === 'Activo'));
        }
      } catch {
        showErr('No se pudo cargar el catálogo');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Cerrar dropdown al clicar fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        refNombre.current    && !refNombre.current.contains(e.target as Node) &&
        refDocumento.current && !refDocumento.current.contains(e.target as Node)
      ) { setMostrarSugerencias(false); setBusquedaActiva(null); }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Autocompletado
  const buscarPorNombre = (v: string) => {
    setClienteNombre(v); setClienteSeleccionado(null);
    if (v.trim().length < 2) { setSugerencias([]); setMostrarSugerencias(false); return; }
    const f = clientes.filter(c => c.nombre.toLowerCase().includes(v.toLowerCase())).slice(0, 6);
    setSugerencias(f); setMostrarSugerencias(f.length > 0); setBusquedaActiva('nombre');
  };

  const buscarPorDNI = (v: string) => {
    setClienteDocumento(v); setClienteSeleccionado(null);
    if (v.trim().length < 2) { setSugerencias([]); setMostrarSugerencias(false); return; }
    const f = clientes.filter(c => (c.dni ?? '').includes(v)).slice(0, 6);
    setSugerencias(f); setMostrarSugerencias(f.length > 0); setBusquedaActiva('dni');
  };

  const seleccionarCliente = (c: Cliente) => {
    setClienteNombre(c.nombre); setClienteDocumento(c.dni ?? '');
    setClienteTelefono(c.telefono ?? ''); setClienteDireccion(c.direccion ?? '');
    setClienteSeleccionado(c); setSugerencias([]); setMostrarSugerencias(false); setBusquedaActiva(null);
  };

  const limpiarCliente = () => {
    setClienteNombre(''); setClienteDocumento('');
    setClienteTelefono(''); setClienteDireccion(''); setClienteSeleccionado(null);
  };

  // Carrito
  const addToCart = (p: Producto) => {
    const ex = cartItems.find(i => i.id === p.id);
    if (ex) {
      if (ex.cantidad >= ex.stock) return;
      setCartItems(cartItems.map(i => i.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i));
    } else {
      setCartItems([...cartItems, { ...p, cantidad: 1 }]);
    }
    setSearchTerm('');
  };

  const updateQty = (id: string, cantidad: number) => {
    const item = cartItems.find(i => i.id === id);
    if (item && cantidad > 0 && cantidad <= item.stock)
      setCartItems(cartItems.map(i => i.id === id ? { ...i, cantidad } : i));
  };

  const removeFromCart = (id: string) => setCartItems(cartItems.filter(i => i.id !== id));

  const limpiarVenta = () => {
    setCartItems([]); limpiarCliente();
    setMontoPagado(''); setMetodoPago('Efectivo'); setTipoDoc('Boleta');
  };

  // Generar QR Yape/Plin
  const generarQR = async (monto: number) => {
    setQrLoading(true);
    setQrUrl(null);
    try {
      // Datos para pago Yape/Plin de Farmacia Sanet
      const telefono  = '986259384';           // número Yape/Plin de la farmacia
      const nombre    = 'Farmacia Sanet';
      const concepto  = `Venta S/. ${monto.toFixed(2)}`;
      // Generamos QR con la API pública de qrserver.com
      // Encode: "YAPE:telefono;monto;concepto" — compatible con lectores Yape y Plin
      const data      = `YAPE:${telefono};${monto.toFixed(2)};${concepto};${nombre}`;
      const encoded   = encodeURIComponent(data);
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encoded}&bgcolor=ffffff&color=6d1dab&margin=10`;
      setQrUrl(url);
    } catch {
      setQrUrl(null);
    } finally {
      setQrLoading(false);
    }
  };

  // Totales 
  const subtotal = cartItems.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const igv      = subtotal * 0.18;
  const total    = subtotal + igv;

  // Regenerar QR cuando cambia el total o el método
  useEffect(() => {
    if (metodoPago === 'Yape/Plin' && total > 0) {
      generarQR(total);
    } else {
      setQrUrl(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metodoPago, total]);
  const montoNum   = parseFloat(montoPagado) || 0;
  const vuelto     = metodoPago === 'Efectivo' && montoPagado !== '' ? montoNum - total : null;
  const montoInsuf = metodoPago === 'Efectivo' && montoPagado !== '' && montoNum < total;

  const canSell = cartItems.length > 0 && !montoInsuf;

  const filteredProducts = productos.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Realizar venta
  const handleRealizarVenta = async () => {
    setSaving(true);
    try {
      const payload = {
        cliente_id:     clienteSeleccionado?.id ?? null,
        cliente_nombre: clienteNombre  || null,
        cliente_doc:    clienteDocumento || null,
        tipo_doc:       tipoDoc,
        metodo_pago:    metodoPago,
        subtotal:       parseFloat(subtotal.toFixed(2)),
        igv:            parseFloat(igv.toFixed(2)),
        total:          parseFloat(total.toFixed(2)),
        usuario_id:     usuario?.id ?? null,
        items: cartItems.map(i => ({
          producto_id:     i.id,
          producto_nombre: i.nombre,
          cantidad:        i.cantidad,
          precio_unit:     i.precio,
          subtotal:        parseFloat((i.precio * i.cantidad).toFixed(2)),
        })),
      };

      const res = await apiClient('/api/ventas', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Error al procesar la venta');
      }

      const data = await res.json();

      // Guardar referencia al PDF para el banner
      if (data.id) {
        setPdfVentaId(data.id);
        setPdfNombre(data.pdf ?? `${tipoDoc === 'Boleta' ? 'B001' : 'F001'}-${String(data.id).padStart(8,'0')}.pdf`);
        setPdfTipo(tipoDoc);
      }

      showMsg(`✓ ${tipoDoc} N° ${data.id} registrada — S/. ${total.toFixed(2)} — ${metodoPago}`);
      setShowConfirm(false);
      limpiarVenta();

      // Refrescar stock
      try { await cargarProductos(); } catch (_) {}

    } catch (err: any) {
      setShowConfirm(false);
      showErr(err.message || 'Error al procesar la venta');
    } finally {
      setSaving(false);
    }
  };

  const getStockBadge = (estado: string) =>
    estado === 'bajo'
      ? <span className="text-xs text-[oklch(0.769_0.188_70.08)]">Stock bajo</span>
      : null;

  // Render
  return (
    <div className="p-8 h-screen overflow-hidden flex flex-col">
      <div className="mb-4">
        <h2 className="text-2xl text-white mb-1">Punto de Venta (POS)</h2>
        <p className="text-muted-foreground">Registro de ventas y facturación</p>
      </div>

      {/* Banner éxito + descarga PDF */}
      {successMessage && (
        <div className="mb-4 bg-[oklch(0.696_0.17_162.48)]/20 border border-[oklch(0.696_0.17_162.48)] rounded-lg p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <CheckCircle2 className="w-5 h-5 text-[oklch(0.696_0.17_162.48)] flex-shrink-0" />
            <p className="text-[oklch(0.696_0.17_162.48)] text-sm truncate">{successMessage}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {pdfVentaId && pdfNombre && (
              <button
                onClick={async () => {
                  const res = await apiClient(`/api/ventas/${pdfVentaId}/pdf`);
                  const blob = await res.blob();
                  const url  = URL.createObjectURL(blob);
                  const a    = document.createElement('a');
                  a.href = url; a.download = pdfNombre!; a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-2 bg-[oklch(0.696_0.17_162.48)] hover:bg-[oklch(0.646_0.17_162.48)] text-white text-sm px-4 py-1.5 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Descargar {pdfTipo}
              </button>
            )}
            <button onClick={() => { setSuccessMessage(''); setPdfVentaId(null); setPdfNombre(null); }}>
              <X className="w-5 h-5 text-[oklch(0.696_0.17_162.48)]" />
            </button>
          </div>
        </div>
      )}
      {errorMessage && (
        <div className="mb-4 bg-destructive/20 border border-destructive rounded-lg p-4 flex items-center justify-between">
          <p className="text-destructive">{errorMessage}</p>
          <button onClick={() => setErrorMessage('')}><X className="w-5 h-5 text-destructive" /></button>
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">

        {/* ── Izquierda ── */}
        <div className="lg:col-span-2 space-y-4 flex flex-col overflow-hidden">

          {/* Búsqueda productos */}
          <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl p-6">
            <label className="block text-sm text-muted-foreground mb-3">Buscar Producto</label>
            {loading ? (
              <div className="flex items-center gap-3 py-3">
                <Loader2 className="w-5 h-5 text-[oklch(0.488_0.243_264.376)] animate-spin" />
                <span className="text-muted-foreground text-sm">Cargando catálogo...</span>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text" value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Nombre o código del producto..."
                    className="w-full bg-[oklch(0.269_0_0)] border border-[oklch(0.269_0_0)] rounded-lg pl-11 pr-4 py-3 text-white placeholder:text-muted-foreground focus:outline-none focus:border-[oklch(0.488_0.243_264.376)] transition-colors"
                  />
                </div>
                {searchTerm && (
                  <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                    {filteredProducts.length > 0 ? filteredProducts.map(p => (
                      <button key={p.id} onClick={() => addToCart(p)}
                        className="w-full flex items-center justify-between p-3 bg-[oklch(0.269_0_0)] hover:bg-[oklch(0.318_0_0)] rounded-lg transition-colors text-left">
                        <div>
                          <p className="text-white">{p.nombre}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">Código: {p.id} • Stock: {p.stock}</p>
                            {getStockBadge(p.estado)}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <p className="text-white">S/. {p.precio.toFixed(2)}</p>
                          <Plus className="w-4 h-4 text-[oklch(0.488_0.243_264.376)] ml-auto mt-1" />
                        </div>
                      </button>
                    )) : (
                      <p className="text-center text-muted-foreground py-4 text-sm">No se encontró "{searchTerm}"</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Carrito */}
          <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl p-6 flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white">
                Carrito
                {cartItems.length > 0 && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    ({cartItems.length} producto{cartItems.length > 1 ? 's' : ''})
                  </span>
                )}
              </h3>
              {cartItems.length > 0 && (
                <button onClick={limpiarVenta} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
                  Limpiar carrito
                </button>
              )}
            </div>
            <div className="flex-1 overflow-auto">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                  <ShoppingCart className="w-10 h-10 opacity-30" />
                  <p>Busca y agrega productos</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="sticky top-0 bg-[oklch(0.205_0_0)]">
                    <tr className="border-b border-[oklch(0.269_0_0)]">
                      <th className="text-left text-sm text-muted-foreground pb-3">Producto</th>
                      <th className="text-center text-sm text-muted-foreground pb-3">Cant.</th>
                      <th className="text-right text-sm text-muted-foreground pb-3">P. Unit.</th>
                      <th className="text-right text-sm text-muted-foreground pb-3">Total</th>
                      <th className="pb-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map(item => (
                      <tr key={item.id} className="border-b border-[oklch(0.269_0_0)]">
                        <td className="py-3">
                          <p className="text-white text-sm">{item.nombre}</p>
                          <p className="text-xs text-muted-foreground">{item.id}</p>
                        </td>
                        <td className="text-center">
                          <input type="number" min="1" max={item.stock} value={item.cantidad}
                            onChange={e => updateQty(item.id, parseInt(e.target.value) || 1)}
                            className="w-16 bg-[oklch(0.269_0_0)] border border-[oklch(0.269_0_0)] rounded px-2 py-1 text-center text-white focus:outline-none focus:border-[oklch(0.488_0.243_264.376)]"
                          />
                        </td>
                        <td className="text-right text-white text-sm">S/. {item.precio.toFixed(2)}</td>
                        <td className="text-right text-white">S/. {(item.precio * item.cantidad).toFixed(2)}</td>
                        <td className="text-right">
                          <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* ── Derecha ── */}
        <div className="space-y-4 overflow-y-auto">

          {/* Cliente con autocompletado */}
          <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-[oklch(0.488_0.243_264.376)]" />
                <h3 className="text-lg text-white">Cliente</h3>
              </div>
              {clienteSeleccionado && (
                <div className="flex items-center gap-1.5 bg-[oklch(0.696_0.17_162.48)]/15 border border-[oklch(0.696_0.17_162.48)]/30 px-2.5 py-1 rounded-full">
                  <UserCheck className="w-3.5 h-3.5 text-[oklch(0.696_0.17_162.48)]" />
                  <span className="text-xs text-[oklch(0.696_0.17_162.48)]">Registrado</span>
                  <button onClick={limpiarCliente} className="ml-1 text-[oklch(0.696_0.17_162.48)] hover:text-white transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-3">
              {/* Nombre */}
              <div ref={refNombre} className="relative">
                <label className="block text-sm text-muted-foreground mb-2">Nombre</label>
                <input
                  type="text" value={clienteNombre} autoComplete="off"
                  onChange={e => buscarPorNombre(e.target.value)}
                  onFocus={() => { if (clienteNombre.length >= 2 && sugerencias.length > 0) setMostrarSugerencias(true); }}
                  placeholder="Consumidor final"
                  className={inputCls + (clienteSeleccionado ? ' border-[oklch(0.696_0.17_162.48)]/50' : '')}
                />
                {mostrarSugerencias && busquedaActiva === 'nombre' && sugerencias.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[oklch(0.205_0_0)] border border-[oklch(0.318_0_0)] rounded-lg overflow-hidden shadow-xl z-30">
                    {sugerencias.map(c => (
                      <button key={c.id} onMouseDown={() => seleccionarCliente(c)}
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[oklch(0.269_0_0)] transition-colors text-left">
                        <div className="w-8 h-8 rounded-full bg-[oklch(0.488_0.243_264.376)]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <User className="w-4 h-4 text-[oklch(0.488_0.243_264.376)]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm truncate">{c.nombre}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.dni ? `DNI: ${c.dni}` : 'Sin DNI'}{c.telefono ? ` • ${c.telefono}` : ''}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* DNI */}
              <div ref={refDocumento} className="relative">
                <label className="block text-sm text-muted-foreground mb-2">DNI / RUC</label>
                <input
                  type="text" value={clienteDocumento} autoComplete="off"
                  onChange={e => buscarPorDNI(e.target.value)}
                  onFocus={() => { if (clienteDocumento.length >= 2 && sugerencias.length > 0) setMostrarSugerencias(true); }}
                  placeholder="Número de documento"
                  className={inputCls + (clienteSeleccionado ? ' border-[oklch(0.696_0.17_162.48)]/50' : '')}
                />
                {mostrarSugerencias && busquedaActiva === 'dni' && sugerencias.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[oklch(0.205_0_0)] border border-[oklch(0.318_0_0)] rounded-lg overflow-hidden shadow-xl z-30">
                    {sugerencias.map(c => (
                      <button key={c.id} onMouseDown={() => seleccionarCliente(c)}
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[oklch(0.269_0_0)] transition-colors text-left">
                        <div className="w-8 h-8 rounded-full bg-[oklch(0.488_0.243_264.376)]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <User className="w-4 h-4 text-[oklch(0.488_0.243_264.376)]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm truncate">{c.nombre}</p>
                          <p className="text-xs text-muted-foreground">DNI: {c.dni}{c.telefono ? ` • ${c.telefono}` : ''}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Info extra del cliente registrado */}
              {clienteSeleccionado && (clienteTelefono || clienteDireccion) && (
                <div className="bg-[oklch(0.269_0_0)] rounded-lg p-3 space-y-2">
                  {clienteTelefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm text-white">{clienteTelefono}</span>
                    </div>
                  )}
                  {clienteDireccion && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm text-white truncate">{clienteDireccion}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Comprobante */}
          <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-[oklch(0.488_0.243_264.376)]" />
              <h3 className="text-lg text-white">Comprobante</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(['Boleta', 'Factura'] as TipoDoc[]).map(t => (
                <button key={t} onClick={() => setTipoDoc(t)}
                  className={`py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 border ${
                    tipoDoc === t
                      ? 'bg-[oklch(0.488_0.243_264.376)] border-[oklch(0.488_0.243_264.376)] text-white'
                      : 'bg-[oklch(0.269_0_0)] border-[oklch(0.269_0_0)] text-muted-foreground hover:text-white'
                  }`}>
                  {t === 'Boleta' ? <Receipt className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Forma de pago */}
          <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-[oklch(0.488_0.243_264.376)]" />
              <h3 className="text-lg text-white">Forma de Pago</h3>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {METODOS.map(({ value, label, icon: Icon }) => (
                <button key={value} onClick={() => { setMetodoPago(value); setMontoPagado(''); }}
                  className={`py-3 rounded-lg text-xs transition-colors flex flex-col items-center gap-1.5 border ${
                    metodoPago === value
                      ? 'bg-[oklch(0.488_0.243_264.376)] border-[oklch(0.488_0.243_264.376)] text-white'
                      : 'bg-[oklch(0.269_0_0)] border-[oklch(0.269_0_0)] text-muted-foreground hover:text-white'
                  }`}>
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              ))}
            </div>
            {metodoPago === 'Efectivo' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Monto recibido</label>
                  <input
                    type="number" min="0" step="0.10" value={montoPagado}
                    onChange={e => setMontoPagado(e.target.value)}
                    placeholder={`S/. ${total.toFixed(2)}`}
                    className={inputCls + (montoInsuf ? ' border-destructive' : montoPagado !== '' && !montoInsuf ? ' border-[oklch(0.696_0.17_162.48)]/70' : '')}
                  />
                </div>
                {/* Falta pagar */}
                {montoInsuf && (
                  <div className="p-3 rounded-lg flex justify-between items-center bg-destructive/10 border border-destructive/40">
                    <span className="text-sm text-destructive font-medium">⚠ Monto insuficiente</span>
                    <span className="font-semibold text-destructive">
                      Faltan S/. {(total - montoNum).toFixed(2)}
                    </span>
                  </div>
                )}
                {/* Vuelto */}
                {vuelto !== null && !montoInsuf && montoPagado !== '' && (
                  <div className="p-3 rounded-lg flex justify-between items-center bg-[oklch(0.696_0.17_162.48)]/10 border border-[oklch(0.696_0.17_162.48)]/30">
                    <span className="text-sm text-muted-foreground">✓ Vuelto</span>
                    <span className="font-semibold text-[oklch(0.696_0.17_162.48)]">
                      S/. {vuelto.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ── Yape/Plin QR ── */}
            {metodoPago === 'Yape/Plin' && (
              <div className="mt-3 flex flex-col items-center gap-3">
                <div className="w-full bg-[oklch(0.269_0_0)] rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-0.5">Monto a pagar</p>
                  <p className="text-[oklch(0.696_0.17_162.48)] text-xl font-bold">S/. {total.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-xl p-3 flex items-center justify-center" style={{minHeight: 130}}>
                  {qrLoading ? (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <Loader2 className="w-8 h-8 text-[#6d1dab] animate-spin" />
                      <p className="text-xs text-gray-500">Generando QR...</p>
                    </div>
                  ) : qrUrl ? (
                    <img src={qrUrl} alt="QR Yape/Plin" className="w-44 h-44 rounded" />
                  ) : (
                    <p className="text-xs text-gray-400 p-4 text-center">No se pudo generar el QR</p>
                  )}
                </div>
                <div className="w-full text-center space-y-0.5">
                  <p className="text-white text-sm font-medium">Farmacia Sanet</p>
                  <p className="text-xs text-muted-foreground">Nro: 986 259 384</p>
                  <p className="text-xs text-muted-foreground">Escanea con Yape o Plin</p>
                </div>
              </div>
            )}
          </div>

          {/* Totales + Botón */}
          <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl p-6">
            <h3 className="text-lg text-white mb-4">Resumen</h3>
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-white">S/. {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IGV (18%)</span>
                <span className="text-white">S/. {igv.toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t border-[oklch(0.269_0_0)] flex justify-between">
                <span className="text-white text-base">Total</span>
                <span className="text-white text-2xl">S/. {total.toFixed(2)}</span>
              </div>
            </div>
            <button
              disabled={!canSell}
              onClick={() => setShowConfirm(true)}
              className="w-full bg-[oklch(0.696_0.17_162.48)] hover:bg-[oklch(0.646_0.17_162.48)] disabled:bg-[oklch(0.269_0_0)] disabled:text-muted-foreground disabled:cursor-not-allowed text-white py-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-base font-medium"
            >
              <CheckCircle2 className="w-5 h-5" />
              Realizar Venta
            </button>
            {!canSell && (
              <p className="text-xs text-destructive text-center mt-2">
                {cartItems.length === 0
                  ? 'Agrega al menos un producto para continuar'
                  : 'El monto recibido es insuficiente'}
              </p>
            )}
          </div>
        </div>
      </div>

      <ConfirmVentaModal
        isOpen={showConfirm}
        onClose={() => !saving && setShowConfirm(false)}
        onConfirm={handleRealizarVenta}
        cartItems={cartItems}
        total={total} igv={igv} subtotal={subtotal}
        clienteNombre={clienteNombre}
        metodoPago={metodoPago} tipoDoc={tipoDoc}
        saving={saving}
      />
    </div>
  );
}
