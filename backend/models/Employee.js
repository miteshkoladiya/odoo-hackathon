const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Personal Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', '']
  },
  maritalStatus: {
    type: String,
    enum: ['single', 'married', 'divorced', 'widowed', '']
  },
  nationality: {
    type: String,
    trim: true
  },
  residingAddress: {
    type: String,
    trim: true
  },
  personalEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  
  // Job Details
  company: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  jobPosition: {
    type: String,
    trim: true
  },
  manager: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  dateOfJoining: {
    type: Date
  },
  
  // Profile Content
  profilePicture: {
    type: String,
    default: ''
  },
  resume: {
    type: String,
    default: ''
  },
  about: {
    type: String,
    default: ''
  },
  whatILove: {
    type: String,
    default: ''
  },
  interests: {
    type: String,
    default: ''
  },
  skills: [{
    type: String,
    trim: true
  }],
  certifications: [{
    type: String,
    trim: true
  }],
  
  // Bank Details (Security)
  bankName: {
    type: String,
    trim: true
  },
  accountNumber: {
    type: String,
    trim: true
  },
  ifscCode: {
    type: String,
    trim: true
  },
  panNo: {
    type: String,
    trim: true
  },
  uanNo: {
    type: String,
    trim: true
  },
  empCode: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster queries
employeeSchema.index({ email: 1 });

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;