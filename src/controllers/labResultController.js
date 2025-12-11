/**
 * @file labResultController.js
 * @desc Controller functions for managing patient lab results.
 * Only Practitioners can create/upload results.
 */
const LabResult = require('../models/LabResult');
const asyncHandler = require('../middlewares/async');
const { NotFoundError, BadRequestError } = require('../utils/HttpError');
// Assuming you have a file upload utility for the reportFileUrl

/* =====================================================
   1. CREATE LAB RESULT (Practitioner Only)
===================================================== */

/**
 * @desc Record a new lab result for a patient
 * @route POST /api/v1/labresults
 * @access Private/Practitioner
 */
exports.createLabResult = asyncHandler(async (req, res, next) => {
    const { patientId, testName, resultDate, status, interpretation, results, reportFileUrl } = req.body;
    
    // The ordering practitioner ID comes from the authenticated user
    const practitionerId = req.user.profileId; 

    if (!patientId || !testName || !resultDate || !results || results.length === 0) {
        return next(new BadRequestError('Missing required fields: patientId, testName, resultDate, and detailed results.'));
    }
    
    // Simple validation for the results array structure
    if (!Array.isArray(results) || results.some(r => !r.parameter || r.value === undefined || !r.unit)) {
        return next(new BadRequestError('Invalid format for the "results" array. Each item needs parameter, value, and unit.'));
    }

    const newResult = await LabResult.create({
        patient: patientId,
        orderedBy: practitionerId,
        testName,
        resultDate,
        status,
        interpretation,
        results,
        reportFileUrl // This URL would typically be generated during a file upload process
    });

    res.status(201).json({
        success: true,
        message: 'Lab result recorded successfully.',
        data: newResult
    });
});

/* =====================================================
   2. GET LAB RESULTS (Patient or Practitioner)
===================================================== */

/**
 * @desc Get lab results associated with the user (patient history or practitioner's ordered tests)
 * @route GET /api/v1/labresults/my
 * @access Private/Authenticated User
 */
exports.getMyLabResults = asyncHandler(async (req, res, next) => {
    const userId = req.user.profileId;
    const userRole = req.user.role; 

    const query = {};
    if (userRole === 'patient') {
        // Patient views their own results
        query.patient = userId;
    } else if (userRole === 'practitioner') {
        // Practitioner views results they ordered
        query.orderedBy = userId;
    } else {
        return next(new BadRequestError('Invalid user role for lab results access.'));
    }

    const results = await LabResult.find(query)
        .populate('patient', 'fullName dob')
        .populate('orderedBy', 'fullName specialty')
        .sort('-resultDate');

    res.status(200).json({
        success: true,
        count: results.length,
        data: results
    });
});

/* =====================================================
   3. GET SINGLE LAB RESULT
===================================================== */

/**
 * @desc Get a single detailed lab result
 * @route GET /api/v1/labresults/:id
 * @access Private/Authenticated User
 */
exports.getLabResultById = asyncHandler(async (req, res, next) => {
    const resultId = req.params.id;
    const userId = req.user.profileId;
    const userRole = req.user.role;

    const result = await LabResult.findById(resultId)
        .populate('patient', 'fullName dob')
        .populate('orderedBy', 'fullName specialty');

    if (!result) {
        return next(new NotFoundError(`Lab result not found with ID ${resultId}`));
    }
    
    // Authorization: Must be the patient, the ordering practitioner, or an admin
    const isAuthorized = (
        (userRole === 'patient' && result.patient.toString() === userId) ||
        (userRole === 'practitioner' && result.orderedBy.toString() === userId) ||
        (userRole === 'admin')
    );
    
    if (!isAuthorized) {
        return next(new BadRequestError('Unauthorized to view this lab result.'));
    }

    res.status(200).json({
        success: true,
        data: result
    });
});