const router = require('express').Router();
const db = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/maintenance — filter by vehicle_id, include overdue alerts
router.get('/', authenticate, async (req, res) => {
    try {
        const { vehicle_id, overdue } = req.query;
        let q = `SELECT m.*, v.plate as vehicle_plate, v.brand, v.model
             FROM maintenance_logs m JOIN vehicles v ON m.vehicle_id = v.id WHERE 1=1`;
        const params = [];
        let idx = 1;

        if (vehicle_id) { q += ` AND m.vehicle_id = $${idx++}`; params.push(vehicle_id); }
        if (overdue === 'true') { q += ` AND m.next_due_date < CURRENT_DATE AND m.is_resolved = true`; }

        q += ' ORDER BY m.service_date DESC';
        const result = await db.query(q, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/maintenance/alerts — upcoming and overdue
router.get('/alerts', authenticate, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT m.*, v.plate, v.brand, v.model,
       CASE
         WHEN m.next_due_date < CURRENT_DATE THEN 'overdue'
         WHEN m.next_due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'upcoming'
         ELSE 'ok'
       END as alert_level
       FROM maintenance_logs m
       JOIN vehicles v ON m.vehicle_id = v.id
       WHERE m.next_due_date IS NOT NULL AND m.next_due_date <= CURRENT_DATE + INTERVAL '30 days'
       ORDER BY m.next_due_date ASC`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/maintenance/:id
router.get('/:id', authenticate, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT m.*, v.plate, v.brand, v.model
       FROM maintenance_logs m JOIN vehicles v ON m.vehicle_id = v.id WHERE m.id = $1`,
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/maintenance
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const { vehicle_id, type, description, cost, service_provider, service_date, next_due_date, next_due_km, odometer_at_service, parts_replaced } = req.body;
        if (!vehicle_id || !description) {
            return res.status(400).json({ error: 'vehicle_id and description are required' });
        }

        const result = await db.query(
            `INSERT INTO maintenance_logs (vehicle_id, type, description, cost, service_provider, service_date, next_due_date, next_due_km, odometer_at_service, parts_replaced)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
            [vehicle_id, type || 'preventive', description, cost || 0, service_provider, service_date || new Date().toISOString().split('T')[0], next_due_date, next_due_km, odometer_at_service, parts_replaced]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/maintenance/:id
router.put('/:id', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const { type, description, cost, service_provider, service_date, next_due_date, next_due_km, odometer_at_service, parts_replaced, is_resolved } = req.body;
        const result = await db.query(
            `UPDATE maintenance_logs SET type=COALESCE($1,type), description=COALESCE($2,description),
       cost=COALESCE($3,cost), service_provider=COALESCE($4,service_provider),
       service_date=COALESCE($5,service_date), next_due_date=COALESCE($6,next_due_date),
       next_due_km=COALESCE($7,next_due_km), odometer_at_service=COALESCE($8,odometer_at_service),
       parts_replaced=COALESCE($9,parts_replaced), is_resolved=COALESCE($10,is_resolved)
       WHERE id=$11 RETURNING *`,
            [type, description, cost, service_provider, service_date, next_due_date, next_due_km, odometer_at_service, parts_replaced, is_resolved, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/maintenance/:id
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const result = await db.query('DELETE FROM maintenance_logs WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
        res.json({ message: 'Record deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
