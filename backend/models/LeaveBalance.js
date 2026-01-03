const mongoose = require('mongoose');

const leaveTypeSchema = new mongoose.Schema({
  total: {
    type: Number,
    default: 0,
    min: 0
  },
  used: {
    type: Number,
    default: 0,
    min: 0
  },
  available: {
    type: Number,
    default: 0,
    min: 0
  }
}, { _id: false });

const leaveBalanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  paidTimeOff: {
    type: leaveTypeSchema,
    default: { total: 24, used: 0, available: 24 }
  },
  sickLeave: {
    type: leaveTypeSchema,
    default: { total: 7, used: 0, available: 7 }
  },
  unpaidLeave: {
    type: leaveTypeSchema,
    default: { total: 999, used: 0, available: 999 }
  }
}, {
  timestamps: true
});

// Compound unique index for employee and year
leaveBalanceSchema.index({ employeeId: 1, year: 1 }, { unique: true });

// Method to update available leaves
leaveBalanceSchema.methods.updateAvailable = function() {
  this.paidTimeOff.available = Math.max(0, this.paidTimeOff.total - this.paidTimeOff.used);
  this.sickLeave.available = Math.max(0, this.sickLeave.total - this.sickLeave.used);
  this.unpaidLeave.available = Math.max(0, this.unpaidLeave.total - this.unpaidLeave.used);
};

// Method to deduct leaves
leaveBalanceSchema.methods.deductLeave = function(leaveType, days) {
  const leaveField = this.getLeaveField(leaveType);
  if (leaveField) {
    this[leaveField].used += days;
    this.updateAvailable();
  }
};

// Method to restore leaves (when leave is rejected)
leaveBalanceSchema.methods.restoreLeave = function(leaveType, days) {
  const leaveField = this.getLeaveField(leaveType);
  if (leaveField) {
    this[leaveField].used = Math.max(0, this[leaveField].used - days);
    this.updateAvailable();
  }
};

// Helper method to get leave field name
leaveBalanceSchema.methods.getLeaveField = function(leaveType) {
  switch (leaveType) {
    case 'paid':
      return 'paidTimeOff';
    case 'sick':
      return 'sickLeave';
    case 'unpaid':
      return 'unpaidLeave';
    default:
      return null;
  }
};

// Static method to initialize leave balance for new employee
leaveBalanceSchema.statics.initializeForEmployee = async function(employeeId, year = new Date().getFullYear()) {
  const existingBalance = await this.findOne({ employeeId, year });
  
  if (existingBalance) {
    return existingBalance;
  }
  
  const newBalance = new this({
    employeeId,
    year,
    paidTimeOff: { total: 24, used: 0, available: 24 },
    sickLeave: { total: 7, used: 0, available: 7 },
    unpaidLeave: { total: 999, used: 0, available: 999 }
  });
  
  return await newBalance.save();
};

const LeaveBalance = mongoose.model('LeaveBalance', leaveBalanceSchema);

module.exports = LeaveBalance;