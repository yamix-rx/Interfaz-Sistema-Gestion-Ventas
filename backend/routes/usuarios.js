const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const pool    = require('../db');
const { verifyToken, requireRoles } = require('../middleware/auth');

// Verifica en tiempo real si un email ya está en uso.
router.get('/check-email', verifyToken, requireRoles('Administrador'), async (req, res) => {
  const { email, excludeId } = req.query;
  if (!email) return res.json({ disponible: true });

  try {
    const query = excludeId
      ? 'SELECT id FROM usuarios WHERE email = ? AND id != ? LIMIT 1'
      : 'SELECT id FROM usuarios WHERE email = ? LIMIT 1';
    const params = excludeId
      ? [email.toString().trim().toLowerCase(), excludeId]
      : [email.toString().trim().toLowerCase()];

    const [rows] = await pool.query(query, params);
    res.json({ disponible: rows.length === 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', verifyToken, requireRoles('Administrador', 'Supervisor'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre, email, rol, estado, telefono, fecha_ingreso FROM usuarios ORDER BY nombre'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', verifyToken, requireRoles('Administrador', 'Supervisor'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre, email, rol, estado, telefono, fecha_ingreso FROM usuarios WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', verifyToken, requireRoles('Administrador'), async (req, res) => {
  const { nombre, email, password, rol, estado, telefono, fechaIngreso } = req.body;

  if (!nombre || !email || !password || !rol) {
    return res.status(400).json({ error: 'Nombre, email, contraseña y rol son obligatorios.' });
  }

  try {
    const [existe] = await pool.query(
      'SELECT id FROM usuarios WHERE email = ? LIMIT 1',
      [email.trim().toLowerCase()]
    );
    if (existe.length > 0) {
      return res.status(409).json({ error: 'Ya existe un usuario registrado con ese email.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, email, password_hash, rol, estado, telefono, fecha_ingreso) VALUES (?,?,?,?,?,?,?)',
      [nombre, email.trim().toLowerCase(), password_hash, rol,
       estado ?? 'Activo', telefono ?? null, fechaIngreso ?? null]
    );
    res.status(201).json({ mensaje: 'Usuario creado.', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe un usuario registrado con ese email.' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', verifyToken, requireRoles('Administrador'), async (req, res) => {
  const { nombre, email, rol, estado, telefono, fechaIngreso } = req.body;
  const targetId = parseInt(req.params.id, 10);

  if (!nombre || !email || !rol) {
    return res.status(400).json({ error: 'Nombre, email y rol son obligatorios.' });
  }

  try {
    const [existe] = await pool.query(
      'SELECT id FROM usuarios WHERE email = ? AND id != ? LIMIT 1',
      [email.trim().toLowerCase(), targetId]
    );
    if (existe.length > 0) {
      return res.status(409).json({ error: 'Ese email ya está en uso por otro usuario.' });
    }

    await pool.query(
      'UPDATE usuarios SET nombre=?, email=?, rol=?, estado=?, telefono=?, fecha_ingreso=? WHERE id=?',
      [nombre, email.trim().toLowerCase(), rol, estado,
       telefono ?? null, fechaIngreso ?? null, targetId]
    );
    res.json({ mensaje: 'Usuario actualizado.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ese email ya está en uso por otro usuario.' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/password', verifyToken, async (req, res) => {
  const targetId = parseInt(req.params.id, 10);
  const isSelf   = req.user.id === targetId;
  const isAdmin  = req.user.rol === 'Administrador';

  if (!isSelf && !isAdmin) {
    return res.status(403).json({ error: 'No tienes permiso para cambiar esta contraseña.' });
  }

  const { password, currentPassword } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
  }

  try {
    if (isSelf && !isAdmin) {
      const [rows] = await pool.query('SELECT password_hash FROM usuarios WHERE id = ?', [targetId]);
      if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });
      const ok = await bcrypt.compare(currentPassword ?? '', rows[0].password_hash);
      if (!ok) return res.status(401).json({ error: 'Contraseña actual incorrecta.' });
    }

    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE usuarios SET password_hash = ? WHERE id = ?', [hash, targetId]);
    res.json({ mensaje: 'Contraseña actualizada.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', verifyToken, requireRoles('Administrador'), async (req, res) => {
  if (parseInt(req.params.id, 10) === req.user.id) {
    return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta.' });
  }
  try {
    await pool.query('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Usuario eliminado.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
