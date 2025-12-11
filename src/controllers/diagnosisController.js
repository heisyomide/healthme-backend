/**
 * @file diagnosisController.js
 * @desc Controller functions for managing patient diagnosis records.
 * Only Practitioners can create/update; Patients can only view their own records.
 */
const Diagnosis = require('../models/Diagnosis');
const asyncHandler = require('../middlewares/async');
const { NotFoundError, BadRequestError } = require('../utils/HttpError');

/* =====================================================
   1. CREATE DIAGNOSIS (Practitioner Only)
===================================================== */

/**
 * @desc Record a new diagnosis for a patient
 * @route POST /api/v1/diagnosis
 * @access Private/Practitioner
 */
exports.createDiagnosis = asyncHandler(async (req, res, next) => {
    const { patientId, appointmentId, code, name, notes, status, diagnosisDate } = req.body;
    
    // The practitioner ID comes from the authenticated user
    const practitionerId = req.user.profileId; 

    if (!patientId || !code || !name) {
        return next(new BadRequestError('Missing required fields: patientId, code, and name.'));
    }

    const newDiagnosis = await Diagnosis.create({
        patient: patientId,
        practitioner: practitionerId,
        appointment: appointmentId,
        code,
        name,
        notes,
        status,
        diagnosisDate: diagnosisDate || Date.now()
    });

    res.status(201).json({
        success: true,
        message: 'Diagnosis recorded successfully.',
        data: newDiagnosis
    });
});

/* =====================================================
   2. GET DIAGNOSES (Patient or Practitioner)
===================================================== */

/**
 * @desc Get all diagnoses associated with the user (patient history or practitioner's cases)
 * @route GET /api/v1/diagnosis/my
 * @access Private/Authenticated User
 */
exports.getMyDiagnoses = asyncHandler(async (req, res, next) => {
    const userId = req.user.profileId;
    const userRole = req.user.role; 

    const query = {};
    if (userRole === 'patient') {
        // Patient views their own records
        query.patient = userId;
    } else if (userRole === 'practitioner') {
        // Practitioner views diagnoses they have made
        query.practitioner = userId;
    } else {
        return next(new BadRequestError('Invalid user role for diagnosis access.'));
    }

    const diagnoses = await Diagnosis.find(query)
        .populate('patient', 'fullName dob')
        .populate('practitioner', 'fullName specialty')
        .sort('-diagnosisDate');

    res.status(200).json({
        success: true,
        count: diagnoses.length,
        data: diagnoses
    });
});

/* =====================================================
   3. UPDATE DIAGNOSIS (Practitioner Only)
===================================================== */

/**
 * @desc Update a diagnosis record (e.g., change status from Provisional to Confirmed)
 * @route PUT /api/v1/diagnosis/:id
 * @access Private/Practitioner
 */
exports.updateDiagnosis = asyncHandler(async (req, res, next) => {
    const diagnosisId = req.params.id;
    const updates = req.body;
    const practitionerId = req.user.profileId;

    let diagnosis = await Diagnosis.findById(diagnosisId);

    if (!diagnosis) {
        return next(new NotFoundError(`Diagnosis not found with ID ${diagnosisId}`));
    }
    
    // Authorization: Only the practitioner who created the diagnosis can update it
    if (diagnosis.practitioner.toString() !== practitionerId) {
        return next(new BadRequestError('You are not authorized to update this diagnosis record.'));
    }

    // Prevent overwriting static links like patient and practitioner
    delete updates.patientId;
    delete updates.practitionerId;
    
    // Update and save
    diagnosis = await Diagnosis.findByIdAndUpdate(diagnosisId, updates, {
        new: true,
        runValidators: true
    }).populate('patient', 'fullName dob');

    res.status(200).json({
        success: true,
        message: 'Diagnosis updated successfully.',
        data: diagnosis
    });
});