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
app.use(express.json()); // must come before routes
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://healthme-frontend.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// === Routes ===
app.use("/api/auth", authRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/practitioner", practitionerRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/location", require("./routes/location"));

// === Health Check Route ===
app.get("/", (req, res) => {
  res.json({ success: true, message: "HealthMe API is running ✅" });
});

module.exports = app;