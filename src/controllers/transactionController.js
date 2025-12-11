// src/controllers/transactionController.js
const Transaction = require("../models/Transaction");
const mongoose = require("mongoose");

/* =====================================================
   1. GET AUTHENTICATED USER'S HISTORY
===================================================== */

/**
 * @desc Get the transaction history for the authenticated user (Patient or Practitioner)
 * @route GET /api/v1/transactions/me
 * @access Private/Patient, Practitioner
 */
exports.getMyTransactionHistory = async (req, res) => {
  try {
    const profileId = req.user.profileId;
    const role = req.user.role;

    const query = {};
    
    // Query based on the user's role: Patient or Practitioner
    if (role === "patient") {
      query.patient = profileId;
    } else if (role === "practitioner") {
      query.practitioner = profileId;
    } else {
      // Admin should use the admin endpoint below
      return res.status(403).json({ success: false, message: "Unauthorized role for this endpoint." });
    }

    const transactions = await Transaction.find(query)
      .populate("patient", "fullName medicalRecordNumber")
      .populate("practitioner", "fullName specialty")
      .sort({ transactionDate: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    console.error("getMyTransactionHistory error:", error);
    res.status(500).json({ success: false, message: "Server error fetching history." });
  }
};

/* =====================================================
   2. ADMIN: GET ALL TRANSACTIONS (Audit)
===================================================== */

/**
 * @desc Admin: Get all transactions, with optional filtering
 * @route GET /api/v1/admin/transactions
 * @access Private/Admin (Requires 'manage_billing' permission)
 */
exports.getAllTransactions = async (req, res) => {
  try {
    const { status, type, dateFrom, dateTo } = req.query;
    const query = {};

    // Apply filters based on query parameters
    if (status) query.status = status;
    if (type) query.transactionType = type;
    
    if (dateFrom || dateTo) {
      query.transactionDate = {};
      if (dateFrom) query.transactionDate.$gte = new Date(dateFrom);
      if (dateTo) query.transactionDate.$lte = new Date(dateTo);
    }

    const transactions = await Transaction.find(query)
      .populate("patient", "fullName medicalRecordNumber")
      .populate("practitioner", "fullName specialty")
      .sort({ transactionDate: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    console.error("getAllTransactions error:", error);
    res.status(500).json({ success: false, message: "Server error fetching all transactions." });
  }
};

/* =====================================================
   3. ADMIN: AGGREGATE REVENUE REPORT
===================================================== */

/**
 * @desc Admin: Get aggregated financial data for reporting (e.g., total revenue)
 * @route GET /api/v1/admin/transactions/revenue-report
 * @access Private/Admin (Requires 'manage_billing' permission)
 */
exports.getRevenueReport = async (req, res) => {
  try {
    // Stage 1: Filter to only include completed payments
    const matchCompletedPayments = {
      $match: {
        status: "Completed",
        transactionType: { $in: ["Payment", "Subscription Fee"] }
      }
    };
    
    // Stage 2: Group by month/year and calculate total sum
    const aggregateResults = await Transaction.aggregate([
      matchCompletedPayments,
      {
        $group: {
          _id: {
            year: { $year: "$transactionDate" },
            month: { $month: "$transactionDate" }
          },
          totalRevenue: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Stage 3: Calculate overall total
    const overallTotal = aggregateResults.reduce((sum, item) => sum + item.totalRevenue, 0);

    res.status(200).json({
      success: true,
      overallTotal: overallTotal,
      data: aggregateResults, // Monthly breakdown
    });
  } catch (error) {
    console.error("getRevenueReport error:", error);
    res.status(500).json({ success: false, message: "Server error generating report." });
  }
};