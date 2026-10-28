const ExcelJS = require('exceljs');

const AZUL = 'FF1F4E79';
const AZUL_CLARO = 'FFDBE7F3';
const GRIS_CLARO = 'FFF2F7FB';
const BORDE = {
  top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
  left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
  bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
  right: { style: 'thin', color: { argb: 'FFD9D9D9' } },
};

const FILA_TITULO = 1;
const FILA_DESCRIPCION = 2;
const FILA_META = 3;
const FILA_FILTROS = 4;
const FILA_ENCABEZADO = 6;

const formatearFiltros = (filtros) => {
  const entradas = Object.entries(filtros || {});

  if (!entradas.length) {
    return 'Sin filtros';
  }

  return entradas.map(([clave, valor]) => `${clave}: ${valor}`).join(' · ');
};

const esNumero = (valor) =>
  valor !== null &&
  valor !== undefined &&
  valor !== '' &&
  !Number.isNaN(Number(valor));

const crearExcel = async (reporte, stream) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema de Gestión de Vuelos - AICM';
  workbook.created = new Date();

  const hoja = workbook.addWorksheet('Reporte', {
    views: [{ state: 'frozen', ySplit: FILA_ENCABEZADO }],
  });

  const columnas = reporte.columnas;
  const ultimaColumna = columnas.length;

  hoja.columns = columnas.map((columna) => ({
    key: columna.clave,
    width: Math.min(42, Math.max(14, columna.titulo.length + 6)),
  }));

  hoja.mergeCells(FILA_TITULO, 1, FILA_TITULO, ultimaColumna);
  const titulo = hoja.getCell(FILA_TITULO, 1);
  titulo.value = reporte.titulo;
  titulo.font = { bold: true, size: 16, color: { argb: AZUL } };
  hoja.getRow(FILA_TITULO).height = 26;

  hoja.mergeCells(FILA_DESCRIPCION, 1, FILA_DESCRIPCION, ultimaColumna);
  const descripcion = hoja.getCell(FILA_DESCRIPCION, 1);
  descripcion.value = reporte.descripcion;
  descripcion.font = { italic: true, size: 10, color: { argb: 'FF555555' } };

  hoja.mergeCells(FILA_META, 1, FILA_META, ultimaColumna);
  hoja.getCell(FILA_META, 1).value =
    `Generado: ${new Date(reporte.generado_en).toLocaleString('es-GT')} · ` +
    `Registros: ${reporte.total_registros}`;
  hoja.getCell(FILA_META, 1).font = { size: 9, color: { argb: 'FF666666' } };

  hoja.mergeCells(FILA_FILTROS, 1, FILA_FILTROS, ultimaColumna);
  hoja.getCell(FILA_FILTROS, 1).value =
    `Filtros: ${formatearFiltros(reporte.filtros)}`;
  hoja.getCell(FILA_FILTROS, 1).font = { size: 9, color: { argb: 'FF666666' } };

  const encabezado = hoja.getRow(FILA_ENCABEZADO);
  encabezado.height = 22;

  columnas.forEach((columna, indice) => {
    const celda = encabezado.getCell(indice + 1);
    celda.value = columna.titulo;
    celda.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    celda.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: AZUL },
    };
    celda.alignment = {
      vertical: 'middle',
      horizontal: columna.tipo === 'numero' ? 'right' : 'center',
      wrapText: true,
    };
    celda.border = BORDE;
  });

  let filaActual = FILA_ENCABEZADO + 1;

  reporte.filas.forEach((fila, indice) => {
    const excelRow = hoja.getRow(filaActual);

    columnas.forEach((columna, columnaIndice) => {
      const celda = excelRow.getCell(columnaIndice + 1);
      const valor = fila[columna.clave];

      if (columna.tipo === 'numero' && esNumero(valor)) {
        const numero = Number(valor);
        celda.value = numero;
        celda.numFmt = Number.isInteger(numero) ? '#,##0' : '#,##0.00';
        celda.alignment = { horizontal: 'right' };
      } else {
        celda.value = valor === null || valor === undefined ? '' : String(valor);
        celda.alignment = { horizontal: 'left', wrapText: false };
      }

      celda.border = BORDE;
      celda.font = { size: 10 };

      if (indice % 2 === 1) {
        celda.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: GRIS_CLARO },
        };
      }
    });

    filaActual += 1;
  });

  const clavesTotales = Object.keys(reporte.totales || {});

  if (clavesTotales.length) {
    const totalRow = hoja.getRow(filaActual);

    columnas.forEach((columna, indice) => {
      const celda = totalRow.getCell(indice + 1);

      if (indice === 0) {
        celda.value = 'TOTALES';
      } else if (reporte.totales[columna.clave] !== undefined) {
        celda.value = reporte.totales[columna.clave];
        celda.numFmt = Number.isInteger(reporte.totales[columna.clave])
          ? '#,##0'
          : '#,##0.00';
      }

      celda.font = { bold: true, size: 10 };
      celda.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: AZUL_CLARO },
      };
      celda.border = BORDE;
      celda.alignment = {
        horizontal: columna.tipo === 'numero' ? 'right' : 'left',
      };
    });

    filaActual += 1;
  }

  if (reporte.filas.length) {
    hoja.autoFilter = {
      from: { row: FILA_ENCABEZADO, column: 1 },
      to: { row: FILA_ENCABEZADO + reporte.filas.length, column: ultimaColumna },
    };
  }

  await workbook.xlsx.write(stream);
};

module.exports = { crearExcel };
