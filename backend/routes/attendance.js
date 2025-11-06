const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Class = require('../models/Class');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

// Helper function to validate and convert to ObjectId (compatible with Mongoose 6 and 7)
function isValidObjectId(id) {
  if (!id) return false;
  // Try mongoose.isValidObjectId first (Mongoose 7+)
  if (typeof mongoose.isValidObjectId === 'function') {
    return mongoose.isValidObjectId(id);
  }
  // Fallback to mongoose.Types.ObjectId.isValid (Mongoose 6)
  return mongoose.Types.ObjectId.isValid(id);
}

// Helper function to convert to ObjectId safely
function toObjectId(id) {
  if (!id) return null;
  if (isValidObjectId(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  return id;
}

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Get all classes (for faculty)
router.get('/classes', verifyToken, async (req, res) => {
  try {
    if (req.userRole !== 'faculty') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const classes = await Class.find({ facultyId: req.userId })
      .populate('students', 'name email')
      .sort({ createdAt: -1 });
    res.json(classes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new class
router.post('/classes', verifyToken, async (req, res) => {
  try {
    if (req.userRole !== 'faculty') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { name, code, schedule } = req.body;
    
    // Validate input
    if (!name || !code) {
      return res.status(400).json({ message: 'Name and code are required' });
    }
    
    if (typeof name !== 'string' || typeof code !== 'string') {
      return res.status(400).json({ message: 'Name and code must be strings' });
    }
    
    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();
    
    if (trimmedName.length === 0 || trimmedCode.length === 0) {
      return res.status(400).json({ message: 'Name and code cannot be empty' });
    }
    
    if (trimmedCode.length < 2) {
      return res.status(400).json({ message: 'Class code must be at least 2 characters' });
    }
    
    const newClass = await Class.create({
      name: trimmedName,
      code: trimmedCode,
      facultyId: req.userId,
      schedule: schedule || {},
      students: []
    });
    
    // Populate faculty info before sending
    await newClass.populate('facultyId', 'name email');
    
    res.status(201).json(newClass);
  } catch (err) {
    console.error('Error creating class:', err);
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Class code already exists. Please use a different code.' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error: ' + (err.message || 'Failed to create class') });
  }
});

// Add student to class
router.post('/classes/:classId/students', verifyToken, async (req, res) => {
  try {
    if (req.userRole !== 'faculty') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { studentId } = req.body;
    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }
    
    const classDoc = await Class.findById(req.params.classId);
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }
    if (classDoc.facultyId.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Convert studentId to ObjectId for proper comparison
    if (!isValidObjectId(studentId)) {
      return res.status(400).json({ message: 'Invalid student ID format' });
    }
    const studentObjectId = toObjectId(studentId);
    
    // Check if student is already in the class (proper ObjectId comparison)
    const studentExists = classDoc.students.some(
      id => id.toString() === studentObjectId.toString()
    );
    
    if (!studentExists) {
      classDoc.students.push(studentObjectId);
      await classDoc.save();
      console.log(`✅ Student ${studentObjectId} added to class ${req.params.classId}`);
      
      // Verify the save worked by checking the database directly
      const verifyClass = await Class.findById(req.params.classId);
      const isInArray = verifyClass.students.some(
        id => id.toString() === studentObjectId.toString()
      );
      if (!isInArray) {
        console.error(`❌ ERROR: Student ${studentObjectId} was NOT saved to class ${req.params.classId}`);
        console.error(`   Class students array: ${verifyClass.students.map(id => id.toString()).join(', ')}`);
      } else {
        console.log(`✅ Verified in DB: Student ${studentObjectId} is saved in class ${req.params.classId}`);
      }
    } else {
      console.log(`ℹ️ Student ${studentObjectId} already in class ${req.params.classId}`);
    }
    
    // Return updated class with populated students
    // Use fresh query to ensure we get the latest data
    const updatedClass = await Class.findById(req.params.classId)
      .populate('students', 'name email')
      .populate('facultyId', 'name email');
    
    // Verify the student is in the returned class
    const studentInClass = updatedClass.students.some(
      s => (s._id || s).toString() === studentObjectId.toString()
    );
    
    if (!studentInClass) {
      console.warn(`⚠️ Warning: Student ${studentObjectId} not found in populated class`);
      console.log(`   Class students: ${updatedClass.students.map(s => (s._id || s).toString()).join(', ')}`);
    } else {
      console.log(`✅ Verified: Student ${studentObjectId} is in class ${updatedClass.name}`);
    }
    
    res.json(updatedClass);
  } catch (err) {
    console.error('Error adding student to class:', err);
    res.status(500).json({ message: 'Server error: ' + (err.message || 'Failed to add student') });
  }
});

// Get students for a class
router.get('/classes/:classId/students', verifyToken, async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.classId)
      .populate('students', 'name email');
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Faculty can see students in their own classes, students can see students in classes they're enrolled in
    if (req.userRole === 'faculty') {
      // Faculty can only see students in their own classes
      if (classDoc.facultyId.toString() !== req.userId.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.userRole === 'student') {
      // Students can only see students in classes they're enrolled in
      const isEnrolled = classDoc.students.some(
        studentId => studentId.toString() === req.userId.toString()
      );
      if (!isEnrolled) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    res.json(classDoc.students);
  } catch (err) {
    console.error('Error fetching class students:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark attendance
router.post('/mark', verifyToken, async (req, res) => {
  try {
    if (req.userRole !== 'faculty') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { classId, date, attendance } = req.body; // attendance is array of {studentId, status, remarks}
    if (!classId || !date || !attendance || !Array.isArray(attendance)) {
      return res.status(400).json({ message: 'Invalid data' });
    }

    const classDoc = await Class.findById(classId);
    if (!classDoc || classDoc.facultyId.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Normalize date to start of day to ensure consistent matching
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    
    // Convert classId to ObjectId
    if (!isValidObjectId(classId)) {
      return res.status(400).json({ message: 'Invalid class ID format' });
    }
    const classObjectId = toObjectId(classId);
    
    const results = [];

    for (const item of attendance) {
      try {
        // Ensure studentId is valid ObjectId
        if (!item.studentId) {
          console.error('Missing studentId in attendance item');
          continue;
        }
        
        // Convert studentId to ObjectId for consistent storage and querying
        if (!isValidObjectId(item.studentId)) {
          console.error('Invalid studentId format:', item.studentId);
          continue;
        }
        const studentObjectId = toObjectId(item.studentId);
        
        const att = await Attendance.findOneAndUpdate(
          { 
            classId: classObjectId, 
            studentId: studentObjectId, 
            date: attendanceDate 
          },
          {
            classId: classObjectId,
            studentId: studentObjectId,
            date: attendanceDate,
            status: item.status || 'absent',
            remarks: item.remarks || '',
            markedBy: req.userId
          },
          { upsert: true, new: true }
        );
        if (att) {
          results.push(att);
          console.log(`✅ Attendance marked for student ${studentObjectId} on ${attendanceDate.toISOString()}`);
        } else {
          console.error(`❌ Failed to mark attendance for student ${studentObjectId}`);
        }
      } catch (err) {
        console.error('Error marking attendance for student:', item.studentId, err);
        // Continue with other students even if one fails
      }
    }

    res.json({ message: 'Attendance marked successfully', attendance: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get attendance for a class and date
router.get('/class/:classId/date/:date', verifyToken, async (req, res) => {
  try {
    const { classId, date } = req.params;
    // Normalize date to start of day
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    
    // Also check for dates within the same day (end of day)
    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const attendance = await Attendance.find({ 
      classId, 
      date: { $gte: attendanceDate, $lte: endOfDay }
    })
      .populate('studentId', 'name email')
      .populate('markedBy', 'name');
    res.json(attendance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student's attendance (for students)
router.get('/student/:studentId', verifyToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Safety check
    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    // Students can only view their own attendance
    if (req.userRole === 'student' && req.userId.toString() !== studentId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Use helper function for consistent ObjectId conversion
    if (!isValidObjectId(studentId)) {
      return res.status(400).json({ message: 'Invalid student ID format' });
    }
    const queryId = toObjectId(studentId);
    
    const attendance = await Attendance.find({ studentId: queryId })
      .populate('classId', 'name code')
      .populate('markedBy', 'name')
      .sort({ date: -1 })
      .lean(); // Use lean() for better performance and to avoid Mongoose document issues
    
    console.log(`📊 Found ${attendance.length} attendance records for student ${queryId}`);
    res.json(attendance);
  } catch (err) {
    console.error('🔥 Error fetching student attendance:', err);
    console.error('Error details:', err.message);
    console.error('Error stack:', err.stack);
    res.status(500).json({ message: 'Server error: ' + (err.message || 'Failed to fetch attendance') });
  }
});

// Get attendance statistics for a student
router.get('/student/:studentId/stats', verifyToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Safety check
    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    if (req.userRole === 'student' && req.userId.toString() !== studentId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Use helper function for consistent ObjectId conversion
    if (!isValidObjectId(studentId)) {
      return res.status(400).json({ message: 'Invalid student ID format' });
    }
    const queryId = toObjectId(studentId);
    
    const allAttendance = await Attendance.find({ studentId: queryId })
      .populate('classId', 'name code')
      .lean(); // Use lean() for better performance
    
    const total = allAttendance.length;
    const present = allAttendance.filter(a => a.status === 'present').length;
    const absent = allAttendance.filter(a => a.status === 'absent').length;
    const late = allAttendance.filter(a => a.status === 'late').length;
    const percentage = total > 0 ? ((present + late) / total * 100).toFixed(2) : 0;

    // Get class-wise stats
    const classStats = {};
    allAttendance.forEach(att => {
      const classId = att.classId?._id?.toString() || att.classId?.toString() || 'unknown';
      if (!classStats[classId]) {
        classStats[classId] = { total: 0, present: 0, absent: 0, late: 0 };
      }
      classStats[classId].total++;
      classStats[classId][att.status]++;
    });

    res.json({
      total,
      present,
      absent,
      late,
      percentage: parseFloat(percentage),
      classStats
    });
  } catch (err) {
    console.error('🔥 Error fetching student stats:', err);
    console.error('Error details:', err.message);
    console.error('Error stack:', err.stack);
    res.status(500).json({ message: 'Server error: ' + (err.message || 'Failed to fetch stats') });
  }
});

// Get student's classes
router.get('/student/:studentId/classes', verifyToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Safety check
    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    if (req.userRole === 'student' && req.userId.toString() !== studentId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Use helper function for consistent ObjectId conversion
    if (!isValidObjectId(studentId)) {
      return res.status(400).json({ message: 'Invalid student ID format' });
    }
    const queryId = toObjectId(studentId);
    
    console.log(`🔍 Searching for classes with student: ${queryId} (string: ${queryId.toString()})`);
    
    // First, try direct array match - this is the standard way
    let classes = await Class.find({ 
      students: queryId
    })
      .populate('facultyId', 'name email')
      .populate('students', 'name email')
      .sort({ createdAt: -1 });
    
    console.log(`📚 Found ${classes.length} classes with direct array match`);
    
    // If still no results, try with $in operator
    if (classes.length === 0) {
      classes = await Class.find({ 
        students: { $in: [queryId] }
      })
        .populate('facultyId', 'name email')
        .populate('students', 'name email')
        .sort({ createdAt: -1 });
      console.log(`📚 Found ${classes.length} classes with $in operator`);
    }
    
    // Final fallback: get all classes and filter manually (check raw students array)
    if (classes.length === 0) {
      console.log(`⚠️ No classes found with standard queries, trying manual filter...`);
      // Get classes WITHOUT population first to check raw ObjectIds
      const allClassesRaw = await Class.find({}).sort({ createdAt: -1 });
      
      console.log(`   Total classes in DB: ${allClassesRaw.length}`);
      
      // Filter by checking raw students array
      const matchingClasses = allClassesRaw.filter(cls => {
        const hasStudent = cls.students.some(studentId => {
          const studentIdStr = studentId.toString();
          const match = studentIdStr === queryId.toString();
          if (match) {
            console.log(`   ✅ Found match in class: ${cls.name} (${cls.code}) - Student ID: ${studentIdStr}`);
          }
          return match;
        });
        return hasStudent;
      });
      
      // Now populate the matching classes
      if (matchingClasses.length > 0) {
        const classIds = matchingClasses.map(c => c._id);
        classes = await Class.find({ _id: { $in: classIds } })
          .populate('facultyId', 'name email')
          .populate('students', 'name email')
          .sort({ createdAt: -1 });
      }
      
      console.log(`📚 Found ${classes.length} classes with manual filter`);
    }
    
    console.log(`📚 Final result: Found ${classes.length} classes for student ${studentId}`);
    if (classes.length > 0) {
      console.log(`   Classes: ${classes.map(c => `${c.name} (${c.code})`).join(', ')}`);
    } else {
      console.log(`   ⚠️ No classes found for student ${studentId}. Checking all classes in DB...`);
      const allClassesCheck = await Class.find({}).select('name code students');
      allClassesCheck.forEach(cls => {
        const studentIds = cls.students.map(id => id.toString());
        const hasMatch = studentIds.includes(queryId.toString());
        console.log(`   Class: ${cls.name} (${cls.code}) - Students: ${studentIds.join(', ')} ${hasMatch ? '✅ MATCH!' : '❌'}`);
      });
    }
    
    res.json(classes);
  } catch (err) {
    console.error('🔥 Error fetching student classes:', err);
    console.error('Error details:', err.message);
    console.error('Error stack:', err.stack);
    res.status(500).json({ message: 'Server error: ' + (err.message || 'Failed to fetch classes') });
  }
});

// Get all students (for faculty to add to classes)
router.get('/students', verifyToken, async (req, res) => {
  try {
    if (req.userRole !== 'faculty') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const students = await User.find({ role: 'student' }).select('name email');
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove student from class
router.delete('/classes/:classId/students/:studentId', verifyToken, async (req, res) => {
  try {
    if (req.userRole !== 'faculty') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { classId, studentId } = req.params;
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }
    if (classDoc.facultyId.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Convert studentId to ObjectId for proper comparison
    if (!isValidObjectId(studentId)) {
      return res.status(400).json({ message: 'Invalid student ID format' });
    }
    const studentObjectId = toObjectId(studentId);
    
    // Check if student is in the class before removal
    const studentExists = classDoc.students.some(
      id => id.toString() === studentObjectId.toString()
    );
    
    if (studentExists) {
      classDoc.students = classDoc.students.filter(
        id => id.toString() !== studentObjectId.toString()
      );
      await classDoc.save();
      console.log(`🗑️ Student ${studentObjectId} removed from class ${classId}`);
      
      // Verify the student was actually removed
      const updatedClass = await Class.findById(classId);
      const stillInClass = updatedClass.students.some(
        id => id.toString() === studentObjectId.toString()
      );
      if (stillInClass) {
        console.warn(`⚠️ Warning: Student ${studentObjectId} still found in class after removal`);
      }
    } else {
      console.log(`ℹ️ Student ${studentObjectId} was not in class ${classId}`);
    }
    
    res.json({ message: 'Student removed from class successfully' });
  } catch (err) {
    console.error('Error removing student from class:', err);
    res.status(500).json({ message: 'Server error: ' + (err.message || 'Failed to remove student') });
  }
});

// Delete class
router.delete('/classes/:classId', verifyToken, async (req, res) => {
  try {
    if (req.userRole !== 'faculty') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const classDoc = await Class.findById(req.params.classId);
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }
    if (classDoc.facultyId.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    // Delete all attendance records for this class
    await Attendance.deleteMany({ classId: req.params.classId });
    // Delete the class
    await Class.findByIdAndDelete(req.params.classId);
    res.json({ message: 'Class deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update attendance record
router.put('/attendance/:attendanceId', verifyToken, async (req, res) => {
  try {
    if (req.userRole !== 'faculty') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { status, remarks } = req.body;
    const attendance = await Attendance.findById(req.params.attendanceId)
      .populate('classId');
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    if (attendance.classId.facultyId.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    attendance.status = status || attendance.status;
    attendance.remarks = remarks !== undefined ? remarks : attendance.remarks;
    await attendance.save();
    
    res.json(attendance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete attendance record
router.delete('/attendance/:attendanceId', verifyToken, async (req, res) => {
  try {
    if (req.userRole !== 'faculty') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const attendance = await Attendance.findById(req.params.attendanceId)
      .populate('classId');
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    if (attendance.classId.facultyId.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    await Attendance.findByIdAndDelete(req.params.attendanceId);
    res.json({ message: 'Attendance record deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get class attendance summary
router.get('/classes/:classId/summary', verifyToken, async (req, res) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate } = req.query;
    
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    if (req.userRole === 'student') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    let query = { classId };
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }
    
    const allAttendance = await Attendance.find(query)
      .populate('studentId', 'name email');
    
    const studentStats = {};
    allAttendance.forEach(att => {
      const studentId = att.studentId._id.toString();
      if (!studentStats[studentId]) {
        studentStats[studentId] = {
          student: att.studentId,
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          percentage: 0
        };
      }
      studentStats[studentId].total++;
      studentStats[studentId][att.status]++;
    });
    
    Object.values(studentStats).forEach(stat => {
      stat.percentage = stat.total > 0 
        ? ((stat.present + stat.late) / stat.total * 100).toFixed(1)
        : 0;
    });
    
    res.json({
      class: classDoc,
      summary: Object.values(studentStats),
      totalDays: startDate && endDate 
        ? Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1
        : null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get attendance by date range
router.get('/student/:studentId/range', verifyToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate, classId } = req.query;
    
    if (req.userRole === 'student' && req.userId.toString() !== studentId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Convert studentId to ObjectId for proper querying
    if (!isValidObjectId(studentId)) {
      return res.status(400).json({ message: 'Invalid student ID format' });
    }
    const queryId = toObjectId(studentId);
    
    let query = { studentId: queryId };
    if (classId) {
      // Convert classId to ObjectId if provided
      if (!isValidObjectId(classId)) {
        return res.status(400).json({ message: 'Invalid class ID format' });
      }
      query.classId = toObjectId(classId);
    }
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }
    
    const attendance = await Attendance.find(query)
      .populate('classId', 'name code')
      .populate('markedBy', 'name')
      .sort({ date: -1 });
    
    res.json(attendance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

