// src/models/Admin.js
const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    // --- Link to Core Authentication ---
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Ensures one admin profile per User document
    },
    
    // --- Basic Identification (often duplicated for quick reference) ---
    fullName: { 
      type: String, 
      required: true 
    },
    
    // --- Administrative Roles and Permissions ---
    adminRole: { 
      type: String, 
      enum: ["Super Admin", "Billing Manager", "Verification Agent", "Support Staff"],
      default: "Support Staff",
      required: true
    },
    
    permissions: [{ 
      type: String, 
      enum: ["manage_users", "manage_billing", "view_all_records", "perform_verification"]
      // This array defines specific rights granted to the admin
    }],
    
    // --- Employment Details ---
    employeeId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    department: {
      type: String,
      trim: true
    },
    
    // --- Audit ---
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// We rely on the central 'User' model for password hashing and comparison.
// We only populate the 'user' field when retrieving the admin profile.

module.exports = mongoose.model("Admin", adminSchema);