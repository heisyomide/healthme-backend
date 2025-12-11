/**
 * @file app.js
 * @desc Main Express application configuration for HealthMe API.
 * Sets up global middleware, routes, and error handling.
 */
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");

// --- Middleware & Error Handlers ---
// NOTE: Corrected relative paths for the module imports
const errorHandler = require("./middlewares/errorHandler"); 
const { NotFoundError } = require("./utils/HttpError"); 

// --- Route Imports (Requires these files to exist in src/routes/) ---
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const patientRoutes = require("./routes/patientRoutes");
const practitionerRoutes = require("./routes/practitionerRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const verificationRoutes = require("./routes/verificationRoutes"); 
const appointmentRoutes = require("./routes/appointmentRoutes");
const diagnosisRoutes = require("./routes/diagnosisRoutes");
const labResultRoutes = require("./routes/labResultRoutes");
const locationRoutes = require("./routes/locationRoutes");

const app = express();
const API_PREFIX = "/api/v1";


/* =====================================================
   GLOBAL MIDDLEWARE
===================================================== */

app.use(helmet());
app.use(express.json()); // Parses incoming JSON requests
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded data
app.use(cookieParser());

// --- CORS Configuration ---
const allowedOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',') 
    : ["http://localhost:3000", "http://127.0.0.1:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
        callback(new Error(msg), false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

// === Ensure uploads folder exists and serve files ===
// We use path.join(__dirname, "...") to correctly resolve paths.
const uploadDir = path.join(__dirname, "uploads/kyc");

if (!fs.existsSync(uploadDir)) {
    console.log(`Creating upload directory: ${uploadDir}`);
    fs.mkdirSync(uploadDir, { recursive: true });
}
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


/* =====================================================
   API ROUTE MOUNTING
===================================================== */

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/verification`, verificationRoutes); 
app.use(`${API_PREFIX}/patients`, patientRoutes);
app.use(`${API_PREFIX}/practitioners`, practitionerRoutes);
app.use(`${API_PREFIX}/appointments`, appointmentRoutes);
app.use(`${API_PREFIX}/diagnosis`, diagnosisRoutes);
app.use(`${API_PREFIX}/labresults`, labResultRoutes);
app.use(`${API_PREFIX}/location`, locationRoutes);
app.use(`${API_PREFIX}/payment`, paymentRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);


/* =====================================================
   HEALTH CHECK & ERROR HANDLING
===================================================== */

// Health Check
app.get("/", (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: "HealthMe API v1 is running smoothly ✅" 
  });
});

// Handle Unhandled Routes (404)
// This must be placed AFTER all valid route handlers
app.use((req, res, next) => {
    // Passes a NotFoundError to the global error handler
    next(new NotFoundError(`The resource at ${req.originalUrl} was not found.`));
});

// GLOBAL ERROR HANDLER (MUST be the LAST middleware loaded)
app.use(errorHandler);

module.exports = app;