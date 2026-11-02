# Manual operativo del AICM

## Puertas de embarque

El Aeropuerto Internacional de la Ciudad de México (AICM) opera en este sistema con **25 puertas**, numeradas de A01 a A25.

- Las puertas **A01 a A05** son de zona **NACIONAL**.
- Las puertas **A06 a A25** son de zona **INTERNACIONAL**.
- La puerta **A15** está en **MANTENIMIENTO** y no debe asignarse.
- La puerta **A25** está **INACTIVA**.

Una puerta solo puede tener **un vuelo a la vez**. La regla se valida en la aplicación y en la base de datos: no se permite asignar dos vuelos con horarios solapados a la misma puerta.

## Estados del vuelo

Todo vuelo nace en estado **PROGRAMADO**. Los estados posibles son:

- **PROGRAMADO:** el vuelo está planificado y aún no inició el abordaje.
- **ABORDANDO:** el proceso de embarque está activo.
- **ABORDADO:** todos los pasajeros abordaron y el vuelo espera despegue.
- **EN_VUELO:** el vuelo está en tránsito.
- **ATERRIZADO:** el vuelo llegó a su destino.
- **FINALIZADO:** la operación terminó.
- **RETRASADO:** la salida se pospuso por condiciones operativas.
- **CANCELADO:** el vuelo no se realizará; requiere un motivo.

Las transiciones se controlan con una máquina de estados. Por ejemplo, un vuelo PROGRAMADO no puede pasar directamente a FINALIZADO.

## Cambios de horario y puerta

Cuando un vuelo cambia de horario o de puerta, el sistema registra el cambio en el historial y notifica a los pasajeros con reserva activa. Una cancelación definitiva exige un motivo y también genera aviso.

## Notificaciones a pasajeros

El sistema genera avisos automáticos con estos tipos:

- **PUERTA_ASIGNADA:** puerta de embarque del vuelo.
- **CAMBIO_PUERTA:** la puerta cambió respecto de un aviso anterior.
- **BANDA_EQUIPAJE:** banda donde se entrega el equipaje.
- **CAMBIO_HORARIO:** nueva hora de salida o llegada.
- **VUELO_RETRASADO:** demora operativa.
- **VUELO_CANCELADO:** cancelación definitiva.
- **ESCALA:** información de una conexión.
- **INFORMACION_GENERAL:** avisos del personal.

Los avisos se entregan por correo mediante una cola asíncrona (RabbitMQ) y un worker. Cada entrega queda registrada con estado PENDIENTE, ENVIADA, SIMULADA o FALLIDA.

## Equipaje y bandas

El aeropuerto tiene **10 bandas** de equipaje, de B01 a B10.

- **B04** está en **MANTENIMIENTO** y **B10** está **INACTIVA**.
- Cuando el equipaje llega a una banda de entrega, el pasajero recibe un aviso **BANDA_EQUIPAJE**.
- En una conexión, el equipaje se transfiere automáticamente al siguiente vuelo **sin que el pasajero tenga que retirarlo**.

## Escalas y conexiones

Una escala conecta dos vuelos del mismo itinerario. El sistema valida que el itinerario pertenezca al pasajero y que exista continuidad entre el vuelo de llegada y el de salida.

Al asignar o cambiar la puerta de una escala, el pasajero debe recibir la información de la nueva puerta y la hora de salida de la conexión.
