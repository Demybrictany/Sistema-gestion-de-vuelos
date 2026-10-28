-- ============================================================
-- Sistema de Gestión de Vuelos - Datos iniciales (PostgreSQL)
--
-- Contenido: 6 aeropuertos, 25 puertas, 10 bandas, 12 vuelos,
-- 6 pasajeros, 8 equipajes, 12 notificaciones y catálogos.
-- Uso: psql "$DATABASE_URL" -f db/postgres/seed.sql
-- ============================================================

BEGIN;

SET TIME ZONE 'UTC';

-- ------------------------------------------------------------
-- roles
-- ------------------------------------------------------------
INSERT INTO roles (id_rol, nombre, descripcion, created_at, updated_at) VALUES
  (1, 'ADMINISTRADOR', 'Acceso completo al sistema', '2026-10-02 23:45:33+00', '2026-10-02 23:45:33+00'),
  (2, 'SECRETARIO', 'Gestión operativa de vuelos, pasajeros y equipajes', '2026-10-02 23:45:33+00', '2026-10-02 23:45:33+00'),
  (3, 'PASAJERO', 'Consulta de vuelos, equipaje y notificaciones', '2026-10-02 23:45:33+00', '2026-10-02 23:45:33+00');

-- ------------------------------------------------------------
-- usuarios
-- ------------------------------------------------------------
INSERT INTO usuarios (
  id_usuario, id_rol, nombre_usuario, password_hash, nombres, apellidos,
  correo, telefono, id_pasajero, estado, ultimo_acceso, created_at, updated_at
) VALUES
  (1, 1, 'admin', '$2b$10$yGmTrFINAlEVTPl1L4S.WuTyqTut1lUQaK1LB.QbG4sOT5VOjcZ8m', 'Administrador', 'Sistema', 'admin@aeropuerto.test', '55550001', NULL, 'ACTIVO', '2026-10-15 23:31:49+00', '2026-10-02 23:45:33+00', '2026-10-15 23:31:49+00'),
  (2, 2, 'secretario', '$2b$10$V.7twQkoTNiHZJmRGZYOg.81.fSad1s5Hne1DOdHOaObDf9WadjYS', 'Daniel', 'Hernandez', 'secretario@aeropuerto.test', '55550002', NULL, 'ACTIVO', '2026-10-03 00:03:17+00', '2026-10-02 23:45:33+00', '2026-10-03 00:03:17+00'),
  (3, 3, 'carlos', '$2b$10$nwskMAqvlgEwJTcYARmpZOiQjxDgFuZITiSsSQZ/wWFoWTmNLLHxy', 'Carlos', 'Martinez', 'carlos@aeropuerto.test', '55550003', 1, 'ACTIVO', '2026-10-03 00:03:50+00', '2026-10-02 23:45:33+00', '2026-10-03 00:03:50+00'),
  (4, 3, 'sofia', '$2b$10$nwskMAqvlgEwJTcYARmpZOiQjxDgFuZITiSsSQZ/wWFoWTmNLLHxy', 'Sofia', 'Ramirez', 'sofia@aeropuerto.test', '55550004', 2, 'ACTIVO', '2026-10-03 02:26:44+00', '2026-10-02 23:45:33+00', '2026-10-03 02:26:44+00'),
  (5, 3, 'andrea', '$2b$10$nwskMAqvlgEwJTcYARmpZOiQjxDgFuZITiSsSQZ/wWFoWTmNLLHxy', 'Andrea', 'Lopez', 'andrea@aeropuerto.test', '55550005', 3, 'ACTIVO', NULL, '2026-10-02 23:45:33+00', '2026-10-02 23:45:33+00'),
  (6, 3, 'inactivo', '$2b$10$nwskMAqvlgEwJTcYARmpZOiQjxDgFuZITiSsSQZ/wWFoWTmNLLHxy', 'Usuario', 'Inactivo', 'inactivo@aeropuerto.test', '55550006', NULL, 'INACTIVO', NULL, '2026-10-02 23:45:33+00', '2026-10-02 23:45:33+00');

