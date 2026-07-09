require('dotenv').config();
const bcrypt  = require('bcryptjs');
const pool    = require('./db');

const USUARIOS = [
  { email: 'admin@farmacia.com',      nombre: 'Administrador Sistema', clave: 'Admin123!', rol: 'Administrador' },
  { email: 'supervisor@farmacia.com', nombre: 'Supervisor Almacén',    clave: 'Super123!', rol: 'Supervisor'    },
  { email: 'vendedor@farmacia.com',   nombre: 'Vendedor Principal',    clave: 'Vende123!', rol: 'Vendedor'      },
];

async function seed() {
  try {
    for (const u of USUARIOS) {
      const hash = await bcrypt.hash(u.clave, 10);
      // Upsert: inserta si no existe, actualiza password_hash si ya existe
      await pool.query(
        `INSERT INTO usuarios (nombre, email, password_hash, rol, estado, fecha_ingreso)
         VALUES (?, ?, ?, ?, 'Activo', CURDATE())
         ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
        [u.nombre, u.email, hash, u.rol]
      );
      console.log(`✓ ${u.rol.padEnd(14)} ${u.email}  →  clave: ${u.clave}`);
    }
    console.log('\n✅ Seed completado. Puedes iniciar sesión con las credenciales de arriba.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en seed:', err.message);
    process.exit(1);
  }
}

seed();
