/**
 * @file locationRoutes.js
 * @desc API routes for location management (clinics, hospitals).
 * Public routes for viewing, Admin routes for creation/modification.
 */
const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middlewares/authMiddleware');

const {
    createLocation,
    updateLocation,
    deleteLocation,
    getAllLocations,
    getLocationById,
    getNearbyLocations,
} = require('../controllers/locationController');


/* =====================================================
   ADMIN CRUD ROUTES
===================================================== */

// These routes require admin authorization
const ADMIN_AUTH = [protect, authorize(['admin'])];

// @route   POST /api/v1/locations
// @desc    Create a new physical location
// @access  Private/Admin
router.post('/', ADMIN_AUTH, createLocation);

// @route   PUT /api/v1/locations/:id
// @desc    Update an existing location
// @access  Private/Admin
router.put('/:id', ADMIN_AUTH, updateLocation);

// @route   DELETE /api/v1/locations/:id
// @desc    Delete a location
// @access  Private/Admin
router.delete('/:id', ADMIN_AUTH, deleteLocation);


/* =====================================================
   PUBLIC/VIEWING ROUTES
===================================================== */

// @route   GET /api/v1/locations/nearby?lat=...&lng=...&distance=...
// @desc    Get locations near a specific coordinate
// @access  Public
router.get('/nearby', getNearbyLocations);

// @route   GET /api/v1/locations/:id
// @desc    Get single location by ID
// @access  Public
router.get('/:id', getLocationById);

// @route   GET /api/v1/locations
// @desc    Get all locations
// @access  Public
router.get('/', getAllLocations);


module.exports = router;