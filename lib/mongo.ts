import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGO_DB_URI;
  if (!uri) {
    console.error('MONGO_DB_URI is not defined');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
