# Development Guide

## Local Setup

### Prerequisites
- Node.js 18+ ([nodejs.org](https://nodejs.org))
- MongoDB 5+ (local or Atlas)
- Git ([git-scm.com](https://git-scm.com))

### Installation

1. **Clone Repository**
   ```bash
   git clone https://github.com/your-org/dayflow-hrms.git
   cd dayflow-hrms
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Setup Environment**
   ```bash
   cp .env.example .env.local
   ```

4. **Configure MongoDB**
   
   Option A: Local MongoDB
   ```bash
   # Install MongoDB Community Edition
   # macOS: brew install mongodb-community
   # Ubuntu: Follow MongoDB installation guide
   
   # Start MongoDB
   mongod
   
   # Update .env.local
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DB_NAME=hrms
   ```
   
   Option B: MongoDB Atlas (Cloud)
   ```bash
   # Create cluster at mongodb.com/cloud/atlas
   # Update .env.local with connection string
   MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/hrms
   ```

5. **Initialize Database**
   ```bash
   npm run db:init
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   ```

7. **Open Application**
   Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
dayflow-hrms/
├── app/
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── employees/            # Employee management
│   │   ├── leave-applications/   # Leave requests
│   │   ├── attendance/           # Attendance tracking
│   │   ├── payroll/              # Payroll management
│   │   ├── approvals/            # Approval workflows
│   │   ├── notifications/        # Notification system
│   │   └── reports/              # Report generation
│   ├── dashboard/
│   │   ├── admin/                # Admin dashboard
│   │   └── employee/             # Employee portal
│   ├── page.tsx                  # Login page
│   ├── register/                 # Registration page
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── components/
│   ├── ui/                       # Shadcn UI components
│   ├── dashboard-sidebar.tsx     # Admin sidebar
│   ├── employee-sidebar.tsx      # Employee sidebar
│   └── notification-bell.tsx     # Notification component
├── lib/
│   ├── mongodb.ts                # Database connection
│   ├── auth.ts                   # Auth utilities
│   ├── db-schema.ts              # Schema definitions
│   └── utils.ts                  # Helper functions
├── public/                       # Static files
├── .github/workflows/            # CI/CD pipelines
├── scripts/                      # Database scripts
├── package.json
├── tsconfig.json
├── next.config.mjs
└── README.md
```

## Common Development Tasks

### Adding a New API Endpoint

1. **Create Route Handler**
   ```typescript
   // app/api/route-name/route.ts
   import { NextRequest, NextResponse } from 'next/server'
   import { connectToDatabase } from '@/lib/mongodb'

   export async function GET(request: NextRequest) {
     try {
       const { db } = await connectToDatabase()
       // Your code here
       return NextResponse.json({ data })
     } catch (error) {
       return NextResponse.json({ error: 'Message' }, { status: 500 })
     }
   }
   ```

2. **Test Endpoint**
   ```bash
   curl http://localhost:3000/api/route-name
   ```

### Adding a New Component

1. **Create Component File**
   ```typescript
   // components/my-component.tsx
   export default function MyComponent() {
     return <div>Component</div>
   }
   ```

2. **Import and Use**
   ```typescript
   import MyComponent from '@/components/my-component'
   ```

### Database Queries

```typescript
import { connectToDatabase } from '@/lib/mongodb'

// Get data
const { db } = await connectToDatabase()
const result = await db.collection('users').findOne({ email })

// Insert data
await db.collection('users').insertOne({ email, name })

// Update data
await db.collection('users').updateOne(
  { _id: userId },
  { $set: { name: 'New Name' } }
)

// Delete data
await db.collection('users').deleteOne({ _id: userId })
```

## Testing

### Running Tests
```bash
npm run test
```

### Writing Tests
```typescript
// __tests__/auth.test.ts
describe('Authentication', () => {
  it('should register a new user', () => {
    // Test code
  })
})
```

## Code Style

### ESLint
```bash
npm run lint
```

### Format Code
```bash
npx prettier --write .
```

## Debugging

### Browser DevTools
- Open http://localhost:3000
- Press F12 to open DevTools
- Use Console, Network, Storage tabs

### Server Logs
```bash
npm run dev  # Logs appear in terminal
```

### VS Code Debugging
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "cwd": "${workspaceFolder}"
    }
  ]
}
```

## Performance Profiling

### Lighthouse
1. Open DevTools
2. Go to Lighthouse tab
3. Click "Generate report"

### Bundle Analysis
```bash
npm run build
npm run analyze  # If configured
```

## Database Management

### View Collections
```bash
mongo
use hrms
db.getCollectionNames()
```

### Backup Database
```bash
mongodump --db hrms --out ./backups
```

### Restore Database
```bash
mongorestore --db hrms ./backups/hrms
```

## Troubleshooting

### Port Already in Use
```bash
lsof -i :3000
kill -9 <PID>
```

### Build Errors
```bash
rm -rf .next node_modules
npm install
npm run build
```

### MongoDB Connection Failed
- Check if MongoDB is running
- Verify connection string
- Check firewall settings
- Test with MongoDB Compass
