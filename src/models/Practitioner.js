// src/models/SupportMessage.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const practitionerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  specialization: { type: String },
  focus: { type: String },
  bio: { type: String },
  experienceYears: { type: Number, default: 0 },
  profilePicture: { type: String },
  location: { type: String },
  availability: [
    {
      day: { type: String }, // e.g. "Monday"
      from: { type: String }, // e.g. "09:00"
      to: { type: String },   // e.g. "17:00"
    },
  ],
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
  },
  isActive: { type: Boolean, default: true }, // Only active ones are shown publicly
});