const router = require('express').Router();
const db = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/vehicles
router.get('/', authenticate, async (req, res) => {
    try {
        const { status } = req.query;
        let q = 'SELECT * FROM vehicles';
        const params = [];
        if (status) {
            q += ' WHERE status = $1';
            params.push(status);
        }
        q += ' ORDER BY plate ASC';
        const result = await db.query(q, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/vehicles/:id
router.get('/:id', authenticate, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM vehicles WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/vehicles
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const { plate, brand, model, year, color, capacity_liters, fuel_type, odometer_km, status, insurance_expiry, notes } = req.body;
        if (!plate || !brand || !model || !year) {
            return res.status(400).json({ error: 'plate, brand, model, year are required' });
        }
        const result = await db.query(
            `INSERT INTO vehicles (plate, brand, model, year, color, capacity_liters, fuel_type, odometer_km, status, insurance_expiry, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
            [plate, brand, model, year, color, capacity_liters || 0, fuel_type || 'diesel', odometer_km || 0, status || 'active', insurance_expiry, notes]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'Plate already exists' });
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/vehicles/:id
router.put('/:id', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const { plate, brand, model, year, color, capacity_liters, fuel_type, odometer_km, status, insurance_expiry, notes } = req.body;
        const result = await db.query(
            `UPDATE vehicles SET plate=COALESCE($1,plate), brand=COALESCE($2,brand), model=COALESCE($3,model),
       year=COALESCE($4,year), color=COALESCE($5,color), capacity_liters=COALESCE($6,capacity_liters),
       fuel_type=COALESCE($7,fuel_type), odometer_km=COALESCE($8,odometer_km), status=COALESCE($9,status),
       insurance_expiry=COALESCE($10,insurance_expiry), notes=COALESCE($11,notes)
       WHERE id=$12 RETURNING *`,
            [plate, brand, model, year, color, capacity_liters, fuel_type, odometer_km, status, insurance_expiry, notes, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/vehicles/:id
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const result = await db.query('DELETE FROM vehicles WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
        res.json({ message: 'Vehicle deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
