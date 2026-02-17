const router = require('express').Router();
const db = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/deliveries — with optional filters
router.get('/', authenticate, async (req, res) => {
    try {
        const { status, zone_id, driver_id, date } = req.query;
        let q = `SELECT d.*, z.name as zone_name, z.color as zone_color,
             u.first_name as driver_first_name, u.last_name as driver_last_name,
             v.plate as vehicle_plate,
             ST_Y(d.location::geometry) as lat, ST_X(d.location::geometry) as lng
             FROM deliveries d
             LEFT JOIN zones z ON d.zone_id = z.id
             LEFT JOIN users u ON d.driver_id = u.id
             LEFT JOIN vehicles v ON d.vehicle_id = v.id WHERE 1=1`;
        const params = [];
        let idx = 1;

        if (status) { q += ` AND d.status = $${idx++}`; params.push(status); }
        if (zone_id) { q += ` AND d.zone_id = $${idx++}`; params.push(zone_id); }
        if (driver_id) { q += ` AND d.driver_id = $${idx++}`; params.push(driver_id); }
        if (date) { q += ` AND d.scheduled_date = $${idx++}`; params.push(date); }

        q += ' ORDER BY d.priority ASC, d.scheduled_date ASC';
        const result = await db.query(q, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/deliveries/:id
router.get('/:id', authenticate, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT d.*, z.name as zone_name, z.color as zone_color,
       ST_Y(d.location::geometry) as lat, ST_X(d.location::geometry) as lng
       FROM deliveries d LEFT JOIN zones z ON d.zone_id = z.id WHERE d.id = $1`,
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Delivery not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/deliveries — zone auto-detected via trigger
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const { client_name, client_phone, address, lat, lng, scheduled_date, quantity_liters, product_type, priority, notes } = req.body;
        if (!client_name || !address || !lat || !lng || !scheduled_date) {
            return res.status(400).json({ error: 'client_name, address, lat, lng, scheduled_date are required' });
        }

        const result = await db.query(
            `INSERT INTO deliveries (client_name, client_phone, address, location, scheduled_date, quantity_liters, product_type, priority, notes)
       VALUES ($1,$2,$3, ST_SetSRID(ST_MakePoint($4,$5),4326)::geography, $6,$7,$8,$9,$10)
       RETURNING *, ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng`,
            [client_name, client_phone, address, lng, lat, scheduled_date, quantity_liters, product_type, priority || 0, notes]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/deliveries/:id
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { client_name, client_phone, address, lat, lng, status, scheduled_date, quantity_liters, product_type, priority, notes } = req.body;

        let locationClause = '';
        const params = [client_name, client_phone, address, status, scheduled_date, quantity_liters, product_type, priority, notes];
        let idx = 10;

        if (lat && lng) {
            locationClause = `, location = ST_SetSRID(ST_MakePoint($${idx++}, $${idx++}), 4326)::geography`;
            params.push(lng, lat);
        }

        params.push(req.params.id);
        const result = await db.query(
            `UPDATE deliveries SET client_name=COALESCE($1,client_name), client_phone=COALESCE($2,client_phone),
       address=COALESCE($3,address), status=COALESCE($4,status), scheduled_date=COALESCE($5,scheduled_date),
       quantity_liters=COALESCE($6,quantity_liters), product_type=COALESCE($7,product_type),
       priority=COALESCE($8,priority), notes=COALESCE($9,notes) ${locationClause}
       WHERE id=$${idx} RETURNING *, ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng`,
            params
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Delivery not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/deliveries/assign — Bulk assign driver + vehicle to deliveries
router.post('/assign', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const { delivery_ids, driver_id, vehicle_id } = req.body;
        if (!delivery_ids || !driver_id || !vehicle_id) {
            return res.status(400).json({ error: 'delivery_ids, driver_id, vehicle_id are required' });
        }

        const result = await db.query(
            `UPDATE deliveries SET driver_id = $1, vehicle_id = $2, status = 'assigned'
       WHERE id = ANY($3::int[]) RETURNING id, status, driver_id, vehicle_id`,
            [driver_id, vehicle_id, delivery_ids]
        );

        res.json({ assigned: result.rows.length, deliveries: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/deliveries/:id
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const result = await db.query('DELETE FROM deliveries WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Delivery not found' });
        res.json({ message: 'Delivery deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
