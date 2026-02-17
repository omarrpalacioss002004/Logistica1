const router = require('express').Router();
const db = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/users — Admin: list all users, optionally filter by role
router.get('/', authenticate, async (req, res) => {
    try {
        const { role } = req.query;
        let q = 'SELECT id, email, role, first_name, last_name, phone, license_number, is_active, created_at FROM users';
        const params = [];
        if (role) {
            q += ' WHERE role = $1';
            params.push(role);
        }
        q += ' ORDER BY created_at DESC';
        const result = await db.query(q, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/:id
router.get('/:id', authenticate, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, email, role, first_name, last_name, phone, license_number, is_active, created_at FROM users WHERE id = $1',
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/users/:id
router.put('/:id', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const { first_name, last_name, phone, license_number, role, is_active } = req.body;
        const result = await db.query(
            `UPDATE users SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name),
       phone = COALESCE($3, phone), license_number = COALESCE($4, license_number),
       role = COALESCE($5, role), is_active = COALESCE($6, is_active)
       WHERE id = $7 RETURNING id, email, role, first_name, last_name, phone, license_number, is_active`,
            [first_name, last_name, phone, license_number, role, is_active, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/users/:id — soft delete
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const result = await db.query(
            'UPDATE users SET is_active = false WHERE id = $1 RETURNING id',
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deactivated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
