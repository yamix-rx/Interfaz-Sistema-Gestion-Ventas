import { Rol } from '../context/AuthContext';

export const PERMISOS: Record<string, Rol[]> = {
  dashboard:       ['Administrador', 'Vendedor'],
  ventas:          ['Administrador', 'Vendedor'],
  inventario:      ['Administrador', 'Supervisor', 'Vendedor'],
  compras:         ['Administrador', 'Supervisor'],
  catalogos:       ['Administrador', 'Supervisor'],
  reportes:        ['Administrador'],
  clientes:        ['Administrador', 'Vendedor'],
  usuarios:        ['Administrador'],
  historial_login: ['Administrador'],   // ← NUEVA: solo Admin
};

export const OPERACIONES = {
  crearProducto:    ['Administrador', 'Supervisor'] as Rol[],
  editarProducto:   ['Administrador', 'Supervisor'] as Rol[],
  eliminarProducto: ['Administrador']               as Rol[],
  crearVenta:       ['Administrador', 'Supervisor', 'Vendedor'] as Rol[],
  anularVenta:      ['Administrador', 'Supervisor']             as Rol[],
  crearCompra:      ['Administrador', 'Supervisor'] as Rol[],
  eliminarCompra:   ['Administrador']               as Rol[],
  crearCatalogo:    ['Administrador', 'Supervisor'] as Rol[],
  editarCatalogo:   ['Administrador', 'Supervisor'] as Rol[],
  eliminarCatalogo: ['Administrador']               as Rol[],
  gestionarUsuarios: ['Administrador'] as Rol[],
  crearCliente:    ['Administrador', 'Supervisor'] as Rol[],
  editarCliente:   ['Administrador', 'Supervisor'] as Rol[],
  eliminarCliente: ['Administrador']               as Rol[],
};

export function puedeAcceder(rol: Rol, vista: string): boolean {
  return (PERMISOS[vista] ?? []).includes(rol);
}
