const router = require('express').Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { getOptimizedRoute } = require('../utils/osrm');

// POST /api/routing/optimize — get optimized route for a set of delivery IDs
router.post('/optimize', authenticate, async (req, res) => {
    try {
        const { delivery_ids, start_lat, start_lng } = req.body;
        if (!delivery_ids || delivery_ids.length < 1) {
            return res.status(400).json({ error: 'delivery_ids are required (at least 1)' });
        }

        // Fetch delivery coordinates
        const result = await db.query(
            `SELECT id, client_name, address,
       ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng
       FROM deliveries WHERE id = ANY($1::int[]) ORDER BY priority ASC`,
            [delivery_ids]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No deliveries found' });
        }

        // Build points array: start point (depot) + delivery points
        const points = [];
        if (start_lat && start_lng) {
            points.push({ lat: parseFloat(start_lat), lng: parseFloat(start_lng) });
        } else {
            // Default depot: Guatemala City center
            points.push({ lat: 14.6349, lng: -90.5069 });
        }

        result.rows.forEach(d => {
            points.push({ lat: parseFloat(d.lat), lng: parseFloat(d.lng) });
        });

        const osrmResult = await getOptimizedRoute(points);

        // Map waypoints back to deliveries
        const trip = osrmResult.trips[0];
        const waypoints = osrmResult.waypoints.map((wp, idx) => ({
            waypoint_index: wp.waypoint_index,
            trips_index: wp.trips_index,
            location: wp.location,
            delivery: idx === 0 ? { id: 0, name: 'Depot' } : {
                id: result.rows[idx - 1]?.id,
                client_name: result.rows[idx - 1]?.client_name,
                address: result.rows[idx - 1]?.address,
            },
        }));

        res.json({
            total_distance_km: (trip.distance / 1000).toFixed(2),
            total_duration_min: (trip.duration / 60).toFixed(2),
            geometry: trip.geometry,
            waypoints,
            legs: trip.legs.map(l => ({
                distance_km: (l.distance / 1000).toFixed(2),
                duration_min: (l.duration / 60).toFixed(2),
                summary: l.summary,
            })),
        });
    } catch (err) {
        console.error('Routing error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
