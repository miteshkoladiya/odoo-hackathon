const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  logo: {
    type: String,
    default: ''
  },
  initials: {
    type: String,
    trim: true,
    uppercase: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employeeCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Generate company initials before saving
companySchema.pre('save', function(next) {
  if (this.isModified('name') && !this.initials) {
    // Extract first two letters of each word
    const words = this.name.split(' ');
    if (words.length >= 2) {
      this.initials = words[0].substring(0, 2).toUpperCase() + 
                     words[1].substring(0, 2).toUpperCase();
    } else {
      this.initials = this.name.substring(0, 4).toUpperCase();
    }
  }
  next();
});

const Company = mongoose.model('Company', companySchema);

module.exports = Company;