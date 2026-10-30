const PDFDocument = require('pdfkit');

const AZUL = '#1f4e79';
const AZUL_CLARO = '#dbe7f3';
const GRIS_CLARO = '#f2f7fb';
const GRIS_TEXTO = '#555555';
const GRIS_LINEA = '#e0e0e0';

const formatearFiltros = (filtros) => {
  const entradas = Object.entries(filtros || {});

  if (!entradas.length) {
    return 'Sin filtros';
  }

  return entradas.map(([clave, valor]) => `${clave}: ${valor}`).join(' · ');
};

const formatearValor = (valor, columna) => {
  if (valor === null || valor === undefined) {
    return '';
  }

  if (columna.tipo === 'numero') {
    const numero = Number(valor);

    if (!Number.isNaN(numero)) {
      return numero.toLocaleString('es-GT', {
        minimumFractionDigits: Number.isInteger(numero) ? 0 : 2,
        maximumFractionDigits: 2,
      });
    }
  }

  return String(valor);
};

const crearPdf = (reporte, stream) =>
  new Promise((resolve, reject) => {
    const documento = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 30,
      bufferPages: true,
      info: {
        Title: reporte.titulo,
        Author: 'Sistema de Gestión de Vuelos - AICM',
        Subject: reporte.descripcion,
      },
    });

    documento.on('error', reject);
    stream.on('error', reject);
    stream.on('finish', resolve);
    documento.pipe(stream);

    const margenIzquierdo = documento.page.margins.left;
    const anchoContenido =
      documento.page.width -
      documento.page.margins.left -
      documento.page.margins.right;
    const altoFila = 18;
    const columnas = reporte.columnas;

    const pesos = columnas.map((columna) => {
      if (columna.tipo === 'numero') {
        return 0.9;
      }

      return Math.min(3, Math.max(1.2, columna.titulo.length / 8));
    });
    const pesoTotal = pesos.reduce((total, peso) => total + peso, 0);
    const anchos = pesos.map((peso) => (anchoContenido * peso) / pesoTotal);

    documento
      .font('Helvetica-Bold')
      .fontSize(16)
      .fillColor(AZUL)
      .text(reporte.titulo, margenIzquierdo, 30, { width: anchoContenido });

    documento
      .font('Helvetica')
      .fontSize(9)
      .fillColor(GRIS_TEXTO)
      .text(reporte.descripcion, { width: anchoContenido });

    documento.text(
      `Generado: ${new Date(reporte.generado_en).toLocaleString('es-GT')} · ` +
        `Registros: ${reporte.total_registros}`,
      { width: anchoContenido }
    );

    documento.text(`Filtros: ${formatearFiltros(reporte.filtros)}`, {
      width: anchoContenido,
    });

    documento.moveDown(0.6);

    const dibujarEncabezado = () => {
      const y = documento.y;

      documento
        .rect(margenIzquierdo, y, anchoContenido, altoFila)
        .fill(AZUL);

      let x = margenIzquierdo;

      documento
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor('#ffffff');

      columnas.forEach((columna, indice) => {
        documento.text(columna.titulo, x + 4, y + 5, {
          width: anchos[indice] - 8,
          height: altoFila - 6,
          ellipsis: true,
          lineBreak: false,
          align: columna.tipo === 'numero' ? 'right' : 'left',
        });

        x += anchos[indice];
      });

      documento.x = margenIzquierdo;
      documento.y = y + altoFila;
    };

    const asegurarEspacio = (alto) => {
      const limite =
        documento.page.height - documento.page.margins.bottom - alto - 2;

      if (documento.y > limite) {
        documento.addPage();
        dibujarEncabezado();
      }
    };

    dibujarEncabezado();

    let sombreada = false;

    reporte.filas.forEach((fila) => {
      asegurarEspacio(altoFila);

      const y = documento.y;

      if (sombreada) {
        documento
          .rect(margenIzquierdo, y, anchoContenido, altoFila)
          .fill(GRIS_CLARO);
      }

      let x = margenIzquierdo;

      documento.font('Helvetica').fontSize(8).fillColor('#222222');

      columnas.forEach((columna, indice) => {
        documento.text(
          formatearValor(fila[columna.clave], columna),
          x + 4,
          y + 5,
          {
            width: anchos[indice] - 8,
            height: altoFila - 6,
            ellipsis: true,
            lineBreak: false,
            align: columna.tipo === 'numero' ? 'right' : 'left',
          }
        );

        x += anchos[indice];
      });

      documento
        .moveTo(margenIzquierdo, y + altoFila)
        .lineTo(margenIzquierdo + anchoContenido, y + altoFila)
        .strokeColor(GRIS_LINEA)
        .lineWidth(0.5)
        .stroke();

      documento.x = margenIzquierdo;
      documento.y = y + altoFila;
      sombreada = !sombreada;
    });

    if (Object.keys(reporte.totales || {}).length) {
      asegurarEspacio(altoFila);

      const y = documento.y;

      documento
        .rect(margenIzquierdo, y, anchoContenido, altoFila)
        .fill(AZUL_CLARO);

      let x = margenIzquierdo;

      documento
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor('#1a1a1a');

      columnas.forEach((columna, indice) => {
        let valor = '';

        if (indice === 0) {
          valor = 'TOTALES';
        } else if (reporte.totales[columna.clave] !== undefined) {
          valor = formatearValor(reporte.totales[columna.clave], columna);
        }

        documento.text(valor, x + 4, y + 5, {
          width: anchos[indice] - 8,
          height: altoFila - 6,
          ellipsis: true,
          lineBreak: false,
          align: columna.tipo === 'numero' ? 'right' : 'left',
        });

        x += anchos[indice];
      });

      documento.x = margenIzquierdo;
      documento.y = y + altoFila;
    }

    // Numeración de páginas.
    const rango = documento.bufferedPageRange();

    for (let indice = 0; indice < rango.count; indice += 1) {
      documento.switchToPage(rango.start + indice);

      const margenInferior = documento.page.margins.bottom;
      documento.page.margins.bottom = 0;

      documento
        .font('Helvetica')
        .fontSize(7)
        .fillColor('#888888')
        .text(
          `Página ${indice + 1} de ${rango.count}`,
          margenIzquierdo,
          documento.page.height - 16,
          { width: anchoContenido, align: 'right', lineBreak: false }
        );

      documento.page.margins.bottom = margenInferior;
    }

    documento.end();
  });

module.exports = { crearPdf };
