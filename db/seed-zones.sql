-- ============================================================
-- Seed Data: Zones, Users, Vehicles, Deliveries
-- ============================================================

-- ============================================================
-- ZONES: Guatemala City Metropolitan Area
-- Approximate polygons for 6 zones
-- ============================================================

INSERT INTO zones (name, description, color, geom) VALUES
(
    'Central',
    'Zona Central - Centro Histórico y zonas 1, 2, 3, 4',
    '#FF6B6B',
    ST_GeogFromText('SRID=4326;POLYGON((-90.525 14.635, -90.505 14.635, -90.505 14.650, -90.525 14.650, -90.525 14.635))')
),
(
    'Norte',
    'Zona Norte - Zonas 6, 17, 18 y alrededores',
    '#4ECDC4',
    ST_GeogFromText('SRID=4326;POLYGON((-90.550 14.650, -90.500 14.650, -90.500 14.690, -90.550 14.690, -90.550 14.650))')
),
(
    'Sur',
    'Zona Sur - Zonas 12, 13, 14, 21 y Villa Nueva',
    '#45B7D1',
    ST_GeogFromText('SRID=4326;POLYGON((-90.570 14.560, -90.490 14.560, -90.490 14.610, -90.570 14.610, -90.570 14.560))')
),
(
    'Oriente',
    'Zona Oriente - Zonas 5, 9, 10, 15, 16 y Carretera al Salvador',
    '#96CEB4',
    ST_GeogFromText('SRID=4326;POLYGON((-90.505 14.600, -90.460 14.600, -90.460 14.660, -90.505 14.660, -90.505 14.600))')
),
(
    'Occidente',
    'Zona Occidente - Mixco y zonas aledañas',
    '#FFEAA7',
    ST_GeogFromText('SRID=4326;POLYGON((-90.610 14.600, -90.550 14.600, -90.550 14.660, -90.610 14.660, -90.610 14.600))')
),
(
    'Centro',
    'Zona Centro-Sur - Zonas 7, 11, 12 y alrededores',
    '#DDA0DD',
    ST_GeogFromText('SRID=4326;POLYGON((-90.560 14.610, -90.520 14.610, -90.520 14.650, -90.560 14.650, -90.560 14.610))')
);

-- ============================================================
-- ADMIN USER (password: admin123)
-- Hash generated with bcryptjs, 10 rounds
-- ============================================================
INSERT INTO users (email, password_hash, role, first_name, last_name, phone) VALUES
('admin@logistica.com', '$2a$10$rDkPvvAFV8Gf.GX8QGqRHeHr5l7.QTVyG5eI.s4rJ0YFDxNnz5XhK', 'admin', 'Admin', 'Sistema', '5555-0001');

-- ============================================================
-- SAMPLE DRIVERS
-- ============================================================
INSERT INTO users (email, password_hash, role, first_name, last_name, phone, license_number) VALUES
('carlos.lopez@logistica.com', '$2a$10$rDkPvvAFV8Gf.GX8QGqRHeHr5l7.QTVyG5eI.s4rJ0YFDxNnz5XhK', 'driver', 'Carlos', 'López', '5555-0010', 'LIC-GT-001'),
('maria.garcia@logistica.com', '$2a$10$rDkPvvAFV8Gf.GX8QGqRHeHr5l7.QTVyG5eI.s4rJ0YFDxNnz5XhK', 'driver', 'María', 'García', '5555-0011', 'LIC-GT-002'),
('jose.martinez@logistica.com', '$2a$10$rDkPvvAFV8Gf.GX8QGqRHeHr5l7.QTVyG5eI.s4rJ0YFDxNnz5XhK', 'driver', 'José', 'Martínez', '5555-0012', 'LIC-GT-003');

-- ============================================================
-- SAMPLE VEHICLES
-- ============================================================
INSERT INTO vehicles (plate, brand, model, year, color, capacity_liters, fuel_type, odometer_km, status) VALUES
('P-001ABC', 'Toyota', 'Hilux', 2022, 'Blanco', 1000.00, 'diesel', 45000.00, 'active'),
('P-002DEF', 'Mitsubishi', 'L200', 2021, 'Gris', 800.00, 'diesel', 62000.00, 'active'),
('P-003GHI', 'Isuzu', 'NPR', 2023, 'Blanco', 3000.00, 'diesel', 15000.00, 'active'),
('P-004JKL', 'Ford', 'Ranger', 2020, 'Azul', 900.00, 'diesel', 78000.00, 'maintenance'),
('P-005MNO', 'Hyundai', 'HD65', 2022, 'Rojo', 2500.00, 'diesel', 32000.00, 'active');

