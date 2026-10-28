class ErrorConEstado extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.name = 'ErrorConEstado';
    this.status = status;
  }
}

module.exports = { ErrorConEstado };
