const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    /* =====================================================
       👤 Basic Account Info
    ===================================================== */
    fullName: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: { type: String, required: true, minlength: 6 },

    /* =====================================================
       📱 Optional Profile Info
    ===================================================== */
    phone: { type: String },
    age: { type: Number },
    gender: { type: String, enum: ["male", "female", "other"] },
    country: { type: String },
    reasonForJoining: { type: String },

    /* =====================================================
       ⚙ Role Management
    ===================================================== */
    role: {
      type: String,
      enum: ["user", "practitioner", "admin"],
      default: "user",
    },

    /* =====================================================
       🧾 Practitioner Verification Flags
    ===================================================== */
    isKycSubmitted: { type: Boolean, default: false },
    isKycApproved: { type: Boolean, default: false },
    isVerifiedPractitioner: { type: Boolean, default: false },
    isPractitionerPaid: { type: Boolean, default: false },

    /* =====================================================
       🔗 Relations
    ===================================================== */
    kycId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KYC",
    },

    /* =====================================================
       🕓 Meta
    ===================================================== */
    lastLogin: { type: Date },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
  },
  {
    timestamps: true, // Automatically adds createdAt & updatedAt
  }
);

/* =====================================================
   🔐 Password Hash Middleware
===================================================== */
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/* =====================================================
   🔍 Compare Password Method
===================================================== */
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);