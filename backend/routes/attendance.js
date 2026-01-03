const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const { authenticate, isAdminOrHR } = require('../middleware/auth');

// @route   POST /api/attendance/check-in
// @desc    Employee check-in
// @access  Private
router.post('/check-in', authenticate, async (req, res) => {
  try {
    // Get employee record
    const employee = await Employee.findOne({ userId: req.user._id });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }
    
    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if already checked in today
    const existingAttendance = await Attendance.findOne({
      employeeId: employee._id,
      date: today
    });
    
    if (existingAttendance && existingAttendance.checkIn) {
      return res.status(400).json({
        success: false,
        message: 'Already checked in today',
        data: existingAttendance
      });
    }
    
    // Create or update attendance record
    const attendance = existingAttendance || new Attendance({
      employeeId: employee._id,
      date: today
    });
    
    attendance.checkIn = new Date();
    attendance.status = 'present';
    
    await attendance.save();
    
    res.json({
      success: true,
      message: 'Checked in successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking in',
      error: error.message
    });
  }
});

// @route   POST /api/attendance/check-out
// @desc    Employee check-out
// @access  Private
router.post('/check-out', authenticate, async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }
    
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find today's attendance
    const attendance = await Attendance.findOne({
      employeeId: employee._id,
      date: today
    });
    
    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'No check-in record found for today'
      });
    }
    
    if (!attendance.checkIn) {
      return res.status(400).json({
        success: false,
        message: 'Please check in first'
      });
    }
    
    if (attendance.checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Already checked out today',
        data: attendance
      });
    }
    
    // Update check-out time
    attendance.checkOut = new Date();
    
    // Calculate work hours
    attendance.calculateHours();
    
    await attendance.save();
    
    res.json({
      success: true,
      message: 'Checked out successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking out',
      error: error.message
    });
  }
});

// @route   GET /api/attendance/my-attendance
// @desc    Get own attendance records
// @access  Private
router.get('/my-attendance', authenticate, async (req, res) => {
  try {
    const { year, month } = req.query;
    
    const employee = await Employee.findOne({ userId: req.user._id });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }
    
    let query = { employeeId: employee._id };
    
    // Filter by year and month if provided
    if (year && month) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      query.date = { $gte: startDate, $lte: endDate };
    }
    
    const attendances = await Attendance.find(query).sort({ date: -1 });
    
    // Calculate summary
    const summary = {
      total: attendances.length,
      present: 0,
      absent: 0,
      halfDay: 0,
      leave: 0,
      totalWorkHours: 0,
      totalExtraHours: 0
    };
    
    attendances.forEach(att => {
      summary[att.status.replace('-', '')]++;
      summary.totalWorkHours += att.workHours;
      summary.totalExtraHours += att.extraHours;
    });
    
    res.json({
      success: true,
      data: attendances,
      summary
    });
  } catch (error) {
    console.error('Get my attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance',
      error: error.message
    });
  }
});

// @route   GET /api/attendance/today
// @desc    Get today's attendance status
// @access  Private
router.get('/today', authenticate, async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await Attendance.findOne({
      employeeId: employee._id,
      date: today
    });
    
    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching today\'s attendance',
      error: error.message
    });
  }
});

// @route   GET /api/attendance/employee/:employeeId
// @desc    Get employee attendance (Admin/HR)
// @access  Private (Admin/HR)
router.get('/employee/:employeeId', authenticate, isAdminOrHR, async (req, res) => {
  try {
    const { year, month } = req.query;
    
    const result = await Attendance.getMonthlySummary(
      req.params.employeeId,
      year || new Date().getFullYear(),
      month || new Date().getMonth() + 1
    );
    
    res.json({
      success: true,
      data: result.attendances,
      summary: result.summary
    });
  } catch (error) {
    console.error('Get employee attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee attendance',
      error: error.message
    });
  }
});

// @route   GET /api/attendance/date/:date
// @desc    Get attendance for specific date (all employees)
// @access  Private (Admin/HR)
router.get('/date/:date', authenticate, isAdminOrHR, async (req, res) => {
  try {
    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);
    
    const attendances = await Attendance.find({ date })
      .populate({
        path: 'employeeId',
        select: 'name employeeId email profilePicture'
      })
      .sort({ 'employeeId.name': 1 });
    
    res.json({
      success: true,
      count: attendances.length,
      data: attendances
    });
  } catch (error) {
    console.error('Get date attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance for date',
      error: error.message
    });
  }
});

// @route   PUT /api/attendance/:id
// @desc    Update attendance record (Admin/HR)
// @access  Private (Admin/HR)
router.put('/:id', authenticate, isAdminOrHR, async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }
    
    // Update allowed fields
    const { checkIn, checkOut, status, remarks } = req.body;
    
    if (checkIn) attendance.checkIn = new Date(checkIn);
    if (checkOut) attendance.checkOut = new Date(checkOut);
    if (status) attendance.status = status;
    if (remarks !== undefined) attendance.remarks = remarks;
    
    // Recalculate hours if check-in or check-out changed
    if (checkIn || checkOut) {
      attendance.calculateHours();
    }
    
    await attendance.save();
    
    res.json({
      success: true,
      message: 'Attendance updated successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating attendance',
      error: error.message
    });
  }
});

// @route   GET /api/attendance/month/:year/:month
// @desc    Get monthly attendance for current user
// @access  Private
router.get('/month/:year/:month', authenticate, async (req, res) => {
  try {
    const { year, month } = req.params;
    
    const employee = await Employee.findOne({ userId: req.user._id });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }
    
    const result = await Attendance.getMonthlySummary(
      employee._id,
      parseInt(year),
      parseInt(month)
    );
    
    res.json({
      success: true,
      data: result.attendances,
      summary: result.summary
    });
  } catch (error) {
    console.error('Get monthly attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching monthly attendance',
      error: error.message
    });
  }
});

module.exports = router;