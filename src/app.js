const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const kycRoutes = require("./routes/kycRoutes");
const adminRoutes = require("./routes/adminRoutes");
const practitionerRoutes = require("./routes/practitionerRoutes");
const patientRoutes = require("./routes/patientRoutes");

const app = express();

// === CORS Configuration ===
const allowedOrigins = [
  "http://localhost:3000",
  "https://healthme-frontend.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

// === Routes ===
app.use("/api/auth", authRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/practitioner", practitionerRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/location", require("./routes/location"));

// === Health Check Route ===

app.get("/", (req, res) => {
  res.json({ success: true, message: "HealthMe API is running ✅" });
});
// === Export app ===
module.exports = app;