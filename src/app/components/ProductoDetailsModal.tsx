import { X, Calendar, Package, DollarSign, AlertCircle } from 'lucide-react';

interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  laboratorio: string;
  lote: string;
  precio: number;
  stock: number;
  stockMinimo: number;
  vencimiento: string;
  estado: 'normal' | 'bajo' | 'agotado' | 'vencido';
  categoria?: string;
}

interface ProductoDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  producto: Producto | null;
}

export default function ProductoDetailsModal({
  isOpen,
  onClose,
  producto
}: ProductoDetailsModalProps) {
  if (!isOpen || !producto) return null;

  const getEstadoBadge = (estado: string) => {
    const badges = {
      normal: 'bg-[oklch(0.696_0.17_162.48)]/20 text-[oklch(0.696_0.17_162.48)]',
      bajo: 'bg-[oklch(0.769_0.188_70.08)]/20 text-[oklch(0.769_0.188_70.08)]',
      agotado: 'bg-[oklch(0.396_0.141_25.723)] text-[oklch(0.645_0.246_16.439)]',
      vencido: 'bg-[oklch(0.396_0.141_25.723)] text-[oklch(0.645_0.246_16.439)]',
    };

    const labels = {
      normal: 'Normal',
      bajo: 'Stock Bajo',
      agotado: 'Agotado',
      vencido: 'Vencido',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs ${badges[estado as keyof typeof badges]}`}>
        {labels[estado as keyof typeof labels]}
      </span>
    );
  };

  const isVencido = (fecha: string) => {
    const vencimiento = new Date(fecha);
    const hoy = new Date();
    const diasDiferencia = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return diasDiferencia <= 12;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl max-w-2xl w-full">
        {/* Header */}
        <div className="border-b border-[oklch(0.269_0_0)] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl text-white">Detalles del Producto</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Nombre y Estado */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-2xl text-white mb-2">{producto.nombre}</h3>
              <p className="text-muted-foreground">Código: {producto.id}</p>
            </div>
            {getEstadoBadge(producto.estado)}
          </div>

          {/* Descripción */}
          {producto.descripcion && (
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-1">Descripción</p>
              <p className="text-white">{producto.descripcion}</p>
            </div>
          )}

          {/* Grid de Información */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Laboratorio */}
            <div className="bg-[oklch(0.269_0_0)] p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Laboratorio</p>
              <p className="text-white">{producto.laboratorio}</p>
            </div>

            {/* Categoría */}
            {producto.categoria && (
              <div className="bg-[oklch(0.269_0_0)] p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Categoría</p>
                <p className="text-white">{producto.categoria}</p>
              </div>
            )}

            {/* Lote */}
            <div className="bg-[oklch(0.269_0_0)] p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Lote</p>
              <p className="text-white">{producto.lote}</p>
            </div>

            {/* Fecha de Vencimiento */}
            <div className="bg-[oklch(0.269_0_0)] p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Fecha de Vencimiento</p>
              </div>
              <div className="flex items-center gap-2">
                {isVencido(producto.vencimiento) && (
                  <AlertCircle className="w-4 h-4 text-[oklch(0.645_0.246_16.439)]" />
                )}
                <p className={`${isVencido(producto.vencimiento) ? 'text-[oklch(0.645_0.246_16.439)]' : 'text-white'}`}>
                  {new Date(producto.vencimiento).toLocaleDateString('es-PE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Información Financiera y de Stock */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Precio */}
            <div className="bg-[oklch(0.488_0.243_264.376)]/10 border border-[oklch(0.488_0.243_264.376)]/30 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-[oklch(0.488_0.243_264.376)]" />
                <p className="text-sm text-muted-foreground">Precio Unitario</p>
              </div>
              <p className="text-2xl text-white">S/. {producto.precio.toFixed(2)}</p>
            </div>

            {/* Stock Disponible */}
            <div className={`p-4 rounded-lg border ${
              producto.stock === 0
                ? 'bg-[oklch(0.645_0.246_16.439)]/10 border-[oklch(0.645_0.246_16.439)]/30'
                : producto.stock < producto.stockMinimo
                ? 'bg-[oklch(0.769_0.188_70.08)]/10 border-[oklch(0.769_0.188_70.08)]/30'
                : 'bg-[oklch(0.696_0.17_162.48)]/10 border-[oklch(0.696_0.17_162.48)]/30'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Package className={`w-5 h-5 ${
                  producto.stock === 0
                    ? 'text-[oklch(0.645_0.246_16.439)]'
                    : producto.stock < producto.stockMinimo
                    ? 'text-[oklch(0.769_0.188_70.08)]'
                    : 'text-[oklch(0.696_0.17_162.48)]'
                }`} />
                <p className="text-sm text-muted-foreground">Stock Disponible</p>
              </div>
              <p className="text-2xl text-white">{producto.stock} unid.</p>
            </div>

            {/* Stock Mínimo */}
            <div className="bg-[oklch(0.269_0_0)] p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Stock Mínimo</p>
              <p className="text-2xl text-white">{producto.stockMinimo} unid.</p>
            </div>
          </div>

          {/* Alertas */}
          {(isVencido(producto.vencimiento) || producto.stock < producto.stockMinimo) && (
            <div className="mt-6 space-y-2">
              {isVencido(producto.vencimiento) && (
                <div className="bg-[oklch(0.396_0.141_25.723)] border-l-4 border-[oklch(0.645_0.246_16.439)] p-4 rounded">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-[oklch(0.645_0.246_16.439)]" />
                    <p className="text-white text-sm">
                      ⚠️ Producto próximo a vencer o vencido
                    </p>
                  </div>
                </div>
              )}

              {producto.stock < producto.stockMinimo && producto.stock > 0 && (
                <div className="bg-[oklch(0.769_0.188_70.08)]/20 border-l-4 border-[oklch(0.769_0.188_70.08)] p-4 rounded">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-[oklch(0.769_0.188_70.08)]" />
                    <p className="text-white text-sm">
                      Stock por debajo del mínimo requerido
                    </p>
                  </div>
                </div>
              )}

              {producto.stock === 0 && (
                <div className="bg-[oklch(0.396_0.141_25.723)] border-l-4 border-[oklch(0.645_0.246_16.439)] p-4 rounded">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-[oklch(0.645_0.246_16.439)]" />
                    <p className="text-white text-sm">
                      Producto agotado
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[oklch(0.269_0_0)] px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-[oklch(0.269_0_0)] hover:bg-[oklch(0.318_0_0)] text-white px-6 py-2 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
