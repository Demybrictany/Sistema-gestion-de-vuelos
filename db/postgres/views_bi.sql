-- ============================================================
-- Vistas de solo lectura para Business Intelligence (Power BI)
--
-- No modifican datos. Se recrean con:
--   npm run db:views
-- o directamente:
--   psql "$DATABASE_URL" -f db/postgres/views_bi.sql
-- ============================================================

BEGIN;

DROP VIEW IF EXISTS bi_kpis_diarios CASCADE;
DROP VIEW IF EXISTS bi_auditoria CASCADE;
DROP VIEW IF EXISTS bi_historial_equipaje CASCADE;
DROP VIEW IF EXISTS bi_historial_vuelo CASCADE;
DROP VIEW IF EXISTS bi_notificaciones CASCADE;
DROP VIEW IF EXISTS bi_equipaje_tramos CASCADE;
DROP VIEW IF EXISTS bi_equipajes CASCADE;
DROP VIEW IF EXISTS bi_pasajeros_vuelo CASCADE;
DROP VIEW IF EXISTS bi_vuelos CASCADE;

-- ------------------------------------------------------------
-- Vuelos con aeropuertos, puerta y ocupación
-- ------------------------------------------------------------
CREATE VIEW bi_vuelos AS
SELECT
  v.id_vuelo,
  v.codigo_vuelo,
  ao.codigo_iata AS origen_iata,
  ao.nombre AS origen_nombre,
  ao.ciudad AS origen_ciudad,
  ad.codigo_iata AS destino_iata,
  ad.nombre AS destino_nombre,
  ad.ciudad AS destino_ciudad,
  v.fecha_salida,
  v.hora_salida,
  v.fecha_llegada,
  v.hora_llegada,
  v.id_puerta,
  p.numero AS puerta,
  p.zona AS zona_puerta,
  v.estado::text AS estado,
  v.capacidad_pasajeros,
  COALESCE((
    SELECT COUNT(*)
    FROM pasajero_vuelo pv
    WHERE pv.id_vuelo = v.id_vuelo
      AND pv.estado <> 'CANCELADO'
  ), 0)::int AS pasajeros_asignados,
  COALESCE((
    SELECT COUNT(*)
    FROM equipaje_vuelo ev
    WHERE ev.id_vuelo = v.id_vuelo
  ), 0)::int AS equipajes,
  v.created_at,
  v.updated_at
FROM vuelos v
JOIN aeropuertos ao ON ao.id_aeropuerto = v.id_aeropuerto_origen
JOIN aeropuertos ad ON ad.id_aeropuerto = v.id_aeropuerto_destino
LEFT JOIN puertas p ON p.id_puerta = v.id_puerta;

-- ------------------------------------------------------------
-- Pasajeros por vuelo
-- ------------------------------------------------------------
CREATE VIEW bi_pasajeros_vuelo AS
SELECT
  pv.id_pasajero_vuelo,
  pv.id_vuelo,
  v.codigo_vuelo,
  v.fecha_salida,
  v.hora_salida,
  v.estado::text AS estado_vuelo,
  pv.id_pasajero,
  p.nombres,
  p.apellidos,
  p.nacionalidad,
  p.pasaporte,
  pv.numero_asiento,
  pv.estado::text AS estado_reserva,
  pv.fecha_registro,
  it.codigo_reserva
FROM pasajero_vuelo pv
JOIN pasajeros p ON p.id_pasajero = pv.id_pasajero
JOIN vuelos v ON v.id_vuelo = pv.id_vuelo
LEFT JOIN itinerarios it ON it.id_itinerario = pv.id_itinerario;

-- ------------------------------------------------------------
-- Equipajes con pasajero, ruta y banda
-- ------------------------------------------------------------
CREATE VIEW bi_equipajes AS
SELECT
  e.id_equipaje,
  e.codigo_equipaje,
  e.id_pasajero,
  (p.nombres || ' ' || p.apellidos) AS pasajero,
  e.peso,
  e.estado::text AS estado,
  ao.codigo_iata AS origen_iata,
  ad.codigo_iata AS destino_final_iata,
  b.numero AS banda_actual,
  b.zona AS banda_zona,
  e.created_at,
  e.updated_at
FROM equipajes e
JOIN pasajeros p ON p.id_pasajero = e.id_pasajero
JOIN aeropuertos ao ON ao.id_aeropuerto = e.origen
JOIN aeropuertos ad ON ad.id_aeropuerto = e.destino_final
LEFT JOIN bandas_equipaje b ON b.id_banda = e.id_banda_actual;

-- ------------------------------------------------------------
-- Tramos de equipaje (conexiones)
-- ------------------------------------------------------------
CREATE VIEW bi_equipaje_tramos AS
SELECT
  ev.id_equipaje_vuelo,
  ev.id_equipaje,
  e.codigo_equipaje,
  ev.id_vuelo,
  v.codigo_vuelo,
  v.fecha_salida,
  v.hora_salida,
  ev.orden_vuelo,
  ev.estado::text AS estado,
  bo.numero AS banda_origen,
  bd.numero AS banda_destino,
  ev.fecha_registro
