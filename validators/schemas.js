const { z } = require('zod');

const id = z.coerce.number().int().positive();

const fecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD');

const hora = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Formato esperado: HH:MM o HH:MM:SS')
  .transform((valor) => (valor.length === 5 ? `${valor}:00` : valor));

const fechaHora = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/,
    'Formato esperado: YYYY-MM-DD HH:MM[:SS]'
  )
  .transform((valor) => valor.replace(' ', 'T'));

const fechaODatetime = z.union([fecha, fechaHora]);

const correo = z
  .string()
  .max(150)
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Correo inválido');

const estadoActivo = z.enum(['ACTIVO', 'INACTIVO']);
const estadoPuerta = z.enum(['DISPONIBLE', 'MANTENIMIENTO', 'INACTIVA']);
const estadoVuelo = z.enum([
  'PROGRAMADO',
  'ABORDANDO',
  'ABORDADO',
  'EN_VUELO',
  'ATERRIZADO',
  'FINALIZADO',
  'RETRASADO',
  'CANCELADO',
]);
const estadoEquipaje = z.enum([
  'REGISTRADO',
  'EN_TRANSITO',
  'EN_BANDA',
  'CARGADO',
  'TRANSFERIDO',
  'ENTREGADO',
  'EXTRAVIADO',
  'DANADO',
]);
const estadoEscala = z.enum([
  'PENDIENTE',
  'EN_TRANSITO',
  'COMPLETADA',
  'CANCELADA',
]);
const estadoItinerario = z.enum([
  'PROGRAMADO',
  'EN_CURSO',
  'COMPLETADO',
  'CANCELADO',
]);
const estadoPasajeroVuelo = z.enum([
  'RESERVADO',
  'CHECK_IN',
  'ABORDADO',
  'NO_ABORDADO',
  'CANCELADO',
]);
const tipoNotificacion = z.enum([
  'CAMBIO_PUERTA',
  'CAMBIO_HORARIO',
  'VUELO_CANCELADO',
  'VUELO_RETRASADO',
  'PUERTA_ASIGNADA',
  'BANDA_EQUIPAJE',
  'ESCALA',
  'INFORMACION_GENERAL',
]);

// ------------------------------------------------------------
// Autenticación
// ------------------------------------------------------------
const login = z
  .object({
    nombre_usuario: z.string().min(1).max(150).optional(),
    usuarioOCorreo: z.string().min(1).max(150).optional(),
    password: z.string().min(1).max(72),
  })
  .strict()
  .refine((datos) => datos.nombre_usuario || datos.usuarioOCorreo, {
    message: 'El usuario o correo es obligatorio',
    path: ['nombre_usuario'],
  });

// ------------------------------------------------------------
// Roles y usuarios
// ------------------------------------------------------------
const crearRol = z
  .object({
    nombre: z.string().min(3).max(50),
    descripcion: z.string().max(255).optional().nullable(),
  })
  .strict();

const actualizarRol = crearRol.partial();

const crearUsuario = z
  .object({
    id_rol: id,
    nombre_usuario: z.string().min(3).max(50),
    password: z.string().min(8).max(72),
    nombres: z.string().min(1).max(100),
    apellidos: z.string().min(1).max(100),
    correo: correo.optional().nullable(),
    telefono: z.string().max(30).optional().nullable(),
    id_pasajero: id.optional().nullable(),
  })
  .strict();

const actualizarUsuario = z
  .object({
    id_rol: id.optional(),
    nombre_usuario: z.string().min(3).max(50).optional(),
    password: z.string().min(8).max(72).optional(),
    nombres: z.string().min(1).max(100).optional(),
    apellidos: z.string().min(1).max(100).optional(),
    correo: correo.optional().nullable(),
    telefono: z.string().max(30).optional().nullable(),
    id_pasajero: id.optional().nullable(),
    estado: estadoActivo.optional(),
  })
  .strict();

// ------------------------------------------------------------
// Catálogos
// ------------------------------------------------------------
const crearAeropuerto = z
  .object({
    codigo_iata: z
      .string()
      .length(3, 'El código IATA debe tener 3 caracteres')
      .transform((valor) => valor.toUpperCase()),
    nombre: z.string().min(1).max(150),
    ciudad: z.string().min(1).max(100),
    pais: z.string().min(1).max(100),
    estado: estadoActivo.optional(),
  })
  .strict();

const actualizarAeropuerto = crearAeropuerto.partial();

