const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      "mongodb+srv://kofohavenhealthme:ademidejoel1@cluster0.gplgox1.mongodb.net/?appName=Cluster0",
      {
        serverSelectionTimeoutMS: 10000,
      }
    );

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;