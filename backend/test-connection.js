// Quick test script to verify backend setup
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/Attendancemsd';

console.log('🔍 Testing MongoDB Connection...');
console.log('📍 Connection String:', MONGO.replace(/\/\/.*@/, '//***:***@')); // Hide password

mongoose.connect(MONGO)
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
    console.log('✅ Database:', mongoose.connection.db.databaseName);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed!');
    console.error('Error:', err.message);
    console.log('\n💡 Common fixes:');
    console.log('1. Check your .env file has correct MONGO_URI');
    console.log('2. Make sure MongoDB Atlas Network Access allows your IP (or 0.0.0.0/0)');
    console.log('3. Verify your MongoDB username and password are correct');
    process.exit(1);
  });

