-- ==========================================
-- 1. GEOGRAFÍA Y CATÁLOGOS
-- ==========================================
CREATE TABLE paises ( id SERIAL PRIMARY KEY, nombre VARCHAR(100) NOT NULL UNIQUE, codigo_iso CHAR(2) UNIQUE );
COMMENT ON TABLE paises IS 'Catálogo global de países.';

CREATE TABLE ciudades ( id SERIAL PRIMARY KEY, nombre VARCHAR(100) NOT NULL, pais_id INT REFERENCES paises(id) ON DELETE CASCADE );
COMMENT ON TABLE ciudades IS 'Catálogo de ciudades vinculadas a su respectivo país.';

CREATE TABLE aeropuertos ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), codigo_iata CHAR(3) NOT NULL UNIQUE, nombre VARCHAR(100) NOT NULL, ciudad_id INT REFERENCES ciudades(id) );
COMMENT ON TABLE aeropuertos IS 'Catálogo de aeropuertos con su código IATA único de 3 letras.';

CREATE TABLE roles ( id SERIAL PRIMARY KEY, nombre VARCHAR(50) NOT NULL UNIQUE );
COMMENT ON TABLE roles IS 'Niveles de acceso al sistema (ej. Administrador, Cliente).';

CREATE TABLE tipos_pasajero ( id SERIAL PRIMARY KEY, nombre VARCHAR(20) NOT NULL, descuento_porcentaje DECIMAL(5,2) DEFAULT 0.00 );
COMMENT ON TABLE tipos_pasajero IS 'Clasificación por edad (Adulto, Niño) para aplicar descuentos automáticos.';

CREATE TABLE planes_tarifarios ( id SERIAL PRIMARY KEY, nombre VARCHAR(50) NOT NULL, seleccion_asiento BOOLEAN NOT NULL, equipaje_bodega INT NOT NULL, asiento_premium BOOLEAN NOT NULL, cargo_adicional NUMERIC(10,2) NOT NULL );
COMMENT ON TABLE planes_tarifarios IS 'Las familias de tarifas o "paquetes" que ofrece la aerolínea (Básico, Estándar, Premium).';

-- ==========================================
-- 2. USUARIOS Y PASAJEROS
-- ==========================================
CREATE TABLE usuarios ( id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, rol_id INT DEFAULT 2 REFERENCES roles(id), telefono VARCHAR(20), creado_at TIMESTAMPTZ DEFAULT NOW() );
COMMENT ON TABLE usuarios IS 'Extensión de la tabla de autenticación de Supabase. Almacena datos del comprador.';

CREATE TABLE pasajeros ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nombres VARCHAR(100) NOT NULL, apellidos VARCHAR(100) NOT NULL, fecha_nacimiento DATE NOT NULL, sexo CHAR(1) CHECK (sexo IN ('M', 'F', 'O')), nacionalidad_id INT REFERENCES paises(id), pasaporte VARCHAR(50) NOT NULL UNIQUE, email_contacto VARCHAR(100), telefono_contacto VARCHAR(20), tipo_pasajero_id INT REFERENCES tipos_pasajero(id) );
COMMENT ON TABLE pasajeros IS 'Personas físicas que abordarán el vuelo. Un usuario comprador puede registrar múltiples pasajeros.';

-- ==========================================
-- 3. FLOTA Y ASIENTOS
-- ==========================================
CREATE TABLE aviones ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), matricula VARCHAR(10) NOT NULL UNIQUE, modelo VARCHAR(50) NOT NULL );
COMMENT ON TABLE aviones IS 'Flota de aeronaves físicas de la compañía.';

CREATE TABLE asientos_avion ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), avion_id UUID REFERENCES aviones(id) ON DELETE CASCADE, fila INT NOT NULL, letra CHAR(1) NOT NULL, es_premium BOOLEAN DEFAULT FALSE );
COMMENT ON TABLE asientos_avion IS 'Plantilla estática de la distribución de asientos de cada avión físico.';

-- ==========================================
-- 4. VUELOS Y RESERVAS
-- ==========================================
CREATE TABLE vuelos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_vuelo VARCHAR(10), 
    origen_id UUID REFERENCES aeropuertos(id),
    destino_id UUID REFERENCES aeropuertos(id),
    avion_id UUID REFERENCES aviones(id),
    fecha_salida TIMESTAMPTZ NOT NULL,
    duracion_minutos INT NOT NULL, 
    fecha_llegada TIMESTAMPTZ, 
    precio_base NUMERIC(10,2) NOT NULL,
    estado CHAR(1) DEFAULT 'P' CHECK (estado IN ('P', 'E', 'F', 'C'))
);
COMMENT ON TABLE vuelos IS 'Instancias de viajes programados entre dos aeropuertos.';
COMMENT ON COLUMN vuelos.estado IS 'P=Programado, E=En Vuelo, F=Finalizado, C=Cancelado';
COMMENT ON COLUMN vuelos.numero_vuelo IS 'Generado automáticamente por trigger si se deja nulo.';
COMMENT ON COLUMN vuelos.fecha_llegada IS 'Calculada automáticamente por trigger usando salida + duracion_minutos.';