FROM equipaje_vuelo ev
JOIN equipajes e ON e.id_equipaje = ev.id_equipaje
JOIN vuelos v ON v.id_vuelo = ev.id_vuelo
LEFT JOIN bandas_equipaje bo ON bo.id_banda = ev.id_banda_origen
LEFT JOIN bandas_equipaje bd ON bd.id_banda = ev.id_banda_destino;

-- ------------------------------------------------------------
-- Notificaciones
-- ------------------------------------------------------------
CREATE VIEW bi_notificaciones AS
SELECT
  n.id_notificacion,
  n.id_pasajero,
  (p.nombres || ' ' || p.apellidos) AS pasajero,
  n.id_vuelo,
  v.codigo_vuelo,
  n.id_equipaje,
  e.codigo_equipaje,
  n.tipo::text AS tipo,
  n.titulo,
  n.leida,
  n.fecha_envio,
  n.fecha_lectura
FROM notificaciones n
JOIN pasajeros p ON p.id_pasajero = n.id_pasajero
LEFT JOIN vuelos v ON v.id_vuelo = n.id_vuelo
LEFT JOIN equipajes e ON e.id_equipaje = n.id_equipaje;

-- ------------------------------------------------------------
-- Historial de vuelos
-- ------------------------------------------------------------
CREATE VIEW bi_historial_vuelo AS
SELECT
  h.id_historial_vuelo,
  h.id_vuelo,
  v.codigo_vuelo,
  h.campo_modificado,
  h.valor_anterior,
  h.valor_nuevo,
  h.motivo,
  h.modificado_por,
  u.nombre_usuario AS usuario,
  h.fecha_modificacion
FROM historial_vuelo h
JOIN vuelos v ON v.id_vuelo = h.id_vuelo
LEFT JOIN usuarios u ON u.id_usuario = h.modificado_por;

-- ------------------------------------------------------------
-- Historial de equipajes
-- ------------------------------------------------------------
CREATE VIEW bi_historial_equipaje AS
SELECT
  h.id_historial_equipaje,
  h.id_equipaje,
  e.codigo_equipaje,
  h.ubicacion,
  h.id_banda,
  b.numero AS banda,
  h.id_vuelo,
  v.codigo_vuelo,
  h.estado_anterior,
  h.estado_nuevo,
  h.observaciones,
  h.registrado_por,
  u.nombre_usuario AS usuario,
  h.fecha_registro
FROM historial_equipaje h
JOIN equipajes e ON e.id_equipaje = h.id_equipaje
LEFT JOIN bandas_equipaje b ON b.id_banda = h.id_banda
LEFT JOIN vuelos v ON v.id_vuelo = h.id_vuelo
LEFT JOIN usuarios u ON u.id_usuario = h.registrado_por;

-- ------------------------------------------------------------
-- Auditoría
-- ------------------------------------------------------------
CREATE VIEW bi_auditoria AS
SELECT
  a.id_auditoria,
  a.id_usuario,
  u.nombre_usuario AS usuario,
  a.accion,
  a.tabla_afectada,
  a.id_registro,
  a.descripcion,
  a.fecha_hora,
  a.direccion_ip
FROM auditoria a
LEFT JOIN usuarios u ON u.id_usuario = a.id_usuario;

-- ------------------------------------------------------------
-- KPIs diarios (una fila por día del rango de vuelos)
-- ------------------------------------------------------------
CREATE VIEW bi_kpis_diarios AS
SELECT
  d::date AS fecha,
  (SELECT COUNT(*) FROM vuelos v
   WHERE v.fecha_salida = d::date)::int AS vuelos,
  (SELECT COUNT(*) FROM vuelos v
   WHERE v.fecha_salida = d::date
     AND v.estado = 'CANCELADO')::int AS vuelos_cancelados,
  (SELECT COUNT(*)
   FROM pasajero_vuelo pv
   JOIN vuelos v ON v.id_vuelo = pv.id_vuelo
   WHERE v.fecha_salida = d::date
     AND pv.estado <> 'CANCELADO')::int AS pasajeros,
  (SELECT COUNT(*) FROM equipajes e
   WHERE e.created_at::date = d::date)::int AS equipajes_registrados,
  (SELECT COUNT(*) FROM notificaciones n
   WHERE n.fecha_envio::date = d::date)::int AS notificaciones_enviadas,
  (SELECT COUNT(*) FROM auditoria a
   WHERE a.fecha_hora::date = d::date)::int AS operaciones_auditadas
FROM generate_series(
  COALESCE((SELECT MIN(fecha_salida) FROM vuelos), CURRENT_DATE),
  COALESCE((SELECT MAX(fecha_salida) FROM vuelos), CURRENT_DATE),
  interval '1 day'
) AS d;

COMMIT;
