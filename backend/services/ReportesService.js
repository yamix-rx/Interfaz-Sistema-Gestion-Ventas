/**
 * services/ReportesService.js
 * Genera PDFs para los 4 tipos de reporte de Farmacia Sanet.
 * Los archivos se guardan en backend/reportes/<tipo>/
 */

const PDFDocument = require('pdfkit');
const fs          = require('fs');
const path        = require('path');

// ── Carpeta base ───────────────────────────────────────────────────────────────
const BASE_DIR = path.join(__dirname, '..', 'reportes');
const DIRS = {
  ventas_mensuales:     path.join(BASE_DIR, 'ventas_mensuales'),
  productos_vendidos:   path.join(BASE_DIR, 'productos_vendidos'),
  inventario_valorizado: path.join(BASE_DIR, 'inventario_valorizado'),
  vencimientos:         path.join(BASE_DIR, 'vencimientos'),
};
Object.values(DIRS).forEach(d => fs.mkdirSync(d, { recursive: true }));

// ── Paleta ────────────────────────────────────────────────────────────────────
const C = {
  primary:   '#1a7f5a',
  dark:      '#1a1a1a',
  gray:      '#555555',
  lightGray: '#888888',
  border:    '#dddddd',
  rowAlt:    '#f7f9f7',
  white:     '#ffffff',
  red:       '#c0392b',
  orange:    '#d35400',
  blue:      '#2471a3',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtMoney = n  => `S/. ${Number(n || 0).toFixed(2)}`;
const fmtNum   = n  => Number(n || 0).toLocaleString('es-PE');
const fmtDate  = dt => dt ? new Date(dt).toLocaleDateString('es-PE',
  { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
const fmtNow   = () => new Date().toLocaleString('es-PE',
  { day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit' });
const slug = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

// ── Diseño base compartido ────────────────────────────────────────────────────
const ML = 50;   // margin left
const W  = 495;  // content width

function crearDoc() {
  return new PDFDocument({ size: 'A4', margin: ML, bufferPages: true });
}

function cabecera(doc, titulo, subtitulo = '') {
  // Barra verde superior
  doc.rect(0, 0, 595, 6).fill(C.primary);

  // Logo texto
  doc.font('Helvetica-Bold').fontSize(20).fillColor(C.primary)
     .text('Farmacia Sanet', ML, 24);
  doc.font('Helvetica').fontSize(8).fillColor(C.lightGray)
     .text('Sistema de Gestión de Ventas e Inventario', ML, 48);

  // Título del reporte (derecha)
  doc.font('Helvetica-Bold').fontSize(13).fillColor(C.dark)
     .text(titulo, ML, 24, { width: W, align: 'right' });
  if (subtitulo) {
    doc.font('Helvetica').fontSize(8.5).fillColor(C.gray)
       .text(subtitulo, ML, 42, { width: W, align: 'right' });
  }
  doc.font('Helvetica').fontSize(8).fillColor(C.lightGray)
     .text(`Generado: ${fmtNow()}`, ML, 54, { width: W, align: 'right' });

  // Línea separadora
  const y = 72;
  doc.moveTo(ML, y).lineTo(ML + W, y).lineWidth(1).strokeColor(C.primary).stroke();
  return y + 14;
}

function pie(doc) {
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(pages.start + i);
    const yPie = doc.page.height - 30;
    doc.moveTo(ML, yPie - 6).lineTo(ML + W, yPie - 6)
       .lineWidth(0.3).strokeColor(C.border).stroke();
    doc.font('Helvetica').fontSize(7).fillColor(C.lightGray)
       .text('Farmacia Sanet — Documento generado automáticamente', ML, yPie, { width: W / 2 });
    doc.text(`Página ${i + 1} de ${pages.count}`, ML, yPie,
       { width: W, align: 'right' });
  }
}

function encabezadoTabla(doc, cols, y) {
  // Fondo cabecera
  doc.rect(ML, y, W, 18).fill(C.primary);
  doc.font('Helvetica-Bold').fontSize(8).fillColor(C.white);
  cols.forEach(col => {
    doc.text(col.label, col.x, y + 5, { width: col.w, align: col.align || 'left' });
  });
  return y + 18;
}

function filaTabla(doc, cols, datos, y, alt = false) {
  if (alt) doc.rect(ML, y, W, 16).fill(C.rowAlt);
  doc.font('Helvetica').fontSize(8).fillColor(C.dark);
  cols.forEach((col, i) => {
    doc.text(String(datos[i] ?? '—'), col.x, y + 4,
      { width: col.w, align: col.align || 'left' });
  });
  return y + 16;
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. REPORTE: VENTAS MENSUALES
// ══════════════════════════════════════════════════════════════════════════════
async function generarVentasMensuales(db, mes, anio) {
  const mesNum  = parseInt(mes);
  const anioNum = parseInt(anio);
  const mesNombre = new Date(anioNum, mesNum - 1, 1)
    .toLocaleString('es-PE', { month: 'long' });

  // Datos
  const [ventas] = await db.query(`
    SELECT v.id, v.fecha, v.cliente_nombre, v.tipo_doc,
           v.metodo_pago, v.subtotal, v.igv, v.total,
           u.nombre AS vendedor
    FROM ventas v
    LEFT JOIN usuarios u ON u.id = v.usuario_id
    WHERE YEAR(v.fecha) = ? AND MONTH(v.fecha) = ?
    ORDER BY v.fecha DESC
  `, [anioNum, mesNum]);

  const [[resumen]] = await db.query(`
    SELECT COUNT(*) AS total_ventas,
           COALESCE(SUM(total), 0)    AS monto_total,
           COALESCE(SUM(igv), 0)      AS igv_total,
           COALESCE(SUM(subtotal), 0) AS subtotal_total
    FROM ventas
    WHERE YEAR(fecha) = ? AND MONTH(fecha) = ?
  `, [anioNum, mesNum]);

  const doc  = crearDoc();
  const file = path.join(DIRS.ventas_mensuales, `ventas_${anioNum}_${String(mesNum).padStart(2,'0')}_${slug()}.pdf`);
  const out  = fs.createWriteStream(file);
  doc.pipe(out);

  let y = cabecera(doc, 'Reporte de Ventas Mensuales',
    `${mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1)} ${anioNum}`);

  // Resumen
  y += 8;
  const boxW = (W - 20) / 4;
  const cajas = [
    { label: 'Total Ventas',  valor: fmtNum(resumen.total_ventas) },
    { label: 'Subtotal',      valor: fmtMoney(resumen.subtotal_total) },
    { label: 'IGV (18%)',     valor: fmtMoney(resumen.igv_total) },
    { label: 'Monto Total',   valor: fmtMoney(resumen.monto_total) },
  ];
  cajas.forEach((c, i) => {
    const bx = ML + i * (boxW + 6.67);
    doc.rect(bx, y, boxW, 44).fill('#eaf5f0').stroke(C.primary);
    doc.font('Helvetica').fontSize(7.5).fillColor(C.gray)
       .text(c.label, bx + 6, y + 8, { width: boxW - 12 });
    doc.font('Helvetica-Bold').fontSize(13).fillColor(C.primary)
       .text(c.valor, bx + 6, y + 20, { width: boxW - 12 });
  });
  y += 58;

  // Tabla
  const cols = [
    { label: '#',          x: ML,       w: 22,  align: 'right' },
    { label: 'Fecha',      x: ML + 26,  w: 60 },
    { label: 'Cliente',    x: ML + 90,  w: 110 },
    { label: 'Tipo',       x: ML + 204, w: 48 },
    { label: 'Método',     x: ML + 256, w: 58 },
    { label: 'Vendedor',   x: ML + 318, w: 80 },
    { label: 'Total',      x: ML + 402, w: 70,  align: 'right' },
  ];
  y = encabezadoTabla(doc, cols, y);

  ventas.forEach((v, i) => {
    if (y > 740) { doc.addPage(); y = 50; }
    y = filaTabla(doc, cols, [
      i + 1,
      fmtDate(v.fecha),
      v.cliente_nombre || 'Consumidor final',
      v.tipo_doc,
      v.metodo_pago,
      v.vendedor || '—',
      fmtMoney(v.total),
    ], y, i % 2 === 1);
    // línea fila
    doc.moveTo(ML, y).lineTo(ML + W, y).lineWidth(0.2).strokeColor(C.border).stroke();
  });

  if (ventas.length === 0) {
    doc.font('Helvetica').fontSize(9).fillColor(C.lightGray)
       .text('Sin ventas registradas en este período.', ML, y + 12, { width: W, align: 'center' });
  }

  pie(doc);
  doc.end();
  return new Promise((res, rej) => {
    out.on('finish', () => res(file));
    out.on('error', rej);
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. REPORTE: PRODUCTOS MÁS VENDIDOS
// ══════════════════════════════════════════════════════════════════════════════
async function generarProductosVendidos(db, mes, anio) {
  const mesNum  = parseInt(mes);
  const anioNum = parseInt(anio);
  const mesNombre = new Date(anioNum, mesNum - 1, 1)
    .toLocaleString('es-PE', { month: 'long' });

  const [productos] = await db.query(`
    SELECT vi.producto_nombre AS nombre,
           SUM(vi.cantidad)   AS unidades,
           SUM(vi.subtotal)   AS ingreso
    FROM venta_items vi
    INNER JOIN ventas v ON v.id = vi.venta_id
    WHERE YEAR(v.fecha) = ? AND MONTH(v.fecha) = ?
    GROUP BY vi.producto_nombre
    ORDER BY unidades DESC
    LIMIT 20
  `, [anioNum, mesNum]);

  const doc  = crearDoc();
  const file = path.join(DIRS.productos_vendidos, `productos_${anioNum}_${String(mesNum).padStart(2,'0')}_${slug()}.pdf`);
  const out  = fs.createWriteStream(file);
  doc.pipe(out);

  let y = cabecera(doc, 'Productos Más Vendidos',
    `${mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1)} ${anioNum} · Top 20`);
  y += 16;

  const cols = [
    { label: 'Pos.',     x: ML,       w: 28,  align: 'right' },
    { label: 'Producto', x: ML + 32,  w: 270 },
    { label: 'Unidades', x: ML + 306, w: 80,  align: 'right' },
    { label: 'Ingreso',  x: ML + 390, w: 105, align: 'right' },
  ];
  y = encabezadoTabla(doc, cols, y);

  productos.forEach((p, i) => {
    if (y > 740) { doc.addPage(); y = 50; }
    // Barra proporcional suave
    const maxU = productos[0]?.unidades || 1;
    const barW = Math.max(2, (p.unidades / maxU) * 80);
    if (i % 2 === 1) doc.rect(ML, y, W, 16).fill(C.rowAlt);
    doc.rect(ML + 32, y + 5, barW, 6).fill('#c8e6d8');
    y = filaTabla(doc, cols, [
      `#${i + 1}`,
      p.nombre,
      fmtNum(p.unidades),
      fmtMoney(p.ingreso),
    ], y, false);
    doc.moveTo(ML, y).lineTo(ML + W, y).lineWidth(0.2).strokeColor(C.border).stroke();
  });

  if (productos.length === 0) {
    doc.font('Helvetica').fontSize(9).fillColor(C.lightGray)
       .text('Sin ventas registradas en este período.', ML, y + 12, { width: W, align: 'center' });
  }

  pie(doc);
  doc.end();
  return new Promise((res, rej) => {
    out.on('finish', () => res(file));
    out.on('error', rej);
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. REPORTE: INVENTARIO VALORIZADO
// ══════════════════════════════════════════════════════════════════════════════
async function generarInventarioValorizado(db) {
  const [productos] = await db.query(`
    SELECT p.nombre, p.lote, p.stock, p.precio,
           (p.stock * p.precio) AS valor_total,
           p.estado, c.nombre AS categoria
    FROM productos p
    LEFT JOIN categorias c ON c.id = p.categoria
    ORDER BY valor_total DESC
  `);

  const [[resumen]] = await db.query(`
    SELECT COUNT(*)                        AS total_productos,
           COALESCE(SUM(stock), 0)         AS total_unidades,
           COALESCE(SUM(stock * precio),0) AS valor_total
    FROM productos
  `);

  const doc  = crearDoc();
  const file = path.join(DIRS.inventario_valorizado, `inventario_${slug()}.pdf`);
  const out  = fs.createWriteStream(file);
  doc.pipe(out);

  let y = cabecera(doc, 'Inventario Valorizado', `Al ${fmtDate(new Date())}`);
  y += 8;

  // Cajas resumen
  const boxW = (W - 10) / 3;
  const cajas = [
    { label: 'Productos',        valor: fmtNum(resumen.total_productos) },
    { label: 'Unidades en Stock', valor: fmtNum(resumen.total_unidades) },
    { label: 'Valor Total',      valor: fmtMoney(resumen.valor_total) },
  ];
  cajas.forEach((c, i) => {
    const bx = ML + i * (boxW + 5);
    doc.rect(bx, y, boxW, 44).fill('#eaf5f0').stroke(C.primary);
    doc.font('Helvetica').fontSize(7.5).fillColor(C.gray)
       .text(c.label, bx + 6, y + 8, { width: boxW - 12 });
    doc.font('Helvetica-Bold').fontSize(13).fillColor(C.primary)
       .text(c.valor, bx + 6, y + 20, { width: boxW - 12 });
  });
  y += 58;

  const cols = [
    { label: '#',          x: ML,       w: 20,  align: 'right' },
    { label: 'Producto',   x: ML + 24,  w: 155 },
    { label: 'Categoría',  x: ML + 183, w: 80 },
    { label: 'Lote',       x: ML + 267, w: 60 },
    { label: 'Stock',      x: ML + 331, w: 44,  align: 'right' },
    { label: 'Precio',     x: ML + 379, w: 56,  align: 'right' },
    { label: 'Valor',      x: ML + 439, w: 68,  align: 'right' },
  ];
  y = encabezadoTabla(doc, cols, y);

  productos.forEach((p, i) => {
    if (y > 740) { doc.addPage(); y = 50; }
    // Color estado
    const estadoColor = p.estado === 'vencido' ? C.red
      : p.estado === 'bajo' ? C.orange
      : p.estado === 'agotado' ? C.red
      : C.dark;
    if (i % 2 === 1) doc.rect(ML, y, W, 16).fill(C.rowAlt);
    doc.font('Helvetica').fontSize(8).fillColor(C.dark);
    // Col especial estado en nombre
    doc.text(String(i + 1), ML, y + 4, { width: 20, align: 'right' });
    doc.fillColor(estadoColor).text(p.nombre, ML + 24, y + 4, { width: 155 });
    doc.fillColor(C.dark)
       .text(p.categoria || '—', ML + 183, y + 4, { width: 80 })
       .text(p.lote      || '—', ML + 267, y + 4, { width: 60 })
       .text(fmtNum(p.stock),    ML + 331, y + 4, { width: 44, align: 'right' })
       .text(fmtMoney(p.precio), ML + 379, y + 4, { width: 56, align: 'right' })
       .text(fmtMoney(p.valor_total), ML + 439, y + 4, { width: 68, align: 'right' });
    doc.moveTo(ML, y + 16).lineTo(ML + W, y + 16).lineWidth(0.2).strokeColor(C.border).stroke();
    y += 16;
  });

  pie(doc);
  doc.end();
  return new Promise((res, rej) => {
    out.on('finish', () => res(file));
    out.on('error', rej);
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. REPORTE: VENCIMIENTOS PRÓXIMOS
// ══════════════════════════════════════════════════════════════════════════════
async function generarVencimientos(db, dias = 90) {
  const [productos] = await db.query(`
    SELECT nombre, lote, vencimiento, stock, stock_minimo,
           estado,
           DATEDIFF(vencimiento, CURDATE()) AS dias_restantes
    FROM productos
    WHERE vencimiento IS NOT NULL
      AND vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
    ORDER BY vencimiento ASC
  `, [dias]);

  const [[totales]] = await db.query(`
    SELECT
      SUM(CASE WHEN DATEDIFF(vencimiento, CURDATE()) <= 30 THEN 1 ELSE 0 END) AS criticos,
      SUM(CASE WHEN DATEDIFF(vencimiento, CURDATE()) BETWEEN 31 AND 60 THEN 1 ELSE 0 END) AS moderados,
      SUM(CASE WHEN DATEDIFF(vencimiento, CURDATE()) > 60 THEN 1 ELSE 0 END) AS normales,
      COUNT(*) AS total
    FROM productos
    WHERE vencimiento IS NOT NULL
      AND vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
  `, [dias]);

  const doc  = crearDoc();
  const file = path.join(DIRS.vencimientos, `vencimientos_${slug()}.pdf`);
  const out  = fs.createWriteStream(file);
  doc.pipe(out);

  let y = cabecera(doc, 'Vencimientos Próximos', `Productos que vencen en los próximos ${dias} días`);
  y += 8;

  // Cajas resumen
  const boxW = (W - 15) / 4;
  const cajas = [
    { label: 'Total',             valor: String(totales.total   || 0), color: C.primary },
    { label: '≤ 30 días (Crítico)', valor: String(totales.criticos || 0), color: C.red },
    { label: '31–60 días',         valor: String(totales.moderados|| 0), color: C.orange },
    { label: '61+ días',           valor: String(totales.normales || 0), color: C.blue },
  ];
  cajas.forEach((c, i) => {
    const bx = ML + i * (boxW + 5);
    doc.rect(bx, y, boxW, 44).fill('#f9f9f9').stroke(c.color);
    doc.font('Helvetica').fontSize(7.5).fillColor(C.gray)
       .text(c.label, bx + 6, y + 8, { width: boxW - 12 });
    doc.font('Helvetica-Bold').fontSize(18).fillColor(c.color)
       .text(c.valor, bx + 6, y + 18, { width: boxW - 12 });
  });
  y += 58;

  const cols = [
    { label: '#',            x: ML,       w: 20,  align: 'right' },
    { label: 'Producto',     x: ML + 24,  w: 168 },
    { label: 'Lote',         x: ML + 196, w: 68 },
    { label: 'Vencimiento',  x: ML + 268, w: 72 },
    { label: 'Días',         x: ML + 344, w: 40,  align: 'right' },
    { label: 'Stock',        x: ML + 388, w: 44,  align: 'right' },
    { label: 'Estado',       x: ML + 436, w: 72 },
  ];
  y = encabezadoTabla(doc, cols, y);

  productos.forEach((p, i) => {
    if (y > 740) { doc.addPage(); y = 50; }
    const d = parseInt(p.dias_restantes);
    const color = d <= 30 ? C.red : d <= 60 ? C.orange : C.dark;
    if (i % 2 === 1) doc.rect(ML, y, W, 16).fill(C.rowAlt);
    doc.font('Helvetica').fontSize(8).fillColor(C.dark)
       .text(String(i + 1), ML, y + 4, { width: 20, align: 'right' })
       .text(p.nombre,      ML + 24,  y + 4, { width: 168 })
       .text(p.lote || '—', ML + 196, y + 4, { width: 68 });
    doc.fillColor(color)
       .text(fmtDate(p.vencimiento), ML + 268, y + 4, { width: 72 })
       .text(String(d),              ML + 344, y + 4, { width: 40, align: 'right' });
    doc.fillColor(C.dark)
       .text(fmtNum(p.stock), ML + 388, y + 4, { width: 44, align: 'right' })
       .text(p.estado,        ML + 436, y + 4, { width: 72 });
    doc.moveTo(ML, y + 16).lineTo(ML + W, y + 16).lineWidth(0.2).strokeColor(C.border).stroke();
    y += 16;
  });

  if (productos.length === 0) {
    doc.font('Helvetica').fontSize(9).fillColor(C.lightGray)
       .text('No hay productos próximos a vencer en este período.', ML, y + 12,
         { width: W, align: 'center' });
  }

  pie(doc);
  doc.end();
  return new Promise((res, rej) => {
    out.on('finish', () => res(file));
    out.on('error', rej);
  });
}

module.exports = {
  generarVentasMensuales,
  generarProductosVendidos,
  generarInventarioValorizado,
  generarVencimientos,
};
