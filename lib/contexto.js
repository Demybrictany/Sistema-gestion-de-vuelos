const { AsyncLocalStorage } = require('async_hooks');

const almacen = new AsyncLocalStorage();

const ejecutarEnContexto = (datos, fn) => almacen.run(datos, fn);

const obtenerContexto = () => almacen.getStore() || {};

module.exports = {
  ejecutarEnContexto,
  obtenerContexto,
};
