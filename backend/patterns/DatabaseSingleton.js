require('dotenv').config();
const mysql = require('mysql2/promise');

class DatabaseSingleton {
  static #instance = null;
  // Pool privado de conexiones
  #pool = null;
  // Constructor privado para evitar instanciación directa
  constructor() {
    if (DatabaseSingleton.#instance) {
      throw new Error(
        'DatabaseSingleton ya tiene una instancia. Usa DatabaseSingleton.getInstance()'
      );
    }

    this.#pool = mysql.createPool({
      host:     process.env.DB_HOST     || 'localhost',
      user:     process.env.DB_USER     || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME     || 'farmacia_db',
      waitForConnections: true,
      connectionLimit:    10,
      queueLimit:         0,
    });

    console.log('[DatabaseSingleton] Pool de conexiones creado.');
  }

  /**
   * Punto de acceso global a la instancia única.
   * Si aún no existe, la crea; de lo contrario devuelve la existente.
   */
  static getInstance() {
    if (!DatabaseSingleton.#instance) {
      DatabaseSingleton.#instance = new DatabaseSingleton();
    }
    return DatabaseSingleton.#instance;
  }

  /**
   * Ejecuta una consulta SQL sobre el pool.
   * @param {string} sql       - Sentencia SQL con placeholders (?)
   * @param {Array}  params    - Valores para los placeholders
   * @returns {Promise<Array>} - [rows, fields]
   */
  async query(sql, params = []) {
    return this.#pool.query(sql, params);
  }

  /**
   * Obtiene una conexión individual del pool (para transacciones).
   * Recuerda liberar la conexión con connection.release() al terminar.
   */
  async getConnection() {
    return this.#pool.getConnection();
  }

  /**
   * Cierra el pool (útil en tests o al apagar el servidor).
   */
  async close() {
    await this.#pool.end();
    DatabaseSingleton.#instance = null;
    console.log('[DatabaseSingleton] Pool cerrado.');
  }
}

// Exportamos directamente la instancia única
module.exports = DatabaseSingleton.getInstance();
