// ============================================================
// RAG sobre la documentación del negocio.
//
// Ingesta: trocea los Markdown de docs/rag, calcula un hash para no
// duplicar documentos y guarda los fragmentos.
// Recuperación: búsqueda de texto completo en español (siempre) y
// búsqueda vectorial con pgvector cuando hay embeddings disponibles.
// ============================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { QueryTypes } = require('sequelize');

const sequelize = require('../db/database');
const {
  configurado: embeddingsConfigurados,
  generarEmbeddings,
  generarEmbeddingConsulta,
  aLiteralVector,
} = require('../lib/embeddings');

const DIRECTORIO_DOCS = path.join(__dirname, '..', 'docs', 'rag');
const TAMANO_FRAGMENTO = 900;
const SOLAPE = 120;

const hashTexto = (texto) =>
  crypto.createHash('sha256').update(texto, 'utf8').digest('hex');

const listarArchivos = () => {
  if (!fs.existsSync(DIRECTORIO_DOCS)) {
    return [];
  }

  return fs
    .readdirSync(DIRECTORIO_DOCS)
    .filter((archivo) => archivo.toLowerCase().endsWith('.md'))
    .sort();
};

const extraerTitulo = (contenido, archivo) => {
  const linea = contenido
    .split('\n')
    .find((item) => item.trim().startsWith('# '));

  return linea ? linea.replace(/^#\s+/, '').trim() : archivo;
};

// Trocea por párrafos, conserva un solape corto entre fragmentos para
// no perder el contexto de una frase que cae en el corte.
const trocear = (contenido) => {
  const bloques = contenido
    .split(/\n{2,}/)
    .map((bloque) => bloque.trim())
    .filter(Boolean);

  const fragmentos = [];
  let actual = '';

  for (const bloque of bloques) {
    const candidato = actual ? `${actual}\n\n${bloque}` : bloque;

    if (candidato.length > TAMANO_FRAGMENTO && actual) {
      fragmentos.push(actual.trim());
      actual = `${actual.slice(-SOLAPE)}\n\n${bloque}`;

      // Un bloque aislado más grande que el límite se parte por longitud.
      while (actual.length > TAMANO_FRAGMENTO) {
        fragmentos.push(actual.slice(0, TAMANO_FRAGMENTO).trim());
        actual = actual.slice(TAMANO_FRAGMENTO - SOLAPE);
      }
    } else {
      actual = candidato;
    }
  }

  if (actual.trim()) {
    fragmentos.push(actual.trim());
  }

  return fragmentos;
};

const ingestar = async () => {
  const archivos = listarArchivos();

  if (archivos.length === 0) {
    throw new Error(
      `No hay documentos Markdown en ${path.relative(process.cwd(), DIRECTORIO_DOCS)}`
    );
  }

  const resumen = [];

  for (const archivo of archivos) {
    const fuente = `docs/rag/${archivo}`;
    const contenido = fs.readFileSync(
      path.join(DIRECTORIO_DOCS, archivo),
      'utf8'
    );
    const hash = hashTexto(contenido);

    const existentes = await sequelize.query(
      'SELECT id_documento FROM documentos_rag WHERE hash = :hash LIMIT 1',
      { replacements: { hash }, type: QueryTypes.SELECT }
    );

    if (existentes.length > 0) {
      resumen.push({ archivo, estado: 'sin cambios', fragmentos: 0 });
      continue;
    }

    const titulo = extraerTitulo(contenido, archivo);
    const fragmentos = trocear(contenido);

    // Si el documento cambió, se reemplaza completo.
    await sequelize.query(
      'DELETE FROM documentos_rag WHERE fuente = :fuente',
      { replacements: { fuente }, type: QueryTypes.DELETE }
    );

    const [documento] = await sequelize.query(
      `INSERT INTO documentos_rag (titulo, fuente, categoria, contenido, hash)
       VALUES (:titulo, :fuente, :categoria, :contenido, :hash)
       RETURNING id_documento`,
      {
        replacements: {
          titulo,
          fuente,
          categoria: path.basename(archivo, '.md'),
          contenido,
          hash,
        },
        type: QueryTypes.SELECT,
      }
    );

    let embeddings = null;

    if (embeddingsConfigurados()) {
      embeddings = await generarEmbeddings(fragmentos);
    }

    for (let orden = 0; orden < fragmentos.length; orden += 1) {
      const vector = embeddings ? aLiteralVector(embeddings[orden]) : null;

      await sequelize.query(
        `INSERT INTO fragmentos_rag (id_documento, orden, contenido, embedding)
         VALUES (:idDocumento, :orden, :contenido, :embedding::vector)`,
        {
          replacements: {
            idDocumento: documento.id_documento,
            orden,
            contenido: fragmentos[orden],
            embedding: vector,
          },
          type: QueryTypes.INSERT,
        }
      );
    }

    resumen.push({
      archivo,
      estado: 'indexado',
      fragmentos: fragmentos.length,
      embeddings: Boolean(embeddings),
    });
  }

  return resumen;
};

const normalizarFilas = (filas) =>
  filas.map((fila) => ({
    id_fragmento: fila.id_fragmento,
    titulo: fila.titulo,
    fuente: fila.fuente,
    categoria: fila.categoria,
    contenido: fila.contenido,
    score: Number(fila.score || 0),
  }));

const buscarPorTexto = async (consulta, limite) => {
  const filas = await sequelize.query(
    `SELECT f.id_fragmento, f.contenido, d.titulo, d.fuente, d.categoria,
            ts_rank(f.busqueda, q) AS score
       FROM fragmentos_rag f
       JOIN documentos_rag d ON d.id_documento = f.id_documento,
            websearch_to_tsquery('spanish', :consulta) q
      WHERE f.busqueda @@ q
      ORDER BY score DESC
      LIMIT :limite`,
    {
      replacements: { consulta, limite: Number(limite) },
      type: QueryTypes.SELECT,
    }
  );

  return normalizarFilas(filas);
};

const buscarPorCoincidencia = async (consulta, limite) => {
  const palabras = consulta
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((palabra) => palabra.length > 3)
    .slice(0, 4);

  if (palabras.length === 0) {
    return [];
  }

  const condiciones = palabras.map(
    (_palabra, indice) => `f.contenido ILIKE :palabra${indice}`
  );
  const replacements = { limite: Number(limite) };

  palabras.forEach((palabra, indice) => {
    replacements[`palabra${indice}`] = `%${palabra}%`;
  });

  const filas = await sequelize.query(
    `SELECT f.id_fragmento, f.contenido, d.titulo, d.fuente, d.categoria,
            0 AS score
       FROM fragmentos_rag f
       JOIN documentos_rag d ON d.id_documento = f.id_documento
      WHERE ${condiciones.join(' OR ')}
      ORDER BY d.titulo, f.orden
      LIMIT :limite`,
    { replacements, type: QueryTypes.SELECT }
  );

  return normalizarFilas(filas);
};

const buscarPorVector = async (consulta, limite) => {
  const vector = await generarEmbeddingConsulta(consulta);

  if (!vector) {
    return [];
  }

  const filas = await sequelize.query(
    `SELECT f.id_fragmento, f.contenido, d.titulo, d.fuente, d.categoria,
            1 - (f.embedding <=> :embedding::vector) AS score
       FROM fragmentos_rag f
       JOIN documentos_rag d ON d.id_documento = f.id_documento
      WHERE f.embedding IS NOT NULL
      ORDER BY f.embedding <=> :embedding::vector
      LIMIT :limite`,
    {
      replacements: {
        embedding: aLiteralVector(vector),
        limite: Number(limite),
      },
      type: QueryTypes.SELECT,
    }
  );

  return normalizarFilas(filas);
};

const buscar = async (consulta, limite = 5) => {
  const texto = String(consulta || '').trim();

  if (!texto) {
    return [];
  }

  if (embeddingsConfigurados()) {
    const vectoriales = await buscarPorVector(texto, limite);

    if (vectoriales.length > 0) {
      return vectoriales;
    }
  }

  const porTexto = await buscarPorTexto(texto, limite);

  if (porTexto.length > 0) {
    return porTexto;
  }

  return buscarPorCoincidencia(texto, limite);
};

const formatearContexto = (fragmentos) =>
  fragmentos
    .map(
      (fragmento, indice) =>
        `[${indice + 1}] ${fragmento.titulo} (${fragmento.fuente})\n${fragmento.contenido}`
    )
    .join('\n\n');

const listarDocumentos = async () => {
  const filas = await sequelize.query(
    `SELECT d.id_documento, d.titulo, d.fuente, d.categoria, d.created_at,
            COUNT(f.id_fragmento)::int AS fragmentos,
            COUNT(f.embedding)::int AS con_embedding
       FROM documentos_rag d
       LEFT JOIN fragmentos_rag f ON f.id_documento = d.id_documento
      GROUP BY d.id_documento
      ORDER BY d.titulo`,
    { type: QueryTypes.SELECT }
  );

  return filas;
};

module.exports = {
  ingestar,
  buscar,
  formatearContexto,
  listarDocumentos,
};
