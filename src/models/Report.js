const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // For example: "January 2025" or "Week 3"
    period: {
      type: String,
      required: true,
      trim: true,
    },

    // Numeric values that represent improvement/progress metrics
    // Could be a health score, stress level, or progress index
    value: {
      type: Number,
      required: true,
      default: 0,
    },

    // Optional breakdown by category (flexible for analytics)
    categories: [
      {
        label: { type: String },
        score: { type: Number, default: 0 },
      },
    ],

    // Optional chart data (for line/bar chart)
    chartData: {
      labels: [{ type: String }],
      values: [{ type: Number }],
    },

    // Optional summary text for report section
    summary: {
      type: String,
      trim: true,
    },

    // Optional doctor review or comment
    doctorComment: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // automatically adds createdAt and updatedAt
  }
);

module.exports = mongoose.model("Report", ReportSchema);