const crearPuerta = z
  .object({
    numero: z.string().min(1).max(10),
    zona: z.string().max(50).optional().nullable(),
    estado: estadoPuerta.optional(),
  })
  .strict();

const actualizarPuerta = crearPuerta.partial();

const crearBandaEquipaje = z
  .object({
    numero: z.string().min(1).max(10),
    zona: z.string().max(50).optional().nullable(),
    estado: estadoPuerta.optional(),
  })
  .strict();

const actualizarBandaEquipaje = crearBandaEquipaje.partial();

const crearPasajero = z
  .object({
    nombres: z.string().min(1).max(100),
    apellidos: z.string().min(1).max(100),
    fecha_nacimiento: fecha.optional().nullable(),
    nacionalidad: z.string().max(80).optional().nullable(),
    pasaporte: z.string().min(1).max(50),
    correo: correo.optional().nullable(),
    telefono: z.string().max(30).optional().nullable(),
    estado: estadoActivo.optional(),
  })
  .strict();

const actualizarPasajero = z
  .object({
    nombres: z.string().min(1).max(100).optional(),
    apellidos: z.string().min(1).max(100).optional(),
    fecha_nacimiento: fecha.optional().nullable(),
    nacionalidad: z.string().max(80).optional().nullable(),
    pasaporte: z.string().min(1).max(50).optional(),
    correo: correo.optional().nullable(),
    telefono: z.string().max(30).optional().nullable(),
    estado: estadoActivo.optional(),
  })
  .strict();

// ------------------------------------------------------------
// Vuelos
// ------------------------------------------------------------
const crearVuelo = z
  .object({
    codigo_vuelo: z.string().min(1).max(20),
    id_aeropuerto_origen: id,
    id_aeropuerto_destino: id,
    fecha_salida: fecha,
    hora_salida: hora,
    fecha_llegada: fecha,
    hora_llegada: hora,
    id_puerta: id.optional().nullable(),
    capacidad_pasajeros: z.coerce.number().int().min(0).max(10000),
    observaciones: z.string().max(2000).optional().nullable(),
  })
  .strict();

const actualizarVuelo = crearVuelo
  .partial()
  .extend({
    estado: estadoVuelo.optional(),
    motivo_cancelacion: z.string().max(255).optional().nullable(),
    motivo: z.string().min(3).max(255).optional(),
  })
  .strict();

const cambiarEstadoVuelo = z
  .object({
    estado: estadoVuelo,
    motivo: z.string().min(3).max(255).optional(),
  })
  .strict()
  .superRefine((datos, ctx) => {
    if (datos.estado === 'CANCELADO' && !datos.motivo) {
      ctx.addIssue({
        code: 'custom',
        message: 'El motivo es obligatorio para cancelar el vuelo',
        path: ['motivo'],
      });
    }
  });

const reprogramarVuelo = z
  .object({
    fecha_salida: fecha,
    hora_salida: hora,
    fecha_llegada: fecha,
    hora_llegada: hora,
    motivo: z.string().min(3).max(255).optional(),
  })
  .strict();

const cambiarPuertaVuelo = z
  .object({
    id_puerta: id.nullable(),
    motivo: z.string().min(3).max(255).optional(),
  })
  .strict();

const cancelarVuelo = z
  .object({
    motivo: z.string().min(3).max(255),
  })
  .strict();

// ------------------------------------------------------------
// Itinerarios, escalas y pasajeros por vuelo
// ------------------------------------------------------------
const crearItinerario = z
  .object({
    id_pasajero: id,
    codigo_reserva: z.string().min(1).max(30),
    origen_principal: id,
    destino_final: id,
    fecha_inicio: fechaODatetime,
    fecha_fin: fechaODatetime,
    estado: estadoItinerario.optional(),
  })
  .strict();

const actualizarItinerario = crearItinerario.partial();

const crearPasajeroVuelo = z
  .object({
    id_pasajero: id,
    id_vuelo: id,
    id_itinerario: id.optional().nullable(),
    numero_asiento: z.string().max(10).optional().nullable(),
    estado: estadoPasajeroVuelo.optional(),
  })
  .strict();

const actualizarPasajeroVuelo = z
  .object({
    id_itinerario: id.optional().nullable(),
    numero_asiento: z.string().max(10).optional().nullable(),
    estado: estadoPasajeroVuelo.optional(),
  })
  .strict();

