const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not set in environment variables");
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, {
    maxPoolSize: 20, // max concurrent connections reused across requests
    minPoolSize: 2, // keep a couple warm to avoid cold-start latency
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
  console.log(`[db] MongoDB connected: ${mongoose.connection.host}`);
}

module.exports = connectDB;
