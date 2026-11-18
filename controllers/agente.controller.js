
const asyncHandler = require('../lib/async-handler');

const {
  consultar,
  consultarStreaming,
  listarInteracciones,
  listarDocumentos,
  ingestar,
} = require('../services/agente.service');

// Consulta normal
const preguntar = asyncHandler(async (req, res) => {
  const resultado = await consultar({
    pregunta: req.body.pregunta,
    usuario: req.usuario,
    ip: req.ip,
  });

  res.status(200).json(resultado);
});

// Consulta con streaming SSE
const preguntarStreaming = async (req, res) => {
  res.status(200);
  res.set({
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  res.flushHeaders();

  const enviarEvento = (evento, datos) => {
    if (res.destroyed || res.writableEnded) return;

    res.write(
      `event: ${evento}\ndata: ${JSON.stringify(datos)}\n\n`
    );
  };

  try {
    enviarEvento('inicio', {
      mensaje: 'Iniciando respuesta del agente.',
    });

    const resultado = await consultarStreaming({
      pregunta: req.body.pregunta,
      usuario: req.usuario,
      ip: req.ip,
      onFragmento: (texto) => {
        enviarEvento('fragmento', { texto });
      },
    });

    enviarEvento('final', resultado);
  } catch (error) {
    console.error('[agente] Error de streaming:', error.message);

    enviarEvento('error', {
      mensaje: 'No se pudo completar la respuesta del agente.',
    });
  } finally {
    if (!res.writableEnded) {
      res.end();
    }
  }
};

// Historial de interacciones
const interacciones = asyncHandler(async (req, res) => {
  const limite = Math.min(Number(req.query.limite) || 50, 200);
  const filas = await listarInteracciones(limite);

  res.status(200).json(filas);
});

// Documentos RAG
const documentos = asyncHandler(async (req, res) => {
  const filas = await listarDocumentos();

  res.status(200).json({
    total: filas.length,
    documentos: filas,
  });
});

// Indexar documentación
const indexar = asyncHandler(async (req, res) => {
  const resumen = await ingestar();

  res.status(200).json({
    mensaje: 'Documentación procesada.',
    resultados: resumen,
  });
});

module.exports = {
  preguntar,
  preguntarStreaming,
  interacciones,
  documentos,
  indexar,
};
