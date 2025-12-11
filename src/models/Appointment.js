// src/models/Appointment.js (Updated)
const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    // REFACTORED: Reference the new specialized models
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    practitioner: { type: mongoose.Schema.Types.ObjectId, ref: "Practitioner", required: true },
    // End Refactored section

    date: { type: Date, required: true }, // Only the date
    timeSlot: { type: String, required: true }, // "14:30" – 24h format
    duration: { type: Number, default: 30 }, // minutes

    mode: { type: String, enum: ["virtual", "in-person"], default: "virtual" },
    location: { type: String, trim: true }, // Required if in-person

    reason: { type: String, trim: true },
    notes: { type: String, trim: true },

    sessionLink: { type: String, trim: true }, // For virtual appointment link

    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled", "rescheduled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

appointmentSchema.index({ patient: 1 });
appointmentSchema.index({ practitioner: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);