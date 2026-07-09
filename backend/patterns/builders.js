class ProductoBuilder {
  constructor() {
    // Valores por defecto para campos opcionales
    this._producto = {
      id:           null,
      nombre:       null,
      descripcion:  '',
      laboratorio:  '',
      lote:         '',
      stock:        0,
      stock_minimo: 5,
      precio:       0,
      vencimiento:  null,
      estado:       'activo',
      categoria:    '',
    };
  }

  setId(id) {
    this._producto.id = id;
    return this; // Permite encadenamiento fluido
  }

  setNombre(nombre) {
    this._producto.nombre = nombre;
    return this;
  }

  setDescripcion(descripcion) {
    this._producto.descripcion = descripcion;
    return this;
  }

  setLaboratorio(laboratorio) {
    this._producto.laboratorio = laboratorio;
    return this;
  }

  setLote(lote) {
    this._producto.lote = lote;
    return this;
  }

  /**
   * @param {number} cantidad     Stock actual
   * @param {number} stockMinimo  Umbral de alerta (default: 5)
   */
  setStock(cantidad, stockMinimo = 5) {
    this._producto.stock        = cantidad;
    this._producto.stock_minimo = stockMinimo;
    return this;
  }

  setPrecio(precio) {
    this._producto.precio = precio;
    return this;
  }

  setVencimiento(fecha) {
    this._producto.vencimiento = fecha;
    return this;
  }

  setEstado(estado) {
    // La tabla productos usa estos valores: normal, bajo, agotado, vencido.
    // También aceptamos activo/inactivo por compatibilidad y los convertimos.
    const valor = String(estado || 'normal').trim().toLowerCase();
    const mapa = {
      normal: 'normal',
      bajo: 'bajo',
      agotado: 'agotado',
      vencido: 'vencido',
      activo: 'normal',
      inactivo: 'agotado',
    };

    const normalizado = mapa[valor];
    if (!normalizado) {
      const validos = ['normal', 'bajo', 'agotado', 'vencido'];
      throw new Error(`Estado inválido: "${estado}". Valores permitidos: ${validos.join(', ')}`);
    }

    this._producto.estado = normalizado;
    return this;
  }

  setCategoria(categoria) {
    this._producto.categoria = categoria;
    return this;
  }

  /**
   * Valida campos obligatorios y devuelve el objeto Producto final.
   * @returns {Object} Producto listo para insertar en la BD
   */
  build() {
    const { id, nombre, precio } = this._producto;

    if (!id)     throw new Error('[ProductoBuilder] El campo "id" es obligatorio.');
    if (!nombre) throw new Error('[ProductoBuilder] El campo "nombre" es obligatorio.');
    if (precio <= 0) throw new Error('[ProductoBuilder] El "precio" debe ser mayor a 0.');

    return { ...this._producto }; 
  }
}

// Compra Builder 
class CompraBuilder {
  constructor() {
    this._compra = {
      id:        null,
      proveedor: null,
      fecha:     new Date().toISOString().split('T')[0], // Hoy por defecto
      total:     0,
      estado:    'pendiente',
      productos: '[]',
      notas:     '',
    };
  }

  setId(id) {
    // Si no llega id (creación nueva), se genera uno automáticamente.
    this._compra.id = id || `C-${Date.now()}`;
    return this;
  }

  setProveedor(proveedor) {
    this._compra.proveedor = proveedor;
    return this;
  }

  setFecha(fecha) {
    this._compra.fecha = fecha;
    return this;
  }

  setTotal(total) {
    this._compra.total = total;
    return this;
  }

  setEstado(estado) {
    // La tabla compras usa estos valores: Pendiente, Recibido, Cancelado.
    const valor = String(estado || 'Pendiente').trim().toLowerCase();

    const mapa = {
      pendiente: 'Pendiente',
      recibido: 'Recibido',
      entregada: 'Recibido',
      aprobada: 'Recibido',
      cancelado: 'Cancelado',
      cancelada: 'Cancelado',
      rechazada: 'Cancelado',
    };

    const normalizado = mapa[valor];
    if (!normalizado) {
      const validos = ['Pendiente', 'Recibido', 'Cancelado'];
      throw new Error(`Estado inválido: "${estado}". Valores permitidos: ${validos.join(', ')}`);
    }

    this._compra.estado = normalizado;
    return this;
  }

  /**
   * @param {Array|string} productos - Array de ítems o JSON string
   */
  setProductos(productos) {
    this._compra.productos = typeof productos === 'string'
      ? productos
      : JSON.stringify(productos);
    return this;
  }

  setNotas(notas) {
    this._compra.notas = notas;
    return this;
  }

  /**
   * Valida y devuelve el objeto Compra final.
   * @returns {Object} Compra lista para insertar en la BD
   */
  build() {
    const { proveedor, total, productos } = this._compra;

    if (!proveedor) throw new Error('[CompraBuilder] El campo "proveedor" es obligatorio.');
    if (total <= 0)  throw new Error('[CompraBuilder] El "total" debe ser mayor a 0.');

    // Valida que productos sea un JSON válido
    try { JSON.parse(this._compra.productos); }
    catch { throw new Error('[CompraBuilder] El campo "productos" debe ser un JSON válido.'); }

    return { ...this._compra };
  }
}

module.exports = { ProductoBuilder, CompraBuilder };
