// src/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // --- Core Authentication ---
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true 
    },
    password: { 
      type: String, 
      required: true 
    },
    
    // --- Role Identification ---
    role: {
      type: String,
      required: true,
      enum: ["patient", "practitioner", "admin"],
      default: "patient",
    },

    // --- References to Specialized Profiles (for quick lookup) ---
    // These fields allow us to easily find the full profile data based on the role
    patientProfile: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Patient", 
      required: false, 
      unique: true,
      sparse: true 
    },
    practitionerProfile: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Practitioner", 
      required: false, 
      unique: true,
      sparse: true 
    },
    adminProfile: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Admin", 
      required: false, 
      unique: true,
      sparse: true 
    },

    // --- Basic Information (often duplicated in profile for convenience) ---
    fullName: { 
      type: String, 
      required: true, 
      trim: true 
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Hash password before saving (same as previous models)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Hide password in responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);