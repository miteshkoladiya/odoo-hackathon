const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const User = require('../models/User');
const { authenticate, isAdminOrHR } = require('../middleware/auth');

// @route   GET /api/employees
// @desc    Get all employees
// @access  Private (Admin/HR)
router.get('/', authenticate, isAdminOrHR, async (req, res) => {
  try {
    const { search, department, company } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (department) {
      query.department = department;
    }
    
    if (company) {
      query.company = company;
    }
    
    const employees = await Employee.find(query)
      .populate('userId', 'email role isActive')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employees',
      error: error.message
    });
  }
});

// @route   GET /api/employees/:id
// @desc    Get single employee
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('userId', 'email role isActive');
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Check if user is viewing their own profile or is admin/HR
    const isOwnProfile = employee.userId._id.toString() === req.user._id.toString();
    const isAdminOrHRRole = req.user.role === 'admin' || req.user.role === 'hr';
    
    if (!isOwnProfile && !isAdminOrHRRole) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee',
      error: error.message
    });
  }
});

// @route   GET /api/employees/user/:userId
// @desc    Get employee by user ID
// @access  Private
router.get('/user/:userId', authenticate, async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.params.userId })
      .populate('userId', 'email role isActive');
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Check if user is viewing their own profile or is admin/HR
    const isOwnProfile = req.params.userId === req.user._id.toString();
    const isAdminOrHRRole = req.user.role === 'admin' || req.user.role === 'hr';
    
    if (!isOwnProfile && !isAdminOrHRRole) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Get employee by user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee',
      error: error.message
    });
  }
});

// @route   PUT /api/employees/:id
// @desc    Update employee
// @access  Private
router.put('/:id', authenticate, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    const isOwnProfile = employee.userId.toString() === req.user._id.toString();
    const isAdminOrHRRole = req.user.role === 'admin' || req.user.role === 'hr';
    
    // Define fields that employees can edit
    const employeeEditableFields = [
      'phone',
      'residingAddress',
      'profilePicture',
      'about',
      'whatILove',
      'interests',
      'skills',
      'certifications'
    ];
    
    // If regular employee, restrict editable fields
    if (isOwnProfile && !isAdminOrHRRole) {
      const updates = {};
      employeeEditableFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });
      
      Object.assign(employee, updates);
    } else if (isAdminOrHRRole) {
      // Admin/HR can update all fields
      Object.assign(employee, req.body);
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    await employee.save();
    
    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: employee
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating employee',
      error: error.message
    });
  }
});

// @route   DELETE /api/employees/:id
// @desc    Delete employee
// @access  Private (Admin/HR)
router.delete('/:id', authenticate, isAdminOrHR, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Also deactivate the user account
    await User.findByIdAndUpdate(employee.userId, { isActive: false });
    
    // Soft delete by marking as inactive
    await Employee.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting employee',
      error: error.message
    });
  }
});

// @route   PUT /api/employees/:id/profile-picture
// @desc    Update profile picture
// @access  Private
router.put('/:id/profile-picture', authenticate, async (req, res) => {
  try {
    const { profilePicture } = req.body;
    
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    const isOwnProfile = employee.userId.toString() === req.user._id.toString();
    const isAdminOrHRRole = req.user.role === 'admin' || req.user.role === 'hr';
    
    if (!isOwnProfile && !isAdminOrHRRole) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    employee.profilePicture = profilePicture;
    await employee.save();
    
    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      data: { profilePicture: employee.profilePicture }
    });
  } catch (error) {
    console.error('Update profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile picture',
      error: error.message
    });
  }
});

module.exports = router;