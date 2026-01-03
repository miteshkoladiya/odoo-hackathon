const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  leaveType: {
    type: String,
    enum: ['paid', 'sick', 'unpaid'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  allocation: {
    type: Number,
    required: true,
    min: 0
  },
  remarks: {
    type: String,
    trim: true,
    default: ''
  },
  attachment: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminComment: {
    type: String,
    trim: true,
    default: ''
  },
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for faster queries
leaveSchema.index({ employeeId: 1 });
leaveSchema.index({ status: 1 });
leaveSchema.index({ startDate: 1, endDate: 1 });

// Calculate allocation (number of days) before saving
leaveSchema.pre('save', function(next) {
  if (this.startDate && this.endDate) {
    const timeDiff = this.endDate - this.startDate;
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;
    this.allocation = daysDiff;
  }
  next();
});

// Method to check if leave dates overlap with existing leaves
leaveSchema.statics.checkOverlap = async function(employeeId, startDate, endDate, excludeId = null) {
  const query = {
    employeeId,
    status: { $in: ['pending', 'approved'] },
    $or: [
      { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
    ]
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  const overlapping = await this.findOne(query);
  return !!overlapping;
};

// Static method to get leave summary for an employee
leaveSchema.statics.getLeaveSummary = async function(employeeId, year) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);
  
  const leaves = await this.find({
    employeeId,
    status: 'approved',
    startDate: { $gte: startDate, $lte: endDate }
  });
  
  const summary = {
    paid: 0,
    sick: 0,
    unpaid: 0,
    total: 0
  };
  
  leaves.forEach(leave => {
    summary[leave.leaveType] += leave.allocation;
    summary.total += leave.allocation;
  });
  
  return summary;
};

const Leave = mongoose.model('Leave', leaveSchema);

module.exports = Leave;