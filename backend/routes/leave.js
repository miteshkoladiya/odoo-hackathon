const express = require('express');
const router = express.Router();
const Leave = require('../models/Leave');
const LeaveBalance = require('../models/LeaveBalance');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendence');
const { authenticate, isAdminOrHR } = require('../middleware/auth');

// @route   POST /api/leaves/apply
// @desc    Apply for leave
// @access  Private
router.post('/apply', authenticate, async (req, res) => {
  try {
    const { leaveType, startDate, endDate, remarks, attachment } = req.body;
    
    // Validation
    if (!leaveType || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Leave type, start date, and end date are required'
      });
    }
    
    const employee = await Employee.findOne({ userId: req.user._id });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }
    
    // Check for overlapping leaves
    const hasOverlap = await Leave.checkOverlap(
      employee._id,
      new Date(startDate),
      new Date(endDate)
    );
    
    if (hasOverlap) {
      return res.status(400).json({
        success: false,
        message: 'Leave dates overlap with existing leave request'
      });
    }
    
    // Calculate number of days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    // Get leave balance
    const currentYear = new Date().getFullYear();
    const leaveBalance = await LeaveBalance.findOne({
      employeeId: employee._id,
      year: currentYear
    });
    
    if (!leaveBalance) {
      return res.status(404).json({
        success: false,
        message: 'Leave balance not found'
      });
    }
    
    // Check if sufficient balance (except for unpaid leave)
    const leaveField = leaveBalance.getLeaveField(leaveType);
    if (leaveField && leaveType !== 'unpaid') {
      if (leaveBalance[leaveField].available < daysDiff) {
        return res.status(400).json({
          success: false,
          message: `Insufficient ${leaveType} leave balance. Available: ${leaveBalance[leaveField].available} days`
        });
      }
    }
    
    // Create leave request
    const leave = new Leave({
      employeeId: employee._id,
      leaveType,
      startDate: start,
      endDate: end,
      allocation: daysDiff,
      remarks,
      attachment,
      status: 'pending'
    });
    
    await leave.save();
    
    // Temporarily deduct from balance (will be confirmed on approval)
    leaveBalance.deductLeave(leaveType, daysDiff);
    await leaveBalance.save();
    
    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      data: leave
    });
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Error applying for leave',
      error: error.message
    });
  }
});

// @route   GET /api/leaves/my-leaves
// @desc    Get own leave requests
// @access  Private
router.get('/my-leaves', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    
    const employee = await Employee.findOne({ userId: req.user._id });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }
    
    let query = { employeeId: employee._id };
    
    if (status) {
      query.status = status;
    }
    
    const leaves = await Leave.find(query)
      .populate('reviewedBy', 'email role')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: leaves.length,
      data: leaves
    });
  } catch (error) {
    console.error('Get my leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave requests',
      error: error.message
    });
  }
});

// @route   GET /api/leaves/pending
// @desc    Get all pending leave requests
// @access  Private (Admin/HR)
router.get('/pending', authenticate, isAdminOrHR, async (req, res) => {
  try {
    const leaves = await Leave.find({ status: 'pending' })
      .populate('employeeId', 'name employeeId email profilePicture')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: leaves.length,
      data: leaves
    });
  } catch (error) {
    console.error('Get pending leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending leaves',
      error: error.message
    });
  }
});

// @route   GET /api/leaves/all
// @desc    Get all leave requests
// @access  Private (Admin/HR)
router.get('/all', authenticate, isAdminOrHR, async (req, res) => {
  try {
    const { status, leaveType, employeeId } = req.query;
    
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (leaveType) {
      query.leaveType = leaveType;
    }
    
    if (employeeId) {
      query.employeeId = employeeId;
    }
    
    const leaves = await Leave.find(query)
      .populate('employeeId', 'name employeeId email profilePicture')
      .populate('reviewedBy', 'email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: leaves.length,
      data: leaves
    });
  } catch (error) {
    console.error('Get all leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave requests',
      error: error.message
    });
  }
});

