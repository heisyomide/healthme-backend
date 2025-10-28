// models/Medicine.js
const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String },
  dose: { type: String },
  refillInDays: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.models.Medicine || mongoose.model("Medicine", medicineSchema);