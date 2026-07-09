import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productName: string;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  productName
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[oklch(0.205_0_0)] border border-[oklch(0.269_0_0)] rounded-xl max-w-md w-full">
        {/* Header */}
        <div className="border-b border-[oklch(0.269_0_0)] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <h2 className="text-xl text-white">Confirmar Eliminación</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-white mb-4">
            ¿Estás seguro de que deseas eliminar el siguiente producto?
          </p>

          <div className="bg-[oklch(0.269_0_0)] p-4 rounded-lg mb-6">
            <p className="text-white text-lg">{productName}</p>
          </div>

          <div className="bg-[oklch(0.769_0.188_70.08)]/10 border-l-4 border-[oklch(0.769_0.188_70.08)] p-3 rounded">
            <p className="text-sm text-muted-foreground">
              ⚠️ Esta acción no se puede deshacer. El producto será eliminado permanentemente del inventario.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[oklch(0.269_0_0)] px-6 py-4 flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-destructive hover:bg-destructive/90 text-white py-3 rounded-lg transition-colors"
          >
            Confirmar Eliminación
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