-- ------------------------------------------------------------
-- aeropuertos
-- ------------------------------------------------------------
INSERT INTO aeropuertos (
  id_aeropuerto, codigo_iata, nombre, ciudad, pais, estado,
  created_at, updated_at
) VALUES
  (1, 'MEX', 'Aeropuerto Internacional de la Ciudad de México', 'Ciudad de México', 'México', 'ACTIVO', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (2, 'GUA', 'Aeropuerto Internacional La Aurora', 'Ciudad de Guatemala', 'Guatemala', 'ACTIVO', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (3, 'LAX', 'Aeropuerto Internacional de Los Ángeles', 'Los Ángeles', 'Estados Unidos', 'ACTIVO', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (4, 'MAD', 'Aeropuerto Adolfo Suárez Madrid-Barajas', 'Madrid', 'España', 'ACTIVO', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (5, 'PTY', 'Aeropuerto Internacional de Tocumen', 'Ciudad de Panamá', 'Panamá', 'ACTIVO', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (6, 'BOG', 'Aeropuerto Internacional El Dorado', 'Bogotá', 'Colombia', 'ACTIVO', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00');

-- ------------------------------------------------------------
-- pasajeros
-- ------------------------------------------------------------
INSERT INTO pasajeros (
  id_pasajero, nombres, apellidos, fecha_nacimiento, nacionalidad,
  pasaporte, correo, telefono, estado, created_at, updated_at
) VALUES
  (1, 'Carlos', 'Martinez', '1998-05-15', 'Guatemalteca', 'GT100001', 'carlos.martinez@correo.test', '55551001', 'ACTIVO', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (2, 'Sofia', 'Ramirez', '2001-08-22', 'Mexicana', 'MX100002', 'sofia.ramirez@correo.test', '55551002', 'ACTIVO', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (3, 'Andrea', 'Lopez', '1995-03-11', 'Panameña', 'PA100003', 'andrea.lopez@correo.test', '55551003', 'ACTIVO', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (4, 'Miguel', 'Garcia', '1989-11-30', 'Colombiana', 'CO100004', 'miguel.garcia@correo.test', '55551004', 'ACTIVO', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (5, 'Elena', 'Torres', '1992-06-18', 'Española', 'ES100005', 'elena.torres@correo.test', '55551005', 'ACTIVO', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (6, 'Luis', 'Morales', '2000-01-25', 'Guatemalteca', 'GT100006', 'luis.morales@correo.test', '55551006', 'ACTIVO', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00');

-- ------------------------------------------------------------
-- puertas (25 puertas de embarque del AICM)
-- ------------------------------------------------------------
INSERT INTO puertas (id_puerta, numero, zona, estado, created_at, updated_at)
SELECT
  n,
  'A' || LPAD(n::text, 2, '0'),
  CASE WHEN n <= 5 THEN 'NACIONAL' ELSE 'INTERNACIONAL' END,
  CASE
    WHEN n = 15 THEN 'MANTENIMIENTO'
    WHEN n = 25 THEN 'INACTIVA'
    ELSE 'DISPONIBLE'
  END::estado_puerta_banda,
  '2026-10-02 23:45:34+00',
  '2026-10-02 23:45:34+00'
FROM generate_series(1, 25) AS s(n);

-- ------------------------------------------------------------
-- bandas_equipaje
-- ------------------------------------------------------------
INSERT INTO bandas_equipaje (
  id_banda, numero, zona, estado, created_at, updated_at
) VALUES
  (1, 'B01', 'NACIONAL', 'DISPONIBLE', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (2, 'B02', 'NACIONAL', 'DISPONIBLE', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (3, 'B03', 'NACIONAL', 'DISPONIBLE', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (4, 'B04', 'NACIONAL', 'MANTENIMIENTO', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (5, 'B05', 'INTERNACIONAL', 'DISPONIBLE', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (6, 'B06', 'INTERNACIONAL', 'DISPONIBLE', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (7, 'B07', 'INTERNACIONAL', 'DISPONIBLE', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (8, 'B08', 'INTERNACIONAL', 'DISPONIBLE', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (9, 'B09', 'INTERNACIONAL', 'DISPONIBLE', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (10, 'B10', 'INTERNACIONAL', 'INACTIVA', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00');

-- ------------------------------------------------------------
-- vuelos
-- ------------------------------------------------------------
INSERT INTO vuelos (
  id_vuelo, codigo_vuelo, id_aeropuerto_origen, id_aeropuerto_destino,
  fecha_salida, hora_salida, fecha_llegada, hora_llegada, id_puerta,
  estado, motivo_cancelacion, capacidad_pasajeros, observaciones,
  created_at, updated_at
) VALUES
  (1, 'GT456', 2, 1, '2026-10-02', '08:00:00', '2026-10-02', '10:20:00', 1, 'FINALIZADO', NULL, 150, 'Vuelo Guatemala - Ciudad de México finalizado', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (2, 'AM123', 1, 3, '2026-10-02', '12:00:00', '2026-10-02', '14:30:00', 6, 'FINALIZADO', NULL, 180, 'Vuelo Ciudad de México - Los Ángeles', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (3, 'IB789', 1, 4, '2026-10-03', '18:00:00', '2026-10-04', '11:00:00', 7, 'PROGRAMADO', NULL, 250, 'Vuelo internacional con destino Madrid', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (4, 'CM208', 5, 1, '2026-10-02', '15:30:00', '2026-10-02', '18:00:00', 8, 'ABORDANDO', NULL, 170, 'Proceso de abordaje activo', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (5, 'AV742', 1, 6, '2026-10-02', '20:30:00', '2026-10-03', '01:00:00', 9, 'RETRASADO', NULL, 160, 'Salida retrasada por condiciones operativas', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (6, 'AM900', 3, 1, '2026-10-01', '09:00:00', '2026-10-01', '12:30:00', 10, 'FINALIZADO', NULL, 190, 'Vuelo completado desde Los Ángeles', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (7, 'GT501', 1, 2, '2026-10-03', '07:00:00', '2026-10-03', '09:15:00', 11, 'PROGRAMADO', NULL, 145, 'Próximo vuelo hacia Guatemala', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (8, 'CM330', 1, 5, '2026-10-04', '10:00:00', '2026-10-04', '13:30:00', 12, 'PROGRAMADO', NULL, 175, 'Vuelo hacia Ciudad de Panamá', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (9, 'AV101', 6, 1, '2026-10-05', '11:00:00', '2026-10-05', '15:30:00', NULL, 'CANCELADO', 'Cancelación por mantenimiento preventivo de la aeronave', 165, 'Vuelo cancelado', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (10, 'IB220', 4, 1, '2026-10-06', '09:00:00', '2026-10-06', '19:00:00', 13, 'PROGRAMADO', NULL, 260, 'Vuelo Madrid - Ciudad de México', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (11, 'AM555', 1, 3, '2026-10-03', '16:00:00', '2026-10-03', '18:45:00', 14, 'PROGRAMADO', NULL, 185, 'Vuelo hacia Los Ángeles', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (12, 'GT777', 2, 1, '2026-10-02', '16:30:00', '2026-10-02', '18:45:00', 16, 'EN_VUELO', NULL, 155, 'Vuelo actualmente en tránsito hacia Ciudad de México', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00');

-- ------------------------------------------------------------
-- itinerarios
-- ------------------------------------------------------------
INSERT INTO itinerarios (
  id_itinerario, id_pasajero, codigo_reserva, origen_principal,
  destino_final, fecha_inicio, fecha_fin, estado, created_at, updated_at
) VALUES
  (1, 1, 'RES-CAR-001', 2, 3, '2026-10-02', '2026-10-02', 'COMPLETADO', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (2, 2, 'RES-SOF-002', 1, 4, '2026-10-03', '2026-10-04', 'PROGRAMADO', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (3, 3, 'RES-AND-003', 5, 3, '2026-10-02', '2026-10-03', 'EN_CURSO', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (4, 4, 'RES-MIG-004', 1, 6, '2026-10-02', '2026-10-03', 'EN_CURSO', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (5, 5, 'RES-ELE-005', 4, 1, '2026-10-06', '2026-10-06', 'PROGRAMADO', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (6, 6, 'RES-LUI-006', 6, 1, '2026-10-05', '2026-10-05', 'CANCELADO', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00');

-- ------------------------------------------------------------
-- pasajero_vuelo
-- ------------------------------------------------------------
INSERT INTO pasajero_vuelo (
  id_pasajero_vuelo, id_pasajero, id_vuelo, id_itinerario, numero_asiento,
  estado, fecha_registro, registrado_por, created_at, updated_at
) VALUES
  (1, 1, 1, 1, '12A', 'ABORDADO', '2026-09-25 10:00:00+00', 2, '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (2, 1, 2, 1, '18C', 'ABORDADO', '2026-09-25 10:05:00+00', 2, '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (3, 2, 3, 2, '22A', 'CHECK_IN', '2026-09-28 09:00:00+00', 2, '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (4, 3, 4, 3, '10B', 'ABORDADO', '2026-09-27 11:00:00+00', 2, '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (5, 3, 11, 3, '14D', 'RESERVADO', '2026-09-27 11:05:00+00', 2, '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (6, 4, 5, 4, '08F', 'CHECK_IN', '2026-09-29 14:00:00+00', 2, '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (7, 5, 10, 5, '03A', 'RESERVADO', '2026-09-30 08:30:00+00', 2, '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (8, 6, 9, 6, '20C', 'CANCELADO', '2026-09-30 12:00:00+00', 2, '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00');

-- ------------------------------------------------------------
-- escalas
-- ------------------------------------------------------------
INSERT INTO escalas (
  id_escala, id_itinerario, id_vuelo, numero_escala, aeropuerto_llegada,
  aeropuerto_salida, hora_llegada, hora_salida, id_puerta_llegada,
  id_puerta_salida, estado, created_at, updated_at
) VALUES
  (1, 1, 2, 1, 1, 1, '2026-10-02 10:20:00+00', '2026-10-02 12:00:00+00', 1, 6, 'COMPLETADA', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (2, 3, 11, 1, 1, 1, '2026-10-02 18:00:00+00', '2026-10-03 16:00:00+00', 8, 14, 'EN_TRANSITO', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00');

-- ------------------------------------------------------------
-- equipajes
-- ------------------------------------------------------------
INSERT INTO equipajes (
  id_equipaje, codigo_equipaje, id_pasajero, peso, origen, destino_final,
  id_banda_actual, estado, observaciones, created_at, updated_at
) VALUES
  (1, 'EQ000001', 1, 18.50, 2, 3, 6, 'ENTREGADO', 'Equipaje completó conexión GUA - MEX - LAX', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (2, 'EQ000002', 2, 21.30, 1, 4, NULL, 'REGISTRADO', 'Equipaje preparado para vuelo MEX - MAD', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (3, 'EQ000003', 3, 16.80, 5, 3, 7, 'TRANSFERIDO', 'Equipaje en conexión PTY - MEX - LAX', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (4, 'EQ000004', 4, 19.40, 1, 6, NULL, 'EN_TRANSITO', 'Equipaje en ruta hacia Bogotá', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (5, 'EQ000005', 5, 23.10, 4, 1, NULL, 'REGISTRADO', 'Equipaje registrado para vuelo Madrid - México', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (6, 'EQ000006', 6, 17.20, 6, 1, NULL, 'REGISTRADO', 'Equipaje asociado a vuelo cancelado', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (7, 'EQ000007', 1, 12.60, 2, 3, NULL, 'EXTRAVIADO', 'Equipaje marcado para seguimiento especial', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (8, 'EQ000008', 3, 20.00, 5, 3, 7, 'DANADO', 'Daño reportado durante manipulación', '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00');

-- ------------------------------------------------------------
-- equipaje_vuelo
-- ------------------------------------------------------------
INSERT INTO equipaje_vuelo (
  id_equipaje_vuelo, id_equipaje, id_vuelo, id_banda_origen,
  id_banda_destino, orden_vuelo, estado, fecha_registro, registrado_por,
  created_at, updated_at
) VALUES
  (1, 1, 1, NULL, 5, 1, 'RECIBIDO', '2026-10-02 06:30:00+00', 2, '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (2, 1, 2, 5, 6, 2, 'ENTREGADO', '2026-10-02 11:00:00+00', 2, '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (3, 2, 3, NULL, NULL, 1, 'REGISTRADO', '2026-10-02 14:00:00+00', 2, '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (4, 3, 4, NULL, 7, 1, 'TRANSFERIDO', '2026-10-02 13:30:00+00', 2, '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (5, 3, 11, 7, NULL, 2, 'REGISTRADO', '2026-10-02 18:20:00+00', 2, '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (6, 4, 5, NULL, NULL, 1, 'EN_VUELO', '2026-10-02 18:30:00+00', 2, '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (7, 5, 10, NULL, NULL, 1, 'REGISTRADO', '2026-10-01 09:00:00+00', 2, '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (8, 6, 9, NULL, NULL, 1, 'REGISTRADO', '2026-10-01 10:00:00+00', 2, '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (9, 7, 1, NULL, 5, 1, 'RECIBIDO', '2026-10-02 06:35:00+00', 2, '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (10, 7, 2, 5, NULL, 2, 'TRANSFERIDO', '2026-10-02 11:05:00+00', 2, '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00'),
  (11, 8, 4, NULL, 7, 1, 'RECIBIDO', '2026-10-02 13:35:00+00', 2, '2026-10-02 23:45:34+00', '2026-10-02 23:45:34+00');

-- ------------------------------------------------------------
-- notificaciones
-- ------------------------------------------------------------
INSERT INTO notificaciones (
  id_notificacion, id_pasajero, id_vuelo, id_equipaje, tipo, titulo,
  mensaje, leida, fecha_envio, fecha_lectura, created_at
) VALUES
  (1, 1, 1, 1, 'PUERTA_ASIGNADA', 'Puerta de embarque asignada', 'Tu vuelo GT456 tiene asignada la puerta A01.', true, '2026-10-02 06:45:00+00', '2026-10-02 06:50:00+00', '2026-10-02 23:45:36+00'),
  (2, 1, 2, 1, 'ESCALA', 'Información de conexión', 'Al llegar a Ciudad de México continúa hacia Los Ángeles en el vuelo AM123.', true, '2026-10-02 09:30:00+00', '2026-10-02 09:35:00+00', '2026-10-02 23:45:36+00'),
  (3, 1, 2, 1, 'BANDA_EQUIPAJE', 'Equipaje disponible', 'Tu equipaje EQ000001 está disponible en la banda B06.', false, '2026-10-02 14:45:00+00', NULL, '2026-10-02 23:45:36+00'),
  (4, 1, 2, 7, 'INFORMACION_GENERAL', 'Seguimiento de equipaje', 'El equipaje EQ000007 requiere seguimiento especial porque no fue localizado durante la transferencia.', false, '2026-10-02 12:20:00+00', NULL, '2026-10-02 23:45:36+00'),
  (5, 2, 3, 2, 'PUERTA_ASIGNADA', 'Puerta para tu vuelo', 'Tu vuelo IB789 tiene asignada la puerta A07.', false, '2026-10-02 13:35:00+00', NULL, '2026-10-02 23:45:36+00'),
  (6, 2, 3, 2, 'CAMBIO_PUERTA', 'Cambio de puerta', 'La puerta de tu vuelo IB789 cambió de A06 a A07.', false, '2026-10-02 13:36:00+00', NULL, '2026-10-02 23:45:36+00'),
  (7, 3, 4, 3, 'ESCALA', 'Conexión en Ciudad de México', 'Tu equipaje será transferido automáticamente para continuar hacia Los Ángeles.', true, '2026-10-02 18:10:00+00', '2026-10-02 18:15:00+00', '2026-10-02 23:45:36+00'),
  (8, 3, 11, 3, 'PUERTA_ASIGNADA', 'Puerta del siguiente vuelo', 'Tu conexión hacia Los Ángeles saldrá por la puerta A14.', false, '2026-10-02 18:20:00+00', NULL, '2026-10-02 23:45:36+00'),
  (9, 4, 5, 4, 'VUELO_RETRASADO', 'Tu vuelo presenta retraso', 'El vuelo AV742 hacia Bogotá presenta un retraso operacional.', false, '2026-10-02 16:05:00+00', NULL, '2026-10-02 23:45:36+00'),
  (10, 4, 5, 4, 'CAMBIO_HORARIO', 'Nuevo horario de salida', 'La salida del vuelo AV742 fue actualizada a las 20:30.', false, '2026-10-02 16:06:00+00', NULL, '2026-10-02 23:45:36+00'),
  (11, 5, 10, 5, 'INFORMACION_GENERAL', 'Reserva confirmada', 'Tu viaje Madrid - Ciudad de México está programado para el 6 de octubre.', true, '2026-10-01 09:10:00+00', '2026-10-01 09:20:00+00', '2026-10-02 23:45:36+00'),
  (12, 6, 9, 6, 'VUELO_CANCELADO', 'Vuelo cancelado', 'El vuelo AV101 fue cancelado por mantenimiento preventivo de la aeronave.', false, '2026-10-02 10:05:00+00', NULL, '2026-10-02 23:45:36+00');

-- ------------------------------------------------------------
-- historial_vuelo
-- ------------------------------------------------------------
INSERT INTO historial_vuelo (
  id_historial_vuelo, id_vuelo, campo_modificado, valor_anterior,
  valor_nuevo, motivo, modificado_por, fecha_modificacion
) VALUES
  (1, 5, 'estado', 'PROGRAMADO', 'RETRASADO', 'Condiciones operativas', 2, '2026-10-02 16:00:00+00'),
  (2, 5, 'hora_salida', '19:30:00', '20:30:00', 'Retraso operacional', 2, '2026-10-02 16:05:00+00'),
  (3, 9, 'estado', 'PROGRAMADO', 'CANCELADO', 'Mantenimiento preventivo de aeronave', 1, '2026-10-02 10:00:00+00'),
  (4, 4, 'estado', 'PROGRAMADO', 'ABORDANDO', 'Inicio de proceso de abordaje', 2, '2026-10-02 15:00:00+00'),
  (5, 12, 'estado', 'ABORDADO', 'EN_VUELO', 'Despegue confirmado', 2, '2026-10-02 16:35:00+00'),
  (6, 3, 'id_puerta', 'A06', 'A07', 'Reasignación operativa de puerta', 2, '2026-10-02 13:30:00+00');

-- ------------------------------------------------------------
-- historial_equipaje
-- ------------------------------------------------------------
INSERT INTO historial_equipaje (
  id_historial_equipaje, id_equipaje, ubicacion, id_banda, id_vuelo,
  estado_anterior, estado_nuevo, observaciones, registrado_por, fecha_registro
) VALUES
  (1, 1, 'Aeropuerto Internacional La Aurora (GUA)', NULL, 1, NULL, 'REGISTRADO', 'Equipaje registrado en Guatemala', 2, '2026-10-02 06:30:00+00'),
  (2, 1, 'Vuelo GT456', NULL, 1, 'REGISTRADO', 'CARGADO', 'Equipaje cargado al vuelo GT456', 2, '2026-10-02 07:30:00+00'),
  (3, 1, 'Ciudad de México (MEX)', 5, 1, 'CARGADO', 'TRANSFERIDO', 'Equipaje recibido para conexión', 2, '2026-10-02 10:35:00+00'),
  (4, 1, 'Vuelo AM123', 5, 2, 'TRANSFERIDO', 'CARGADO', 'Equipaje cargado al segundo vuelo', 2, '2026-10-02 11:30:00+00'),
  (5, 1, 'Los Ángeles (LAX)', 6, 2, 'CARGADO', 'EN_BANDA', 'Equipaje colocado en banda de entrega', 2, '2026-10-02 14:45:00+00'),
  (6, 1, 'Los Ángeles (LAX)', 6, 2, 'EN_BANDA', 'ENTREGADO', 'Equipaje entregado al pasajero', 2, '2026-10-02 15:05:00+00'),
  (7, 2, 'Ciudad de México (MEX)', NULL, 3, NULL, 'REGISTRADO', 'Equipaje registrado para IB789', 2, '2026-10-02 14:00:00+00'),
  (8, 3, 'Ciudad de Panamá (PTY)', NULL, 4, NULL, 'REGISTRADO', 'Equipaje registrado en Panamá', 2, '2026-10-02 13:30:00+00'),
  (9, 3, 'Vuelo CM208', NULL, 4, 'REGISTRADO', 'CARGADO', 'Equipaje cargado en CM208', 2, '2026-10-02 15:00:00+00'),
  (10, 3, 'Ciudad de México (MEX)', 7, 4, 'CARGADO', 'TRANSFERIDO', 'Equipaje recibido para conexión hacia LAX', 2, '2026-10-02 18:15:00+00'),
  (11, 4, 'Ciudad de México (MEX)', NULL, 5, NULL, 'REGISTRADO', 'Equipaje registrado para Bogotá', 2, '2026-10-02 17:30:00+00'),
  (12, 4, 'Vuelo AV742', NULL, 5, 'REGISTRADO', 'EN_TRANSITO', 'Equipaje asociado al vuelo retrasado AV742', 2, '2026-10-02 20:00:00+00'),
  (13, 5, 'Madrid (MAD)', NULL, 10, NULL, 'REGISTRADO', 'Equipaje registrado para próximo vuelo', 2, '2026-10-01 09:00:00+00'),
  (14, 6, 'Bogotá (BOG)', NULL, 9, NULL, 'REGISTRADO', 'Equipaje retenido tras cancelación del vuelo', 2, '2026-10-01 10:00:00+00'),
  (15, 7, 'Ciudad de México (MEX)', 5, 2, 'TRANSFERIDO', 'EXTRAVIADO', 'Equipaje no localizado durante la transferencia', 2, '2026-10-02 12:15:00+00'),
  (16, 8, 'Ciudad de México (MEX)', 7, 4, 'CARGADO', 'DANADO', 'Se reportó daño externo en el equipaje', 2, '2026-10-02 18:25:00+00');

-- ------------------------------------------------------------
-- auditoria
-- ------------------------------------------------------------
INSERT INTO auditoria (
  id_auditoria, id_usuario, accion, tabla_afectada, id_registro,
  descripcion, fecha_hora, direccion_ip
) VALUES
  (1, 1, 'LOGIN', 'usuarios', '1', 'Inicio de sesión del administrador', '2026-10-02 08:00:00+00', '127.0.0.1'),
  (2, 2, 'ACTUALIZAR_VUELO', 'vuelos', '5', 'Se cambió el estado del vuelo AV742 a RETRASADO', '2026-10-02 16:00:00+00', '127.0.0.1'),
  (3, 2, 'CAMBIO_HORARIO', 'vuelos', '5', 'Se actualizó el horario del vuelo AV742', '2026-10-02 16:05:00+00', '127.0.0.1'),
  (4, 1, 'CANCELAR_VUELO', 'vuelos', '9', 'Se canceló el vuelo AV101', '2026-10-02 10:00:00+00', '127.0.0.1'),
  (5, 2, 'ACTUALIZAR_EQUIPAJE', 'equipajes', '3', 'Equipaje EQ000003 marcado como transferido', '2026-10-02 18:15:00+00', '127.0.0.1'),
  (6, 2, 'REGISTRAR_INCIDENCIA', 'equipajes', '7', 'Equipaje EQ000007 marcado como extraviado', '2026-10-02 12:15:00+00', '127.0.0.1'),
  (7, 2, 'REGISTRAR_INCIDENCIA', 'equipajes', '8', 'Equipaje EQ000008 marcado como dañado', '2026-10-02 18:25:00+00', '127.0.0.1');

-- ------------------------------------------------------------
-- Reinicio de secuencias (los IDs se insertaron explícitamente)
-- ------------------------------------------------------------
SELECT setval(pg_get_serial_sequence('roles', 'id_rol'),
  COALESCE((SELECT MAX(id_rol) FROM roles), 1), true);
SELECT setval(pg_get_serial_sequence('usuarios', 'id_usuario'),
  COALESCE((SELECT MAX(id_usuario) FROM usuarios), 1), true);
SELECT setval(pg_get_serial_sequence('aeropuertos', 'id_aeropuerto'),
  COALESCE((SELECT MAX(id_aeropuerto) FROM aeropuertos), 1), true);
SELECT setval(pg_get_serial_sequence('pasajeros', 'id_pasajero'),
  COALESCE((SELECT MAX(id_pasajero) FROM pasajeros), 1), true);
SELECT setval(pg_get_serial_sequence('puertas', 'id_puerta'),
  COALESCE((SELECT MAX(id_puerta) FROM puertas), 1), true);
SELECT setval(pg_get_serial_sequence('bandas_equipaje', 'id_banda'),
  COALESCE((SELECT MAX(id_banda) FROM bandas_equipaje), 1), true);
SELECT setval(pg_get_serial_sequence('vuelos', 'id_vuelo'),
  COALESCE((SELECT MAX(id_vuelo) FROM vuelos), 1), true);
SELECT setval(pg_get_serial_sequence('itinerarios', 'id_itinerario'),
  COALESCE((SELECT MAX(id_itinerario) FROM itinerarios), 1), true);
SELECT setval(pg_get_serial_sequence('pasajero_vuelo', 'id_pasajero_vuelo'),
  COALESCE((SELECT MAX(id_pasajero_vuelo) FROM pasajero_vuelo), 1), true);
SELECT setval(pg_get_serial_sequence('escalas', 'id_escala'),
  COALESCE((SELECT MAX(id_escala) FROM escalas), 1), true);
SELECT setval(pg_get_serial_sequence('equipajes', 'id_equipaje'),
  COALESCE((SELECT MAX(id_equipaje) FROM equipajes), 1), true);
SELECT setval(pg_get_serial_sequence('equipaje_vuelo', 'id_equipaje_vuelo'),
  COALESCE((SELECT MAX(id_equipaje_vuelo) FROM equipaje_vuelo), 1), true);
SELECT setval(pg_get_serial_sequence('notificaciones', 'id_notificacion'),
  COALESCE((SELECT MAX(id_notificacion) FROM notificaciones), 1), true);
SELECT setval(pg_get_serial_sequence('historial_vuelo', 'id_historial_vuelo'),
  COALESCE((SELECT MAX(id_historial_vuelo) FROM historial_vuelo), 1), true);
SELECT setval(pg_get_serial_sequence('historial_equipaje', 'id_historial_equipaje'),
  COALESCE((SELECT MAX(id_historial_equipaje) FROM historial_equipaje), 1), true);
SELECT setval(pg_get_serial_sequence('auditoria', 'id_auditoria'),
  COALESCE((SELECT MAX(id_auditoria) FROM auditoria), 1), true);

COMMIT;
