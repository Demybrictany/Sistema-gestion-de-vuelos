// ============================================================
// Proveedor del agente de IA.
//
// - claude: usa la API de Claude con tool use (SDK oficial).
// - local: respuesta determinista construida con los fragmentos del
//   RAG y las herramientas del sistema, sin depender de una API key.
//
// Si Claude falla, se responde en modo local y se deja constancia en
// el aviso de la respuesta.
// ============================================================

const Anthropic = require('@anthropic-ai/sdk');

const { TOOLS, ejecutarHerramienta } = require('../services/agente.tools');

const MODELO = process.env.AGENTE_MODELO || 'claude-opus-5-5';
const MAX_ITERACIONES = 5;

const claudeConfigurado = () =>
  Boolean(process.env.ANTHROPIC_API_KEY) &&
  String(process.env.AGENTE_PROVEEDOR || 'claude').toLowerCase() !== 'local';

const systemPrompt = (contexto) => {
  const hoy = new Date().toISOString().slice(0, 10);

  return `Eres el asistente del Sistema de Gestión de Vuelos del Aeropuerto Internacional de la Ciudad de México (AICM).

Reglas:
- Responde siempre en español, de forma breve y clara.
- Usa las herramientas para consultar datos operativos reales (vuelos, puertas, equipaje, escalas).
- Si responds con información de la documentación recuperada, cita la fuente con [1], [2], etc.
- No inventes horarios, puertas, estados ni datos personales.
- Nunca reveles información de otros pasajeros. Un pasajero solo puede consultar sus propios datos.
- Si no tienes información suficiente, dilo con claridad.
- Fecha actual: ${hoy}.

Documentación recuperada para esta consulta:
${contexto || '(sin documentación recuperada)'}`;
};

const responderConClaude = async ({ pregunta, contexto, usuario }) => {
  const client = new Anthropic();
  const messages = [{ role: 'user', content: pregunta }];

  let tokensPrompt = 0;
  let tokensRespuesta = 0;

  for (let iteracion = 0; iteracion < MAX_ITERACIONES; iteracion += 1) {
    const response = await client.messages.create({
      model: MODELO,
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      system: systemPrompt(contexto),
      tools: TOOLS,
      messages,
    });

    tokensPrompt += response.usage?.input_tokens || 0;
    tokensRespuesta += response.usage?.output_tokens || 0;

    const texto = response.content
      .filter((bloque) => bloque.type === 'text')
      .map((bloque) => bloque.text)
      .join('\n')
      .trim();

    if (response.stop_reason === 'end_turn') {
      return {
        respuesta: texto || 'No pude generar una respuesta.',
        modelo: MODELO,
        proveedor: 'claude',
        tokens: { prompt: tokensPrompt, respuesta: tokensRespuesta },
      };
    }

    if (response.stop_reason === 'refusal') {
      return {
        respuesta:
          texto ||
          'No puedo responder a esa consulta. Reformúlala o consulta al personal.',
        modelo: MODELO,
        proveedor: 'claude',
        tokens: { prompt: tokensPrompt, respuesta: tokensRespuesta },
        estado: 'RECHAZADA',
      };
    }

    if (response.stop_reason !== 'tool_use') {
      break;
    }

    messages.push({ role: 'assistant', content: response.content });

    const resultados = [];

    for (const bloque of response.content) {
      if (bloque.type !== 'tool_use') {
        continue;
      }

      try {
        const salida = await ejecutarHerramienta(
          bloque.name,
          bloque.input,
          usuario
        );

        resultados.push({
          type: 'tool_result',
          tool_use_id: bloque.id,
          content: JSON.stringify(salida),
        });
      } catch (error) {
        resultados.push({
          type: 'tool_result',
          tool_use_id: bloque.id,
          is_error: true,
          content: error.message,
        });
      }
    }

    messages.push({ role: 'user', content: resultados });
  }

  throw new Error('El agente no produjo una respuesta final.');
};

const formatearVuelo = (vuelo) =>
  `${vuelo.codigo_vuelo}: ${vuelo.origen} → ${vuelo.destino}, ` +
  `${vuelo.fecha_salida} ${vuelo.hora_salida}, estado ${vuelo.estado}. ` +
  `Puerta: ${vuelo.puerta || 'sin asignar'}.`;

