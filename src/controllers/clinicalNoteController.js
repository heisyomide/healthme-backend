// src/controllers/clinicalNoteController.js
const ClinicalNote = require("../models/clinical");
const Appointment = require("../models/Appointment");

/* =====================================================
   1. CREATE CLINICAL NOTE
===================================================== */

/**
 * @desc Create a new clinical note after an appointment
 * @route POST /api/v1/notes
 * @access Private/Practitioner
 */
exports.createClinicalNote = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { 
      appointmentId, 
      subjective, 
      objective, 
      assessment, 
      plan, 
      noteType 
    } = req.body;
    
    const practitionerId = req.user.profileId; 

    // 1. Validate Appointment and Authorization
    const appointment = await Appointment.findById(appointmentId).session(session);

    if (!appointment) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Appointment not found." });
    }
    
    // Check if the authenticated practitioner is the one assigned to the appointment
    if (appointment.practitioner.toString() !== practitionerId) {
      await session.abortTransaction();
      return res.status(403).json({ success: false, message: "Unauthorized: Note must be created by the assigned practitioner." });
    }

    // 2. Check if a note already exists for this appointment
    const existingNote = await ClinicalNote.findOne({ appointment: appointmentId }).session(session);
    if (existingNote) {
      await session.abortTransaction();
      return res.status(409).json({ success: false, message: "A clinical note already exists for this appointment." });
    }

    // 3. Create the Note
    const newNote = await ClinicalNote.create([{
      patient: appointment.patient,
      practitioner: practitionerId,
      appointment: appointmentId,
      subjective,
      objective,
      assessment,
      plan,
      noteType: noteType || "SOAP",
    }], { session });

    // 4. Update the appointment status to 'completed'
    await Appointment.updateOne(
        { _id: appointmentId }, 
        { $set: { status: "completed" } },
        { session }
    );
    
    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: "Clinical note created successfully.",
      data: newNote[0],
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("createClinicalNote error:", error);
    res.status(500).json({ success: false, message: "Server error creating clinical note." });
  } finally {
    session.endSession();
  }
};


/* =====================================================
   2. RETRIEVE CLINICAL NOTES (Access Control)
===================================================== */

/**
 * @desc Get a specific clinical note by ID
 * @route GET /api/v1/notes/:id
 * @access Private/Patient, Practitioner, Admin
 */
exports.getClinicalNoteById = async (req, res) => {
  try {
    const noteId = req.params.id;
    const note = await ClinicalNote.findById(noteId)
      .populate('patient', 'fullName dateOfBirth medicalRecordNumber')
      .populate('practitioner', 'fullName specialty licenseNumber');

    if (!note) {
      return res.status(404).json({ success: false, message: "Clinical note not found." });
    }

    // Security Check: Ensure authenticated user is the patient, the practitioner, or an admin
    const isOwner = note.patient.toString() === req.user.profileId;
    const isCreator = note.practitioner.toString() === req.user.profileId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isCreator && !isAdmin) {
      return res.status(403).json({ success: false, message: "Unauthorized to view this clinical note." });
    }

    res.status(200).json({
      success: true,
      data: note,
    });
  } catch (error) {
    console.error("getClinicalNoteById error:", error);
    res.status(500).json({ success: false, message: "Server error fetching clinical note." });
  }
};


/* =====================================================
   3. SIGN/FINALIZE NOTE
===================================================== */

/**
 * @desc Sign and finalize a clinical note (e-signature)
 * @route PUT /api/v1/notes/:id/sign
 * @access Private/Practitioner
 */
exports.signClinicalNote = async (req, res) => {
  try {
    const noteId = req.params.id;
    const practitionerId = req.user.profileId;

    const note = await ClinicalNote.findById(noteId);
    
    if (!note) {
      return res.status(404).json({ success: false, message: "Clinical note not found." });
    }

    // 1. Authorization Check: Only the note creator can sign it
    if (note.practitioner.toString() !== practitionerId) {
      return res.status(403).json({ success: false, message: "Unauthorized: Only the originating practitioner can sign the note." });
    }
    
    if (note.isSigned) {
        return res.status(400).json({ success: false, message: "Note is already signed." });
    }

    // 2. Perform the signing
    const updatedNote = await ClinicalNote.findByIdAndUpdate(
      noteId,
      { $set: { isSigned: true, signedDate: Date.now() } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Clinical note has been successfully signed and finalized.",
      data: updatedNote,
    });
  } catch (error) {
    console.error("signClinicalNote error:", error);
    res.status(500).json({ success: false, message: "Server error signing note." });
  }
};