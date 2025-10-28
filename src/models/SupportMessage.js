// src/models/SupportMessage.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SupportSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  subject: String,
  message: String,
  status: { type: String, enum: ["open", "answered", "closed"], default: "open" },
  responses: [
    {
      adminId: { type: Schema.Types.ObjectId, ref: "User" },
      message: String,
      at: Date,
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model("SupportMessage", SupportSchema);