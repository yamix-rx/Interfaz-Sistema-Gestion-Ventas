/**
 * src/app/App.tsx
 * Envuelve la app con AccesibilidadProvider para acceso global al contexto.
 */

import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AccesibilidadProvider } from './context/AccesibilidadContext';
import { puedeAcceder } from './config/permisos';

import Login          from './components/Login';
import Sidebar        from './components/Sidebar';
import Dashboard      from './components/Dashboard';
import Ventas         from './components/Ventas';
import Inventario     from './components/Inventario';
import Compras        from './components/Compras';
import Catalogos      from './components/Catalogos';
import Reportes       from './components/Reportes';
import Usuarios       from './components/Usuarios';
import AccesoDenegado from './components/AccesoDenegado';
import Clientes       from './components/Clientes';
import HistorialLogin from './components/HistorialLogin';

function AppContent() {
  const { usuario, isLoading, logout } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');

  if (isLoading) {
    return (
      <div className="dark min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[oklch(0.488_0.243_264.376)] border-t-transparent rounded-full animate-spin"
          role="status" aria-label="Cargando sistema..." />
      </div>
    );
  }

  if (!usuario) {
    return <div className="dark"><Login /></div>;
  }

  const renderView = () => {
    if (!puedeAcceder(usuario.rol, activeView)) {
      return <AccesoDenegado vista={activeView} />;
    }
    switch (activeView) {
      case 'dashboard':       return <Dashboard />;
      case 'ventas':          return <Ventas />;
      case 'inventario':      return <Inventario />;
      case 'compras':         return <Compras />;
      case 'catalogos':       return <Catalogos />;
      case 'reportes':        return <Reportes />;
      case 'clientes':        return <Clientes />;
      case 'usuarios':        return <Usuarios />;
      case 'historial_login': return <HistorialLogin />;
      default:                return <Dashboard />;
    }
  };

  return (
    <div className="dark h-screen overflow-hidden flex bg-background">
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        onLogout={logout}
      />
      <main className="flex-1 overflow-auto" role="main" aria-label="Contenido principal">
        {renderView()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AccesibilidadProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </AccesibilidadProvider>
  );
}
