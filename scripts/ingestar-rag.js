// ============================================================
// Ingesta del corpus RAG desde docs/rag/.
//
// Uso: npm run rag:ingestar
// Es idempotente: si el documento no cambió, no lo vuelve a indexar.
// ============================================================

require('dotenv').config();

const sequelize = require('../db/database');
const { ingestar } = require('../services/rag.service');

const ejecutar = async () => {
  const resumen = await ingestar();

  console.log('Ingesta de documentación terminada:');
  resumen.forEach((item) => {
    console.log(
      ` - ${item.archivo}: ${item.estado}` +
        (item.fragmentos ? ` (${item.fragmentos} fragmentos)` : '')
    );
  });
};

ejecutar()
  .catch((error) => {
    console.error('Error al ingestar la documentación:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
