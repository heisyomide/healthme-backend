// src/services/practitionerService.js
const Practitioner = require('../models/Practitioner');
const Appointment = require('../models/Appointment');
const Patient = require('../models/patient');

/**
 * Calculates dashboard overview statistics for a practitioner.
 * @param {string} practitionerId - The ID of the Practitioner profile.
 * @returns {object} Dashboard summary data.
 */
exports.getPractitionerOverview = async (practitionerId) => {
    const practitioner = await Practitioner.findById(practitionerId).select('+appointments').lean();

    if (!practitioner) {
        throw new Error("Practitioner profile not found.");
    }

    // 1. Fetch appointments for status counts
    const appointments = await Appointment.find({ practitioner: practitionerId }).select('status').lean();

    // 2. Find all unique patient IDs from appointments
    const totalPatients = await Appointment.distinct("patient", { practitioner: practitionerId });
    
    const upcomingAppointments = appointments.filter(a => a.status === "confirmed").length;
    const completedAppointments = appointments.filter(a => a.status === "completed").length;

    // Helper to calculate completion percentage (moved from controller)
    const calcProfileCompletion = (p) => {
        const fields = [p.fullName, p.email, p.specialty, p.bio, p.profilePicture, p.location];
        const filled = fields.filter(val => val && val.length > 0).length;
        return Math.round((filled / fields.length) * 100);
    };

    return {
        totalPatients: totalPatients.length,
        upcomingAppointments,
        completedAppointments,
        profileCompletion: calcProfileCompletion(practitioner),
        ratings: practitioner.ratings || [],
        isVerified: practitioner.isVerified || false,
    };
};

/**
 * Retrieves a list of unique patients seen by the practitioner.
 * @param {string} practitionerId - The ID of the Practitioner profile.
 * @returns {Array<object>} List of patient profiles.
 */
exports.getPractitionerPatients = async (practitionerId) => {
    const patientIds = await Appointment.distinct("patient", { practitioner: practitionerId });
    
    const patients = await Patient.find({ _id: { $in: patientIds } })
      .select("fullName email dateOfBirth medicalRecordNumber")
      .lean();
    
    return patients;
};