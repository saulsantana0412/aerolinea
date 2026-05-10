-- 1. LIMPIEZA INICIAL
-- Esto permite que puedas correr el seed varias veces sin errores de duplicidad
TRUNCATE TABLE boletos, reservas, pasajeros, vuelos, asientos_avion, aviones, planes_tarifarios, tipos_pasajero, aeropuertos, ciudades, paises, roles CASCADE;

-- 2. ROLES
INSERT INTO roles (id, nombre) VALUES 
(1, 'Administrador'), 
(2, 'Cliente');

-- 3. PAÍSES
INSERT INTO paises (id, nombre, codigo_iso) VALUES 
(1, 'República Dominicana', 'DO'),
(2, 'Estados Unidos', 'US'),
(3, 'España', 'ES'),
(4, 'Colombia', 'CO');

-- 4. CIUDADES
INSERT INTO ciudades (id, nombre, pais_id) VALUES 
(1, 'Santo Domingo', 1),
(2, 'Punta Cana', 1),
(3, 'Miami', 2),
(4, 'Nueva York', 2),
(5, 'Madrid', 3),
(6, 'Bogotá', 4);

-- 5. AEROPUERTOS (Usamos UUIDs fijos para vincularlos fácilmente)
INSERT INTO aeropuertos (id, codigo_iata, nombre, ciudad_id) VALUES 
('a0000000-0000-0000-0000-000000000001', 'SDQ', 'Aeropuerto Int. Las Américas', 1),
('a0000000-0000-0000-0000-000000000002', 'PUJ', 'Aeropuerto Int. de Punta Cana', 2),
('a0000000-0000-0000-0000-000000000003', 'MIA', 'Miami International Airport', 3),
('a0000000-0000-0000-0000-000000000004', 'JFK', 'John F. Kennedy Int. Airport', 4),
('a0000000-0000-0000-0000-000000000005', 'MAD', 'Adolfo Suárez Madrid-Barajas', 5),
('a0000000-0000-0000-0000-000000000006', 'BOG', 'Aeropuerto Int. El Dorado', 6);

-- 6. TIPOS DE PASAJERO
INSERT INTO tipos_pasajero (id, nombre, descuento_porcentaje) VALUES 
(1, 'Adulto', 0.00),
(2, 'Niño', 0.25);

-- 7. PLANES TARIFARIOS
INSERT INTO planes_tarifarios (id, nombre, seleccion_asiento, equipaje_bodega, asiento_premium, cargo_adicional) VALUES 
(1, 'Básico', false, 0, false, 0.00),
(2, 'Estándar', true, 0, false, 30.00),
(3, 'Premium', true, 1, true, 80.00);

-- 8. AVIONES
INSERT INTO aviones (id, matricula, modelo) VALUES 
('b0000000-0000-0000-0000-000000000001', 'HI-1042', 'Boeing 737 MAX 8'),
('b0000000-0000-0000-0000-000000000002', 'HI-1043', 'Airbus A320');

-- 9. ASIENTOS (Generación dinámica con PL/pgSQL ajustada a 3x3)
-- Este bloque crea 10 filas de 6 asientos (A, B, C, D, E, F) para el Avión 1.
DO $$
DECLARE
    fila_actual INT;
    letra_actual CHAR;
    es_prem BOOLEAN;
BEGIN
    FOR fila_actual IN 1..10 LOOP
        -- Las primeras 2 filas las marcamos como Premium (asientos con más espacio)
        IF fila_actual <= 2 THEN es_prem := TRUE; ELSE es_prem := FALSE; END IF;
        
        -- Aquí está la magia: Iteramos sobre las 6 letras del alfabeto correspondientes
        FOREACH letra_actual IN ARRAY ARRAY['A', 'B', 'C', 'D', 'E', 'F'] LOOP
            INSERT INTO asientos_avion (avion_id, fila, letra, es_premium) 
            VALUES ('b0000000-0000-0000-0000-000000000001', fila_actual, letra_actual, es_prem);
        END LOOP;
    END LOOP;
END $$;

-- 10. VUELOS PROGRAMADOS (Ajustado al CHAR(1))
INSERT INTO vuelos (id, numero_vuelo, origen_id, destino_id, avion_id, fecha_salida, duracion_minutos, precio_base, estado) VALUES 
('c0000000-0000-0000-0000-000000000001', 'AERO-101', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', NOW() + INTERVAL '2 days', 120, 150.00, 'P'),
('c0000000-0000-0000-0000-000000000002', 'AERO-102', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', NOW() + INTERVAL '5 days', 240, 250.00, 'P'),
('c0000000-0000-0000-0000-000000000003', 'AERO-103', 'a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000002', NOW() + INTERVAL '15 days', 600, 650.00, 'P');