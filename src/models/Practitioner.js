// src/models/Practitioner.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const practitionerSchema = new mongoose.Schema(
  {
    // --- Identification and Authentication (Standard User Fields) ---
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, default: "practitioner", enum: ["practitioner", "doctor", "nurse", "specialist"] },

    // --- Professional Details (Specific to Practitioner) ---
    specialty: { type: String, required: true, trim: true },
    licenseNumber: { type: String, required: true, unique: true },
    npiNumber: { type: String, unique: true, sparse: true }, // National Provider Identifier (US-specific)
    yearsOfExperience: { type: Number, default: 0, min: 0 },
    hospitalAffiliation: { type: String, trim: true },

    // --- Availability/Scheduling ---
    // A simple array of working days/time blocks can be added here, 
    // but complex scheduling is often handled separately.
    workingDays: [{ 
      type: String, 
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] 
    }],
    
    // An array of clinic locations, if applicable
    locations: [{ type: String, trim: true }]
  },
  { timestamps: true }
);

// Add same pre-save hash and password comparison methods as in Admin.js
practitionerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

practitionerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

practitionerSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("Practitioner", practitionerSchema);