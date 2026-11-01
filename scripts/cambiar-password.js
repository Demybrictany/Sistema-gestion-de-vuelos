// ============================================================
// Cambia la contraseña de un usuario en la base configurada.
//
// Sirve para reemplazar las contraseñas del seed antes de publicar el
// sistema en producción:
//
//   npm run db:password -- admin "MiClaveSegura2026!"
//
// En PowerShell, como el argumento lleva caracteres especiales, conviene
// entrecomillarlo siempre.
// ============================================================

require('dotenv').config();

const bcrypt = require('bcryptjs');
const { QueryTypes } = require('sequelize');

const sequelize = require('../db/database');

const SALT_ROUNDS = 10;
const LONGITUD_MINIMA = 8;

const [nombreUsuario, password] = process.argv.slice(2);

const salir = (mensaje) => {
  console.error(mensaje);
  process.exitCode = 1;
};

const ejecutar = async () => {
  if (!nombreUsuario || !password) {
    salir('Uso: npm run db:password -- <usuario> <nueva-contraseña>');
    return;
  }

  if (password.length < LONGITUD_MINIMA) {
    salir(`La contraseña debe tener al menos ${LONGITUD_MINIMA} caracteres.`);
    return;
  }

  const usuarios = await sequelize.query(
    'SELECT id_usuario FROM usuarios WHERE nombre_usuario = :nombre LIMIT 1',
    {
      replacements: { nombre: nombreUsuario },
      type: QueryTypes.SELECT,
    }
  );

  if (usuarios.length === 0) {
    salir(`No existe el usuario "${nombreUsuario}".`);
    return;
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  await sequelize.query(
    `UPDATE usuarios
        SET password_hash = :password_hash,
            updated_at = now()
      WHERE id_usuario = :id_usuario`,
    {
      replacements: { password_hash, id_usuario: usuarios[0].id_usuario },
      type: QueryTypes.UPDATE,
    }
  );

  console.log(`Contraseña actualizada para "${nombreUsuario}".`);
};

ejecutar()
  .catch((error) => {
    console.error('No se pudo cambiar la contraseña:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
