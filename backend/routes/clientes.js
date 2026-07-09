const router = require('express').Router();
const pool   = require('../db');
const { verifyToken, requireRoles } = require('../middleware/auth');

router.get('/', verifyToken, requireRoles('Administrador', 'Supervisor', 'Vendedor'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM clientes ORDER BY nombre'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', verifyToken, requireRoles('Administrador', 'Supervisor', 'Vendedor'), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM clientes WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Cliente no encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', verifyToken, requireRoles('Administrador', 'Supervisor'), async (req, res) => {
  const { nombre, dni, direccion, telefono, estado } = req.body;
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre es obligatorio.' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO clientes (nombre, dni, direccion, telefono, estado) VALUES (?,?,?,?,?)',
      [nombre.trim(), dni ?? null, direccion ?? null, telefono ?? null, estado ?? 'Activo']
    );
    res.status(201).json({ mensaje: 'Cliente creado.', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe un cliente con ese DNI.' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', verifyToken, requireRoles('Administrador', 'Supervisor'), async (req, res) => {
  const { nombre, dni, direccion, telefono, estado } = req.body;
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre es obligatorio.' });
  }
  try {
    const [result] = await pool.query(
      'UPDATE clientes SET nombre=?, dni=?, direccion=?, telefono=?, estado=? WHERE id=?',
      [nombre.trim(), dni ?? null, direccion ?? null, telefono ?? null, estado ?? 'Activo', req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Cliente no encontrado.' });
    res.json({ mensaje: 'Cliente actualizado.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', verifyToken, requireRoles('Administrador'), async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM clientes WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Cliente no encontrado.' });
    res.json({ mensaje: 'Cliente eliminado.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