-- ============================================================
-- SAMPLE DELIVERIES (points within zones)
-- ============================================================
INSERT INTO deliveries (client_name, client_phone, address, location, scheduled_date, quantity_liters, product_type, priority) VALUES
-- Central zone deliveries
('Lubricantes del Centro S.A.', '2222-1001', '6a Avenida 10-50 Zona 1', ST_GeogFromText('SRID=4326;POINT(-90.515 14.642)'), CURRENT_DATE, 200.00, 'Aceite Motor 20W50', 1),
('Taller Central Guatemala', '2222-1002', '8a Calle 5-30 Zona 1', ST_GeogFromText('SRID=4326;POINT(-90.512 14.640)'), CURRENT_DATE, 150.00, 'Aceite Hidráulico', 2),

-- Norte zone deliveries
('AutoServicios Norte', '2222-2001', 'Calzada La Paz, Zona 17', ST_GeogFromText('SRID=4326;POINT(-90.520 14.665)'), CURRENT_DATE, 500.00, 'Aceite Motor 15W40', 1),
('Transportes del Norte', '2222-2002', 'Zona 18, Guatemala', ST_GeogFromText('SRID=4326;POINT(-90.510 14.670)'), CURRENT_DATE, 300.00, 'Grasa Industrial', 3),

-- Sur zone deliveries
('Distribuidora Sur', '2222-3001', 'Villa Nueva, Km 15', ST_GeogFromText('SRID=4326;POINT(-90.530 14.580)'), CURRENT_DATE, 400.00, 'Aceite Motor 20W50', 1),
('Industrias Villa Nueva', '2222-3002', 'Boulevard Sur, Villa Nueva', ST_GeogFromText('SRID=4326;POINT(-90.540 14.575)'), CURRENT_DATE, 250.00, 'Refrigerante', 2),

-- Oriente zone deliveries
('Lubricentro Oriente', '2222-4001', 'Carretera al Salvador Km 8', ST_GeogFromText('SRID=4326;POINT(-90.480 14.630)'), CURRENT_DATE, 350.00, 'Aceite Transmisión', 1),
('Taller Express Zona 10', '2222-4002', 'Zona 10 Guatemala', ST_GeogFromText('SRID=4326;POINT(-90.490 14.620)'), CURRENT_DATE, 180.00, 'Aceite Motor 5W30', 2),

-- Occidente zone deliveries
('AutoPartes Mixco', '2222-5001', 'Calzada Roosevelt, Mixco', ST_GeogFromText('SRID=4326;POINT(-90.580 14.630)'), CURRENT_DATE, 600.00, 'Aceite Motor 15W40', 1),
('Servicio Occidental', '2222-5002', 'San Cristóbal, Mixco', ST_GeogFromText('SRID=4326;POINT(-90.590 14.640)'), CURRENT_DATE, 200.00, 'Aceite Hidráulico', 3),

-- Centro zone deliveries
('Distribuidora Centro-Sur', '2222-6001', 'Calzada Aguilar Batres, Zona 11', ST_GeogFromText('SRID=4326;POINT(-90.540 14.625)'), CURRENT_DATE, 450.00, 'Aceite Motor 20W50', 1),
('Taller Industrial Z7', '2222-6002', 'Calzada San Juan, Zona 7', ST_GeogFromText('SRID=4326;POINT(-90.545 14.635)'), CURRENT_DATE, 300.00, 'Grasa Multiuso', 2);

-- ============================================================
-- SAMPLE MAINTENANCE LOGS
-- ============================================================
INSERT INTO maintenance_logs (vehicle_id, type, description, cost, service_provider, service_date, next_due_date, odometer_at_service) VALUES
(1, 'preventive', 'Cambio de aceite y filtros', 450.00, 'Taller Toyota Guatemala', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '60 days', 44000.00),
(2, 'preventive', 'Revisión de frenos', 800.00, 'Frenos y Más', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '90 days', 61500.00),
(4, 'corrective', 'Reparación de transmisión', 3500.00, 'Servicio Ford Guatemala', CURRENT_DATE - INTERVAL '5 days', NULL, 77500.00),
(3, 'inspection', 'Inspección general de 15,000 km', 200.00, 'Isuzu Service Center', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE + INTERVAL '120 days', 15000.00);

-- ============================================================
-- SAMPLE CHECKLISTS
-- ============================================================
INSERT INTO checklists (vehicle_id, driver_id, check_date, tires_ok, oil_ok, brakes_ok, lights_ok, mirrors_ok, horn_ok, seatbelt_ok, fire_extinguisher_ok, fuel_level, odometer_reading, general_condition) VALUES
(1, 2, CURRENT_DATE, true, true, true, true, true, true, true, true, 'full', 45000.00, 'good'),
(2, 3, CURRENT_DATE, true, true, false, true, true, true, true, true, '3/4', 62000.00, 'fair'),
(3, 4, CURRENT_DATE, true, true, true, true, true, true, true, false, 'half', 15000.00, 'good');
