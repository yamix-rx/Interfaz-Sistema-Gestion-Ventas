const router = require('express').Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categorias ORDER BY nombre');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { nombre, descripcion, productos } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO categorias (nombre, descripcion, productos) VALUES (?,?,?)',
      [nombre, descripcion, productos || 0]
    );
    res.status(201).json({ mensaje: 'Categoría creada', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { nombre, descripcion, productos } = req.body;
  try {
    await pool.query(
      'UPDATE categorias SET nombre=?, descripcion=?, productos=? WHERE id=?',
      [nombre, descripcion, productos, req.params.id]
    );
    res.json({ mensaje: 'Categoría actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM categorias WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Categoría eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
