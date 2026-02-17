-- ============================================================
-- Sistema de Gestión Logística de Lubricantes
-- PostgreSQL + PostGIS Schema
-- ============================================================

-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- ENUM TYPES
-- ============================================================
CREATE TYPE user_role AS ENUM ('admin', 'driver');
CREATE TYPE vehicle_status AS ENUM ('active', 'maintenance', 'inactive');
CREATE TYPE delivery_status AS ENUM ('pending', 'assigned', 'in_transit', 'delivered', 'cancelled');
CREATE TYPE maintenance_type AS ENUM ('preventive', 'corrective', 'inspection');

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'driver',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    license_number VARCHAR(50),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- VEHICLES
-- ============================================================
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    plate VARCHAR(20) UNIQUE NOT NULL,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    color VARCHAR(30),
    capacity_liters NUMERIC(10,2) DEFAULT 0,
    fuel_type VARCHAR(20) DEFAULT 'diesel',
    odometer_km NUMERIC(12,2) DEFAULT 0,
    status vehicle_status DEFAULT 'active',
    insurance_expiry DATE,
    last_service_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_plate ON vehicles(plate);

-- ============================================================
-- ZONES (Geographic polygons)
-- ============================================================
CREATE TABLE zones (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7) NOT NULL DEFAULT '#3388ff',
    geom GEOGRAPHY(POLYGON, 4326) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_zones_geom ON zones USING GIST(geom);

-- ============================================================
-- DELIVERIES
-- ============================================================
CREATE TABLE deliveries (
    id SERIAL PRIMARY KEY,
    client_name VARCHAR(200) NOT NULL,
    client_phone VARCHAR(20),
    address TEXT NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    zone_id INTEGER REFERENCES zones(id),
    driver_id INTEGER REFERENCES users(id),
    vehicle_id INTEGER REFERENCES vehicles(id),
    status delivery_status DEFAULT 'pending',
    scheduled_date DATE NOT NULL,
    delivered_at TIMESTAMPTZ,
    quantity_liters NUMERIC(10,2),
    product_type VARCHAR(100),
    priority INTEGER DEFAULT 0,
    notes TEXT,
    route_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_driver ON deliveries(driver_id);
CREATE INDEX idx_deliveries_vehicle ON deliveries(vehicle_id);
CREATE INDEX idx_deliveries_zone ON deliveries(zone_id);
CREATE INDEX idx_deliveries_date ON deliveries(scheduled_date);
CREATE INDEX idx_deliveries_location ON deliveries USING GIST(location);

-- ============================================================
-- CHECKLISTS (Daily pre-trip inspection)
-- ============================================================
CREATE TABLE checklists (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    driver_id INTEGER NOT NULL REFERENCES users(id),
    check_date DATE NOT NULL DEFAULT CURRENT_DATE,
    tires_ok BOOLEAN DEFAULT false,
    oil_ok BOOLEAN DEFAULT false,
    brakes_ok BOOLEAN DEFAULT false,
    lights_ok BOOLEAN DEFAULT false,
    mirrors_ok BOOLEAN DEFAULT false,
    horn_ok BOOLEAN DEFAULT false,
    seatbelt_ok BOOLEAN DEFAULT false,
    fire_extinguisher_ok BOOLEAN DEFAULT false,
    fuel_level VARCHAR(20),
    odometer_reading NUMERIC(12,2),
    general_condition VARCHAR(20) DEFAULT 'good',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(vehicle_id, driver_id, check_date)
);

CREATE INDEX idx_checklists_vehicle ON checklists(vehicle_id);
CREATE INDEX idx_checklists_driver ON checklists(driver_id);
CREATE INDEX idx_checklists_date ON checklists(check_date);

-- ============================================================
-- MAINTENANCE LOGS
-- ============================================================
CREATE TABLE maintenance_logs (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    type maintenance_type NOT NULL DEFAULT 'preventive',
    description TEXT NOT NULL,
    cost NUMERIC(10,2) DEFAULT 0,
    service_provider VARCHAR(200),
    service_date DATE NOT NULL DEFAULT CURRENT_DATE,
    next_due_date DATE,
    next_due_km NUMERIC(12,2),
    odometer_at_service NUMERIC(12,2),
    parts_replaced TEXT,
    is_resolved BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_maintenance_vehicle ON maintenance_logs(vehicle_id);
CREATE INDEX idx_maintenance_date ON maintenance_logs(service_date);
CREATE INDEX idx_maintenance_next_due ON maintenance_logs(next_due_date);

-- ============================================================
-- FUNCTION: Auto-detect zone from delivery coordinates
-- ============================================================
CREATE OR REPLACE FUNCTION fn_auto_assign_zone()
RETURNS TRIGGER AS $$
BEGIN
    SELECT id INTO NEW.zone_id
    FROM zones
    WHERE ST_Contains(geom::geometry, NEW.location::geometry)
    LIMIT 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_delivery_zone
    BEFORE INSERT OR UPDATE OF location ON deliveries
    FOR EACH ROW
    EXECUTE FUNCTION fn_auto_assign_zone();

-- ============================================================
-- FUNCTION: Auto-update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_deliveries_updated_at BEFORE UPDATE ON deliveries
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_maintenance_updated_at BEFORE UPDATE ON maintenance_logs
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
