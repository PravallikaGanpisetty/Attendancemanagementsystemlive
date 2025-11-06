const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
require('dotenv').config();

async function main(){
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/Attendancemsd');
  const passwordHash = await bcrypt.hash('password123', 10);
  const users = [
    { name: 'Test Student', email: 'student@example.com', role: 'student', passwordHash },
    { name: 'Test Faculty', email: 'faculty@example.com', role: 'faculty', passwordHash }
  ];
  for (const u of users) {
    try {
      await User.create(u);
      console.log('Created', u.email);
    } catch(e) {
      console.warn('Could not create', u.email, e.message);
    }
  }
  process.exit();
}

main().catch(e=>{console.error(e); process.exit(1);});
