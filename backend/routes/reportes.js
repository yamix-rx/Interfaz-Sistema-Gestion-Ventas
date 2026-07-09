/**
 * routes/reportes.js
 * POST /api/reportes/ventas-mensuales
 * POST /api/reportes/productos-vendidos
 * POST /api/reportes/inventario-valorizado
 * POST /api/reportes/vencimientos
 * GET  /api/reportes/descargar?file=...
 */

const router  = require('express').Router();
const path    = require('path');
const fs      = require('fs');
const db      = require('../patterns/DatabaseSingleton');
const { requireRoles } = require('../middleware/auth');
const {
  generarVentasMensuales,
  generarProductosVendidos,
  generarInventarioValorizado,
  generarVencimientos,
} = require('../services/ReportesService');

const soloAdmin = requireRoles('Administrador');

// ── POST /ventas-mensuales ────────────────────────────────────────────────────
router.post('/ventas-mensuales', soloAdmin, async (req, res) => {
  try {
    const { mes, anio } = req.body;
    if (!mes || !anio) return res.status(400).json({ error: 'Indica mes y año.' });
    const file = await generarVentasMensuales(db, mes, anio);
    res.json({ ok: true, archivo: path.basename(file), ruta: file });
  } catch (err) {
    console.error('[reportes/ventas]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /productos-vendidos ──────────────────────────────────────────────────
router.post('/productos-vendidos', soloAdmin, async (req, res) => {
  try {
    const { mes, anio } = req.body;
    if (!mes || !anio) return res.status(400).json({ error: 'Indica mes y año.' });
    const file = await generarProductosVendidos(db, mes, anio);
    res.json({ ok: true, archivo: path.basename(file), ruta: file });
  } catch (err) {
    console.error('[reportes/productos]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /inventario-valorizado ───────────────────────────────────────────────
router.post('/inventario-valorizado', soloAdmin, async (req, res) => {
  try {
    const file = await generarInventarioValorizado(db);
    res.json({ ok: true, archivo: path.basename(file), ruta: file });
  } catch (err) {
    console.error('[reportes/inventario]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /vencimientos ────────────────────────────────────────────────────────
router.post('/vencimientos', soloAdmin, async (req, res) => {
  try {
    const dias = parseInt(req.body.dias || 90);
    const file = await generarVencimientos(db, dias);
    res.json({ ok: true, archivo: path.basename(file), ruta: file });
  } catch (err) {
    console.error('[reportes/vencimientos]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /descargar?file=nombre.pdf&tipo=ventas_mensuales ──────────────────────
router.get('/descargar', soloAdmin, (req, res) => {
  try {
    const { file, tipo } = req.query;
    if (!file || !tipo) return res.status(400).json({ error: 'Parámetros incompletos.' });

    // Seguridad: solo nombres de archivo, sin rutas relativas
    const nombre = path.basename(file);
    const BASE   = path.join(__dirname, '..', 'reportes', tipo, nombre);

    if (!fs.existsSync(BASE)) return res.status(404).json({ error: 'Archivo no encontrado.' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`);
    fs.createReadStream(BASE).pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
