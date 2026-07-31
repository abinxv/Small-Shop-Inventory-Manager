const mongoose = require("mongoose");

const connectDb = async () => {
  if (!process.env.MONGODB_URI) {
    console.error(
      "Missing MONGODB_URI. Create server/.env from server/.env.example and add your MongoDB Atlas connection string."
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDb;
