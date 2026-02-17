const router = require('express').Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /api/zones — return all zones as GeoJSON FeatureCollection
router.get('/', authenticate, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT id, name, description, color, ST_AsGeoJSON(geom)::json as geometry FROM zones ORDER BY name`
        );

        const geojson = {
            type: 'FeatureCollection',
            features: result.rows.map(z => ({
                type: 'Feature',
                properties: {
                    id: z.id,
                    name: z.name,
                    description: z.description,
                    color: z.color,
                },
                geometry: z.geometry,
            })),
        };

        res.json(geojson);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/zones/stats — delivery counts per zone
router.get('/stats', authenticate, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT z.id, z.name, z.color,
       COUNT(d.id) FILTER (WHERE d.status = 'pending') as pending,
       COUNT(d.id) FILTER (WHERE d.status = 'assigned') as assigned,
       COUNT(d.id) FILTER (WHERE d.status = 'in_transit') as in_transit,
       COUNT(d.id) FILTER (WHERE d.status = 'delivered') as delivered,
       COUNT(d.id) as total
       FROM zones z LEFT JOIN deliveries d ON d.zone_id = z.id
       GROUP BY z.id ORDER BY z.name`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
