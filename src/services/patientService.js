// src/services/patientService.js
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const ClinicalNote = require('../models/ClinicalNote');
const Prescription = require('../models/Prescription');

/**
 * Retrieves a patient's entire medical record bundle.
 * @param {string} patientId - The ID of the Patient profile.
 * @returns {object} The bundled medical history.
 */
exports.getPatientMedicalHistory = async (patientId) => {
    // Ensure Patient exists (optional, but good for security boundary)
    const patient = await Patient.findById(patientId);
    if (!patient) {
        throw new Error("Patient profile not found.");
    }
    
    // Fetch all related data concurrently
    const [appointments, clinicalNotes, prescriptions] = await Promise.all([
        Appointment.find({ patient: patientId })
            .populate('practitioner', 'fullName specialty')
            .sort({ date: -1 }),
            
        ClinicalNote.find({ patient: patientId })
            .populate('practitioner', 'fullName specialty')
            .sort({ noteDate: -1 }),
            
        Prescription.find({ patient: patientId })
            .populate('practitioner', 'fullName specialty')
            .sort({ prescriptionDate: -1 })
    ]);
    
    return { appointments, clinicalNotes, prescriptions };
};

/**
 * Updates a patient's demographic and contact information.
 * @param {string} patientId - The ID of the Patient profile.
 * @param {object} updates - Fields to update.
 * @returns {object} The updated Patient profile.
 */
exports.updatePatientDemographics = async (patientId, updates) => {
    // Important: Sanitize input to prevent modification of protected fields
    delete updates.medicalRecordNumber;
    delete updates.isVerified;
    
    const patient = await Patient.findByIdAndUpdate(
        patientId,
        { $set: updates },
        { new: true, runValidators: true }
    );
    
    if (!patient) {
        throw new Error("Patient profile not found.");
    }
    
    return patient;
};