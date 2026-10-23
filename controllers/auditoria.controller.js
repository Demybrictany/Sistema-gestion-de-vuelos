const Auditoria = require('../models/auditoria.model');
const Usuario = require('../models/usuario.model');

// Obtener todos los registros de auditoría
const obtenerAuditorias = async (req, res) => {
  try {
    const auditorias = await Auditoria.findAll({
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: {
            exclude: ['password_hash'],
          },
        },
      ],
      order: [['fecha_hora', 'DESC']],
    });

    res.status(200).json(auditorias);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener los registros de auditoría',
      error: error.message,
    });
  }
};

// Obtener auditoría por ID
const obtenerAuditoriaPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const auditoria = await Auditoria.findByPk(id, {
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: {
            exclude: ['password_hash'],
          },
        },
      ],
    });

    if (!auditoria) {
      return res.status(404).json({
        mensaje: 'Registro de auditoría no encontrado',
      });
    }

    res.status(200).json(auditoria);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener el registro de auditoría',
      error: error.message,
    });
  }
};

// Obtener auditorías de un usuario
const obtenerAuditoriasPorUsuario = async (req, res) => {
  try {
    const { idUsuario } = req.params;

    const auditorias = await Auditoria.findAll({
      where: {
        id_usuario: idUsuario,
      },
      order: [['fecha_hora', 'DESC']],
    });

    res.status(200).json(auditorias);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener la auditoría del usuario',
      error: error.message,
    });
  }
};

// Crear registro de auditoría
const crearAuditoria = async (req, res) => {
  try {
    const {
      id_usuario,
      accion,
      tabla_afectada,
      id_registro,
      descripcion,
    } = req.body;

    if (!accion || !tabla_afectada) {
      return res.status(400).json({
        mensaje: 'La acción y la tabla afectada son obligatorias',
      });
    }

    if (id_usuario) {
      const usuario = await Usuario.findByPk(id_usuario);

      if (!usuario) {
        return res.status(400).json({
          mensaje: 'El usuario no existe',
        });
      }
    }

    const nuevaAuditoria = await Auditoria.create({
      id_usuario,
      accion,
      tabla_afectada,
      id_registro,
      descripcion,
      direccion_ip: req.ip,
    });

    res.status(201).json({
      mensaje: 'Registro de auditoría creado correctamente',
      auditoria: nuevaAuditoria,
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al crear el registro de auditoría',
      error: error.message,
    });
  }
};

// Eliminar registro de auditoría
const eliminarAuditoria = async (req, res) => {
  try {
    const { id } = req.params;

    const auditoria = await Auditoria.findByPk(id);

    if (!auditoria) {
      return res.status(404).json({
        mensaje: 'Registro de auditoría no encontrado',
      });
    }

    await auditoria.destroy();

    res.status(200).json({
      mensaje: 'Registro de auditoría eliminado correctamente',
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al eliminar el registro de auditoría',
      error: error.message,
    });
  }
};

module.exports = {
  obtenerAuditorias,
  obtenerAuditoriaPorId,
  obtenerAuditoriasPorUsuario,
  crearAuditoria,
  eliminarAuditoria,
};
