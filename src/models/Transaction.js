// src/models/Transaction.js
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    // --- Related Entities (Connecting to other models) ---
    patient: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Patient", 
      required: true 
    },
    practitioner: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Practitioner", 
      required: false // Optional, as some transactions might be system-level
    },
    appointment: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Appointment", 
      required: false, 
      unique: true, 
      sparse: true // Allows nulls, but if present, it must be unique
    },

    // --- Financial Details ---
    transactionType: {
      type: String,
      enum: ["Payment", "Refund", "Adjustment", "Billing"],
      required: true,
    },
    amount: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    currency: {
      type: String,
      default: "USD",
      enum: ["USD", "EUR", "GBP"], // Adjust as needed
    },
    paymentMethod: {
      type: String,
      enum: ["Credit Card", "Bank Transfer", "Cash", "Insurance"],
      required: true,
    },

    // --- Status and Reference ---
    status: {
      type: String,
      enum: ["Pending", "Completed", "Failed", "Cancelled"],
      default: "Completed",
    },
    transactionDate: { 
      type: Date, 
      default: Date.now 
    },
    referenceId: { 
      type: String, 
      unique: true, 
      required: true, 
      trim: true 
    }, // Unique ID from payment gateway or system

    // --- Description ---
    description: { 
      type: String, 
      trim: true 
    },
    
    // --- Audit/Metadata ---
    processedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Admin", // Or whoever processes the transaction
      required: false
    }
  },
  { timestamps: true }
);

// Indexes for faster lookups based on patient or date
transactionSchema.index({ patient: 1, transactionDate: -1 });
transactionSchema.index({ referenceId: 1 });

module.exports = mongoose.model("Transaction", transactionSchema);