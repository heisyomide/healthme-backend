/**
 * @file locationController.js
 * @desc Controller functions for managing physical locations (clinics, hospitals).
 * CRUD operations are restricted to Admins. Viewing is public/authenticated.
 */
const Location = require('../models/Location');
const asyncHandler = require('../middlewares/async');
const { NotFoundError, BadRequestError } = require('../utils/HttpError');

/* =====================================================
   1. ADMIN CRUD OPERATIONS
===================================================== */

/**
 * @desc Create a new physical location
 * @route POST /api/v1/locations
 * @access Private/Admin
 */
exports.createLocation = asyncHandler(async (req, res, next) => {
    const newLocation = await Location.create(req.body);

    res.status(201).json({
        success: true,
        message: 'Location created successfully.',
        data: newLocation
    });
});

/**
 * @desc Update an existing location
 * @route PUT /api/v1/locations/:id
 * @access Private/Admin
 */
exports.updateLocation = asyncHandler(async (req, res, next) => {
    const locationId = req.params.id;
    const updates = req.body;

    const location = await Location.findByIdAndUpdate(locationId, updates, {
        new: true,
        runValidators: true
    });

    if (!location) {
        return next(new NotFoundError(`Location not found with ID ${locationId}`));
    }

    res.status(200).json({
        success: true,
        message: 'Location updated successfully.',
        data: location
    });
});

/**
 * @desc Delete a location
 * @route DELETE /api/v1/locations/:id
 * @access Private/Admin
 */
exports.deleteLocation = asyncHandler(async (req, res, next) => {
    const location = await Location.findByIdAndDelete(req.params.id);

    if (!location) {
        return next(new NotFoundError(`Location not found with ID ${req.params.id}`));
    }

    // Note: In a real app, you must check for and update/delete related appointments first.

    res.status(200).json({
        success: true,
        message: 'Location deleted successfully.',
        data: {}
    });
});

/* =====================================================
   2. PUBLIC/VIEWING OPERATIONS
===================================================== */

/**
 * @desc Get all locations
 * @route GET /api/v1/locations
 * @access Public
 */
exports.getAllLocations = asyncHandler(async (req, res, next) => {
    const locations = await Location.find().sort('name');

    res.status(200).json({
        success: true,
        count: locations.length,
        data: locations
    });
});

/**
 * @desc Get single location by ID
 * @route GET /api/v1/locations/:id
 * @access Public
 */
exports.getLocationById = asyncHandler(async (req, res, next) => {
    const location = await Location.findById(req.params.id).populate('affiliatedPractitioners', 'fullName specialty');

    if (!location) {
        return next(new NotFoundError(`Location not found with ID ${req.params.id}`));
    }

    res.status(200).json({
        success: true,
        data: location
    });
});

/**
 * @desc Get locations near a specific coordinate (requires geospatial indexing)
 * @route GET /api/v1/locations/nearby
 * @access Public
 * @queryParams lat, lng, distance (in miles)
 */
exports.getNearbyLocations = asyncHandler(async (req, res, next) => {
    const { lat, lng, distance } = req.query;

    if (!lat || !lng || !distance) {
        return next(new BadRequestError('Missing required query parameters: lat, lng, and distance.'));
    }

    const radius = distance / 3963.2; // Convert distance (miles) to radians

    const locations = await Location.find({
        coordinates: {
            $geoWithin: {
                $centerSphere: [[lng, lat], radius]
            }
        }
    }).sort('name');

    res.status(200).json({
        success: true,
        count: locations.length,
        message: `Found ${locations.length} locations within ${distance} miles of [${lat}, ${lng}].`,
        data: locations
    });
});