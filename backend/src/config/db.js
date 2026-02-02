import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("Attempting to connect to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, {
      ssl: true,
      tlsAllowInvalidCertificates: true,
      retryWrites: true,
      w: "majority",
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
};

export default connectDB;
