const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const Usuario = require('../models/usuario.model');
const Rol = require('../models/rol.model');

const INCLUDE_ROL = {
  model: Rol,
  as: 'rol',
  attributes: ['id_rol', 'nombre'],
};

const buildSafeUser = (usuario) => ({
  id_usuario: usuario.id_usuario,
  nombre_usuario: usuario.nombre_usuario,
  nombres: usuario.nombres,
  apellidos: usuario.apellidos,
  correo: usuario.correo,
  telefono: usuario.telefono,
  estado: usuario.estado,
  ultimo_acceso: usuario.ultimo_acceso,
  rol: usuario.rol
    ? {
        id_rol: usuario.rol.id_rol,
        nombre: usuario.rol.nombre,
      }
    : null,
});

const login = async (req, res) => {
  try {
    const { nombre_usuario, usuarioOCorreo, password } = req.body;
    const identifier = nombre_usuario || usuarioOCorreo;

    if (!identifier || !password) {
      return res.status(400).json({
        mensaje: 'Usuario y contrasena son obligatorios',
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        mensaje: 'Configuracion de autenticacion incompleta',
      });
    }

    const usuario = await Usuario.findOne({
      where: {
        [Op.or]: [
          { nombre_usuario: identifier },
          { correo: identifier },
        ],
      },
      include: [INCLUDE_ROL],
    });

    if (!usuario) {
      return res.status(401).json({
        mensaje: 'Credenciales incorrectas',
      });
    }

    if (usuario.estado !== 'ACTIVO') {
      return res.status(403).json({
        mensaje: 'El usuario no se encuentra activo',
      });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password_hash);

    if (!passwordValida) {
      return res.status(401).json({
        mensaje: 'Credenciales incorrectas',
      });
    }

    const ultimoAcceso = new Date();
    await usuario.update({ ultimo_acceso: ultimoAcceso });
    usuario.ultimo_acceso = ultimoAcceso;

    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        nombre_usuario: usuario.nombre_usuario,
        id_rol: usuario.id_rol,
        rol: usuario.rol?.nombre,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.status(200).json({
      token,
      usuario: buildSafeUser(usuario),
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error al iniciar sesion',
    });
  }
};

const me = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id_usuario, {
      include: [INCLUDE_ROL],
    });

    if (!usuario || usuario.estado !== 'ACTIVO') {
      return res.status(401).json({
        mensaje: 'Sesion invalida',
      });
    }

    return res.status(200).json({
      usuario: buildSafeUser(usuario),
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error al verificar la sesion',
    });
  }
};

module.exports = {
  login,
  me,
};
