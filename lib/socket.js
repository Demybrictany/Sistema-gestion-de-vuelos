const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

const { bus } = require('./eventos-panel');
const { obtenerOrigenes } = require('./cors');

const ROLES_DEL_PANEL = ['ADMINISTRADOR', 'SECRETARIO'];

const iniciarSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: obtenerOrigenes(),
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Token no proporcionado'));
    }

    if (!process.env.JWT_SECRET) {
      return next(new Error('Configuración de autenticación incompleta'));
    }

    try {
      const usuario = jwt.verify(token, process.env.JWT_SECRET);

      if (!ROLES_DEL_PANEL.includes(usuario.rol)) {
        return next(new Error('No tienes permisos para el panel operativo'));
      }

      socket.usuario = usuario;
      return next();
    } catch (error) {
      return next(new Error('Token inválido o expirado'));
    }
  });

  io.on('connection', (socket) => {
    socket.emit('panel:conectado', {
      usuario: socket.usuario.nombre_usuario,
      rol: socket.usuario.rol,
      fecha: new Date().toISOString(),
    });
  });

  bus.on('cambio', () => {
    io.emit('panel:actualizar', { fecha: new Date().toISOString() });
  });

  return io;
};

module.exports = iniciarSocket;
