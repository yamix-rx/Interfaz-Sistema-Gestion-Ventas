const PDFDocument = require('pdfkit');
const fs          = require('fs');
const path        = require('path');

// Carpetas
const BASE_DIR = path.join(__dirname, '..', 'comprobantes');
const DIRS = {
  Boleta:  path.join(BASE_DIR, 'boletas'),
  Factura: path.join(BASE_DIR, 'facturas'),
};
Object.values(DIRS).forEach(d => fs.mkdirSync(d, { recursive: true }));

// Helpers 
const fmtMoney = n  => `S/. ${Number(n).toFixed(2)}`;
const fmtDate  = dt => new Date(dt).toLocaleDateString('es-PE',
  { day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtDT    = dt => new Date(dt).toLocaleString('es-PE',
  { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// Paleta
const C = {
  green:     '#1a7f5a',
  greenDark: '#145f44',
  blue:      '#2471a3',
  blueBg:    '#eaf2fb',
  greenBg:   '#e8f8f0',
  dark:      '#1a1a1a',
  gray:      '#666666',
  border:    '#dddddd',
  rowAlt:    '#f9f9f9',
  white:     '#ffffff',
};

/**
 * Genera (o devuelve si ya existe) el PDF del comprobante.
 * @param {object} venta  Fila de ventas + campo `.items` y `.vendedor`
 * @returns {Promise<string>}  Ruta absoluta del PDF
 */
function generarComprobante(venta) {
  return new Promise((resolve, reject) => {
    const tipo    = venta.tipo_doc;                      
    const serie   = tipo === 'Boleta' ? 'B001' : 'F001';
    const numero  = String(venta.id).padStart(8, '0');
    const nombre  = `${serie}-${numero}.pdf`;
    const rutaPDF = path.join(DIRS[tipo], nombre);

    // Si ya existe, lo devuelve sin regenerar
    if (fs.existsSync(rutaPDF)) return resolve(rutaPDF);

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      info: {
        Title:   `${tipo} ${serie}-${numero}`,
        Author:  'Farmacia Sanet',
        Subject: 'Comprobante de venta',
      },
    });

    const stream = fs.createWriteStream(rutaPDF);
    doc.pipe(stream);
    stream.on('finish', () => resolve(rutaPDF));
    stream.on('error',  reject);

    const PW = doc.page.width;  
    const ML = 50;              
    const MR = 50;              
    const W  = PW - ML - MR;    

    //  BANDA SUPERIOR
    doc.rect(0, 0, PW, 8).fill(C.green);

    // Encabezado
    let y = 24;

    // Logo
    doc.font('Helvetica-Bold').fontSize(22).fillColor(C.green)
       .text('Farmacia Sanet', ML, y);

    doc.font('Helvetica').fontSize(8.5).fillColor(C.gray)
       .text('RUC: 20123456789',                               ML, y + 28)
       .text('Trujillo — La Libertad, Perú', ML, y + 40)
       .text('Tel: (044) 123-456  |  farmacia@sanet.com',      ML, y + 52);

    // Caja comprobante (derecha)
    const BOX_X = 370, BOX_Y = y, BOX_W = 175, BOX_H = 72;
    const boxColor  = tipo === 'Boleta' ? C.green  : C.blue;
    const boxBg     = tipo === 'Boleta' ? C.greenBg : C.blueBg;

    doc.roundedRect(BOX_X, BOX_Y, BOX_W, BOX_H, 5)
       .fillAndStroke(boxBg, boxColor);

    doc.font('Helvetica-Bold').fontSize(11).fillColor(boxColor)
       .text(tipo === 'Boleta' ? 'BOLETA DE VENTA' : 'FACTURA',
             BOX_X, BOX_Y + 10, { width: BOX_W, align: 'center' });

    doc.font('Helvetica-Bold').fontSize(14).fillColor(C.dark)
       .text(`${serie}-${numero}`, BOX_X, BOX_Y + 28, { width: BOX_W, align: 'center' });

    doc.font('Helvetica').fontSize(8).fillColor(C.gray)
       .text(fmtDT(venta.fecha), BOX_X, BOX_Y + 50, { width: BOX_W, align: 'center' });

    y += 90;

    doc.moveTo(ML, y).lineTo(ML + W, y).lineWidth(0.5).strokeColor(C.border).stroke();
    y += 12;

    // Datos del cliente
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(C.green)
       .text('DATOS DEL CLIENTE', ML, y);
    y += 13;

    // 2 columnas
    const col2X = ML + W / 2;

    const dataRow = (label, value, x, yy) => {
      doc.font('Helvetica-Bold').fontSize(8).fillColor(C.gray)
         .text(label + ':', x, yy, { width: 90, continued: false });
      doc.font('Helvetica').fontSize(8).fillColor(C.dark)
         .text(value || '—', x + 92, yy, { width: W / 2 - 100 });
    };

    dataRow('Cliente',  venta.cliente_nombre || 'Consumidor final', ML,     y);
    dataRow('Método',   venta.metodo_pago,                          col2X,  y);
    y += 13;
    dataRow(tipo === 'Factura' ? 'RUC' : 'DNI', venta.cliente_doc || '—', ML,    y);
    dataRow('Vendedor', venta.vendedor || '—',                      col2X, y);
    y += 18;

    // Tabla de productos 
    const ROW_H   = 18;
    const COL     = { desc: ML, cant: ML + 295, unit: ML + 340, total: ML + 400 };
    const TH_H    = 22;

    // Cabecera tabla
    doc.rect(ML, y, W, TH_H).fill(C.green);
    doc.font('Helvetica-Bold').fontSize(8).fillColor(C.white);
    doc.text('Descripción',   COL.desc  + 4, y + 7, { width: 285 });
    doc.text('Cant.',         COL.cant,       y + 7, { width: 40,  align: 'right' });
    doc.text('P. Unit.',      COL.unit,       y + 7, { width: 55,  align: 'right' });
    doc.text('Subtotal',      COL.total,      y + 7, { width: W - (COL.total - ML), align: 'right' });
    y += TH_H;

    const items = venta.items || [];
    items.forEach((item, i) => {
      const bg = i % 2 === 0 ? C.white : C.rowAlt;
      doc.rect(ML, y, W, ROW_H).fill(bg);
      doc.font('Helvetica').fontSize(8).fillColor(C.dark);
      doc.text(item.producto_nombre, COL.desc + 4, y + 5, { width: 280, ellipsis: true });
      doc.text(String(item.cantidad),             COL.cant,  y + 5, { width: 40,  align: 'right' });
      doc.text(fmtMoney(item.precio_unit),        COL.unit,  y + 5, { width: 55,  align: 'right' });
      doc.text(fmtMoney(item.subtotal),           COL.total, y + 5, { width: W - (COL.total - ML), align: 'right' });
      y += ROW_H;
    });

    // Borde de toda la tabla
    const tableTop = y - (items.length * ROW_H) - TH_H;
    doc.rect(ML, tableTop, W, TH_H + items.length * ROW_H)
       .lineWidth(0.5).strokeColor(C.border).stroke();

    y += 10;

    // Totales
    const TOT_X  = ML + W - 190;
    const TOT_W  = 190;
    const LBL_W  = 110;

    const totRow = (label, valor, bold = false, highlight = false) => {
      if (highlight) {
        doc.rect(TOT_X - 5, y - 2, TOT_W + 5, 20).fill(C.green);
        doc.font('Helvetica-Bold').fontSize(10.5).fillColor(C.white)
           .text(label, TOT_X, y + 2, { width: LBL_W })
           .text(valor,  TOT_X + LBL_W, y + 2, { width: TOT_W - LBL_W, align: 'right' });
        y += 22;
      } else {
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5)
           .fillColor(C.gray).text(label, TOT_X, y, { width: LBL_W })
           .fillColor(C.dark).text(valor,  TOT_X + LBL_W, y, { width: TOT_W - LBL_W, align: 'right' });
        y += 13;
      }
    };

    totRow('Subtotal (sin IGV):', fmtMoney(venta.subtotal));
    totRow('IGV (18%):', fmtMoney(venta.igv));
    totRow('TOTAL A PAGAR:', fmtMoney(venta.total), true, true);

    y += 20;

    // Observaciones / leyenda legal
    doc.moveTo(ML, y).lineTo(ML + W, y).lineWidth(0.3).strokeColor(C.border).stroke();
    y += 10;

    if (tipo === 'Boleta') {
      doc.font('Helvetica').fontSize(7.5).fillColor(C.gray)
         .text(
           'El IGV está incluido en el precio. Este documento acredita la adquisición de los productos listados.',
           ML, y, { width: W, align: 'center' }
         );
    } else {
      doc.font('Helvetica').fontSize(7.5).fillColor(C.gray)
         .text(
           'Representación impresa de la factura electrónica. Verifique en: www.sunat.gob.pe',
           ML, y, { width: W, align: 'center' }
         );
    }
    y += 14;

    doc.font('Helvetica').fontSize(7.5).fillColor(C.gray)
       .text(
         `Gracias por su preferencia — Farmacia Sanet — ${fmtDate(venta.fecha)} — ${serie}-${numero}`,
         ML, y, { width: W, align: 'center' }
       );

    //  BANDA INFERIOR
    const PH = doc.page.height;  // 842
    doc.rect(0, PH - 8, PW, 8).fill(C.green);

    doc.end();
  });
}

module.exports = { generarComprobante, DIRS };
