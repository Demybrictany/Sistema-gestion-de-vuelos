const nodemailer = require('nodemailer');

let transporte = null;
let avisoModo = false;

// simulado: registra la entrega sin enviar correo real (útil para
// desarrollo y pruebas). smtp: envía por el servidor configurado.
const modoCorreo = () =>
  (
    process.env.CORREO_MODO || (process.env.SMTP_HOST ? 'smtp' : 'simulado')
  ).toLowerCase();

const obtenerTransporte = () => {
  if (!transporte) {
    transporte = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
    });
  }

  return transporte;
};

const enviarCorreo = async ({ para, asunto, texto }) => {
  if (!para) {
    return {
      estado: 'SIMULADA',
      detalle: 'El pasajero no tiene correo registrado.',
    };
  }

  if (modoCorreo() !== 'smtp') {
    if (!avisoModo) {
      console.warn(
        '[correo] CORREO_MODO=simulado; no se envían correos reales.'
      );
      avisoModo = true;
    }

    return {
      estado: 'SIMULADA',
      detalle: `Correo simulado: "${asunto}" para ${para}.`,
    };
  }

  for (const variable of ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS']) {
    if (!process.env[variable]) {
      throw new Error(`Falta la variable ${variable} para enviar correo`);
    }
  }

  const info = await obtenerTransporte().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: para,
    subject: asunto,
    text: texto,
  });

  return {
    estado: 'ENVIADA',
    detalle: `Correo enviado (${info.messageId || 'sin messageId'})`,
  };
};

module.exports = { enviarCorreo, modoCorreo };
