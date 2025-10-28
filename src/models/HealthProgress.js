const mongoose = require("mongoose");

const HealthProgressSchema = new mongoose.Schema(
  {
    // Reference to the user (the patient)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // <-- references the User model
      required: true,
    },

    // Health score from 0 to 100
    score: {
      type: Number,
      required: true,
      default: 0,
    },

    // Session tracking
    completedSessions: {
      type: Number,
      default: 0,
    },
    totalSessions: {
      type: Number,
      default: 0,
    },

    // Latest metrics summary
    metrics: {
      heartRate: { type: Number, default: 0 },
      systolicBP: { type: Number, default: 0 },
      vrSessions: { type: Number, default: 0 },
    },

    // For progress chart visualization
    chartData: {
      labels: [{ type: String }],
      values: [{ type: Number }],
    },

    // Optional notes or system remarks
    notes: {
      type: String,
      trim: true,
    },

    // Timestamp of last update
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

module.exports = mongoose.model("HealthProgress", HealthProgressSchema);