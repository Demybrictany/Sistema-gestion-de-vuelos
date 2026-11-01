# Políticas para pasajeros

## Reserva y check-in

Al asignar un pasajero a un vuelo, el sistema registra la reserva y genera un aviso con:

- el código del vuelo,
- la fecha y hora de salida,
- la puerta de embarque, si ya está asignada.

El pasajero puede consultar sus vuelos, escalas, equipaje y notificaciones. Solo tiene acceso a **su propia información**; no puede consultar datos de otros pasajeros.

## Documentos y datos personales

Los datos personales del pasajero se usan solo para la operación del vuelo y las notificaciones. El personal con rol ADMINISTRADOR o SECRETARIO puede gestionar la operación, pero el agente de IA no debe revelar información de terceros.

Si un pasajero pregunta por datos de otra persona, el sistema debe negarse y explicar que solo puede consultar su propia información.

## Cambios y cancelaciones

- Un cambio de hora o de puerta genera una notificación y queda en el historial del vuelo.
- Una cancelación definitiva requiere un motivo y se notifica a los pasajeros con reserva activa.
- Las reservas canceladas liberan su lugar y no deben recibir avisos de cambios operativos.

## Equipaje

- Cada equipaje se registra a nombre de un pasajero y tiene un código único, por ejemplo EQ000001.
- El equipaje puede pasar por varios tramos cuando hay conexión.
- En una conexión, el pasajero **no retira** el equipaje: el sistema lo transfiere al vuelo siguiente.
- Cuando el equipaje se coloca en una banda, se notifica al pasajero.
- Los estados de incidencia (dañado, extraviado) se registran en el historial y los atiende el personal.

## Consultas al agente

El agente responde sobre información pública del sistema y sobre los datos del propio pasajero. Cuando la respuesta proviene de un documento, debe citar la fuente. Si no tiene información suficiente, debe decirlo en lugar de inventar.