CREATE TABLE reservas ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), codigo_pnr VARCHAR(6) UNIQUE, usuario_id UUID REFERENCES usuarios(id), estado CHAR(1) DEFAULT 'C' CHECK (estado IN ('P', 'C', 'A')), creado_at TIMESTAMPTZ DEFAULT NOW() );
COMMENT ON TABLE reservas IS 'El "carrito de compras" o localizador que agrupa todos los boletos de una transacción.';
COMMENT ON COLUMN reservas.estado IS 'P=Pendiente de pago, C=Confirmada, A=Anulada';
COMMENT ON COLUMN reservas.codigo_pnr IS 'Código alfanumérico generado automáticamente (ej. X7B9TQ).';

CREATE TABLE boletos ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), reserva_id UUID REFERENCES reservas(id) ON DELETE CASCADE, pasajero_id UUID REFERENCES pasajeros(id), vuelo_id UUID REFERENCES vuelos(id), plan_id INT REFERENCES planes_tarifarios(id), asiento_id UUID REFERENCES asientos_avion(id), precio_pagado NUMERIC(10,2) NOT NULL, CONSTRAINT asiento_vuelo_unico UNIQUE (vuelo_id, asiento_id) );
COMMENT ON TABLE boletos IS 'El ticket individual. Vincula a un pasajero específico con un asiento en un vuelo.';
COMMENT ON COLUMN boletos.precio_pagado IS 'Valor calculado por trigger (precio base del vuelo + cargo plan - descuento por edad).';

CREATE TABLE pagos ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), reserva_id UUID REFERENCES reservas(id), monto NUMERIC(10,2) NOT NULL, metodo VARCHAR(50) NOT NULL, fecha_pago TIMESTAMPTZ DEFAULT NOW() );
COMMENT ON TABLE pagos IS 'Registro auditable de las transacciones financieras vinculadas a las reservas.';

-- ==========================================
-- 5. TRIGGERS Y FUNCIONES AUTOMÁTICAS
-- ==========================================

-- TRIGGER 1: Generador automático de Código PNR
CREATE OR REPLACE FUNCTION generar_pnr()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.codigo_pnr IS NULL OR NEW.codigo_pnr = '' THEN
        NEW.codigo_pnr := upper(substring(md5(random()::text), 1, 6));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_generar_pnr
BEFORE INSERT ON reservas
FOR EACH ROW
EXECUTE FUNCTION generar_pnr();

-- TRIGGER 2: Calculadora Automática del Precio del Boleto
CREATE OR REPLACE FUNCTION calcular_precio_boleto()
RETURNS TRIGGER AS $$
DECLARE
    v_precio_base NUMERIC;
    v_cargo_plan NUMERIC;
    v_descuento DECIMAL;
BEGIN
    SELECT precio_base INTO v_precio_base FROM vuelos WHERE id = NEW.vuelo_id;
    SELECT cargo_adicional INTO v_cargo_plan FROM planes_tarifarios WHERE id = NEW.plan_id;
    SELECT tp.descuento_porcentaje INTO v_descuento 
    FROM pasajeros p
    JOIN tipos_pasajero tp ON p.tipo_pasajero_id = tp.id
    WHERE p.id = NEW.pasajero_id;
    
    NEW.precio_pagado := (v_precio_base - (v_precio_base * COALESCE(v_descuento, 0))) + COALESCE(v_cargo_plan, 0);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_calcular_precio_boleto
BEFORE INSERT ON boletos
FOR EACH ROW
EXECUTE FUNCTION calcular_precio_boleto();

-- TRIGGER 3: Automatización de Vuelos (Número y Llegada)
-- Este trigger es crucial para que no tengas que calcular la llegada en el frontend.
CREATE OR REPLACE FUNCTION automatizar_datos_vuelo()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND (NEW.numero_vuelo IS NULL OR NEW.numero_vuelo = '') THEN
        NEW.numero_vuelo := 'AERO-' || LPAD(CAST(FLOOR(RANDOM() * 9000 + 1000) AS TEXT), 4, '0');
    END IF;
    
    IF NEW.duracion_minutos IS NOT NULL THEN
        NEW.fecha_llegada := NEW.fecha_salida + (NEW.duracion_minutos || ' minutes')::INTERVAL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_automatizar_vuelo
BEFORE INSERT OR UPDATE ON vuelos
FOR EACH ROW
EXECUTE FUNCTION automatizar_datos_vuelo();

