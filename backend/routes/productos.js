const router = require('express').Router();

// Singleton: una sola instancia del pool de conexiones 
const db = require('../patterns/DatabaseSingleton');

// Builder: construcción fluida y validada de Producto 
const { ProductoBuilder } = require('../patterns/builders');

// Observer: sujeto que notifica cuando el stock es bajo 
const { stockSubject, alertasObserver } = require('../patterns/StockObserver');

// listar todos

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM productos ORDER BY id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// alertas de stock bajo (Observer)
router.get('/alertas', (req, res) => {
  res.json(alertasObserver.obtenerAlertas());
});

// obtener por ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM productos WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// crear producto (Builder + Observer)
router.post('/', async (req, res) => {
  try {
    // Builder: construye y valida el objeto antes de tocar la BD
    const producto = new ProductoBuilder()
      .setId(req.body.id)
      .setNombre(req.body.nombre)
      .setDescripcion(req.body.descripcion)
      .setLaboratorio(req.body.laboratorio)
      .setLote(req.body.lote)
      .setStock(req.body.stock, req.body.stock_minimo)
      .setPrecio(req.body.precio)
      .setVencimiento(req.body.vencimiento)
      .setEstado(req.body.estado || 'activo')
      .setCategoria(req.body.categoria)
      .build(); // lanza Error si falta algún campo obligatorio

    await db.query(
      `INSERT INTO productos
         (id, nombre, descripcion, laboratorio, lote, stock, stock_minimo, precio, vencimiento, estado, categoria)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        producto.id, producto.nombre, producto.descripcion, producto.laboratorio,
        producto.lote, producto.stock, producto.stock_minimo, producto.precio,
        producto.vencimiento, producto.estado, producto.categoria,
      ]
    );

    // Observer: evalúa stock y notifica si es necesario
    stockSubject.actualizarStock(producto);

    res.status(201).json({ mensaje: 'Producto creado', id: producto.id });
  } catch (err) {
    console.error('[productos POST /] Error al crear producto:', err.message);
    console.error('  Body recibido:', JSON.stringify(req.body));
    res.status(400).json({ error: err.message });
  }
});

// actualizar producto (Builder + Observer)
router.put('/:id', async (req, res) => {
  try {
    const producto = new ProductoBuilder()
      .setId(req.params.id)
      .setNombre(req.body.nombre)
      .setDescripcion(req.body.descripcion)
      .setLaboratorio(req.body.laboratorio)
      .setLote(req.body.lote)
      .setStock(req.body.stock, req.body.stock_minimo)
      .setPrecio(req.body.precio)
      .setVencimiento(req.body.vencimiento)
      .setEstado(req.body.estado || 'activo')
      .setCategoria(req.body.categoria)
      .build();

    await db.query(
      `UPDATE productos
       SET nombre=?, descripcion=?, laboratorio=?, lote=?, stock=?, stock_minimo=?,
           precio=?, vencimiento=?, estado=?, categoria=?
       WHERE id=?`,
      [
        producto.nombre, producto.descripcion, producto.laboratorio, producto.lote,
        producto.stock, producto.stock_minimo, producto.precio, producto.vencimiento,
        producto.estado, producto.categoria, producto.id,
      ]
    );

    // Observer: re-evalúa stock tras la actualización
    stockSubject.actualizarStock(producto);

    res.json({ mensaje: 'Producto actualizado' });
  } catch (err) {
    console.error('[productos PUT /:id] Error al actualizar producto:', err.message);
    console.error('  Body recibido:', JSON.stringify(req.body));
    res.status(400).json({ error: err.message });
  }
});

// eliminar producto
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM productos WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
