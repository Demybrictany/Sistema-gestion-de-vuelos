const asyncHandler = require('../lib/async-handler');
const { ErrorConEstado } = require('../lib/errores');
const {
  listarReportes,
  obtenerReporte,
} = require('../services/reportes.service');
const { crearExcel } = require('../lib/exportar/excel');
const { crearPdf } = require('../lib/exportar/pdf');

const FORMATOS = ['excel', 'pdf'];

const listar = asyncHandler(async (req, res) => {
  const reportes = listarReportes();

  res.status(200).json({
    total: reportes.length,
    reportes,
  });
});

const obtener = asyncHandler(async (req, res) => {
  const reporte = await obtenerReporte(req.params.clave, req.filtros || {});
  res.status(200).json(reporte);
});

const exportar = asyncHandler(async (req, res) => {
  const formato = String(req.query.formato || '').toLowerCase();

  if (!FORMATOS.includes(formato)) {
    throw new ErrorConEstado(
      400,
      'Formato inválido. Usa ?formato=excel o ?formato=pdf'
    );
  }

  const reporte = await obtenerReporte(req.params.clave, req.filtros || {});
  const extension = formato === 'excel' ? 'xlsx' : 'pdf';
  const fecha = new Date().toISOString().slice(0, 10);
  const nombre = `reporte-${reporte.clave}-${fecha}.${extension}`;

  res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`);

  if (formato === 'excel') {
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    await crearExcel(reporte, res);
    res.end();
    return;
  }

  res.setHeader('Content-Type', 'application/pdf');
  await crearPdf(reporte, res);
});

module.exports = {
  listar,
  obtener,
  exportar,
};
