const Employee = require('../models/Employee');
const Company = require('../models/Company');

/**
 * Generate Employee ID in format: [CompanyInitials][FirstTwoLetters][YearOfJoining][SerialNumber]
 * Example: OIJODO20220001
 * 
 * @param {string} employeeName - Full name of the employee
 * @param {string} companyId - Company ID
 * @param {Date} dateOfJoining - Date of joining
 * @returns {Promise<string>} Generated employee ID
 */
const generateEmployeeId = async (employeeName, companyId, dateOfJoining = new Date()) => {
  try {
    // Get company details
    const company = await Company.findById(companyId);
    if (!company) {
      throw new Error('Company not found');
    }
    
    // Extract company initials (first 2 letters of first 2 words)
    const companyInitials = company.initials || 'OI';
    
    // Extract first two letters of first and last name
    const nameParts = employeeName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts[nameParts.length - 1] || '';
    
    const firstTwoLetters = (firstName.substring(0, 2) + lastName.substring(0, 2))
      .toUpperCase()
      .padEnd(4, 'X');
    
    // Extract year of joining
    const year = dateOfJoining.getFullYear();
    
    // Find the last employee ID for this year and company
    const lastEmployee = await Employee.findOne({
      company: company.name,
      employeeId: new RegExp(`^${companyInitials}${firstTwoLetters}${year}`)
    }).sort({ employeeId: -1 });
    
    // Generate serial number
    let serialNumber = 1;
    if (lastEmployee) {
      const lastSerial = parseInt(lastEmployee.employeeId.slice(-4));
      if (!isNaN(lastSerial)) {
        serialNumber = lastSerial + 1;
      }
    }
    
    // Format serial number to 4 digits
    const formattedSerial = serialNumber.toString().padStart(4, '0');
    
    // Combine all parts
    const employeeId = `${companyInitials}${firstTwoLetters}${year}${formattedSerial}`;
    
    return employeeId;
  } catch (error) {
    console.error('Error generating employee ID:', error);
    throw error;
  }
};

module.exports = generateEmployeeId;