class Observer {
  /**
   * Método que será invocado por el Subject al detectar stock bajo.
   * @param {Object} producto - { id, nombre, stock, stock_minimo }
   */
  actualizar(producto) {
    throw new Error('El método actualizar() debe ser implementado por la subclase.');
  }
}

// Observador 1: Logger en consola
class ConsoleLogger extends Observer {
  actualizar(producto) {
    console.warn(
      `[ConsoleLogger] ⚠️  STOCK BAJO — Producto: "${producto.nombre}" ` +
      `(ID: ${producto.id}) | Stock actual: ${producto.stock} | Mínimo: ${producto.stock_minimo}`
    );
  }
}

// Observador 2: Registro de alertas en memoria 
class AlertasObserver extends Observer {
  constructor() {
    super();
    this.alertas = []; // Historial de alertas generadas
  }

  actualizar(producto) {
    const alerta = {
      tipo:      'STOCK_BAJO',
      productoId: producto.id,
      nombre:    producto.nombre,
      stock:     producto.stock,
      minimo:    producto.stock_minimo,
      fecha:     new Date().toISOString(),
      mensaje:   `Stock insuficiente: ${producto.stock} unidades (mínimo: ${producto.stock_minimo})`,
    };

    this.alertas.push(alerta);
    console.info(`[AlertasObserver] Alerta registrada para "${producto.nombre}".`);
  }

  /**
   * Devuelve todas las alertas generadas (para exponerlas vía API).
   */
  obtenerAlertas() {
    return this.alertas;
  }

  /**
   * Limpia el historial de alertas.
   */
  limpiarAlertas() {
    this.alertas = [];
  }
}

// Observador 3: Simulación de envío de email
class EmailObserver extends Observer {
  constructor(emailDestino = 'admin@farmacia.com') {
    super();
    this.emailDestino = emailDestino;
  }

  actualizar(producto) {
    // En producción: integrar con Nodemailer, SendGrid, etc.
    console.info(
      `[EmailObserver] 📧  Simulando envío de email a "${this.emailDestino}":\n` +
      `  Asunto: ALERTA — Stock bajo de "${producto.nombre}"\n` +
      `  Cuerpo : El producto "${producto.nombre}" tiene solo ${producto.stock} ` +
      `unidades. Se requieren al menos ${producto.stock_minimo}.`
    );
  }
}

// Subject: StockSubject 
class StockSubject {
  constructor() {
    this._observadores = [];
  }

  /**
   * Agrega un observador a la lista de suscriptores.
   * @param {Observer} observador
   */
  suscribir(observador) {
    if (!(observador instanceof Observer)) {
      throw new Error('Solo se pueden suscribir instancias de Observer.');
    }
    this._observadores.push(observador);
    console.log(`[StockSubject] Observador "${observador.constructor.name}" suscrito.`);
  }

  /**
   * Elimina un observador de la lista.
   * @param {Observer} observador
   */
  desuscribir(observador) {
    this._observadores = this._observadores.filter(o => o !== observador);
  }

  /**
   * Notifica a todos los observadores suscritos.
   * @param {Object} producto
   */
  _notificar(producto) {
    for (const observador of this._observadores) {
      observador.actualizar(producto);
    }
  }

  /**
   * Evalúa el stock del producto y dispara notificaciones si es necesario.
   * Llamar a este método en cada CREATE y UPDATE de productos.
   *
   * @param {Object} producto - { id, nombre, stock, stock_minimo }
   */
  actualizarStock(producto) {
    const { stock, stock_minimo } = producto;

    if (stock !== undefined && stock_minimo !== undefined && stock < stock_minimo) {
      console.log(`[StockSubject] Stock bajo detectado → notificando ${this._observadores.length} observador(es).`);
      this._notificar(producto);
    }
  }
}

// Instancia global del Subject (Singleton ligero) 
// Todos los módulos importan el mismo subject para compartir observadores.
const stockSubject = new StockSubject();
// Suscribir observadores por defecto
stockSubject.suscribir(new ConsoleLogger());
const alertasObserver = new AlertasObserver();
stockSubject.suscribir(alertasObserver);
stockSubject.suscribir(new EmailObserver('admin@farmacia.com'));

module.exports = {
  StockSubject,
  Observer,
  ConsoleLogger,
  AlertasObserver,
  EmailObserver,
  stockSubject,      
  alertasObserver,   
};
