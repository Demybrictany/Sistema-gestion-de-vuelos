const asyncHandler = require('../lib/async-handler');

const {
  consultar,
  listarInteracciones,
  listarDocumentos,
  ingestar,
} = require('../services/agente.service');

const preguntar = asyncHandler(async (req, res) => {
  const resultado = await consultar({
    pregunta: req.body.pregunta,
    usuario: req.usuario,
    ip: req.ip,
  });

  res.status(200).json(resultado);
});

const interacciones = asyncHandler(async (req, res) => {
  const limite = Math.min(Number(req.query.limite) || 50, 200);
  const filas = await listarInteracciones(limite);

  res.status(200).json(filas);
});

const documentos = asyncHandler(async (req, res) => {
  const filas = await listarDocumentos();

  res.status(200).json({
    total: filas.length,
    documentos: filas,
  });
});

const indexar = asyncHandler(async (req, res) => {
  const resumen = await ingestar();

  res.status(200).json({
    mensaje: 'Documentación procesada.',
    resultados: resumen,
  });
});

module.exports = {
  preguntar,
  interacciones,
  documentos,
  indexar,
};
