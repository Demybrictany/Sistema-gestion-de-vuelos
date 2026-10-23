-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: aeropuerto_db
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `aeropuertos`
--

DROP TABLE IF EXISTS `aeropuertos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `aeropuertos` (
  `id_aeropuerto` int NOT NULL AUTO_INCREMENT,
  `codigo_iata` char(3) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ciudad` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pais` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` enum('ACTIVO','INACTIVO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVO',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_aeropuerto`),
  UNIQUE KEY `codigo_iata` (`codigo_iata`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `aeropuertos`
--

LOCK TABLES `aeropuertos` WRITE;
/*!40000 ALTER TABLE `aeropuertos` DISABLE KEYS */;
INSERT INTO `aeropuertos` VALUES (1,'MEX','Aeropuerto Internacional de la Ciudad de México','Ciudad de México','México','ACTIVO','2026-10-02 23:45:34','2026-10-02 23:45:34'),(2,'GUA','Aeropuerto Internacional La Aurora','Ciudad de Guatemala','Guatemala','ACTIVO','2026-10-02 23:45:34','2026-10-02 23:45:34'),(3,'LAX','Aeropuerto Internacional de Los Ángeles','Los Ángeles','Estados Unidos','ACTIVO','2026-10-02 23:45:34','2026-10-02 23:45:34'),(4,'MAD','Aeropuerto Adolfo Suárez Madrid-Barajas','Madrid','España','ACTIVO','2026-10-02 23:45:34','2026-10-02 23:45:34'),(5,'PTY','Aeropuerto Internacional de Tocumen','Ciudad de Panamá','Panamá','ACTIVO','2026-10-02 23:45:34','2026-10-02 23:45:34'),(6,'BOG','Aeropuerto Internacional El Dorado','Bogotá','Colombia','ACTIVO','2026-10-02 23:45:34','2026-10-02 23:45:34');
/*!40000 ALTER TABLE `aeropuertos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auditoria`
--

DROP TABLE IF EXISTS `auditoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auditoria` (
  `id_auditoria` bigint NOT NULL AUTO_INCREMENT,
  `id_usuario` int DEFAULT NULL,
  `accion` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tabla_afectada` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_registro` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `fecha_hora` datetime DEFAULT CURRENT_TIMESTAMP,
  `direccion_ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_auditoria`),
  KEY `idx_auditoria_usuario` (`id_usuario`),
  KEY `idx_auditoria_fecha` (`fecha_hora`),
  KEY `idx_auditoria_tabla` (`tabla_afectada`),
  CONSTRAINT `fk_auditoria_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auditoria`
--

LOCK TABLES `auditoria` WRITE;
/*!40000 ALTER TABLE `auditoria` DISABLE KEYS */;
INSERT INTO `auditoria` VALUES (1,1,'LOGIN','usuarios','1','Inicio de sesión del administrador','2026-10-02 08:00:00','127.0.0.1'),(2,2,'ACTUALIZAR_VUELO','vuelos','5','Se cambió el estado del vuelo AV742 a RETRASADO','2026-10-02 16:00:00','127.0.0.1'),(3,2,'CAMBIO_HORARIO','vuelos','5','Se actualizó el horario del vuelo AV742','2026-10-02 16:05:00','127.0.0.1'),(4,1,'CANCELAR_VUELO','vuelos','9','Se canceló el vuelo AV101','2026-10-02 10:00:00','127.0.0.1'),(5,2,'ACTUALIZAR_EQUIPAJE','equipajes','3','Equipaje EQ000003 marcado como transferido','2026-10-02 18:15:00','127.0.0.1'),(6,2,'REGISTRAR_INCIDENCIA','equipajes','7','Equipaje EQ000007 marcado como extraviado','2026-10-02 12:15:00','127.0.0.1'),(7,2,'REGISTRAR_INCIDENCIA','equipajes','8','Equipaje EQ000008 marcado como dañado','2026-10-02 18:25:00','127.0.0.1');
/*!40000 ALTER TABLE `auditoria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bandas_equipaje`
--

DROP TABLE IF EXISTS `bandas_equipaje`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bandas_equipaje` (
  `id_banda` int NOT NULL AUTO_INCREMENT,
  `numero` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `zona` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` enum('DISPONIBLE','MANTENIMIENTO','INACTIVA') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DISPONIBLE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_banda`),
  UNIQUE KEY `numero` (`numero`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bandas_equipaje`
--

LOCK TABLES `bandas_equipaje` WRITE;
/*!40000 ALTER TABLE `bandas_equipaje` DISABLE KEYS */;
INSERT INTO `bandas_equipaje` VALUES (1,'B01','NACIONAL','DISPONIBLE','2026-10-02 23:45:34','2026-10-02 23:45:34'),(2,'B02','NACIONAL','DISPONIBLE','2026-10-02 23:45:34','2026-10-02 23:45:34'),(3,'B03','NACIONAL','DISPONIBLE','2026-10-02 23:45:34','2026-10-02 23:45:34'),(4,'B04','NACIONAL','MANTENIMIENTO','2026-10-02 23:45:34','2026-10-02 23:45:34'),(5,'B05','INTERNACIONAL','DISPONIBLE','2026-10-02 23:45:34','2026-10-02 23:45:34'),(6,'B06','INTERNACIONAL','DISPONIBLE','2026-10-02 23:45:34','2026-10-02 23:45:34'),(7,'B07','INTERNACIONAL','DISPONIBLE','2026-10-02 23:45:34','2026-10-02 23:45:34'),(8,'B08','INTERNACIONAL','DISPONIBLE','2026-10-02 23:45:34','2026-10-02 23:45:34'),(9,'B09','INTERNACIONAL','DISPONIBLE','2026-10-02 23:45:34','2026-10-02 23:45:34'),(10,'B10','INTERNACIONAL','INACTIVA','2026-10-02 23:45:34','2026-10-02 23:45:34');
/*!40000 ALTER TABLE `bandas_equipaje` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipaje_vuelo`
--

DROP TABLE IF EXISTS `equipaje_vuelo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipaje_vuelo` (
  `id_equipaje_vuelo` int NOT NULL AUTO_INCREMENT,
  `id_equipaje` int NOT NULL,
  `id_vuelo` int NOT NULL,
  `id_banda_origen` int DEFAULT NULL,
  `id_banda_destino` int DEFAULT NULL,
  `orden_vuelo` int NOT NULL DEFAULT '1',
  `estado` enum('REGISTRADO','CARGADO','EN_VUELO','RECIBIDO','TRANSFERIDO','ENTREGADO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'REGISTRADO',
  `fecha_registro` datetime DEFAULT CURRENT_TIMESTAMP,
  `registrado_por` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_equipaje_vuelo`),
  UNIQUE KEY `uq_equipaje_vuelo` (`id_equipaje`,`id_vuelo`),
  KEY `fk_ev_banda_origen` (`id_banda_origen`),
  KEY `fk_ev_banda_destino` (`id_banda_destino`),
  KEY `fk_ev_usuario` (`registrado_por`),
  KEY `idx_equipaje_vuelo_vuelo` (`id_vuelo`),
  CONSTRAINT `fk_ev_banda_destino` FOREIGN KEY (`id_banda_destino`) REFERENCES `bandas_equipaje` (`id_banda`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ev_banda_origen` FOREIGN KEY (`id_banda_origen`) REFERENCES `bandas_equipaje` (`id_banda`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ev_equipaje` FOREIGN KEY (`id_equipaje`) REFERENCES `equipajes` (`id_equipaje`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_ev_usuario` FOREIGN KEY (`registrado_por`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ev_vuelo` FOREIGN KEY (`id_vuelo`) REFERENCES `vuelos` (`id_vuelo`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipaje_vuelo`
--

LOCK TABLES `equipaje_vuelo` WRITE;
/*!40000 ALTER TABLE `equipaje_vuelo` DISABLE KEYS */;
INSERT INTO `equipaje_vuelo` VALUES (1,1,1,NULL,5,1,'RECIBIDO','2026-10-02 06:30:00',2,'2026-10-02 23:45:34','2026-10-02 23:45:34'),(2,1,2,5,6,2,'ENTREGADO','2026-10-02 11:00:00',2,'2026-10-02 23:45:34','2026-10-02 23:45:34'),(3,2,3,NULL,NULL,1,'REGISTRADO','2026-10-02 14:00:00',2,'2026-10-02 23:45:34','2026-10-02 23:45:34'),(4,3,4,NULL,7,1,'TRANSFERIDO','2026-10-02 13:30:00',2,'2026-10-02 23:45:34','2026-10-02 23:45:34'),(5,3,11,7,NULL,2,'REGISTRADO','2026-10-02 18:20:00',2,'2026-10-02 23:45:34','2026-10-02 23:45:34'),(6,4,5,NULL,NULL,1,'EN_VUELO','2026-10-02 18:30:00',2,'2026-10-02 23:45:34','2026-10-02 23:45:34'),(7,5,10,NULL,NULL,1,'REGISTRADO','2026-10-01 09:00:00',2,'2026-10-02 23:45:34','2026-10-02 23:45:34'),(8,6,9,NULL,NULL,1,'REGISTRADO','2026-10-01 10:00:00',2,'2026-10-02 23:45:34','2026-10-02 23:45:34'),(9,7,1,NULL,5,1,'RECIBIDO','2026-10-02 06:35:00',2,'2026-10-02 23:45:34','2026-10-02 23:45:34'),(10,7,2,5,NULL,2,'TRANSFERIDO','2026-10-02 11:05:00',2,'2026-10-02 23:45:34','2026-10-02 23:45:34'),(11,8,4,NULL,7,1,'RECIBIDO','2026-10-02 13:35:00',2,'2026-10-02 23:45:34','2026-10-02 23:45:34');
/*!40000 ALTER TABLE `equipaje_vuelo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipajes`
--

DROP TABLE IF EXISTS `equipajes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipajes` (
  `id_equipaje` int NOT NULL AUTO_INCREMENT,
  `codigo_equipaje` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_pasajero` int NOT NULL,
  `peso` decimal(6,2) DEFAULT NULL,
  `origen` int NOT NULL,
  `destino_final` int NOT NULL,
  `id_banda_actual` int DEFAULT NULL,
  `estado` enum('REGISTRADO','EN_TRANSITO','EN_BANDA','CARGADO','TRANSFERIDO','ENTREGADO','EXTRAVIADO','DANADO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'REGISTRADO',
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_equipaje`),
  UNIQUE KEY `codigo_equipaje` (`codigo_equipaje`),
  KEY `fk_equipaje_origen` (`origen`),
  KEY `fk_equipaje_destino` (`destino_final`),
  KEY `fk_equipaje_banda` (`id_banda_actual`),
  KEY `idx_equipaje_pasajero` (`id_pasajero`),
  KEY `idx_equipaje_estado` (`estado`),
  CONSTRAINT `fk_equipaje_banda` FOREIGN KEY (`id_banda_actual`) REFERENCES `bandas_equipaje` (`id_banda`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_equipaje_destino` FOREIGN KEY (`destino_final`) REFERENCES `aeropuertos` (`id_aeropuerto`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_equipaje_origen` FOREIGN KEY (`origen`) REFERENCES `aeropuertos` (`id_aeropuerto`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_equipaje_pasajero` FOREIGN KEY (`id_pasajero`) REFERENCES `pasajeros` (`id_pasajero`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_equipaje_peso` CHECK (((`peso` is null) or (`peso` >= 0)))
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipajes`
--

LOCK TABLES `equipajes` WRITE;
/*!40000 ALTER TABLE `equipajes` DISABLE KEYS */;
INSERT INTO `equipajes` VALUES (1,'EQ000001',1,18.50,2,3,6,'ENTREGADO','Equipaje completó conexión GUA - MEX - LAX','2026-10-02 23:45:34','2026-10-02 23:45:34'),(2,'EQ000002',2,21.30,1,4,NULL,'REGISTRADO','Equipaje preparado para vuelo MEX - MAD','2026-10-02 23:45:34','2026-10-02 23:45:34'),(3,'EQ000003',3,16.80,5,3,7,'TRANSFERIDO','Equipaje en conexión PTY - MEX - LAX','2026-10-02 23:45:34','2026-10-02 23:45:34'),(4,'EQ000004',4,19.40,1,6,NULL,'EN_TRANSITO','Equipaje en ruta hacia Bogotá','2026-10-02 23:45:34','2026-10-02 23:45:34'),(5,'EQ000005',5,23.10,4,1,NULL,'REGISTRADO','Equipaje registrado para vuelo Madrid - México','2026-10-02 23:45:34','2026-10-02 23:45:34'),(6,'EQ000006',6,17.20,6,1,NULL,'REGISTRADO','Equipaje asociado a vuelo cancelado','2026-10-02 23:45:34','2026-10-02 23:45:34'),(7,'EQ000007',1,12.60,2,3,NULL,'EXTRAVIADO','Equipaje marcado para seguimiento especial','2026-10-02 23:45:34','2026-10-02 23:45:34'),(8,'EQ000008',3,20.00,5,3,7,'DANADO','Daño reportado durante manipulación','2026-10-02 23:45:34','2026-10-02 23:45:34');
/*!40000 ALTER TABLE `equipajes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `escalas`
--

DROP TABLE IF EXISTS `escalas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `escalas` (
  `id_escala` int NOT NULL AUTO_INCREMENT,
  `id_itinerario` int NOT NULL,
  `id_vuelo` int NOT NULL,
  `numero_escala` int NOT NULL,
  `aeropuerto_llegada` int NOT NULL,
  `aeropuerto_salida` int NOT NULL,
  `hora_llegada` datetime NOT NULL,
  `hora_salida` datetime DEFAULT NULL,
  `id_puerta_llegada` int DEFAULT NULL,
  `id_puerta_salida` int DEFAULT NULL,
  `estado` enum('PENDIENTE','EN_TRANSITO','COMPLETADA','CANCELADA') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDIENTE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_escala`),
  UNIQUE KEY `uq_itinerario_escala` (`id_itinerario`,`numero_escala`),
  KEY `fk_escala_vuelo` (`id_vuelo`),
  KEY `fk_escala_aeropuerto_llegada` (`aeropuerto_llegada`),
  KEY `fk_escala_aeropuerto_salida` (`aeropuerto_salida`),
  KEY `fk_escala_puerta_llegada` (`id_puerta_llegada`),
  KEY `fk_escala_puerta_salida` (`id_puerta_salida`),
  CONSTRAINT `fk_escala_aeropuerto_llegada` FOREIGN KEY (`aeropuerto_llegada`) REFERENCES `aeropuertos` (`id_aeropuerto`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_escala_aeropuerto_salida` FOREIGN KEY (`aeropuerto_salida`) REFERENCES `aeropuertos` (`id_aeropuerto`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_escala_itinerario` FOREIGN KEY (`id_itinerario`) REFERENCES `itinerarios` (`id_itinerario`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_escala_puerta_llegada` FOREIGN KEY (`id_puerta_llegada`) REFERENCES `puertas` (`id_puerta`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_escala_puerta_salida` FOREIGN KEY (`id_puerta_salida`) REFERENCES `puertas` (`id_puerta`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_escala_vuelo` FOREIGN KEY (`id_vuelo`) REFERENCES `vuelos` (`id_vuelo`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `escalas`
--

LOCK TABLES `escalas` WRITE;
/*!40000 ALTER TABLE `escalas` DISABLE KEYS */;
INSERT INTO `escalas` VALUES (1,1,2,1,1,1,'2026-10-02 10:20:00','2026-10-02 12:00:00',1,6,'COMPLETADA','2026-10-02 23:45:34','2026-10-02 23:45:34'),(2,3,11,1,1,1,'2026-10-02 18:00:00','2026-10-03 16:00:00',8,14,'EN_TRANSITO','2026-10-02 23:45:34','2026-10-02 23:45:34');
/*!40000 ALTER TABLE `escalas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historial_equipaje`
--

DROP TABLE IF EXISTS `historial_equipaje`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historial_equipaje` (
  `id_historial_equipaje` int NOT NULL AUTO_INCREMENT,
  `id_equipaje` int NOT NULL,
  `ubicacion` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_banda` int DEFAULT NULL,
  `id_vuelo` int DEFAULT NULL,
  `estado_anterior` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado_nuevo` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `registrado_por` int DEFAULT NULL,
  `fecha_registro` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_historial_equipaje`),
  KEY `fk_historial_equipaje_banda` (`id_banda`),
  KEY `fk_historial_equipaje_vuelo` (`id_vuelo`),
  KEY `fk_historial_equipaje_usuario` (`registrado_por`),
  KEY `idx_historial_equipaje` (`id_equipaje`),
  CONSTRAINT `fk_historial_equipaje` FOREIGN KEY (`id_equipaje`) REFERENCES `equipajes` (`id_equipaje`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_historial_equipaje_banda` FOREIGN KEY (`id_banda`) REFERENCES `bandas_equipaje` (`id_banda`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_historial_equipaje_usuario` FOREIGN KEY (`registrado_por`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_historial_equipaje_vuelo` FOREIGN KEY (`id_vuelo`) REFERENCES `vuelos` (`id_vuelo`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historial_equipaje`
--

LOCK TABLES `historial_equipaje` WRITE;
/*!40000 ALTER TABLE `historial_equipaje` DISABLE KEYS */;
INSERT INTO `historial_equipaje` VALUES (1,1,'Aeropuerto Internacional La Aurora (GUA)',NULL,1,NULL,'REGISTRADO','Equipaje registrado en Guatemala',2,'2026-10-02 06:30:00'),(2,1,'Vuelo GT456',NULL,1,'REGISTRADO','CARGADO','Equipaje cargado al vuelo GT456',2,'2026-10-02 07:30:00'),(3,1,'Ciudad de México (MEX)',5,1,'CARGADO','TRANSFERIDO','Equipaje recibido para conexión',2,'2026-10-02 10:35:00'),(4,1,'Vuelo AM123',5,2,'TRANSFERIDO','CARGADO','Equipaje cargado al segundo vuelo',2,'2026-10-02 11:30:00'),(5,1,'Los Ángeles (LAX)',6,2,'CARGADO','EN_BANDA','Equipaje colocado en banda de entrega',2,'2026-10-02 14:45:00'),(6,1,'Los Ángeles (LAX)',6,2,'EN_BANDA','ENTREGADO','Equipaje entregado al pasajero',2,'2026-10-02 15:05:00'),(7,2,'Ciudad de México (MEX)',NULL,3,NULL,'REGISTRADO','Equipaje registrado para IB789',2,'2026-10-02 14:00:00'),(8,3,'Ciudad de Panamá (PTY)',NULL,4,NULL,'REGISTRADO','Equipaje registrado en Panamá',2,'2026-10-02 13:30:00'),(9,3,'Vuelo CM208',NULL,4,'REGISTRADO','CARGADO','Equipaje cargado en CM208',2,'2026-10-02 15:00:00'),(10,3,'Ciudad de México (MEX)',7,4,'CARGADO','TRANSFERIDO','Equipaje recibido para conexión hacia LAX',2,'2026-10-02 18:15:00'),(11,4,'Ciudad de México (MEX)',NULL,5,NULL,'REGISTRADO','Equipaje registrado para Bogotá',2,'2026-10-02 17:30:00'),(12,4,'Vuelo AV742',NULL,5,'REGISTRADO','EN_TRANSITO','Equipaje asociado al vuelo retrasado AV742',2,'2026-10-02 20:00:00'),(13,5,'Madrid (MAD)',NULL,10,NULL,'REGISTRADO','Equipaje registrado para próximo vuelo',2,'2026-10-01 09:00:00'),(14,6,'Bogotá (BOG)',NULL,9,NULL,'REGISTRADO','Equipaje retenido tras cancelación del vuelo',2,'2026-10-01 10:00:00'),(15,7,'Ciudad de México (MEX)',5,2,'TRANSFERIDO','EXTRAVIADO','Equipaje no localizado durante la transferencia',2,'2026-10-02 12:15:00'),(16,8,'Ciudad de México (MEX)',7,4,'CARGADO','DANADO','Se reportó daño externo en el equipaje',2,'2026-10-02 18:25:00');
/*!40000 ALTER TABLE `historial_equipaje` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historial_vuelo`
--

DROP TABLE IF EXISTS `historial_vuelo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historial_vuelo` (
  `id_historial_vuelo` int NOT NULL AUTO_INCREMENT,
  `id_vuelo` int NOT NULL,
  `campo_modificado` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor_anterior` text COLLATE utf8mb4_unicode_ci,
  `valor_nuevo` text COLLATE utf8mb4_unicode_ci,
  `motivo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modificado_por` int DEFAULT NULL,
  `fecha_modificacion` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_historial_vuelo`),
  KEY `fk_historial_vuelo_usuario` (`modificado_por`),
  KEY `idx_historial_vuelo` (`id_vuelo`),
  CONSTRAINT `fk_historial_vuelo` FOREIGN KEY (`id_vuelo`) REFERENCES `vuelos` (`id_vuelo`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_historial_vuelo_usuario` FOREIGN KEY (`modificado_por`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historial_vuelo`
--

LOCK TABLES `historial_vuelo` WRITE;
/*!40000 ALTER TABLE `historial_vuelo` DISABLE KEYS */;
INSERT INTO `historial_vuelo` VALUES (1,5,'estado','PROGRAMADO','RETRASADO','Condiciones operativas',2,'2026-10-02 16:00:00'),(2,5,'hora_salida','19:30:00','20:30:00','Retraso operacional',2,'2026-10-02 16:05:00'),(3,9,'estado','PROGRAMADO','CANCELADO','Mantenimiento preventivo de aeronave',1,'2026-10-02 10:00:00'),(4,4,'estado','PROGRAMADO','ABORDANDO','Inicio de proceso de abordaje',2,'2026-10-02 15:00:00'),(5,12,'estado','ABORDADO','EN_VUELO','Despegue confirmado',2,'2026-10-02 16:35:00'),(6,3,'id_puerta','A06','A07','Reasignación operativa de puerta',2,'2026-10-02 13:30:00');
/*!40000 ALTER TABLE `historial_vuelo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `itinerarios`
--

DROP TABLE IF EXISTS `itinerarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `itinerarios` (
  `id_itinerario` int NOT NULL AUTO_INCREMENT,
  `id_pasajero` int NOT NULL,
  `codigo_reserva` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `origen_principal` int NOT NULL,
  `destino_final` int NOT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `estado` enum('PROGRAMADO','EN_CURSO','COMPLETADO','CANCELADO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PROGRAMADO',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_itinerario`),
  UNIQUE KEY `codigo_reserva` (`codigo_reserva`),
  KEY `fk_itinerario_pasajero` (`id_pasajero`),
  KEY `fk_itinerario_origen` (`origen_principal`),
  KEY `fk_itinerario_destino` (`destino_final`),
  CONSTRAINT `fk_itinerario_destino` FOREIGN KEY (`destino_final`) REFERENCES `aeropuertos` (`id_aeropuerto`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_itinerario_origen` FOREIGN KEY (`origen_principal`) REFERENCES `aeropuertos` (`id_aeropuerto`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_itinerario_pasajero` FOREIGN KEY (`id_pasajero`) REFERENCES `pasajeros` (`id_pasajero`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `itinerarios`
--

LOCK TABLES `itinerarios` WRITE;
/*!40000 ALTER TABLE `itinerarios` DISABLE KEYS */;
INSERT INTO `itinerarios` VALUES (1,1,'RES-CAR-001',2,3,'2026-10-02','2026-10-02','COMPLETADO','2026-10-02 23:45:34','2026-10-02 23:45:34'),(2,2,'RES-SOF-002',1,4,'2026-10-03','2026-10-04','PROGRAMADO','2026-10-02 23:45:34','2026-10-02 23:45:34'),(3,3,'RES-AND-003',5,3,'2026-10-02','2026-10-03','EN_CURSO','2026-10-02 23:45:34','2026-10-02 23:45:34'),(4,4,'RES-MIG-004',1,6,'2026-10-02','2026-10-03','EN_CURSO','2026-10-02 23:45:34','2026-10-02 23:45:34'),(5,5,'RES-ELE-005',4,1,'2026-10-06','2026-10-06','PROGRAMADO','2026-10-02 23:45:34','2026-10-02 23:45:34'),(6,6,'RES-LUI-006',6,1,'2026-10-05','2026-10-05','CANCELADO','2026-10-02 23:45:34','2026-10-02 23:45:34');
/*!40000 ALTER TABLE `itinerarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificaciones`
--

DROP TABLE IF EXISTS `notificaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificaciones` (
  `id_notificacion` int NOT NULL AUTO_INCREMENT,
  `id_pasajero` int NOT NULL,
  `id_vuelo` int DEFAULT NULL,
  `id_equipaje` int DEFAULT NULL,
  `tipo` enum('CAMBIO_PUERTA','CAMBIO_HORARIO','VUELO_CANCELADO','VUELO_RETRASADO','PUERTA_ASIGNADA','BANDA_EQUIPAJE','ESCALA','INFORMACION_GENERAL') COLLATE utf8mb4_unicode_ci NOT NULL,
  `titulo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mensaje` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `leida` tinyint(1) NOT NULL DEFAULT '0',
  `fecha_envio` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_lectura` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_notificacion`),
  KEY `fk_notificacion_vuelo` (`id_vuelo`),
  KEY `fk_notificacion_equipaje` (`id_equipaje`),
  KEY `idx_notificaciones_pasajero` (`id_pasajero`),
  CONSTRAINT `fk_notificacion_equipaje` FOREIGN KEY (`id_equipaje`) REFERENCES `equipajes` (`id_equipaje`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_notificacion_pasajero` FOREIGN KEY (`id_pasajero`) REFERENCES `pasajeros` (`id_pasajero`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_notificacion_vuelo` FOREIGN KEY (`id_vuelo`) REFERENCES `vuelos` (`id_vuelo`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificaciones`
--

LOCK TABLES `notificaciones` WRITE;
/*!40000 ALTER TABLE `notificaciones` DISABLE KEYS */;
INSERT INTO `notificaciones` VALUES (1,1,1,1,'PUERTA_ASIGNADA','Puerta de embarque asignada','Tu vuelo GT456 tiene asignada la puerta A01.',1,'2026-10-02 06:45:00','2026-10-02 06:50:00','2026-10-02 23:45:36'),(2,1,2,1,'ESCALA','Información de conexión','Al llegar a Ciudad de México continúa hacia Los Ángeles en el vuelo AM123.',1,'2026-10-02 09:30:00','2026-10-02 09:35:00','2026-10-02 23:45:36'),(3,1,2,1,'BANDA_EQUIPAJE','Equipaje disponible','Tu equipaje EQ000001 está disponible en la banda B06.',0,'2026-10-02 14:45:00',NULL,'2026-10-02 23:45:36'),(4,1,2,7,'INFORMACION_GENERAL','Seguimiento de equipaje','El equipaje EQ000007 requiere seguimiento especial porque no fue localizado durante la transferencia.',0,'2026-10-02 12:20:00',NULL,'2026-10-02 23:45:36'),(5,2,3,2,'PUERTA_ASIGNADA','Puerta para tu vuelo','Tu vuelo IB789 tiene asignada la puerta A07.',0,'2026-10-02 13:35:00',NULL,'2026-10-02 23:45:36'),(6,2,3,2,'CAMBIO_PUERTA','Cambio de puerta','La puerta de tu vuelo IB789 cambió de A06 a A07.',0,'2026-10-02 13:36:00',NULL,'2026-10-02 23:45:36'),(7,3,4,3,'ESCALA','Conexión en Ciudad de México','Tu equipaje será transferido automáticamente para continuar hacia Los Ángeles.',1,'2026-10-02 18:10:00','2026-10-02 18:15:00','2026-10-02 23:45:36'),(8,3,11,3,'PUERTA_ASIGNADA','Puerta del siguiente vuelo','Tu conexión hacia Los Ángeles saldrá por la puerta A14.',0,'2026-10-02 18:20:00',NULL,'2026-10-02 23:45:36'),(9,4,5,4,'VUELO_RETRASADO','Tu vuelo presenta retraso','El vuelo AV742 hacia Bogotá presenta un retraso operacional.',0,'2026-10-02 16:05:00',NULL,'2026-10-02 23:45:36'),(10,4,5,4,'CAMBIO_HORARIO','Nuevo horario de salida','La salida del vuelo AV742 fue actualizada a las 20:30.',0,'2026-10-02 16:06:00',NULL,'2026-10-02 23:45:36'),(11,5,10,5,'INFORMACION_GENERAL','Reserva confirmada','Tu viaje Madrid - Ciudad de México está programado para el 6 de octubre.',1,'2026-10-01 09:10:00','2026-10-01 09:20:00','2026-10-02 23:45:36'),(12,6,9,6,'VUELO_CANCELADO','Vuelo cancelado','El vuelo AV101 fue cancelado por mantenimiento preventivo de la aeronave.',0,'2026-10-02 10:05:00',NULL,'2026-10-02 23:45:36');
/*!40000 ALTER TABLE `notificaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pasajero_vuelo`
--

DROP TABLE IF EXISTS `pasajero_vuelo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pasajero_vuelo` (
  `id_pasajero_vuelo` int NOT NULL AUTO_INCREMENT,
  `id_pasajero` int NOT NULL,
  `id_vuelo` int NOT NULL,
  `id_itinerario` int DEFAULT NULL,
  `numero_asiento` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` enum('RESERVADO','CHECK_IN','ABORDADO','NO_ABORDADO','CANCELADO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'RESERVADO',
  `fecha_registro` datetime DEFAULT CURRENT_TIMESTAMP,
  `registrado_por` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_pasajero_vuelo`),
  UNIQUE KEY `uq_pasajero_vuelo` (`id_pasajero`,`id_vuelo`),
  KEY `fk_pv_itinerario` (`id_itinerario`),
  KEY `fk_pv_usuario` (`registrado_por`),
  KEY `idx_pasajero_vuelo_vuelo` (`id_vuelo`),
  CONSTRAINT `fk_pv_itinerario` FOREIGN KEY (`id_itinerario`) REFERENCES `itinerarios` (`id_itinerario`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_pv_pasajero` FOREIGN KEY (`id_pasajero`) REFERENCES `pasajeros` (`id_pasajero`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_pv_usuario` FOREIGN KEY (`registrado_por`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_pv_vuelo` FOREIGN KEY (`id_vuelo`) REFERENCES `vuelos` (`id_vuelo`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pasajero_vuelo`
--

LOCK TABLES `pasajero_vuelo` WRITE;
/*!40000 ALTER TABLE `pasajero_vuelo` DISABLE KEYS */;
INSERT INTO `pasajero_vuelo` VALUES (1,1,1,1,'12A','ABORDADO','2026-09-25 10:00:00',2,'2026-10-02 23:45:34','2026-10-02 23:45:34'),(2,1,2,1,'18C','ABORDADO','2026-09-25 10:05:00',2,'2026-10-02 23:45:34','2026-10-02 23:45:34'),(3,2,3,2,'22A','CHECK_IN','2026-09-28 09:00:00',2,'2026-10-02 23:45:34','2026-10-02 23:45:34'),(4,3,4,3,'10B','ABORDADO','2026-09-27 11:00:00',2,'2026-10-02 23:45:34','2026-10-02 23:45:34'),(5,3,11,3,'14D','RESERVADO','2026-09-27 11:05:00',2,'2026-10-02 23:45:34','2026-10-02 23:45:34'),(6,4,5,4,'08F','CHECK_IN','2026-09-29 14:00:00',2,'2026-10-02 23:45:34','2026-10-02 23:45:34'),(7,5,10,5,'03A','RESERVADO','2026-09-30 08:30:00',2,'2026-10-02 23:45:34','2026-10-02 23:45:34'),(8,6,9,6,'20C','CANCELADO','2026-09-30 12:00:00',2,'2026-10-02 23:45:34','2026-10-02 23:45:34');
/*!40000 ALTER TABLE `pasajero_vuelo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pasajeros`
--

DROP TABLE IF EXISTS `pasajeros`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pasajeros` (
  `id_pasajero` int NOT NULL AUTO_INCREMENT,
  `nombres` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellidos` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `nacionalidad` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pasaporte` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `correo` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` enum('ACTIVO','INACTIVO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVO',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_pasajero`),
  UNIQUE KEY `pasaporte` (`pasaporte`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pasajeros`
--

LOCK TABLES `pasajeros` WRITE;
/*!40000 ALTER TABLE `pasajeros` DISABLE KEYS */;
INSERT INTO `pasajeros` VALUES (1,'Carlos','Martinez','1998-05-15','Guatemalteca','GT100001','carlos.martinez@correo.test','55551001','ACTIVO','2026-10-02 23:45:34','2026-10-02 23:45:34'),(2,'Sofia','Ramirez','2001-08-22','Mexicana','MX100002','sofia.ramirez@correo.test','55551002','ACTIVO','2026-10-02 23:45:34','2026-10-02 23:45:34'),(3,'Andrea','Lopez','1995-03-11','Panameña','PA100003','andrea.lopez@correo.test','55551003','ACTIVO','2026-10-02 23:45:34','2026-10-02 23:45:34'),(4,'Miguel','Garcia','1989-11-30','Colombiana','CO100004','miguel.garcia@correo.test','55551004','ACTIVO','2026-10-02 23:45:34','2026-10-02 23:45:34'),(5,'Elena','Torres','1992-06-18','Española','ES100005','elena.torres@correo.test','55551005','ACTIVO','2026-10-02 23:45:34','2026-10-02 23:45:34'),(6,'Luis','Morales','2000-01-25','Guatemalteca','GT100006','luis.morales@correo.test','55551006','ACTIVO','2026-10-02 23:45:34','2026-10-02 23:45:34');
/*!40000 ALTER TABLE `pasajeros` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `puertas`
--

DROP TABLE IF EXISTS `puertas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `puertas` (
  `id_puerta` int NOT NULL AUTO_INCREMENT,
  `numero` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `zona` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` enum('DISPONIBLE','MANTENIMIENTO','INACTIVA') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DISPONIBLE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_puerta`),
  UNIQUE KEY `numero` (`numero`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `puertas`
--

LOCK TABLES `puertas` WRITE;
/*!40000 ALTER TABLE `puertas` DISABLE KEYS */;
INSERT INTO `puertas` VALUES (1,'A01','NACIONAL','DISPONIBLE','2026-10-02 23:45:34','2026-10-02 23:45:34'),(2,'A02','NACIONAL','DISPONIBLE','2026-10-02 23:45:34','2026-10-02 23:45:34'),(3,'A03','NACIONAL','DISPONIBLE','2026-10-02 23:45:34','2026-10-02 23:45:34'),(4,'A04','NACIONAL','DISPONIBLE','2026-10-02 23:45:34','2026-10-02 23:45:34'),(5,'A05','NACIONAL','DISPONIBLE','2026-10-02 23:45:34','2026-10-02 23:45:34'),(6,'A06','INTERNACIONAL','DISPONIBLE','2026-10-02 23:45:34','2026-10-02 23:45:34'),(7,'A07','INTERNACIONAL','DISPONIBLE','2026-10-02 23:45:34','2026-10-02 23:45:34'),(8,'A08','INTERNACIONAL','DISPONIBLE','2026-10-02 23:45:34','2026-10-02 23:45:34'),(9,'A09','INTERNACIONAL','DISPONIBLE','2026-10-02 23:45:34','2026-10-02 23:45:34'),(10,'A10','INTERNACIONAL','DISPONIBLE','2026-10-02 23:45:34','2026-10-02 23:45:34'),(11,'A11','INTERNACIONAL','DISPONIBLE','2026-10-02 23:45:34','2026-10-02 23:45:34'),(12,'A12','INTERNACIONAL','DISPONIBLE','2026-10-02 23:45:34','2026-10-02 23:45:34'),(13,'A13','INTERNACIONAL','DISPONIBLE','2026-10-02 23:45:34','2026-10-02 23:45:34'),(14,'A14','INTERNACIONAL','DISPONIBLE','2026-10-02 23:45:34','2026-10-02 23:45:34'),(15,'A15','INTERNACIONAL','MANTENIMIENTO','2026-10-02 23:45:34','2026-10-02 23:45:34'),(16,'A16','INTERNACIONAL','DISPONIBLE','2026-10-02 23:45:34','2026-10-02 23:45:34'),(17,'A17','INTERNACIONAL','DISPONIBLE','2026-10-02 23:45:34','2026-10-02 23:45:34'),(18,'A18','INTERNACIONAL','DISPONIBLE','2026-10-02 23:45:34','2026-10-02 23:45:34'),(19,'A19','INTERNACIONAL','DISPONIBLE','2026-10-02 23:45:34','2026-10-02 23:45:34'),(20,'A20','INTERNACIONAL','DISPONIBLE','2026-10-02 23:45:34','2026-10-02 23:45:34'),(21,'A21','INTERNACIONAL','DISPONIBLE','2026-10-02 23:45:34','2026-10-02 23:45:34'),(22,'A22','INTERNACIONAL','DISPONIBLE','2026-10-02 23:45:34','2026-10-02 23:45:34'),(23,'A23','INTERNACIONAL','DISPONIBLE','2026-10-02 23:45:34','2026-10-02 23:45:34'),(24,'A24','INTERNACIONAL','DISPONIBLE','2026-10-02 23:45:34','2026-10-02 23:45:34'),(25,'A25','INTERNACIONAL','INACTIVA','2026-10-02 23:45:34','2026-10-02 23:45:34');
/*!40000 ALTER TABLE `puertas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id_rol` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'ADMINISTRADOR','Acceso completo al sistema','2026-10-02 23:45:33','2026-10-02 23:45:33'),(2,'SECRETARIO','Gestión operativa de vuelos, pasajeros y equipajes','2026-10-02 23:45:33','2026-10-02 23:45:33'),(3,'PASAJERO','Consulta de vuelos, equipaje y notificaciones','2026-10-02 23:45:33','2026-10-02 23:45:33');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `id_rol` int NOT NULL,
  `nombre_usuario` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombres` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellidos` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `correo` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` enum('ACTIVO','INACTIVO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVO',
  `ultimo_acceso` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `nombre_usuario` (`nombre_usuario`),
  UNIQUE KEY `correo` (`correo`),
  KEY `fk_usuario_rol` (`id_rol`),
  CONSTRAINT `fk_usuario_rol` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,1,'admin','$2b$10$yGmTrFINAlEVTPl1L4S.WuTyqTut1lUQaK1LB.QbG4sOT5VOjcZ8m','Administrador','Sistema','admin@aeropuerto.test','55550001','ACTIVO','2026-10-15 23:31:49','2026-10-02 23:45:33','2026-10-15 23:31:49'),(2,2,'secretario','$2b$10$V.7twQkoTNiHZJmRGZYOg.81.fSad1s5Hne1DOdHOaObDf9WadjYS','Daniel','Hernandez','secretario@aeropuerto.test','55550002','ACTIVO','2026-10-03 00:03:17','2026-10-02 23:45:33','2026-10-03 00:03:17'),(3,3,'carlos','$2b$10$nwskMAqvlgEwJTcYARmpZOiQjxDgFuZITiSsSQZ/wWFoWTmNLLHxy','Carlos','Martinez','carlos@aeropuerto.test','55550003','ACTIVO','2026-10-03 00:03:50','2026-10-02 23:45:33','2026-10-03 00:03:50'),(4,3,'sofia','$2b$10$nwskMAqvlgEwJTcYARmpZOiQjxDgFuZITiSsSQZ/wWFoWTmNLLHxy','Sofia','Ramirez','sofia@aeropuerto.test','55550004','ACTIVO','2026-10-03 02:26:44','2026-10-02 23:45:33','2026-10-03 02:26:44'),(5,3,'andrea','$2b$10$nwskMAqvlgEwJTcYARmpZOiQjxDgFuZITiSsSQZ/wWFoWTmNLLHxy','Andrea','Lopez','andrea@aeropuerto.test','55550005','ACTIVO',NULL,'2026-10-02 23:45:33','2026-10-02 23:45:33'),(6,3,'inactivo','$2b$10$nwskMAqvlgEwJTcYARmpZOiQjxDgFuZITiSsSQZ/wWFoWTmNLLHxy','Usuario','Inactivo','inactivo@aeropuerto.test','55550006','INACTIVO',NULL,'2026-10-02 23:45:33','2026-10-02 23:45:33');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vuelos`
--

DROP TABLE IF EXISTS `vuelos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vuelos` (
  `id_vuelo` int NOT NULL AUTO_INCREMENT,
  `codigo_vuelo` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_aeropuerto_origen` int NOT NULL,
  `id_aeropuerto_destino` int NOT NULL,
  `fecha_salida` date NOT NULL,
  `hora_salida` time NOT NULL,
  `fecha_llegada` date NOT NULL,
  `hora_llegada` time NOT NULL,
  `id_puerta` int DEFAULT NULL,
  `estado` enum('PROGRAMADO','ABORDANDO','ABORDADO','EN_VUELO','ATERRIZADO','FINALIZADO','RETRASADO','CANCELADO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PROGRAMADO',
  `motivo_cancelacion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `capacidad_pasajeros` int NOT NULL DEFAULT '0',
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_vuelo`),
  KEY `fk_vuelo_origen` (`id_aeropuerto_origen`),
  KEY `fk_vuelo_destino` (`id_aeropuerto_destino`),
  KEY `fk_vuelo_puerta` (`id_puerta`),
  KEY `idx_vuelos_fecha_salida` (`fecha_salida`),
  KEY `idx_vuelos_estado` (`estado`),
  KEY `idx_vuelos_codigo` (`codigo_vuelo`),
  CONSTRAINT `fk_vuelo_destino` FOREIGN KEY (`id_aeropuerto_destino`) REFERENCES `aeropuertos` (`id_aeropuerto`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_vuelo_origen` FOREIGN KEY (`id_aeropuerto_origen`) REFERENCES `aeropuertos` (`id_aeropuerto`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_vuelo_puerta` FOREIGN KEY (`id_puerta`) REFERENCES `puertas` (`id_puerta`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_vuelo_capacidad` CHECK ((`capacidad_pasajeros` >= 0)),
  CONSTRAINT `chk_vuelo_fechas` CHECK ((timestamp(`fecha_llegada`,`hora_llegada`) > timestamp(`fecha_salida`,`hora_salida`)))
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vuelos`
--

LOCK TABLES `vuelos` WRITE;
/*!40000 ALTER TABLE `vuelos` DISABLE KEYS */;
INSERT INTO `vuelos` VALUES (1,'GT456',2,1,'2026-10-02','08:00:00','2026-10-02','10:20:00',1,'FINALIZADO',NULL,150,'Vuelo Guatemala - Ciudad de México finalizado','2026-10-02 23:45:34','2026-10-02 23:45:34'),(2,'AM123',1,3,'2026-10-02','12:00:00','2026-10-02','14:30:00',6,'FINALIZADO',NULL,180,'Vuelo Ciudad de México - Los Ángeles','2026-10-02 23:45:34','2026-10-02 23:45:34'),(3,'IB789',1,4,'2026-10-03','18:00:00','2026-10-04','11:00:00',7,'PROGRAMADO',NULL,250,'Vuelo internacional con destino Madrid','2026-10-02 23:45:34','2026-10-02 23:45:34'),(4,'CM208',5,1,'2026-10-02','15:30:00','2026-10-02','18:00:00',8,'ABORDANDO',NULL,170,'Proceso de abordaje activo','2026-10-02 23:45:34','2026-10-02 23:45:34'),(5,'AV742',1,6,'2026-10-02','20:30:00','2026-10-03','01:00:00',9,'RETRASADO',NULL,160,'Salida retrasada por condiciones operativas','2026-10-02 23:45:34','2026-10-02 23:45:34'),(6,'AM900',3,1,'2026-10-01','09:00:00','2026-10-01','12:30:00',10,'FINALIZADO',NULL,190,'Vuelo completado desde Los Ángeles','2026-10-02 23:45:34','2026-10-02 23:45:34'),(7,'GT501',1,2,'2026-10-03','07:00:00','2026-10-03','09:15:00',11,'PROGRAMADO',NULL,145,'Próximo vuelo hacia Guatemala','2026-10-02 23:45:34','2026-10-02 23:45:34'),(8,'CM330',1,5,'2026-10-04','10:00:00','2026-10-04','13:30:00',12,'PROGRAMADO',NULL,175,'Vuelo hacia Ciudad de Panamá','2026-10-02 23:45:34','2026-10-02 23:45:34'),(9,'AV101',6,1,'2026-10-05','11:00:00','2026-10-05','15:30:00',NULL,'CANCELADO','Cancelación por mantenimiento preventivo de la aeronave',165,'Vuelo cancelado','2026-10-02 23:45:34','2026-10-02 23:45:34'),(10,'IB220',4,1,'2026-10-06','09:00:00','2026-10-06','19:00:00',13,'PROGRAMADO',NULL,260,'Vuelo Madrid - Ciudad de México','2026-10-02 23:45:34','2026-10-02 23:45:34'),(11,'AM555',1,3,'2026-10-03','16:00:00','2026-10-03','18:45:00',14,'PROGRAMADO',NULL,185,'Vuelo hacia Los Ángeles','2026-10-02 23:45:34','2026-10-02 23:45:34'),(12,'GT777',2,1,'2026-10-02','16:30:00','2026-10-02','18:45:00',16,'EN_VUELO',NULL,155,'Vuelo actualmente en tránsito hacia Ciudad de México','2026-10-02 23:45:34','2026-10-02 23:45:34');
/*!40000 ALTER TABLE `vuelos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'aeropuerto_db'
--

--
-- Dumping routines for database 'aeropuerto_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-23  9:34:33
