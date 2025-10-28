const mongoose = require("mongoose");

const MetricsSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Heart rate (beats per minute)
    heartRate: {
      type: Number,
      default: 0,
    },

    // Systolic blood pressure
    systolic: {
      type: Number,
      default: 0,
    },

    // Diastolic blood pressure
    diastolic: {
      type: Number,
      default: 0,
    },

    // Number of completed VR sessions
    vrSessions: {
      type: Number,
      default: 0,
    },

    // Optional oxygen level (%)
    oxygenLevel: {
      type: Number,
      default: 0,
    },

    // Optional temperature (°C)
    temperature: {
      type: Number,
      default: 0,
    },

    // Optional note (doctor comment or device source)
    note: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // adds createdAt, updatedAt automatically
  }
);

module.exports = mongoose.model("Metrics", MetricsSchema);