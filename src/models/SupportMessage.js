const mongoose = require("mongoose");

const SupportSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  senderName: { type: String },
  content: { type: String },
  status: { type: String, enum: ["open", "answered", "closed"], default: "open" },
  responses: [
    {
      adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      message: { type: String },
      at: { type: Date, default: Date.now },
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model("SupportMessage", SupportSchema);