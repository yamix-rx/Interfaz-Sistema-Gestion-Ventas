import { ShieldOff } from 'lucide-react';

interface Props {
  vista?: string;
}

export default function AccesoDenegado({ vista }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] p-8 text-center">
      <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
        <ShieldOff className="w-10 h-10 text-red-400" />
      </div>
      <h2 className="text-2xl text-white mb-2">Acceso Denegado</h2>
      <p className="text-muted-foreground max-w-sm">
        No tienes permiso para acceder a{' '}
        <span className="text-white font-medium">{vista ?? 'esta sección'}</span>.
        Contacta al administrador si crees que es un error.
      </p>
    </div>
  );
}
