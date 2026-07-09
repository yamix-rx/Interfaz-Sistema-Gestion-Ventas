/**
 * routes/dashboard.js
 * GET /api/dashboard → métricas reales
 */

const router = require('express').Router();
const db     = require('../patterns/DatabaseSingleton');
const { requireRoles } = require('../middleware/auth');

router.get('/', requireRoles('Administrador', 'Supervisor', 'Vendedor'), async (req, res) => {
  try {

    // 1. Ventas del día
    const [[ventasDia]] = await db.query(`
      SELECT COALESCE(SUM(total), 0) AS total
      FROM ventas
      WHERE DATE(fecha) = CURDATE()
    `);

    // 2. Ventas del mes actual
    const [[ventasMes]] = await db.query(`
      SELECT COALESCE(SUM(total), 0) AS total
      FROM ventas
      WHERE YEAR(fecha) = YEAR(CURDATE())
        AND MONTH(fecha) = MONTH(CURDATE())
    `);

    // 3. Ventas del mes anterior (para % cambio)
    const [[ventasMesAnt]] = await db.query(`
      SELECT COALESCE(SUM(total), 0) AS total
      FROM ventas
      WHERE YEAR(fecha)  = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
        AND MONTH(fecha) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
    `);

    // 4. Stock total y cantidad de productos
    const [[totalStock]] = await db.query(`
      SELECT COALESCE(SUM(stock), 0) AS total,
             COUNT(*)                AS productos
      FROM productos
      WHERE estado != 'vencido'
    `);

    // 5. Productos con stock bajo
    const [stockBajo] = await db.query(`
      SELECT nombre, stock, stock_minimo
      FROM productos
      WHERE stock <= stock_minimo AND estado != 'vencido'
      ORDER BY stock ASC
      LIMIT 5
    `);

    // 6. Próximos a vencer (90 días)
    const [proxVencer] = await db.query(`
      SELECT nombre, lote, vencimiento, stock
      FROM productos
      WHERE vencimiento IS NOT NULL
        AND vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 90 DAY)
        AND estado != 'vencido'
      ORDER BY vencimiento ASC
      LIMIT 5
    `);

    // 7. Top 5 productos más vendidos este mes
    const [topProductos] = await db.query(`
      SELECT vi.producto_nombre AS nombre,
             SUM(vi.cantidad)   AS ventas
      FROM venta_items vi
      INNER JOIN ventas v ON v.id = vi.venta_id
      WHERE YEAR(v.fecha)  = YEAR(CURDATE())
        AND MONTH(v.fecha) = MONTH(CURDATE())
      GROUP BY vi.producto_nombre
      ORDER BY ventas DESC
      LIMIT 5
    `);

    // 8. Ventas mensuales últimos 6 meses
    const [ventasMensuales] = await db.query(`
      SELECT
        DATE_FORMAT(fecha, '%b')    AS mes,
        DATE_FORMAT(fecha, '%Y-%m') AS periodo,
        COALESCE(SUM(total), 0)     AS ventas
      FROM ventas
      WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY periodo, mes
      ORDER BY periodo ASC
    `);

    // 9. Alertas críticas
    const [[alertasCriticas]] = await db.query(`
      SELECT COUNT(*) AS total
      FROM productos
      WHERE estado IN ('agotado', 'vencido') OR stock = 0
    `);

    // Calcular % cambio mes
    const totalMes    = parseFloat(ventasMes.total);
    const totalMesAnt = parseFloat(ventasMesAnt.total);
    let cambioPct = 0;
    if (totalMesAnt > 0) {
      cambioPct = ((totalMes - totalMesAnt) / totalMesAnt) * 100;
    }

    res.json({
      metricas: {
        ventasDia:       parseFloat(ventasDia.total),
        ventasMes:       totalMes,
        ventasMesAnt:    totalMesAnt,
        cambioPct:       Math.round(cambioPct * 10) / 10,
        totalStock:      parseInt(totalStock.total),
        totalProductos:  parseInt(totalStock.productos),
        alertasCriticas: parseInt(alertasCriticas.total),
        stockBajoCount:  stockBajo.length,
      },
      stockBajo,
      proxVencer,
      topProductos,
      ventasMensuales,
    });

  } catch (err) {
    console.error('[dashboard]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
