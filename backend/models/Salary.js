const mongoose = require('mongoose');

const salaryComponentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    default: 0
  },
  percentage: {
    type: Number,
    default: 0
  }
}, { _id: false });

const salarySchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    unique: true
  },
  
  // Basic Wage Information
  monthlyWage: {
    type: Number,
    required: true,
    min: 0
  },
  yearlyWage: {
    type: Number,
    default: 0
  },
  wageType: {
    type: String,
    enum: ['fixed', 'hourly'],
    default: 'fixed'
  },
  workingDaysPerWeek: {
    type: Number,
    default: 5,
    min: 1,
    max: 7
  },
  breakTimeHours: {
    type: Number,
    default: 1,
    min: 0
  },
  
  // Salary Components
  basicSalary: {
    type: salaryComponentSchema,
    default: { amount: 0, percentage: 50 }
  },
  houseRentAllowance: {
    type: salaryComponentSchema,
    default: { amount: 0, percentage: 50 }
  },
  standardAllowance: {
    type: salaryComponentSchema,
    default: { amount: 0, percentage: 16.67 }
  },
  performanceBonus: {
    type: salaryComponentSchema,
    default: { amount: 0, percentage: 8.33 }
  },
  leaveTravelAllowance: {
    type: salaryComponentSchema,
    default: { amount: 0, percentage: 8.33 }
  },
  fixedAllowance: {
    type: salaryComponentSchema,
    default: { amount: 0, percentage: 11.67 }
  },
  
  // Provident Fund
  pfEmployee: {
    type: salaryComponentSchema,
    default: { amount: 0, percentage: 12 }
  },
  pfEmployer: {
    type: salaryComponentSchema,
    default: { amount: 0, percentage: 12 }
  },
  
  // Tax Deductions
  professionalTax: {
    type: Number,
    default: 200
  }
}, {
  timestamps: true
});

// Calculate yearly wage before saving
salarySchema.pre('save', function(next) {
  this.yearlyWage = this.monthlyWage * 12;
  next();
});

// Method to calculate all salary components based on monthly wage
salarySchema.methods.calculateComponents = function() {
  const wage = this.monthlyWage;
  
  // Calculate Basic Salary (50% of wage)
  this.basicSalary.amount = wage * 0.5;
  this.basicSalary.percentage = 50;
  
  // Calculate HRA (50% of Basic)
  this.houseRentAllowance.amount = this.basicSalary.amount * 0.5;
  this.houseRentAllowance.percentage = 50;
  
  // Calculate Standard Allowance (fixed ₹4167)
  this.standardAllowance.amount = 4167;
  this.standardAllowance.percentage = 16.67;
  
  // Calculate Performance Bonus (8.33% of Basic)
  this.performanceBonus.amount = this.basicSalary.amount * 0.0833;
  this.performanceBonus.percentage = 8.33;
  
  // Calculate LTA (8.33% of Basic)
  this.leaveTravelAllowance.amount = this.basicSalary.amount * 0.0833;
  this.leaveTravelAllowance.percentage = 8.33;
  
  // Calculate Fixed Allowance (remaining amount to match wage)
  const totalComponents = this.basicSalary.amount + 
                         this.houseRentAllowance.amount + 
                         this.standardAllowance.amount + 
                         this.performanceBonus.amount + 
                         this.leaveTravelAllowance.amount;
  
  this.fixedAllowance.amount = wage - totalComponents;
  this.fixedAllowance.percentage = (this.fixedAllowance.amount / wage) * 100;
  
  // Calculate PF (12% of Basic)
  this.pfEmployee.amount = this.basicSalary.amount * 0.12;
  this.pfEmployee.percentage = 12;
  
  this.pfEmployer.amount = this.basicSalary.amount * 0.12;
  this.pfEmployer.percentage = 12;
};


const Salary = mongoose.model('Salary', salarySchema);

module.exports = Salary;