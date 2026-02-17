const axios = require('axios');

const OSRM_URL = process.env.OSRM_URL || 'https://router.project-osrm.org';

/**
 * Get optimized route (TSP) for a set of coordinates via OSRM Trip Service
 * @param {Array<{lng: number, lat: number}>} points
 * @returns {Object} OSRM trip response with optimized waypoints and route geometry
 */
async function getOptimizedRoute(points) {
    if (!points || points.length < 2) {
        throw new Error('At least 2 points are required for routing');
    }

    const coordinates = points.map(p => `${p.lng},${p.lat}`).join(';');
    const url = `${OSRM_URL}/trip/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=true&roundtrip=false&source=first&destination=last`;

    const response = await axios.get(url, { timeout: 10000 });

    if (response.data.code !== 'Ok') {
        throw new Error(`OSRM error: ${response.data.code}`);
    }

    return response.data;
}

/**
 * Get simple route between two points
 * @param {Object} origin {lat, lng}
 * @param {Object} destination {lat, lng}
 * @returns {Object} OSRM route response
 */
async function getRoute(origin, destination) {
    const url = `${OSRM_URL}/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true`;

    const response = await axios.get(url, { timeout: 10000 });

    if (response.data.code !== 'Ok') {
        throw new Error(`OSRM error: ${response.data.code}`);
    }

    return response.data;
}

module.exports = { getOptimizedRoute, getRoute };
