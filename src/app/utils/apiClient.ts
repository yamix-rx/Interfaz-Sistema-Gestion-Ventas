const API_BASE    = 'http://localhost:3001';
const TOKEN_KEY   = 'fs_token';

export async function apiClient(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // Si el servidor responde 401 (token expirado / inválido), limpiar sesión
  if (response.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('fs_usuario');
    // Recargar para volver al Login
    window.location.reload();
  }

  return response;
}