-- ==========================================
-- 6. VISTAS
-- ==========================================
-- VISTA 1: Buscador de Vuelos Completo
-- Se actualizó para incluir 'duracion_minutos' y manejar la estructura relacional.
CREATE OR REPLACE VIEW v_busqueda_vuelos AS
SELECT 
    v.id AS vuelo_id,
    v.numero_vuelo,
    v.fecha_salida,
    v.fecha_llegada,
    v.duracion_minutos,
    v.precio_base,
    v.estado, -- Devuelve P, E, F o C
    ori.codigo_iata AS origen_iata,
    c_ori.nombre AS origen_ciudad,
    p_ori.nombre AS origen_pais,
    des.codigo_iata AS destino_iata,
    c_des.nombre AS destino_ciudad,
    p_des.nombre AS destino_pais,
    a.modelo AS avion_modelo
FROM vuelos v
JOIN aeropuertos ori ON v.origen_id = ori.id
JOIN ciudades c_ori ON ori.ciudad_id = c_ori.id
JOIN paises p_ori ON c_ori.pais_id = p_ori.id
JOIN aeropuertos des ON v.destino_id = des.id
JOIN ciudades c_des ON des.ciudad_id = c_des.id
JOIN paises p_des ON c_des.pais_id = p_des.id
JOIN aviones a ON v.avion_id = a.id;

COMMENT ON VIEW v_busqueda_vuelos IS 'Consulta principal para la UI de búsqueda de vuelos. Incluye duración y datos geográficos.';

-- VISTA 2: Mapa de Asientos Dinámico
CREATE OR REPLACE VIEW v_mapa_asientos AS
SELECT 
    v.id AS vuelo_id,
    aa.id AS asiento_id,
    aa.fila,
    aa.letra,
    aa.es_premium,
    CASE 
        WHEN b.id IS NOT NULL THEN TRUE 
        ELSE FALSE 
    END AS ocupado
FROM vuelos v
JOIN asientos_avion aa ON v.avion_id = aa.avion_id
LEFT JOIN boletos b ON b.vuelo_id = v.id AND b.asiento_id = aa.id;

COMMENT ON VIEW v_mapa_asientos IS 'Muestra la disponibilidad de asientos en tiempo real cruzando la plantilla física con boletos vendidos.';

-- VISTA 3: Resumen de la Reserva (Recibo)
CREATE OR REPLACE VIEW v_detalle_reservas AS
SELECT 
    r.id AS reserva_id,
    r.codigo_pnr,
    r.estado AS reserva_estado, -- Devuelve P, C o A
    r.creado_at AS fecha_reserva,
    b.id AS boleto_id,
    p.nombres || ' ' || p.apellidos AS nombre_pasajero,
    p.pasaporte,
    v.numero_vuelo,
    v.fecha_salida,
    ori.codigo_iata AS origen,
    des.codigo_iata AS destino,
    aa.fila || aa.letra AS asiento_asignado,
    pt.nombre AS plan_comprado,
    b.precio_pagado
FROM reservas r
JOIN boletos b ON r.id = b.reserva_id
JOIN pasajeros p ON b.pasajero_id = p.id
JOIN vuelos v ON b.vuelo_id = v.id
JOIN aeropuertos ori ON v.origen_id = ori.id
JOIN aeropuertos des ON v.destino_id = des.id
JOIN planes_tarifarios pt ON b.plan_id = pt.id
LEFT JOIN asientos_avion aa ON b.asiento_id = aa.id;

COMMENT ON VIEW v_detalle_reservas IS 'Detalle completo para visualización de itinerarios y facturas.';
-- ==========================================
-- 7. DESACTIVAR RLS (Para proyecto académico)
-- ==========================================
ALTER TABLE paises DISABLE ROW LEVEL SECURITY; 
ALTER TABLE ciudades DISABLE ROW LEVEL SECURITY; 
ALTER TABLE aeropuertos DISABLE ROW LEVEL SECURITY; 
ALTER TABLE roles DISABLE ROW LEVEL SECURITY; 
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY; 
ALTER TABLE aviones DISABLE ROW LEVEL SECURITY; 
ALTER TABLE asientos_avion DISABLE ROW LEVEL SECURITY; 
ALTER TABLE vuelos DISABLE ROW LEVEL SECURITY; 
ALTER TABLE planes_tarifarios DISABLE ROW LEVEL SECURITY; 
ALTER TABLE tipos_pasajero DISABLE ROW LEVEL SECURITY; 
ALTER TABLE pasajeros DISABLE ROW LEVEL SECURITY; 
ALTER TABLE reservas DISABLE ROW LEVEL SECURITY; 
ALTER TABLE boletos DISABLE ROW LEVEL SECURITY; 
ALTER TABLE pagos DISABLE ROW LEVEL SECURITY;