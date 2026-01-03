const express = require('express');
const router = express.Router();
const Salary = require('../models/Salary');
const Employee = require('../models/Employee');
const { authenticate, isAdminOrHR } = require('../middleware/auth');

// @route   GET /api/salary/my-salary
// @desc    Get own salary information (read-only for employees)
// @access  Private
router.get('/my-salary', authenticate, async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }
    
    let salary = await Salary.findOne({ employeeId: employee._id });
    
    // If salary not set, return null
    if (!salary) {
      return res.json({
        success: true,
        data: null,
        message: 'Salary information not yet configured'
      });
    }
    
    res.json({
      success: true,
      data: salary
    });
  } catch (error) {
    console.error('Get my salary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching salary information',
      error: error.message
    });
  }
});

// @route   GET /api/salary/employee/:employeeId
// @desc    Get employee salary (Admin/HR only)
// @access  Private (Admin/HR)
router.get('/employee/:employeeId', authenticate, isAdminOrHR, async (req, res) => {
  try {
    const salary = await Salary.findOne({ employeeId: req.params.employeeId })
      .populate('employeeId', 'name employeeId email');
    
    if (!salary) {
      return res.json({
        success: true,
        data: null,
        message: 'Salary information not yet configured'
      });
    }
    
    res.json({
      success: true,
      data: salary
    });
  } catch (error) {
    console.error('Get employee salary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee salary',
      error: error.message
    });
  }
});

// @route   POST /api/salary/employee/:employeeId
// @desc    Create salary structure for employee
// @access  Private (Admin/HR)
router.post('/employee/:employeeId', authenticate, isAdminOrHR, async (req, res) => {
  try {
    const { monthlyWage, workingDaysPerWeek, breakTimeHours } = req.body;
    
    if (!monthlyWage) {
      return res.status(400).json({
        success: false,
        message: 'Monthly wage is required'
      });
    }
    
    // Check if employee exists
    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Check if salary already exists
    const existingSalary = await Salary.findOne({ employeeId: req.params.employeeId });
    if (existingSalary) {
      return res.status(400).json({
        success: false,
        message: 'Salary structure already exists. Use PUT to update.'
      });
    }
    
    // Create new salary record
    const salary = new Salary({
      employeeId: req.params.employeeId,
      monthlyWage,
      workingDaysPerWeek: workingDaysPerWeek || 5,
      breakTimeHours: breakTimeHours || 1
    });
    
    // Calculate all components
    salary.calculateComponents();
    
    await salary.save();
    
    res.status(201).json({
      success: true,
      message: 'Salary structure created successfully',
      data: salary
    });
  } catch (error) {
    console.error('Create salary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating salary structure',
      error: error.message
    });
  }
});

// @route   PUT /api/salary/employee/:employeeId
// @desc    Update salary structure for employee
// @access  Private (Admin/HR)
router.put('/employee/:employeeId', authenticate, isAdminOrHR, async (req, res) => {
  try {
    const salary = await Salary.findOne({ employeeId: req.params.employeeId });
    
    if (!salary) {
      return res.status(404).json({
        success: false,
        message: 'Salary structure not found. Use POST to create.'
      });
    }
    
    const { 
      monthlyWage, 
      workingDaysPerWeek, 
      breakTimeHours,
      professionalTax
    } = req.body;
    
    // Update basic fields
    if (monthlyWage !== undefined) salary.monthlyWage = monthlyWage;
    if (workingDaysPerWeek !== undefined) salary.workingDaysPerWeek = workingDaysPerWeek;
    if (breakTimeHours !== undefined) salary.breakTimeHours = breakTimeHours;
    if (professionalTax !== undefined) salary.professionalTax = professionalTax;
    
    // Recalculate components if wage changed
    if (monthlyWage !== undefined) {
      salary.calculateComponents();
    }
    
    await salary.save();
    
    res.json({
      success: true,
      message: 'Salary structure updated successfully',
      data: salary
    });
  } catch (error) {
    console.error('Update salary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating salary structure',
      error: error.message
    });
  }
});

// @route   POST /api/salary/calculate
// @desc    Calculate salary components based on wage (preview)
// @access  Private (Admin/HR)
router.post('/calculate', authenticate, isAdminOrHR, async (req, res) => {
  try {
    const { monthlyWage } = req.body;
    
    if (!monthlyWage) {
      return res.status(400).json({
        success: false,
        message: 'Monthly wage is required'
      });
    }
    
    // Create temporary salary object for calculation
    const tempSalary = new Salary({
      employeeId: 'temp',
      monthlyWage
    });
    
    tempSalary.calculateComponents();
    
    res.json({
      success: true,
      data: {
        monthlyWage: tempSalary.monthlyWage,
        yearlyWage: tempSalary.yearlyWage,
        basicSalary: tempSalary.basicSalary,
        houseRentAllowance: tempSalary.houseRentAllowance,
        standardAllowance: tempSalary.standardAllowance,
        performanceBonus: tempSalary.performanceBonus,
        leaveTravelAllowance: tempSalary.leaveTravelAllowance,
        fixedAllowance: tempSalary.fixedAllowance,
        pfEmployee: tempSalary.pfEmployee,
        pfEmployer: tempSalary.pfEmployer,
        professionalTax: tempSalary.professionalTax
      }
    });
  } catch (error) {
    console.error('Calculate salary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating salary',
      error: error.message
    });
  }
});

// @route   DELETE /api/salary/employee/:employeeId
// @desc    Delete salary structure
// @access  Private (Admin/HR)
router.delete('/employee/:employeeId', authenticate, isAdminOrHR, async (req, res) => {
  try {
    const salary = await Salary.findOneAndDelete({ employeeId: req.params.employeeId });
    
    if (!salary) {
      return res.status(404).json({
        success: false,
        message: 'Salary structure not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Salary structure deleted successfully'
    });
  } catch (error) {
    console.error('Delete salary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting salary structure',
      error: error.message
    });
  }
});

module.exports = router;