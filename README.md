# Dayflow - Human Resource Management System

A comprehensive HRMS built with MERN stack and Next.js, providing employee management, attendance tracking, leave management, payroll processing, and approval workflows.

## Features

### Employee Management
- Employee profile management
- Department and role assignment
- Organizational hierarchy

### Attendance Tracking
- Daily check-in/check-out
- Monthly attendance reports
- Late arrival tracking
- Leave marking

### Leave Management
- Multiple leave types (annual, sick, casual, unpaid)
- Leave application workflow
- Approval system with comments
- Leave balance tracking

### Payroll System
- Salary calculation with allowances and deductions
- Monthly payroll processing
- Payroll approval workflow
- Salary slip generation

### Approval Workflows
- Leave approval process
- Payroll approval pipeline
- Real-time notifications
- Comment and feedback system

### Reports & Analytics
- Attendance reports
- Payroll summaries
- Leave statistics
- Department-wise analytics
- Export to CSV/PDF

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript
- **UI Components:** shadcn/ui, Tailwind CSS
- **Backend:** Next.js API Routes, Node.js
- **Database:** MongoDB
- **Authentication:** Custom implementation with JWT
- **Deployment:** Vercel

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB instance
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/your-org/dayflow-hrms.git
   cd dayflow-hrms
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Setup environment variables
   ```bash
   cp .env.example .env.local
   ```

4. Configure MongoDB
   ```env
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DB_NAME=hrms
   ```

5. Initialize database
   ```bash
   npm run db:init
   ```

6. Start development server
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
dayflow-hrms/
├── app/
│   ├── api/                 # API routes
│   ├── dashboard/           # Dashboard pages
│   ├── page.tsx             # Login page
│   ├── register/            # Registration page
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── components/
│   ├── ui/                  # Reusable UI components
│   ├── dashboard-sidebar.tsx
│   ├── employee-sidebar.tsx
│   └── notification-bell.tsx
├── lib/
│   ├── mongodb.ts           # MongoDB connection
│   ├── auth.ts              # Authentication utilities
│   └── db-schema.ts         # Database schema
├── public/                  # Static assets
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Email verification

### Employees
- `GET /api/employees` - List employees
- `POST /api/employees` - Create employee
- `GET /api/employees/[id]` - Get employee details
- `PUT /api/employees/[id]` - Update employee
- `DELETE /api/employees/[id]` - Delete employee

### Leave Applications
- `GET /api/leave-applications` - List leave applications
- `POST /api/leave-applications` - Create leave application

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Record attendance

### Payroll
- `GET /api/payroll` - List payroll records
- `POST /api/payroll` - Process payroll

### Approvals
- `GET /api/approvals` - List pending approvals
- `POST /api/approvals` - Process approval

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications` - Mark as read

### Reports
- `GET /api/reports/attendance` - Attendance report
- `GET /api/reports/payroll` - Payroll report

## Development

### Running Tests
```bash
npm run test
```

### Building for Production
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## Deployment

### Deploy to Vercel

1. Push code to GitHub
   ```bash
   git push origin main
   ```

2. Connect repository to Vercel
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Configure environment variables

3. Deploy
   ```bash
   npm run build
   vercel --prod
   ```

## Environment Variables

```env
# MongoDB
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/database
MONGODB_DB_NAME=hrms

# Authentication (optional)
JWT_SECRET=your_jwt_secret_key

# Email (optional, for verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# App URLs
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Troubleshooting

### MongoDB Connection Issues
- Verify MongoDB is running
- Check connection string in `.env.local`
- Ensure network access is allowed

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti :3000 | xargs kill -9
```

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support & Contact

- Email: support@dayflow.com
- Documentation: https://docs.dayflow.com
- Issues: GitHub Issues
