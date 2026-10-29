const asyncHandler = require('../lib/async-handler');
const { obtenerPanel } = require('../services/panel.service');

const obtener = asyncHandler(async (req, res) => {
  const panel = await obtenerPanel();
  res.status(200).json(panel);
});

module.exports = { obtener };
