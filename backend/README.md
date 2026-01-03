# Dayflow HRMS Backend API

A comprehensive Human Resource Management System backend built with Node.js, Express, and MongoDB.

## Features

- 🔐 **Authentication & Authorization** - JWT-based auth with role-based access control
- 👥 **Employee Management** - Complete employee profile management
- ⏰ **Attendance Tracking** - Check-in/check-out with automatic hour calculation
- 🏖️ **Leave Management** - Apply, approve/reject leaves with balance tracking
- 💰 **Salary Management** - Automated salary component calculations
- 📊 **Dashboard** - Role-specific dashboards with analytics

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## Project Structure

```
backend/
├── models/
│   ├── User.js
│   ├── Employee.js
│   ├── Attendance.js
│   ├── Leave.js
│   ├── LeaveBalance.js
│   ├── Salary.js
│   └── Company.js
├── routes/
│   ├── auth.js
│   ├── employee.js
│   ├── attendance.js
│   ├── leave.js
│   ├── salary.js
│   └── dashboard.js
├── middleware/
│   └── auth.js
├── utils/
│   └── generateEmployeeId.js
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
```

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd dayflow-hrms-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```
Edit `.env` file with your configuration:
- MongoDB connection string
- JWT secret key
- Email credentials (optional)
- Other configurations

4. **Start MongoDB**
Ensure MongoDB is running on your system or use MongoDB Atlas.

5. **Run the server**
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new employee
- `POST /api/auth/signin` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Employees
- `GET /api/employees` - Get all employees (Admin/HR)
- `GET /api/employees/:id` - Get single employee
- `GET /api/employees/user/:userId` - Get employee by user ID
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee (Admin/HR)
- `PUT /api/employees/:id/profile-picture` - Update profile picture

### Attendance
- `POST /api/attendance/check-in` - Check in
- `POST /api/attendance/check-out` - Check out
- `GET /api/attendance/my-attendance` - Get own attendance
- `GET /api/attendance/today` - Get today's attendance
- `GET /api/attendance/employee/:employeeId` - Get employee attendance (Admin/HR)
- `GET /api/attendance/date/:date` - Get attendance by date (Admin/HR)
- `GET /api/attendance/month/:year/:month` - Get monthly attendance
- `PUT /api/attendance/:id` - Update attendance (Admin/HR)

### Leave
- `POST /api/leaves/apply` - Apply for leave
- `GET /api/leaves/my-leaves` - Get own leave requests
- `GET /api/leaves/my-balance` - Get own leave balance
- `GET /api/leaves/pending` - Get pending leaves (Admin/HR)
- `GET /api/leaves/all` - Get all leaves (Admin/HR)
- `PUT /api/leaves/:id/approve` - Approve leave (Admin/HR)
- `PUT /api/leaves/:id/reject` - Reject leave (Admin/HR)
- `GET /api/leaves/balance/:employeeId` - Get employee leave balance

### Salary
- `GET /api/salary/my-salary` - Get own salary (read-only)
- `GET /api/salary/employee/:employeeId` - Get employee salary (Admin/HR)
- `POST /api/salary/employee/:employeeId` - Create salary structure (Admin/HR)
- `PUT /api/salary/employee/:employeeId` - Update salary structure (Admin/HR)
- `POST /api/salary/calculate` - Calculate salary preview (Admin/HR)
- `DELETE /api/salary/employee/:employeeId` - Delete salary structure (Admin/HR)

### Dashboard
- `GET /api/dashboard/employee` - Get employee dashboard
- `GET /api/dashboard/admin` - Get admin dashboard (Admin/HR)
- `GET /api/dashboard/stats` - Get statistics (Admin/HR)

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## User Roles

- **employee** - Regular employee with limited access
- **hr** - HR officer with management capabilities
- **admin** - Full system access and control

## Employee ID Format

Employee IDs are auto-generated in the format:
```
[CompanyInitials][FirstTwoLetters][YearOfJoining][SerialNumber]
Example: OIJODO20220001
```

## Salary Calculation Logic

Based on monthly wage, components are calculated as:
- **Basic Salary**: 50% of wage
- **HRA**: 50% of Basic
- **Standard Allowance**: ₹4,167
- **Performance Bonus**: 8.33% of Basic
- **LTA**: 8.33% of Basic
- **Fixed Allowance**: Remaining amount
- **PF (Employee & Employer)**: 12% of Basic each
- **Professional Tax**: ₹200

## Leave Balance Defaults

- **Paid Time Off**: 24 days/year
- **Sick Leave**: 7 days/year
- **Unpaid Leave**: Unlimited

## Error Handling

All API responses follow this format:
```json
{
  "success": true/false,
  "message": "Description",
  "data": {}  // Optional
}
```

## Development

### Running Tests
```bash
npm test
```

### Code Style
Follow JavaScript Standard Style guidelines.

## Deployment

### Environment Variables for Production
Ensure these are set in production:
- `NODE_ENV=production`
- `MONGODB_URI=<production-database-url>`
- `JWT_SECRET=<strong-secret-key>`
- `FRONTEND_URL=<production-frontend-url>`

### Security Considerations
- Always use HTTPS in production
- Rotate JWT secrets regularly
- Implement rate limiting
- Use strong MongoDB credentials
- Enable MongoDB authentication
- Regular security audits

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - See LICENSE file for details

## Support

For issues and questions, please create an issue in the repository.