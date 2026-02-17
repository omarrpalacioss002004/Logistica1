const router = require('express').Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /api/checklists — filter by driver_id, vehicle_id, date
router.get('/', authenticate, async (req, res) => {
    try {
        const { driver_id, vehicle_id, date } = req.query;
        let q = `SELECT c.*, u.first_name || ' ' || u.last_name as driver_name, v.plate as vehicle_plate
             FROM checklists c
             JOIN users u ON c.driver_id = u.id
             JOIN vehicles v ON c.vehicle_id = v.id WHERE 1=1`;
        const params = [];
        let idx = 1;

        if (driver_id) { q += ` AND c.driver_id = $${idx++}`; params.push(driver_id); }
        if (vehicle_id) { q += ` AND c.vehicle_id = $${idx++}`; params.push(vehicle_id); }
        if (date) { q += ` AND c.check_date = $${idx++}`; params.push(date); }

        q += ' ORDER BY c.check_date DESC, c.created_at DESC';
        const result = await db.query(q, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/checklists/:id
router.get('/:id', authenticate, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT c.*, u.first_name || ' ' || u.last_name as driver_name, v.plate as vehicle_plate
       FROM checklists c JOIN users u ON c.driver_id = u.id JOIN vehicles v ON c.vehicle_id = v.id
       WHERE c.id = $1`,
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Checklist not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/checklists
router.post('/', authenticate, async (req, res) => {
    try {
        const {
            vehicle_id, driver_id, check_date,
            tires_ok, oil_ok, brakes_ok, lights_ok, mirrors_ok, horn_ok, seatbelt_ok, fire_extinguisher_ok,
            fuel_level, odometer_reading, general_condition, notes
        } = req.body;

        if (!vehicle_id || !driver_id) {
            return res.status(400).json({ error: 'vehicle_id and driver_id are required' });
        }

        const result = await db.query(
            `INSERT INTO checklists (vehicle_id, driver_id, check_date, tires_ok, oil_ok, brakes_ok, lights_ok,
       mirrors_ok, horn_ok, seatbelt_ok, fire_extinguisher_ok, fuel_level, odometer_reading, general_condition, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
            [vehicle_id, driver_id, check_date || new Date().toISOString().split('T')[0],
                tires_ok, oil_ok, brakes_ok, lights_ok, mirrors_ok, horn_ok, seatbelt_ok, fire_extinguisher_ok,
                fuel_level, odometer_reading, general_condition || 'good', notes]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'Checklist for this vehicle/driver/date already exists' });
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
