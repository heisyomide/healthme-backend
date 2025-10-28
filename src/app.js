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

// === Middleware ===
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
    credentials: true, // Allow cookies and auth headers
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