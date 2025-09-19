const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/devops_app';


const options = {
  maxPoolSize: 10, 
  serverSelectionTimeoutMS: 5000, 
  socketTimeoutMS: 45000, 
  bufferCommands: false, 
};


const testConnection = async (retries = 5, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(MONGODB_URI, options);
      console.log('MongoDB connected successfully');
      return;
    } catch (err) {
      console.error(`MongoDB connection attempt ${i + 1} failed:`, err.message);
      if (i === retries - 1) {
        console.error('MongoDB connection failed after all retries');
        process.exit(1);
      }
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};


mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

const gracefulShutdown = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error during MongoDB disconnection:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

testConnection();

module.exports = mongoose;