// @route   PUT /api/leaves/:id/approve
// @desc    Approve leave request
// @access  Private (Admin/HR)
router.put('/:id/approve', authenticate, isAdminOrHR, async (req, res) => {
  try {
    const { adminComment } = req.body;
    
    const leave = await Leave.findById(req.params.id)
      .populate('employeeId');
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }
    
    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Leave request already processed'
      });
    }
    
    // Update leave status
    leave.status = 'approved';
    leave.adminComment = adminComment || '';
    leave.reviewedAt = new Date();
    leave.reviewedBy = req.user._id;
    
    await leave.save();
    
    // Create attendance records for leave dates
    const currentDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);
    
    while (currentDate <= endDate) {
      await Attendance.findOneAndUpdate(
        {
          employeeId: leave.employeeId._id,
          date: new Date(currentDate)
        },
        {
          employeeId: leave.employeeId._id,
          date: new Date(currentDate),
          status: 'leave',
          remarks: `${leave.leaveType} leave - approved`
        },
        { upsert: true, new: true }
      );
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    res.json({
      success: true,
      message: 'Leave request approved successfully',
      data: leave
    });
  } catch (error) {
    console.error('Approve leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving leave request',
      error: error.message
    });
  }
});

// @route   PUT /api/leaves/:id/reject
// @desc    Reject leave request
// @access  Private (Admin/HR)
router.put('/:id/reject', authenticate, isAdminOrHR, async (req, res) => {
  try {
    const { adminComment } = req.body;
    
    const leave = await Leave.findById(req.params.id)
      .populate('employeeId');
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }
    
    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Leave request already processed'
      });
    }
    
    // Update leave status
    leave.status = 'rejected';
    leave.adminComment = adminComment || '';
    leave.reviewedAt = new Date();
    leave.reviewedBy = req.user._id;
    
    await leave.save();
    
    // Restore leave balance
    const currentYear = new Date().getFullYear();
    const leaveBalance = await LeaveBalance.findOne({
      employeeId: leave.employeeId._id,
      year: currentYear
    });
    
    if (leaveBalance) {
      leaveBalance.restoreLeave(leave.leaveType, leave.allocation);
      await leaveBalance.save();
    }
    
    res.json({
      success: true,
      message: 'Leave request rejected',
      data: leave
    });
  } catch (error) {
    console.error('Reject leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting leave request',
      error: error.message
    });
  }
});

// @route   GET /api/leaves/balance/:employeeId
// @desc    Get leave balance for employee
// @access  Private
router.get('/balance/:employeeId', authenticate, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.employeeId);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Check authorization
    const isOwnRecord = employee.userId.toString() === req.user._id.toString();
    const isAdminOrHRRole = req.user.role === 'admin' || req.user.role === 'hr';
    
    if (!isOwnRecord && !isAdminOrHRRole) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const currentYear = new Date().getFullYear();
    let leaveBalance = await LeaveBalance.findOne({
      employeeId: req.params.employeeId,
      year: currentYear
    });
    
    // Initialize if not exists
    if (!leaveBalance) {
      leaveBalance = await LeaveBalance.initializeForEmployee(
        req.params.employeeId,
        currentYear
      );
    }
    
    res.json({
      success: true,
      data: leaveBalance
    });
  } catch (error) {
    console.error('Get leave balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave balance',
      error: error.message
    });
  }
});

// @route   GET /api/leaves/my-balance
// @desc    Get own leave balance
// @access  Private
router.get('/my-balance', authenticate, async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }
    
    const currentYear = new Date().getFullYear();
    let leaveBalance = await LeaveBalance.findOne({
      employeeId: employee._id,
      year: currentYear
    });
    
    if (!leaveBalance) {
      leaveBalance = await LeaveBalance.initializeForEmployee(
        employee._id,
        currentYear
      );
    }
    
    res.json({
      success: true,
      data: leaveBalance
    });
  } catch (error) {
    console.error('Get my leave balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave balance',
      error: error.message
    });
  }
});

module.exports = router;