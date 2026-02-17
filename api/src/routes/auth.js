const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { email, password, first_name, last_name, role, phone, license_number } = req.body;
        if (!email || !password || !first_name || !last_name) {
            return res.status(400).json({ error: 'email, password, first_name, last_name are required' });
        }

        const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const result = await db.query(
            `INSERT INTO users (email, password_hash, role, first_name, last_name, phone, license_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, role, first_name, last_name`,
            [email, password_hash, role || 'driver', first_name, last_name, phone, license_number]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'email and password are required' });
        }

        const result = await db.query(
            'SELECT id, email, password_hash, role, first_name, last_name FROM users WHERE email = $1 AND is_active = true',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                first_name: user.first_name,
                last_name: user.last_name,
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
