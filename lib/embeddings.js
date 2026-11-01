// ============================================================
// Embeddings opcionales para el RAG.
//
// Si VOYAGE_API_KEY está definida se generan vectores con Voyage AI
// (modelo voyage-3, 1024 dimensiones, igual que la columna de la BD).
// Si no, el RAG usa búsqueda de texto completo de PostgreSQL.
// ============================================================

const DIMENSION = 1024;

const configurado = () => Boolean(process.env.VOYAGE_API_KEY);

const generarEmbeddings = async (textos) => {
  if (!configurado() || !Array.isArray(textos) || textos.length === 0) {
    return null;
  }

  const respuesta = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.VOYAGE_MODEL || 'voyage-3',
      input: textos,
      input_type: 'document',
    }),
  });

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => '');
    throw new Error(
      `Voyage AI respondió ${respuesta.status}: ${detalle.slice(0, 200)}`
    );
  }

  const datos = await respuesta.json();
  return datos.data.map((item) => item.embedding);
};

const generarEmbeddingConsulta = async (texto) => {
  const vectores = await generarEmbeddings([texto]);
  return vectores ? vectores[0] : null;
};

const aLiteralVector = (vector) => `[${vector.join(',')}]`;

module.exports = {
  DIMENSION,
  configurado,
  generarEmbeddings,
  generarEmbeddingConsulta,
  aLiteralVector,
};
