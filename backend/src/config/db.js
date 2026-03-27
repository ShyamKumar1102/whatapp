const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    console.error('❌ FATAL: MONGODB_URI is not defined');
    process.exit(1);
  }

  const connect = async () => {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        maxPoolSize: 10,
        retryWrites: true
      });
      console.log('✅ MongoDB Connected:', mongoose.connection.host);
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      console.log('🔄 Retrying in 5 seconds...');
      setTimeout(connect, 5000);
    }
  };

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected. Reconnecting...');
    setTimeout(connect, 5000);
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB error:', err.message);
  });

  await connect();
};

module.exports = connectDB;