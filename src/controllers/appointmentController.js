/**
 * @file appointmentController.js
 * @desc Controller functions for managing appointments: booking, viewing, and status updates.
 */
const Appointment = require("../models/Appointment");
const Patient = require("../models/patient");
const Practitioner = require("../models/Practitioner");
const asyncHandler = require('../middlewares/async');
const { NotFoundError, BadRequestError, ConflictError } = require('../utils/HttpError');
// const Transaction = require("../models/Transaction"); 
// Removed: const moment = require("moment"); 

/* =====================================================
   Helper Function: Check Practitioner Availability
===================================================== */
const checkAvailability = async (practitionerId, date, timeSlot) => {
  // Ensure the date string is converted to a proper Date object
  const appointmentDate = new Date(date); 
    
  // A simple check to see if the practitioner is already booked at that time
  const existingAppointment = await Appointment.findOne({
    practitioner: practitionerId,
    date: appointmentDate,
    timeSlot: timeSlot,
    status: { $in: ["pending", "confirmed", "rescheduled"] } // Don't count completed/cancelled
  });

  return !existingAppointment; // Returns true if available, false if booked
};


/* =====================================================
   1. CREATE/BOOK APPOINTMENT
===================================================== */

/**
 * @desc Book a new appointment
 * @route POST /api/v1/appointments
 * @access Private/Patient
 */
exports.createAppointment = asyncHandler(async (req, res, next) => {
    const { practitionerId, date, timeSlot, mode, reason, duration, location } = req.body;
    
    // patientId comes from the authenticated user
    const patientId = req.user.profileId; 

    // 1. Validate inputs
    if (!practitionerId || !date || !timeSlot || !reason) {
      return next(new BadRequestError("Missing required fields for booking (practitionerId, date, timeSlot, reason)."));
    }

    // 2. Check Practitioner Exists
    const practitioner = await Practitioner.findById(practitionerId);
    if (!practitioner) {
      return next(new NotFoundError("Practitioner not found."));
    }

    // 3. Check Availability
    const isAvailable = await checkAvailability(practitionerId, date, timeSlot);
    if (!isAvailable) {
      return next(new ConflictError("The selected time slot is already booked."));
    }
    
    // Convert date string to Date object
    const appointmentDate = new Date(date);

    // 4. Create the Appointment
    const newAppointment = await Appointment.create({
      patient: patientId,
      practitioner: practitionerId,
      date: appointmentDate,
      timeSlot,
      mode,
      reason,
      duration,
      location: mode === 'in-person' ? location : undefined,
      status: "pending", 
    });

    // 5. Success response
    res.status(201).json({
      success: true,
      message: "Appointment booked successfully and is pending confirmation.",
      data: newAppointment,
    });
});


/* =====================================================
   2. GET APPOINTMENTS (Patient or Practitioner Dashboard)
===================================================== */

/**
 * @desc Get all appointments for the authenticated user (Patient/Practitioner)
 * @route GET /api/v1/appointments/my
 * @access Private/Authenticated User
 */
exports.getMyAppointments = asyncHandler(async (req, res, next) => {
    const userId = req.user.profileId;
    const userRole = req.user.role; // patient or practitioner

    const query = {};
    if (userRole === "patient") {
      query.patient = userId;
    } else if (userRole === "practitioner") {
      query.practitioner = userId;
    } else {
        // This case should be blocked by 'protect' but acts as a safeguard
        return next(new BadRequestError("Invalid user role detected."));
    }

    // Populate patient and practitioner details for context
    const appointments = await Appointment.find(query)
      .populate("patient", "fullName email phone")
      .populate("practitioner", "fullName specialty")
      .sort({ date: -1, timeSlot: 1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
});


/* =====================================================
   3. UPDATE APPOINTMENT STATUS (Practitioner/Admin)
===================================================== */

/**
 * @desc Confirm, Cancel, or Reschedule an appointment
 * @route PUT /api/v1/appointments/:id/status
 * @access Private/Practitioner or Admin
 */
exports.updateAppointmentStatus = asyncHandler(async (req, res, next) => {
    const { status, sessionLink, notes } = req.body;
    const appointmentId = req.params.id;
    const validStatuses = ["confirmed", "cancelled", "completed", "rescheduled"];

    if (!validStatuses.includes(status)) {
      return next(new BadRequestError(`Invalid status provided. Must be one of: ${validStatuses.join(', ')}.`));
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return next(new NotFoundError("Appointment not found."));
    }

    // Authorization check: Ensure only the assigned practitioner or an Admin can change the status
    if (req.user.role === 'practitioner' && appointment.practitioner.toString() !== req.user.profileId) {
        return next(new BadRequestError("Unauthorized to modify this appointment."));
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { 
        status,
        sessionLink: status === 'confirmed' ? sessionLink : appointment.sessionLink,
        notes: notes || appointment.notes,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: `Appointment status updated to ${status}.`,
      data: updatedAppointment,
    });
});