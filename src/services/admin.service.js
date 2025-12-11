// src/services/adminService.js
const User = require("../models/User");
const Patient = require("../models/patient_temp");
const Practitioner = require("../models/Practitioner");
const Appointment = require("../models/Appointment");
const Verification = require("../models/Verification_temp");
const Transaction = require("../models/Transaction");
const mongoose = require("mongoose");

/**
 * @desc Retrieves key aggregated statistics for the Admin Dashboard.
 * @returns {object} Object containing counts of various entities.
 */
exports.getDashboardStats = async () => {
  try {
    // Fetch counts concurrently for speed
    const [
      totalUsers,
      totalPractitioners,
      totalPatients,
      pendingAppointments,
      pendingVerifications,
      revenueStats
    ] = await Promise.all([
      User.countDocuments(),
      Practitioner.countDocuments({ isActive: true }),
      Patient.countDocuments(),
      Appointment.countDocuments({ status: { $in: ["pending", "confirmed"] } }),
      Verification.countDocuments({ kycStatus: "In Review" }),
      this.getRevenueSummary() // Reuse the revenue summary function
    ]);

    return {
      totalUsers,
      totalPractitioners,
      totalPatients,
      pendingAppointments,
      pendingVerifications,
      totalRevenueUSD: revenueStats.totalRevenueUSD,
    };
  } catch (error) {
    console.error("Error in getDashboardStats service:", error);
    throw new Error("Failed to retrieve dashboard statistics.");
  }
};

/**
 * @desc Calculates the overall total completed revenue.
 * @returns {object} Summary of total revenue.
 */
exports.getRevenueSummary = async () => {
    try {
        const result = await Transaction.aggregate([
            {
                $match: {
                    status: "Completed",
                    transactionType: { $in: ["Payment", "Subscription Fee"] },
                    currency: "USD" // Only aggregate USD for consistency
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$amount" }
                }
            }
        ]);
        
        const totalRevenueUSD = result.length > 0 ? result[0].totalRevenue : 0;
        
        return { totalRevenueUSD };

    } catch (error) {
        console.error("Error in getRevenueSummary service:", error);
        throw new Error("Failed to calculate revenue summary.");
    }
};

/**
 * @desc Retrieves a comprehensive list of all users with profile details.
 * @param {object} filters - Query filters (e.g., role, status).
 * @returns {Array<object>} List of User documents.
 */
exports.getAllUsers = async (filters = {}) => {
  try {
    const query = {};

    // Map high-level filters to User model fields
    if (filters.role) query.role = filters.role;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;

    // Retrieve core User documents
    let users = await User.find(query).select('-password').lean();

    // Group users by role to prepare for profile lookup
    const patients = users.filter(u => u.role === 'patient').map(u => u._id);
    const practitioners = users.filter(u => u.role === 'practitioner').map(u => u._id);

    // Fetch profile details concurrently
    const [patientProfiles, practitionerProfiles] = await Promise.all([
      Patient.find({ user: { $in: patients } }).select('fullName medicalRecordNumber dateOfBirth').lean(),
      Practitioner.find({ user: { $in: practitioners } }).select('fullName specialty isVerified location').lean()
    ]);

    const patientMap = patientProfiles.reduce((map, p) => {
      map[p.user.toString()] = p;
      return map;
    }, {});
    
    const practitionerMap = practitionerProfiles.reduce((map, p) => {
      map[p.user.toString()] = p;
      return map;
    }, {});

    // Merge profile data into the core user list
    users = users.map(user => {
      const profileData = user.role === 'patient' ? patientMap[user._id.toString()] : practitionerMap[user._id.toString()];
      return {
        ...user,
        profileData: profileData || null, // Include profile details
      };
    });

    return users;

  } catch (error) {
    console.error("Error in getAllUsers service:", error);
    throw new Error("Failed to retrieve user list.");
  }
};

/**
 * @desc Suspends or reactivates a user's account and profile.
 * @param {string} userId - The core User ID to modify.
 * @param {boolean} suspend - True to suspend (isActive: false), false to reactivate.
 * @returns {object} The updated User document.
 */
exports.suspendUser = async (userId, suspend) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const isActive = !suspend; // If 'suspend' is true, set isActive to false

    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      throw new Error("User not found.");
    }
    
    // 1. Update the core User status
    user.isActive = isActive;
    await user.save({ session });

    // 2. Update the associated profile status (Patient or Practitioner)
    let ProfileModel;
    if (user.role === 'patient') {
        ProfileModel = Patient;
    } else if (user.role === 'practitioner') {
        ProfileModel = Practitioner;
    }

    if (ProfileModel) {
        await ProfileModel.updateOne(
            { user: userId },
            { $set: { isActive: isActive } }, // Match the core User status
            { session }
        );
    }

    await session.commitTransaction();

    return user;

  } catch (error) {
    await session.abortTransaction();
    console.error("Error in suspendUser service:", error);
    throw new Error(`Failed to ${suspend ? 'suspend' : 'reactivate'} user account.`);
  } finally {
    session.endSession();
  }
};