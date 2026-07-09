const router = require('express').Router();

// Singleton
const db = require('../patterns/DatabaseSingleton');

// Builder 
const { CompraBuilder } = require('../patterns/builders');

// Observer: reevalúa alertas después de mover stock
const { stockSubject } = require('../patterns/StockObserver');

function normalizarTexto(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function esRecibido(estado) {
  return normalizarTexto(estado) === 'recibido';
}

function obtenerLineasProductos(productos) {
  if (!productos) return [];

  if (Array.isArray(productos)) {
    return productos
      .map((item) => item?.descripcion || item?.nombre || item?.producto || String(item || ''))
      .filter(Boolean);
  }

  if (typeof productos === 'string') {
    const texto = productos.trim();

    // Soporta el formato nuevo: [{"descripcion":"Paracetamol x100"}]
    try {
      const parsed = JSON.parse(texto);
      if (Array.isArray(parsed)) return obtenerLineasProductos(parsed);
    } catch (_) {
      // Si no es JSON, se procesa como texto normal.
    }

    // Soporta el formato antiguo: Paracetamol x100, Ibuprofeno x50
    return texto.split(',').map((x) => x.trim()).filter(Boolean);
  }

  return [];
}

function extraerProductoCantidad(linea) {
  const texto = String(linea || '').trim();

  // Acepta: Paracetamol x100, Paracetamol X 100, Paracetamol 100
  const matchConX = texto.match(/^(.+?)\s*x\s*(\d+)\s*$/i);
  const matchFinal = texto.match(/^(.+?)\s+(\d+)\s*$/i);
  const match = matchConX || matchFinal;

  if (!match) return null;

  const nombre = match[1].trim();
  const cantidad = Number(match[2]);

  if (!nombre || !Number.isInteger(cantidad) || cantidad <= 0) return null;

  return { nombre, cantidad };
}

function obtenerTerminoBusqueda(nombre) {
  // Quita dosis o presentaciones para encontrar "Paracetamol" dentro de "Paracetamol 500mg".
  return String(nombre || '')
    .replace(/\b\d+(mg|g|ml|mcg|%)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function sumarStockPorCompra(connection, productos) {
  const lineas = obtenerLineasProductos(productos);
  const items = lineas.map(extraerProductoCantidad).filter(Boolean);
  const actualizados = [];
  const noEncontrados = [];
  const invalidos = lineas.filter((linea) => !extraerProductoCantidad(linea));

  for (const item of items) {
    const termino = obtenerTerminoBusqueda(item.nombre);

    const [productosEncontrados] = await connection.query(
      `SELECT id, nombre, stock, stock_minimo, precio, vencimiento, estado
       FROM productos
       WHERE LOWER(nombre) LIKE LOWER(?)
       ORDER BY id
       LIMIT 1`,
      [`%${termino}%`]
    );

    if (productosEncontrados.length === 0) {
      noEncontrados.push(`${item.nombre} x${item.cantidad}`);
      continue;
    }

    const producto = productosEncontrados[0];
    const nuevoStock = Number(producto.stock || 0) + item.cantidad;
    const nuevoEstado = nuevoStock <= 0
      ? 'agotado'
      : nuevoStock <= Number(producto.stock_minimo || 0)
        ? 'bajo'
        : 'normal';

    await connection.query(
      `UPDATE productos
       SET stock = ?, estado = CASE WHEN vencimiento < CURDATE() THEN 'vencido' ELSE ? END
       WHERE id = ?`,
      [nuevoStock, nuevoEstado, producto.id]
    );

    const productoActualizado = {
      ...producto,
      stock: nuevoStock,
      estado: nuevoEstado,
    };

    stockSubject.actualizarStock(productoActualizado);

    actualizados.push({
      id: producto.id,
      nombre: producto.nombre,
      cantidad_sumada: item.cantidad,
      stock_anterior: Number(producto.stock || 0),
      stock_nuevo: nuevoStock,
    });
  }

  return { actualizados, noEncontrados, invalidos };
}

// listar todas
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM compras ORDER BY fecha DESC');
    res.json(rows);
  } catch (err) {
    console.error('[compras GET /]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// obtener por ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM compras WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Compra no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[compras GET /:id]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// registrar compra (Builder)
router.post('/', async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const compra = new CompraBuilder()
      .setId(req.body.id)
      .setProveedor(req.body.proveedor)
      .setFecha(req.body.fecha)
      .setTotal(req.body.total)
      .setEstado(req.body.estado || 'Pendiente')
      .setProductos(req.body.productos || [])
      .setNotas(req.body.notas)
      .build();

    await connection.query(
      'INSERT INTO compras (id, proveedor, fecha, total, estado, productos, notas) VALUES (?,?,?,?,?,?,?)',
      [compra.id, compra.proveedor, compra.fecha, compra.total, compra.estado, compra.productos, compra.notas]
    );

    let movimientoStock = null;
    if (esRecibido(compra.estado)) {
      movimientoStock = await sumarStockPorCompra(connection, compra.productos);
    }

    await connection.commit();

    res.status(201).json({
      mensaje: esRecibido(compra.estado)
        ? 'Compra registrada y stock actualizado'
        : 'Compra registrada',
      id: compra.id,
      movimientoStock,
    });
  } catch (err) {
    await connection.rollback();
    console.error('[compras POST /] Error al registrar compra:', err.message);
    console.error('  Body recibido:', JSON.stringify(req.body));
    res.status(400).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// actualizar compra (Builder)
router.put('/:id', async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [compraAnteriorRows] = await connection.query(
      'SELECT * FROM compras WHERE id = ? FOR UPDATE',
      [req.params.id]
    );

    if (compraAnteriorRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    const compraAnterior = compraAnteriorRows[0];

    const compra = new CompraBuilder()
      .setId(req.params.id)
      .setProveedor(req.body.proveedor)
      .setFecha(req.body.fecha)
      .setTotal(req.body.total)
      .setEstado(req.body.estado || 'Pendiente')
      .setProductos(req.body.productos || [])
      .setNotas(req.body.notas)
      .build();

    await connection.query(
      'UPDATE compras SET proveedor=?, fecha=?, total=?, estado=?, productos=?, notas=? WHERE id=?',
      [compra.proveedor, compra.fecha, compra.total, compra.estado, compra.productos, compra.notas, compra.id]
    );

    let movimientoStock = null;

    // Solo suma una vez: cuando cambia de Pendiente/Cancelado a Recibido.
    if (!esRecibido(compraAnterior.estado) && esRecibido(compra.estado)) {
      movimientoStock = await sumarStockPorCompra(connection, compra.productos);
    }

    await connection.commit();

    res.json({
      mensaje: movimientoStock
        ? 'Compra actualizada y stock incrementado'
        : 'Compra actualizada',
      movimientoStock,
    });
  } catch (err) {
    await connection.rollback();
    console.error('[compras PUT /:id] Error al actualizar compra:', err.message);
    console.error('  Body recibido:', JSON.stringify(req.body));
    res.status(400).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// eliminar compra
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM compras WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Compra eliminada' });
  } catch (err) {
    console.error('[compras DELETE /:id]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
