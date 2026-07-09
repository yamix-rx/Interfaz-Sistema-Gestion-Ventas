const router = require('express').Router();
const path   = require('path');
const db     = require('../patterns/DatabaseSingleton');
const { requireRoles }       = require('../middleware/auth');
const { generarComprobante } = require('../services/ComprobanteService');

// Registrar venta
router.post('/', requireRoles('Administrador', 'Supervisor', 'Vendedor'), async (req, res) => {
  const {
    cliente_id, cliente_nombre, cliente_doc,
    tipo_doc, metodo_pago,
    subtotal, igv, total,
    items,        
    usuario_id,
  } = req.body;

  if (!items || items.length === 0)
    return res.status(400).json({ error: 'La venta debe tener al menos un producto.' });
  if (!['Boleta', 'Factura'].includes(tipo_doc))
    return res.status(400).json({ error: 'Tipo de documento inválido.' });
  if (!['Efectivo', 'Yape/Plin'].includes(metodo_pago))
    return res.status(400).json({ error: 'Método de pago inválido.' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Verificar stock
    for (const item of items) {
      const [rows] = await conn.query(
        'SELECT stock, estado FROM productos WHERE id = ? FOR UPDATE',
        [item.producto_id]
      );
      if (rows.length === 0)
        throw new Error(`Producto ${item.producto_id} no encontrado.`);
      if (rows[0].estado === 'vencido')
        throw new Error(`El producto "${item.producto_nombre}" está vencido.`);
      if (rows[0].stock < item.cantidad)
        throw new Error(`Stock insuficiente para "${item.producto_nombre}". Disponible: ${rows[0].stock}.`);
    }

    // Auto-registrar cliente nuevo si no tiene id pero si tiene nombre
    let clienteIdFinal = cliente_id || null;

    if (!cliente_id && cliente_nombre && cliente_nombre.trim() !== '') {
      if (cliente_doc && cliente_doc.trim() !== '') {
        const [existing] = await conn.query(
          'SELECT id FROM clientes WHERE dni = ? LIMIT 1',
          [cliente_doc.trim()]
        );
        if (existing.length > 0) clienteIdFinal = existing[0].id;
      }
      if (!clienteIdFinal) {
        const [inserted] = await conn.query(
          `INSERT INTO clientes (nombre, dni, estado) VALUES (?, ?, 'Activo')`,
          [
            cliente_nombre.trim(),
            (cliente_doc && cliente_doc.trim() !== '') ? cliente_doc.trim() : null,
          ]
        );
        clienteIdFinal = inserted.insertId;
      }
    }

    // Insertar cabecera de venta
    const [ventaResult] = await conn.query(
      `INSERT INTO ventas
         (cliente_id, cliente_nombre, cliente_doc, tipo_doc, metodo_pago, subtotal, igv, total, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clienteIdFinal,
        cliente_nombre || 'Consumidor final',
        cliente_doc    || null,
        tipo_doc, metodo_pago,
        subtotal, igv, total,
        usuario_id || null,
      ]
    );
    const ventaId = ventaResult.insertId;

    // Insertar ítems y descontar stock
    for (const item of items) {
      await conn.query(
        `INSERT INTO venta_items (venta_id, producto_id, producto_nombre, cantidad, precio_unit, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [ventaId, item.producto_id, item.producto_nombre, item.cantidad, item.precio_unit, item.subtotal]
      );
      await conn.query(
        `UPDATE productos
         SET stock = stock - ?,
             estado = CASE
               WHEN (stock - ?) <= 0           THEN 'agotado'
               WHEN (stock - ?) <= stock_minimo THEN 'bajo'
               ELSE 'normal'
             END
         WHERE id = ?`,
        [item.cantidad, item.cantidad, item.cantidad, item.producto_id]
      );
    }

    await conn.commit();

    // Generar PDF
    let pdfNombre = null;
    try {
      const [[ventaCompleta]] = await db.query(
        `SELECT v.*, u.nombre AS vendedor
         FROM ventas v LEFT JOIN usuarios u ON u.id = v.usuario_id
         WHERE v.id = ?`, [ventaId]
      );
      const [ventaItems] = await db.query(
        'SELECT * FROM venta_items WHERE venta_id = ?', [ventaId]
      );
      ventaCompleta.items = ventaItems;
      const rutaPDF = await generarComprobante(ventaCompleta);
      pdfNombre = path.basename(rutaPDF);
    } catch (pdfErr) {
      console.error('[PDF] Error generando comprobante:', pdfErr.message);
    }

    res.status(201).json({
      mensaje:  'Venta registrada correctamente.',
      id:       ventaId,
      pdf:      pdfNombre,
      pdf_url:  pdfNombre ? `/api/ventas/${ventaId}/pdf` : null,
    });

  } catch (err) {
    await conn.rollback();
    res.status(400).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// Listar ventas 
router.get('/', requireRoles('Administrador', 'Supervisor'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT v.*, u.nombre AS vendedor
       FROM ventas v
       LEFT JOIN usuarios u ON u.id = v.usuario_id
       ORDER BY v.fecha DESC
       LIMIT 200`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Descargar comprobante 
router.get('/:id/pdf', requireRoles('Administrador', 'Supervisor', 'Vendedor'), async (req, res) => {
  try {
    const [[venta]] = await db.query(
      `SELECT v.*, u.nombre AS vendedor
       FROM ventas v LEFT JOIN usuarios u ON u.id = v.usuario_id
       WHERE v.id = ?`, [req.params.id]
    );
    if (!venta) return res.status(404).json({ error: 'Venta no encontrada.' });

    const [items] = await db.query(
      'SELECT * FROM venta_items WHERE venta_id = ?', [req.params.id]
    );
    venta.items = items;

    // Borra el PDF
    const rutaPDF = await generarComprobante(venta);
    const nombre  = path.basename(rutaPDF);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`);
    res.sendFile(rutaPDF);
  } catch (err) {
    console.error('[PDF] Error al servir comprobante:', err.message);
    res.status(500).json({ error: 'No se pudo generar el PDF.' });
  }
});

// Detalle de venta 
router.get('/:id', requireRoles('Administrador', 'Supervisor', 'Vendedor'), async (req, res) => {
  try {
    const [[venta]] = await db.query('SELECT * FROM ventas WHERE id = ?', [req.params.id]);
    if (!venta) return res.status(404).json({ error: 'Venta no encontrada.' });
    const [items] = await db.query('SELECT * FROM venta_items WHERE venta_id = ?', [req.params.id]);
    res.json({ ...venta, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Anular venta y devolver stock 
router.put('/:id/anular', requireRoles('Administrador'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[venta]] = await conn.query(
      'SELECT * FROM ventas WHERE id = ? FOR UPDATE', [req.params.id]
    );
    if (!venta) throw new Error('Venta no encontrada.');
    if (venta.estado === 'Anulada') throw new Error('La venta ya está anulada.');

    const [items] = await conn.query(
      'SELECT * FROM venta_items WHERE venta_id = ?', [req.params.id]
    );

    for (const item of items) {
      await conn.query(
        `UPDATE productos
         SET stock = stock + ?,
             estado = CASE
               WHEN (stock + ?) > stock_minimo THEN 'normal'
               WHEN (stock + ?) > 0            THEN 'bajo'
               ELSE 'agotado'
             END
         WHERE id = ?`,
        [item.cantidad, item.cantidad, item.cantidad, item.producto_id]
      );
    }

    await conn.query('UPDATE ventas SET estado = ? WHERE id = ?', ['Anulada', req.params.id]);
    await conn.commit();
    res.json({ mensaje: 'Venta anulada y stock restaurado.' });

  } catch (err) {
    await conn.rollback();
    res.status(400).json({ error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
