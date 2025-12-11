/**
 * @file server.js
 * @desc Entry point for the Express server. Handles environment setup,
 * database connection, and graceful shutdown.
 */
require("dotenv").config(); // Ensure dotenv is at the very top

const app = require("./src/app");
// NOTE: You must create this file: src/config/db.js
const connectDB = require("./src/config/db"); 
const http = require("http");

const PORT = process.env.PORT || 4000;

let server; // Define server instance globally

// Connect to MongoDB and start the server
const startApp = async () => {
    try {
        // 1. Connect to Database
        await connectDB();
        console.log("✅ Database connected successfully.");

        // 2. Start the Express server
        server = http.createServer(app).listen(PORT, () =>
            console.log(`✅ Server running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`)
        );
    } catch (err) {
        console.error("❌ Fatal: Server initialization failed:", err.message);
        // Exit process with failure code
        process.exit(1); 
    }
};

startApp();


/* =====================================================
   UNHANDLED PROCESS SHUTDOWN
===================================================== */

/**
 * Handles graceful shutdown by closing the server and then exiting the process.
 * @param {string} reason - The reason for the shutdown.
 * @param {Error} [err] - The error object (if applicable).
 */
const handleShutdown = (reason, err) => {
    console.log(`\n\n🚨 Shutting down due to ${reason}...`);
    if (err) {
        console.error(err.message, err.stack);
    }

    if (server) {
        // Close server first, allowing active requests to finish
        server.close(() => {
            console.log('Server gracefully terminated.');
            process.exit(err ? 1 : 0); // Exit with 1 if error, 0 otherwise
        });
    } else {
        process.exit(err ? 1 : 0);
    }
};

// Handle unhandled promise rejections (e.g., in async service code)
process.on("unhandledRejection", (reason, promise) => {
    handleShutdown("Unhandled Promise Rejection", reason instanceof Error ? reason : new Error(String(reason)));
});

// Handle uncaught exceptions (e.g., in synchronous middleware)
process.on("uncaughtException", (err) => {
    handleShutdown("Uncaught Exception", err);
});

// Handle termination signals
process.on('SIGTERM', () => handleShutdown("SIGTERM (Termination Signal)"));
process.on('SIGINT', () => handleShutdown("SIGINT (Ctrl+C)"));