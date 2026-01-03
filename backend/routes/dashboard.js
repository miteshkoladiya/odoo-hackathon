const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const LeaveBalance = require('../models/LeaveBalance');
const { authenticate, isAdminOrHR } = require('../middleware/auth');

// @route   GET /api/dashboard/employee
// @desc    Get employee dashboard data
// @access  Private
router.get('/employee', authenticate, async (req, res) => {
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
    
    // Get today's attendance
    const todayAttendance = await Attendance.findOne({
      employeeId: employee._id,
      date: today
    });
    
    // Get current month attendance summary
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const monthlyAttendance = await Attendance.getMonthlySummary(
      employee._id,
      currentYear,
      currentMonth
    );
    
    // Get pending leave requests
    const pendingLeaves = await Leave.find({
      employeeId: employee._id,
      status: 'pending'
    }).sort({ createdAt: -1 }).limit(5);
    
    // Get recent leaves (approved/rejected)
    const recentLeaves = await Leave.find({
      employeeId: employee._id,
      status: { $in: ['approved', 'rejected'] }
    }).sort({ reviewedAt: -1 }).limit(5);
    
    // Get leave balance
    const leaveBalance = await LeaveBalance.findOne({
      employeeId: employee._id,
      year: currentYear
    });
    
    res.json({
      success: true,
      data: {
        profile: {
          name: employee.name,
          employeeId: employee.employeeId,
          email: employee.email,
          profilePicture: employee.profilePicture,
          company: employee.company,
          department: employee.department,
          jobPosition: employee.jobPosition
        },
        attendance: {
          today: todayAttendance,
          monthly: monthlyAttendance.summary
        },
        leaves: {
          pending: pendingLeaves,
          recent: recentLeaves,
          balance: leaveBalance
        }
      }
    });
  } catch (error) {
    console.error('Get employee dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
});

// @route   GET /api/dashboard/admin
// @desc    Get admin/HR dashboard data
// @access  Private (Admin/HR)
router.get('/admin', authenticate, isAdminOrHR, async (req, res) => {
  try {
    // Get total employees count
    const totalEmployees = await Employee.countDocuments();
    
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get today's attendance summary
    const todayAttendances = await Attendance.find({ date: today });
    
    const attendanceSummary = {
      total: totalEmployees,
      present: 0,
      absent: 0,
      leave: 0,
      notMarked: 0
    };
    
    todayAttendances.forEach(att => {
      if (att.status === 'present') attendanceSummary.present++;
      else if (att.status === 'absent') attendanceSummary.absent++;
      else if (att.status === 'leave') attendanceSummary.leave++;
    });
    
    attendanceSummary.notMarked = totalEmployees - todayAttendances.length;
    
    // Get pending leave requests count
    const pendingLeavesCount = await Leave.countDocuments({ status: 'pending' });
    
    // Get recent pending leaves
    const recentPendingLeaves = await Leave.find({ status: 'pending' })
      .populate('employeeId', 'name employeeId email profilePicture')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Get recent employees (last 5 joined)
    const recentEmployees = await Employee.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name employeeId email profilePicture company department');
    
    // Get department-wise employee count
    const departmentStats = await Employee.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        stats: {
          totalEmployees,
          todayAttendance: attendanceSummary,
          pendingLeaves: pendingLeavesCount
        },
        recentPendingLeaves,
        recentEmployees,
        departmentStats
      }
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
});

// @route   GET /api/dashboard/stats
// @desc    Get overall statistics (Admin/HR)
// @access  Private (Admin/HR)
router.get('/stats', authenticate, isAdminOrHR, async (req, res) => {
  try {
    const { year, month } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    
    // Total employees
    const totalEmployees = await Employee.countDocuments();
    
    // Month date range
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);
    
    // Monthly attendance stats
    const monthlyAttendances = await Attendance.find({
      date: { $gte: startDate, $lte: endDate }
    });
    
    const attendanceStats = {
      totalDays: 0,
      avgPresent: 0,
      avgAbsent: 0,
      avgLeave: 0
    };
    
    if (monthlyAttendances.length > 0) {
      const grouped = {};
      monthlyAttendances.forEach(att => {
        const dateKey = att.date.toISOString().split('T')[0];
        if (!grouped[dateKey]) {
          grouped[dateKey] = { present: 0, absent: 0, leave: 0 };
        }
        grouped[dateKey][att.status]++;
      });
      
      const days = Object.keys(grouped);
      attendanceStats.totalDays = days.length;
      
      days.forEach(day => {
        attendanceStats.avgPresent += grouped[day].present || 0;
        attendanceStats.avgAbsent += grouped[day].absent || 0;
        attendanceStats.avgLeave += grouped[day].leave || 0;
      });
      
      if (days.length > 0) {
        attendanceStats.avgPresent = Math.round(attendanceStats.avgPresent / days.length);
        attendanceStats.avgAbsent = Math.round(attendanceStats.avgAbsent / days.length);
        attendanceStats.avgLeave = Math.round(attendanceStats.avgLeave / days.length);
      }
    }
    
    // Leave statistics
    const approvedLeaves = await Leave.countDocuments({
      status: 'approved',
      startDate: { $gte: startDate, $lte: endDate }
    });
    
    const rejectedLeaves = await Leave.countDocuments({
      status: 'rejected',
      reviewedAt: { $gte: startDate, $lte: endDate }
    });
    
    const pendingLeaves = await Leave.countDocuments({ status: 'pending' });
    
    res.json({
      success: true,
      data: {
        employees: {
          total: totalEmployees
        },
        attendance: attendanceStats,
        leaves: {
          approved: approvedLeaves,
          rejected: rejectedLeaves,
          pending: pendingLeaves
        },
        period: {
          year: currentYear,
          month: currentMonth
        }
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

module.exports = router;