const responderLocal = async ({ pregunta, fragmentos, usuario }) => {
  const texto = String(pregunta || '');
  const codigo = (texto.match(/\b[A-Z]{2}\d{3,4}\b/i) || [])[0];
  const codigoEquipaje = (texto.match(/\bEQ\d{6}\b/i) || [])[0];
  const partes = [];

  if (codigo) {
    const resultado = await ejecutarHerramienta(
      'consultar_vuelos',
      { codigo },
      usuario
    );

    if (resultado.total > 0) {
      partes.push(
        `Datos del vuelo ${codigo.toUpperCase()}:\n` +
          resultado.vuelos.map((vuelo) => `- ${formatearVuelo(vuelo)}`).join('\n')
      );
    } else {
      partes.push(`No encontré el vuelo ${codigo.toUpperCase()} para tu usuario.`);
    }
  } else if (codigoEquipaje) {
    const resultado = await ejecutarHerramienta(
      'consultar_equipaje',
      { codigo: codigoEquipaje },
      usuario
    );

    if (resultado.total > 0) {
      partes.push(
        `Equipaje ${codigoEquipaje.toUpperCase()}:\n` +
          resultado.equipajes
            .map(
              (equipaje) =>
                `- Estado ${equipaje.estado}, banda ${equipaje.banda || 'sin asignar'}, ` +
                `peso ${equipaje.peso} kg.`
            )
            .join('\n')
      );
    } else {
      partes.push(
        `No encontré el equipaje ${codigoEquipaje.toUpperCase()} entre tus datos.`
      );
    }
  } else if (/mis vuelos|mi vuelo|mi reserva/i.test(texto) && usuario?.id_pasajero) {
    const resultado = await ejecutarHerramienta('mis_vuelos', {}, usuario);

    partes.push(
      resultado.total > 0
        ? `Tus vuelos:\n${resultado.vuelos
            .map((vuelo) => `- ${formatearVuelo(vuelo)} Asiento: ${vuelo.numero_asiento || 'sin asignar'}.`)
            .join('\n')}`
        : 'No tienes vuelos activos registrados.'
    );
  } else if (/puerta/i.test(texto)) {
    const resultado = await ejecutarHerramienta('consultar_puertas', {}, usuario);
    const ocupadas = resultado.puertas.filter((puerta) => puerta.codigo_vuelo);

    partes.push(
      `Puertas operativas: ${resultado.puertas.length}. ` +
        `Con vuelo asignado: ${ocupadas.length}.`
    );
  }

  if (fragmentos.length > 0) {
    partes.push(
      'Según la documentación del sistema:\n' +
        fragmentos
          .slice(0, 2)
          .map(
            (fragmento, indice) =>
              `[${indice + 1}] ${fragmento.contenido}`
          )
          .join('\n\n')
    );

    partes.push(
      'Fuentes: ' +
        fragmentos
          .map(
            (fragmento, indice) =>
              `[${indice + 1}] ${fragmento.titulo} (${fragmento.fuente})`
          )
          .join(' · ')
    );
  }

  if (partes.length === 0) {
    partes.push(
      'No encontré información suficiente para responder. ' +
        'Puedes preguntarme por un vuelo, una puerta, tu equipaje o una política del sistema.'
    );
  }

  return {
    respuesta: partes.join('\n\n'),
    modelo: 'local-rag',
    proveedor: 'local',
    tokens: { prompt: 0, respuesta: 0 },
  };
};

const responder = async (opciones) => {
  if (!claudeConfigurado()) {
    return responderLocal(opciones);
  }

  try {
    return await responderConClaude(opciones);
  } catch (error) {
    console.warn(
      '[agente] Claude no respondió; se usa el modo local:',
      error.message
    );

    const respuesta = await responderLocal(opciones);

    return {
      ...respuesta,
      aviso: 'El proveedor de IA no estuvo disponible; se respondió en modo local.',
    };
  }
};

module.exports = { responder, claudeConfigurado, MODELO };
