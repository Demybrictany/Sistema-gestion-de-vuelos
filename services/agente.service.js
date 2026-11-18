
'use strict';

// ============================================================
// Servicio del agente de IA.
// Gestiona RAG, respuestas normales, streaming,
// registro de interacciones y auditoría.
// ============================================================

const { QueryTypes } = require('sequelize');

const sequelize = require('../db/database');

const {
  buscar,
  formatearContexto,
  listarDocumentos,
  ingestar,
} = require('./rag.service');

const {
  responder,
  transmitirConClaude,
  claudeConfigurado,
} = require('../lib/agente.proveedor');

const { registrarAuditoria } = require('./auditoria.service');

// ============================================================
// FUENTES RAG
// ============================================================

const fuentesParaLog = (fragmentos) =>
  fragmentos.map((fragmento, indice) => ({
    cita: indice + 1,
    titulo: fragmento.titulo,
    fuente: fragmento.fuente,
    categoria: fragmento.categoria,
    score: Number(fragmento.score?.toFixed?.(4) ?? 0),
  }));

// ============================================================
// REGISTRO DE INTERACCIONES Y AUDITORÍA
// ============================================================

const guardarInteraccion = async ({
  pregunta,
  usuario,
  ip,
  resultado,
  fuentes,
  inicio,
  estado = 'OK',
  error = null,
}) => {
  const latenciaMs = Date.now() - inicio;

  const [interaccion] = await sequelize.query(
    `INSERT INTO interacciones_agente
       (
         id_usuario,
         pregunta,
         respuesta,
         fuentes,
         modelo,
         proveedor,
         tokens_prompt,
         tokens_respuesta,
         latencia_ms,
         estado,
         error,
         direccion_ip
       )
     VALUES
       (
         :idUsuario,
         :pregunta,
         :respuesta,
         CAST(:fuentes AS jsonb),
         :modelo,
         :proveedor,
         :tokensPrompt,
         :tokensRespuesta,
         :latenciaMs,
         :estado,
         :error,
         :ip
       )
     RETURNING id_interaccion`,
    {
      replacements: {
        idUsuario: usuario?.id_usuario || null,
        pregunta,
        respuesta: resultado.respuesta || null,
        fuentes: JSON.stringify(fuentes),
        modelo: resultado.modelo || null,
        proveedor: resultado.proveedor || null,
        tokensPrompt: resultado.tokens?.prompt || 0,
        tokensRespuesta: resultado.tokens?.respuesta || 0,
        latenciaMs,
        estado,
        error,
        ip: ip || null,
      },
      type: QueryTypes.SELECT,
    }
  );

  try {
    await registrarAuditoria({
      idUsuario: usuario?.id_usuario || null,
      accion: 'CONSULTA_AGENTE',
      tabla: 'interacciones_agente',
      idRegistro: interaccion.id_interaccion,
      descripcion:
        `Consulta al agente: ${String(pregunta).slice(0, 180)}`,
      ip,
    });
  } catch (falloAuditoria) {
    console.warn(
      '[agente] No se pudo registrar la auditoría:',
      falloAuditoria.message
    );
  }

  return {
    id_interaccion: Number(interaccion.id_interaccion),
    respuesta: resultado.respuesta,
    fuentes,
    modelo: resultado.modelo,
    proveedor: resultado.proveedor,
    tokens: resultado.tokens,
    latencia_ms: latenciaMs,
    estado,
    aviso: resultado.aviso,
  };
};

// ============================================================
// CONSULTA NORMAL
// Conserva el funcionamiento anterior.
// ============================================================

const consultar = async ({ pregunta, usuario, ip }) => {
  const inicio = Date.now();

  const fragmentos = await buscar(pregunta, 5);
  const contexto = formatearContexto(fragmentos);

  let resultado;
  let estado = 'OK';
  let error = null;

  try {
    resultado = await responder({
      pregunta,
      contexto,
      fragmentos,
      usuario,
    });

    estado = resultado.estado || 'OK';
  } catch (fallo) {
    estado = 'ERROR';
    error = fallo.message;

    resultado = {
      respuesta:
        'No pude procesar la consulta en este momento. ' +
        'Intenta de nuevo o consulta al personal.',
      modelo: null,
      proveedor: null,
      tokens: {
        prompt: 0,
        respuesta: 0,
      },
    };
  }

  const fuentes = fuentesParaLog(fragmentos);

  return guardarInteraccion({
    pregunta,
    usuario,
    ip,
    resultado,
    fuentes,
    inicio,
    estado,
    error,
  });
};

// ============================================================
// CONSULTA STREAMING
// Envía fragmentos conforme Claude genera la respuesta.
// ============================================================

const consultarStreaming = async ({
  pregunta,
  usuario,
  ip,
  onFragmento,
}) => {
  const inicio = Date.now();

  if (!claudeConfigurado()) {
    throw new Error(
      'El streaming requiere que Claude esté configurado.'
    );
  }

  const fragmentos = await buscar(pregunta, 5);
  const contexto = formatearContexto(fragmentos);
  const fuentes = fuentesParaLog(fragmentos);

  let resultado;
  let estado = 'OK';
  let error = null;

  try {
    resultado = await transmitirConClaude({
      pregunta,
      contexto,
      usuario,
      onFragmento,
    });

    estado = resultado.estado || 'OK';
  } catch (fallo) {
    estado = 'ERROR';
    error = fallo.message;

    resultado = {
      respuesta: null,
      modelo: null,
      proveedor: 'claude',
      tokens: {
        prompt: 0,
        respuesta: 0,
      },
    };
  }

  const registro = await guardarInteraccion({
    pregunta,
    usuario,
    ip,
    resultado,
    fuentes,
    inicio,
    estado,
    error,
  });

  if (estado === 'ERROR') {
    const fallo = new Error(
      'No se pudo completar la respuesta en streaming.'
    );

    fallo.id_interaccion = registro.id_interaccion;

    throw fallo;
  }

  return registro;
};

// ============================================================
// HISTORIAL DE INTERACCIONES
// ============================================================

const listarInteracciones = async (limite = 50) => {
  return sequelize.query(
    `SELECT
        i.id_interaccion,
        i.id_usuario,
        u.nombre_usuario,
        u.id_rol,
        i.pregunta,
        i.respuesta,
        i.fuentes,
        i.modelo,
        i.proveedor,
        i.tokens_prompt,
        i.tokens_respuesta,
        i.latencia_ms,
        i.estado,
        i.error,
        i.direccion_ip,
        i.created_at
     FROM interacciones_agente i
     LEFT JOIN usuarios u
       ON u.id_usuario = i.id_usuario
     ORDER BY i.created_at DESC
     LIMIT :limite`,
    {
      replacements: {
        limite: Number(limite),
      },
      type: QueryTypes.SELECT,
    }
  );
};

// ============================================================
// EXPORTACIONES
// ============================================================

module.exports = {
  consultar,
  consultarStreaming,
  listarInteracciones,
  listarDocumentos,
  ingestar,
};
