// models/TreatmentPlan.js
const mongoose = require("mongoose");

const treatmentPlanSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String },
  sessions: { type: Number, default: 0 },
  cadence: { type: String }, // e.g. "1 session / week"
  histogram: { type: [Number], default: [] }, // for UI bars
  weeks: { type: String },
}, { timestamps: true });

module.exports = mongoose.models.TreatmentPlan || mongoose.model("TreatmentPlan", treatmentPlanSchema);