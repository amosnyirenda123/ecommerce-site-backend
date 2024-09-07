import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_CONNECTION_STRING as string
    );
    console.log(`Connected to MongoDB: ${conn.connection.host}`);
  } catch (error: any) {
    console.log("Error connecting to MongoDB", error.message);
    process.exit(1);
  }
};