const crearEscala = z
  .object({
    id_itinerario: id,
    id_vuelo: id,
    numero_escala: z.coerce.number().int().min(1),
    aeropuerto_llegada: id,
    aeropuerto_salida: id,
    hora_llegada: fechaHora,
    hora_salida: fechaHora.optional().nullable(),
    id_puerta_llegada: id.optional().nullable(),
    id_puerta_salida: id.optional().nullable(),
    estado: estadoEscala.optional(),
  })
  .strict();

const actualizarEscala = crearEscala.partial();

// ------------------------------------------------------------
// Equipaje
// ------------------------------------------------------------
const crearEquipaje = z
  .object({
    codigo_equipaje: z.string().min(1).max(50),
    id_pasajero: id,
    peso: z.number().min(0).max(9999).optional().nullable(),
    origen: id,
    destino_final: id,
    id_banda_actual: id.optional().nullable(),
    observaciones: z.string().max(2000).optional().nullable(),
  })
  .strict();

const actualizarEquipaje = z
  .object({
    peso: z.number().min(0).max(9999).optional().nullable(),
    observaciones: z.string().max(2000).optional().nullable(),
  })
  .strict()
  .refine((datos) => Object.keys(datos).length > 0, {
    message: 'Envía al menos un campo para actualizar',
  });

const registrarTramo = z
  .object({
    id_vuelo: id,
    id_banda_origen: id.optional().nullable(),
    id_banda_destino: id.optional().nullable(),
    observaciones: z.string().max(500).optional().nullable(),
  })
  .strict();

const cambiarBandaEquipaje = z
  .object({
    id_banda: id,
    ubicacion: z.string().max(150).optional().nullable(),
  })
  .strict();

const cambiarEstadoEquipaje = z
  .object({
    estado: estadoEquipaje,
    ubicacion: z.string().max(150).optional().nullable(),
    id_vuelo: id.optional().nullable(),
  })
  .strict();

const crearEquipajeVuelo = z
  .object({
    id_equipaje: id,
    id_vuelo: id,
    id_banda_origen: id.optional().nullable(),
    id_banda_destino: id.optional().nullable(),
  })
  .strict();

// ------------------------------------------------------------
// Notificaciones e historiales
// ------------------------------------------------------------
const crearNotificacion = z
  .object({
    id_pasajero: id,
    id_vuelo: id.optional().nullable(),
    id_equipaje: id.optional().nullable(),
    tipo: tipoNotificacion,
    titulo: z.string().min(1).max(150),
    mensaje: z.string().min(1).max(5000),
  })
  .strict();

const actualizarNotificacion = z
  .object({
    tipo: tipoNotificacion.optional(),
    titulo: z.string().min(1).max(150).optional(),
    mensaje: z.string().min(1).max(5000).optional(),
    leida: z.boolean().optional(),
  })
  .strict();

const crearHistorialVuelo = z
  .object({
    id_vuelo: id,
    campo_modificado: z.string().min(1).max(100),
    valor_anterior: z.string().max(10000).optional().nullable(),
    valor_nuevo: z.string().max(10000).optional().nullable(),
    motivo: z.string().max(255).optional().nullable(),
    modificado_por: id.optional().nullable(),
  })
  .strict();

const crearHistorialEquipaje = z
  .object({
    id_equipaje: id,
    ubicacion: z.string().max(150).optional().nullable(),
    id_banda: id.optional().nullable(),
    id_vuelo: id.optional().nullable(),
    estado_anterior: z.string().max(50).optional().nullable(),
    estado_nuevo: z.string().max(50).optional().nullable(),
    observaciones: z.string().max(2000).optional().nullable(),
    registrado_por: id.optional().nullable(),
  })
  .strict();

module.exports = {
  login,
  crearRol,
  actualizarRol,
  crearUsuario,
  actualizarUsuario,
  crearAeropuerto,
  actualizarAeropuerto,
  crearPuerta,
  actualizarPuerta,
  crearBandaEquipaje,
  actualizarBandaEquipaje,
  crearPasajero,
  actualizarPasajero,
  crearVuelo,
  actualizarVuelo,
  cambiarEstadoVuelo,
  reprogramarVuelo,
  cambiarPuertaVuelo,
  cancelarVuelo,
  crearItinerario,
  actualizarItinerario,
  crearPasajeroVuelo,
  actualizarPasajeroVuelo,
  crearEscala,
  actualizarEscala,
  crearEquipaje,
  actualizarEquipaje,
  registrarTramo,
  cambiarBandaEquipaje,
  cambiarEstadoEquipaje,
  crearEquipajeVuelo,
  crearNotificacion,
  actualizarNotificacion,
  crearHistorialVuelo,
  crearHistorialEquipaje,
};
