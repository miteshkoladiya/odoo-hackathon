const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  checkIn: {
    type: Date
  },
  checkOut: {
    type: Date
  },
  workHours: {
    type: Number,
    default: 0
  },
  extraHours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'half-day', 'leave'],
    default: 'absent'
  },
  remarks: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

// Compound index for unique employee attendance per date
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

// Index for date-based queries
attendanceSchema.index({ date: 1 });

// Method to calculate work hours and extra hours
attendanceSchema.methods.calculateHours = function(standardHours = 9, breakHours = 1) {
  if (this.checkIn && this.checkOut) {
    const totalMs = this.checkOut - this.checkIn;
    const totalHours = totalMs / (1000 * 60 * 60);
    
    // Subtract break time
    this.workHours = Math.max(0, totalHours - breakHours);
    
    // Calculate extra hours if work exceeds standard hours
    this.extraHours = Math.max(0, this.workHours - standardHours);
    
    // Update status
    if (this.workHours >= standardHours) {
      this.status = 'present';
    } else if (this.workHours >= standardHours / 2) {
      this.status = 'half-day';
    } else {
      this.status = 'absent';
    }
  }
};

// Static method to get monthly attendance summary
attendanceSchema.statics.getMonthlySummary = async function(employeeId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  const attendances = await this.find({
    employeeId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });
  
  const summary = {
    totalDays: attendances.length,
    present: 0,
    absent: 0,
    halfDay: 0,
    leave: 0,
    totalWorkHours: 0,
    totalExtraHours: 0
  };
  
  attendances.forEach(att => {
    switch (att.status) {
      case 'present':
        summary.present++;
        break;
      case 'absent':
        summary.absent++;
        break;
      case 'half-day':
        summary.halfDay++;
        break;
      case 'leave':
        summary.leave++;
        break;
    }
    summary.totalWorkHours += att.workHours;
    summary.totalExtraHours += att.extraHours;
  });
  
  return { attendances, summary };
};

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;