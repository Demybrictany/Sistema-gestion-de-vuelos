const Rol = require('../models/rol.model');

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

const obtenerRoles = async (req, res) => {
  try {
    const roles = await Rol.findAll({
      order: [['id_rol', 'ASC']],
    });

    return res.status(200).json(roles);
  } catch (error) {
    return responderError(res, 'Error al obtener los roles', error);
  }
};

const obtenerRolPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const rol = await Rol.findByPk(id);

    if (!rol) {
      return res.status(404).json({
        mensaje: 'Rol no encontrado',
      });
    }

    return res.status(200).json(rol);
  } catch (error) {
    return responderError(res, 'Error al obtener el rol', error);
  }
};

const crearRol = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre) {
      return res.status(400).json({
        mensaje: 'El nombre del rol es obligatorio',
      });
    }

    const nuevoRol = await Rol.create({
      nombre,
      descripcion,
    });

    return res.status(201).json({
      mensaje: 'Rol creado correctamente',
      rol: nuevoRol,
    });
  } catch (error) {
    return responderError(res, 'Error al crear el rol', error);
  }
};

const actualizarRol = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    const rol = await Rol.findByPk(id);

    if (!rol) {
      return res.status(404).json({
        mensaje: 'Rol no encontrado',
      });
    }

    const datosActualizar = limpiarCamposVacios({
      nombre,
      descripcion,
    });

    await rol.update(datosActualizar);

    return res.status(200).json({
      mensaje: 'Rol actualizado correctamente',
      rol,
    });
  } catch (error) {
    return responderError(res, 'Error al actualizar el rol', error);
  }
};

const eliminarRol = async (req, res) => {
  try {
    const { id } = req.params;
    const rol = await Rol.findByPk(id);

    if (!rol) {
      return res.status(404).json({
        mensaje: 'Rol no encontrado',
      });
    }

    await rol.destroy();

    return res.status(200).json({
      mensaje: 'Rol eliminado correctamente',
    });
  } catch (error) {
    return responderError(res, 'Error al eliminar el rol', error);
  }
};

module.exports = {
  obtenerRoles,
  obtenerRolPorId,
  crearRol,
  actualizarRol,
  eliminarRol,
};
