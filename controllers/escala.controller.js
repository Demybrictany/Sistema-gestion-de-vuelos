const asyncHandler = require('../lib/async-handler');

const {
  obtenerEscalas: listarEscalas,
  obtenerEscalaPorId: buscarEscala,
  crearEscala: registrarEscala,
  actualizarEscala: modificarEscala,
  eliminarEscala: borrarEscala,
} = require('../services/escala.service');

const obtenerEscalas = asyncHandler(async (req, res) => {
  res.status(200).json(await listarEscalas());
});

const obtenerEscalaPorId = asyncHandler(async (req, res) => {
  res.status(200).json(await buscarEscala(req.params.id));
});

const crearEscala = asyncHandler(async (req, res) => {
  const escala = await registrarEscala({ datos: req.body });

  res.status(201).json({
    mensaje: 'Escala creada correctamente',
    escala,
  });
});

const actualizarEscala = asyncHandler(async (req, res) => {
  const escala = await modificarEscala({
    id: req.params.id,
    datos: req.body,
  });

  res.status(200).json({
    mensaje: 'Escala actualizada correctamente',
    escala,
  });
});

const eliminarEscala = asyncHandler(async (req, res) => {
  await borrarEscala(req.params.id);

  res.status(200).json({
    mensaje: 'Escala eliminada correctamente',
  });
});

module.exports = {
  obtenerEscalas,
  obtenerEscalaPorId,
  crearEscala,
  actualizarEscala,
  eliminarEscala,
};
