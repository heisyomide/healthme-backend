// src/services/appointmentService.js
const Appointment = require("../models/Appointment");
const Practitioner = require("../models/Practitioner");
const Patient = require("../models/patient");
const mongoose = require("mongoose");

/**
 * Checks for time conflicts for a new or updated appointment.
 * A conflict occurs if the requested time slot is already booked by the practitioner or patient.
 * @param {string} practitionerId - The ID of the practitioner.
 * @param {string} patientId - The ID of the patient.
 * @param {Date} date - The date of the appointment.
 * @param {string} timeSlot - The specific time slot (e.g., "10:00").
 * @param {string} [excludeAppointmentId] - Optional ID of an appointment to exclude (for updates).
 * @returns {boolean} True if a conflict exists, false otherwise.
 */
exports.checkForConflicts = async (practitionerId, patientId, date, timeSlot, excludeAppointmentId = null) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Base query to find appointments on the specified date and time slot
  const query = {
    date: { $gte: startOfDay, $lte: endOfDay },
    timeSlot: timeSlot,
    status: { $in: ['pending', 'confirmed'] } // Only check against non-cancelled/non-completed appointments
  };

  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId };
  }

  // Check for Practitioner conflict
  const practitionerConflict = await Appointment.findOne({ 
    ...query, 
    practitioner: practitionerId 
  });

  if (practitionerConflict) {
    return true; // Practitioner is double-booked
  }

  // Check for Patient conflict
  const patientConflict = await Appointment.findOne({ 
    ...query, 
    patient: patientId 
  });

  if (patientConflict) {
    return true; // Patient is double-booked
  }

  return false;
};

/**
 * Handles the initial scheduling of an appointment.
 * Performs validation checks before creating the record.
 * @param {object} appointmentData - Data including patient, practitioner, date, timeSlot, and reason.
 * @returns {object} The newly created Appointment document.
 */
exports.scheduleAppointment = async (appointmentData) => {
  const { patient, practitioner, date, timeSlot } = appointmentData;
  
  // 1. Check for required profiles
  const [patientProfile, practitionerProfile] = await Promise.all([
    Patient.findById(patient),
    Practitioner.findById(practitioner)
  ]);

  if (!patientProfile || !practitionerProfile) {
    throw new Error("Patient or Practitioner profile not found.");
  }
  
  // 2. Check Practitioner availability based on public availability schedule (if stored)
  // NOTE: This assumes the practitioner's availability is pre-checked on the front-end,
  // but a server-side check should still confirm the requested slot is offered.
  // For simplicity, we skip complex schedule parsing here, but this is where it belongs.

  // 3. Check for time conflicts
  const conflict = await exports.checkForConflicts(practitioner, patient, date, timeSlot);
  if (conflict) {
    throw new Error("The requested time slot is unavailable due to a conflict with an existing appointment.");
  }

  // 4. Create the appointment (Status starts as 'pending' until payment is confirmed)
  const newAppointment = await Appointment.create({
    ...appointmentData,
    status: 'pending', // Requires payment confirmation to move to 'confirmed'
    bookedBy: patient,
    // Note: Link patient to practitioner's patient list (handled implicitly by appointment history)
  });

  return newAppointment;
};


/**
 * Updates the status of an appointment (e.g., completed, cancelled).
 * @param {string} appointmentId - The ID of the appointment.
 * @param {string} newStatus - The new status ('confirmed', 'completed', 'cancelled', 'no-show').
 * @param {string} [cancellationReason] - Reason for cancellation, if applicable.
 * @returns {object} The updated Appointment document.
 */
exports.updateAppointmentStatus = async (appointmentId, newStatus, cancellationReason) => {
  if (!['confirmed', 'completed', 'cancelled', 'no-show'].includes(newStatus)) {
    throw new Error("Invalid status provided.");
  }
  
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new Error("Appointment not found.");
  }
  
  const updateFields = { status: newStatus };
  
  if (newStatus === 'cancelled') {
    updateFields.cancellationReason = cancellationReason || 'Cancelled by user/admin.';
    updateFields.cancellationDate = new Date();
  }
  
  if (newStatus === 'completed') {
    updateFields.completionDate = new Date();
  }
  
  const updatedAppointment = await Appointment.findByIdAndUpdate(
    appointmentId,
    { $set: updateFields },
    { new: true, runValidators: true }
  );

  return updatedAppointment;
};


/**
 * Retrieves a list of upcoming appointments for the practitioner.
 * @param {string} practitionerId - The ID of the practitioner.
 * @returns {Array<object>} List of upcoming appointments.
 */
exports.getUpcomingPractitionerAppointments = async (practitionerId) => {
    const upcomingAppointments = await Appointment.find({
        practitioner: practitionerId,
        date: { $gte: new Date() }, // Appointments in the future
        status: { $in: ['pending', 'confirmed'] }
    })
    .populate('patient', 'fullName email dateOfBirth')
    .sort({ date: 1, timeSlot: 1 })
    .lean();
    
    return upcomingAppointments;
};

/**
 * Retrieves a list of past appointments for the patient.
 * @param {string} patientId - The ID of the patient.
 * @returns {Array<object>} List of past appointments.
 */
exports.getPastPatientAppointments = async (patientId) => {
    const pastAppointments = await Appointment.find({
        patient: patientId,
        status: { $in: ['completed', 'no-show', 'cancelled'] } // Or check against date < today
    })
    .populate('practitioner', 'fullName specialty')
    .sort({ date: -1, timeSlot: -1 })
    .lean();
    
    return pastAppointments;
};