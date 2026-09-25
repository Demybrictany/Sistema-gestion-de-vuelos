const bcrypt = require('bcryptjs');
const Usuario = require('../models/usuario.model');
const Rol = require('../models/rol.model');

const SALT_ROUNDS = 10;
const CAMPOS_USUARIO_SEGUROS = { exclude: ['password_hash'] };
const INCLUDE_ROL = {
  model: Rol,
  as: 'rol',
  attributes: ['id_rol', 'nombre'],
};

const responderError = (res, mensaje, error) => {
  return res.status(500).json({
    mensaje,
    error: error.message,
  });
};

const limpiarCamposVacios = (datos) => {
  return Object.fromEntries(
    Object.entries(datos).filter(([, valor]) => valor !== undefined)
  );
};

const validarRol = async (idRol) => {
  if (!idRol) return true;

  const rol = await Rol.findByPk(idRol);
  return Boolean(rol);
};

const quitarPassword = (usuario) => {
  const usuarioSeguro = usuario.toJSON();
  delete usuarioSeguro.password_hash;
  return usuarioSeguro;
};

const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: CAMPOS_USUARIO_SEGUROS,
      include: [INCLUDE_ROL],
      order: [['id_usuario', 'ASC']],
    });

    return res.status(200).json(usuarios);
  } catch (error) {
    return responderError(res, 'Error al obtener los usuarios', error);
  }
};

const obtenerUsuarioPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findByPk(id, {
      attributes: CAMPOS_USUARIO_SEGUROS,
      include: [INCLUDE_ROL],
    });

    if (!usuario) {
      return res.status(404).json({
        mensaje: 'Usuario no encontrado',
      });
    }

    return res.status(200).json(usuario);
  } catch (error) {
    return responderError(res, 'Error al obtener el usuario', error);
  }
};

const crearUsuario = async (req, res) => {
  try {
    const {
      id_rol,
      nombre_usuario,
      password,
      nombres,
      apellidos,
      correo,
      telefono,
    } = req.body;

    const camposObligatorios = [
      id_rol,
      nombre_usuario,
      password,
      nombres,
      apellidos,
    ];

    if (camposObligatorios.some((campo) => !campo)) {
      return res.status(400).json({
        mensaje:
          'Rol, nombre de usuario, contrasena, nombres y apellidos son obligatorios',
      });
    }

    const rolExiste = await validarRol(id_rol);
    if (!rolExiste) {
      return res.status(400).json({
        mensaje: 'El rol seleccionado no existe',
      });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const nuevoUsuario = await Usuario.create({
      id_rol,
      nombre_usuario,
      password_hash,
      nombres,
      apellidos,
      correo,
      telefono,
    });

    return res.status(201).json({
      mensaje: 'Usuario creado correctamente',
      usuario: quitarPassword(nuevoUsuario),
    });
  } catch (error) {
    return responderError(res, 'Error al crear el usuario', error);
  }
};

const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      id_rol,
      nombre_usuario,
      password,
      nombres,
      apellidos,
      correo,
      telefono,
      estado,
    } = req.body;

    const usuario = await Usuario.findByPk(id);

    if (!usuario) {
      return res.status(404).json({
        mensaje: 'Usuario no encontrado',
      });
    }

    const rolExiste = await validarRol(id_rol);
    if (!rolExiste) {
      return res.status(400).json({
        mensaje: 'El rol seleccionado no existe',
      });
    }

    const datosActualizar = limpiarCamposVacios({
      id_rol,
      nombre_usuario,
      nombres,
      apellidos,
      correo,
      telefono,
      estado,
    });

    if (password) {
      datosActualizar.password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    }

    await usuario.update(datosActualizar);

    return res.status(200).json({
      mensaje: 'Usuario actualizado correctamente',
      usuario: quitarPassword(usuario),
    });
  } catch (error) {
    return responderError(res, 'Error al actualizar el usuario', error);
  }
};

const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findByPk(id);

    if (!usuario) {
      return res.status(404).json({
        mensaje: 'Usuario no encontrado',
      });
    }

    await usuario.destroy();

    return res.status(200).json({
      mensaje: 'Usuario eliminado correctamente',
    });
  } catch (error) {
    return responderError(res, 'Error al eliminar el usuario', error);
  }
};

module.exports = {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
};
