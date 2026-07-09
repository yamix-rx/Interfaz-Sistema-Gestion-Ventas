const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../db');
const { verifyToken, requireRoles } = require('../middleware/auth');

const JWT_SECRET  = process.env.JWT_SECRET  || 'farmacia_sanet_secret_key_change_in_prod';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h';

// Helper: obtener IP real del cliente
function getIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    null
  );
}

// Helper: registrar intento en historial_login
async function registrarIntento({ usuario_id, email, nombre, rol, resultado, ip, ua, detalle }) {
  try {
    await pool.query(
      `INSERT INTO historial_login
         (usuario_id, email, nombre, rol, resultado, ip_address, user_agent, detalle)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id ?? null, email, nombre ?? null, rol ?? null,
       resultado, ip ?? null, ua ?? null, detalle ?? null]
    );
  } catch (e) {
    // No interrumpir el flujo principal si el log falla
    console.error('[historial_login] Error al registrar intento:', e.message);
  }
}

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const ip = getIP(req);
  const ua = req.headers['user-agent'] || null;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos.' });
  }

  const emailNorm = email.trim().toLowerCase();

  try {
    const [rows] = await pool.query(
      'SELECT id, nombre, email, password_hash, rol, estado FROM usuarios WHERE email = ? LIMIT 1',
      [emailNorm]
    );

    // Usuario no encontrado
    if (rows.length === 0) {
      await registrarIntento({
        email: emailNorm, resultado: 'Fallido',
        ip, ua, detalle: 'Email no registrado',
      });
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const usuario = rows[0];

    // Cuenta desactivada
    if (usuario.estado !== 'Activo') {
      await registrarIntento({
        usuario_id: usuario.id, email: emailNorm,
        nombre: usuario.nombre, rol: usuario.rol,
        resultado: 'Fallido', ip, ua, detalle: 'Cuenta desactivada',
      });
      return res.status(403).json({ error: 'Tu cuenta está desactivada. Contacta al administrador.' });
    }

    // Sin hash (usuario sin contraseña) 
    if (!usuario.password_hash) {
      await registrarIntento({
        usuario_id: usuario.id, email: emailNorm,
        nombre: usuario.nombre, rol: usuario.rol,
        resultado: 'Fallido', ip, ua, detalle: 'Sin contraseña configurada',
      });
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // Contraseña incorrecta
    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) {
      await registrarIntento({
        usuario_id: usuario.id, email: emailNorm,
        nombre: usuario.nombre, rol: usuario.rol,
        resultado: 'Fallido', ip, ua, detalle: 'Contraseña incorrecta',
      });
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // Login exitoso 
    const payload = {
      id:     usuario.id,
      nombre: usuario.nombre,
      email:  usuario.email,
      rol:    usuario.rol,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    await registrarIntento({
      usuario_id: usuario.id, email: emailNorm,
      nombre: usuario.nombre, rol: usuario.rol,
      resultado: 'Exitoso', ip, ua, detalle: null,
    });

    return res.json({ token, usuario: payload });

  } catch (err) {
    console.error('[auth/login]', err.message);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});


router.post('/logout', (_req, res) => {
  res.json({ mensaje: 'Sesión cerrada correctamente.' });
});

// Solo Administrador puede ver el historial de login
router.get('/historial', verifyToken, requireRoles('Administrador'), async (req, res) => {
  try {
    const limite = Math.min(parseInt(req.query.limite || '200', 10), 500);
    const pagina = Math.max(parseInt(req.query.pagina || '1', 10), 1);
    const offset = (pagina - 1) * limite;

    // Filtros opcionales
    const filtros   = [];
    const params    = [];

    if (req.query.resultado) {
      filtros.push('resultado = ?');
      params.push(req.query.resultado);
    }
    if (req.query.email) {
      filtros.push('email LIKE ?');
      params.push(`%${req.query.email}%`);
    }
    if (req.query.desde) {
      filtros.push('fecha_hora >= ?');
      params.push(req.query.desde);
    }
    if (req.query.hasta) {
      filtros.push('fecha_hora <= ?');
      params.push(req.query.hasta);
    }

    const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM historial_login ${where}`, params
    );

    const [rows] = await pool.query(
      `SELECT id, usuario_id, email, nombre, rol, resultado,
              ip_address, detalle, fecha_hora
       FROM historial_login ${where}
       ORDER BY fecha_hora DESC
       LIMIT ? OFFSET ?`,
      [...params, limite, offset]
    );

    res.json({ total, pagina, limite, registros: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
