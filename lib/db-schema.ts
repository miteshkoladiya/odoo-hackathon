import { connectToDatabase } from "./mongodb"

export async function initializeDatabase() {
  const { db } = await connectToDatabase()

  // Create collections if they don't exist
  const collections = await db.listCollections().toArray()
  const collectionNames = collections.map((c) => c.name)

  // Users collection
  if (!collectionNames.includes("users")) {
    await db.createCollection("users")
    await db.collection("users").createIndex({ email: 1 }, { unique: true })
    await db.collection("users").createIndex({ employeeId: 1 }, { unique: true })
  }

  // Employees collection
  if (!collectionNames.includes("employees")) {
    await db.createCollection("employees")
    await db.collection("employees").createIndex({ userId: 1 })
    await db.collection("employees").createIndex({ department: 1 })
  }

  // Leave applications collection
  if (!collectionNames.includes("leave_applications")) {
    await db.createCollection("leave_applications")
    await db.collection("leave_applications").createIndex({ employeeId: 1 })
    await db.collection("leave_applications").createIndex({ status: 1 })
  }

  // Attendance collection
  if (!collectionNames.includes("attendance")) {
    await db.createCollection("attendance")
    await db.collection("attendance").createIndex({ employeeId: 1, date: 1 })
  }

  // Payroll collection
  if (!collectionNames.includes("payroll")) {
    await db.createCollection("payroll")
    await db.collection("payroll").createIndex({ employeeId: 1, month: 1 })
  }

  // Approvals collection
  if (!collectionNames.includes("approvals")) {
    await db.createCollection("approvals")
    await db.collection("approvals").createIndex({ requestId: 1 })
    await db.collection("approvals").createIndex({ approverId: 1, status: 1 })
  }

  // Notifications collection
  if (!collectionNames.includes("notifications")) {
    await db.createCollection("notifications")
    await db.collection("notifications").createIndex({ userId: 1, read: 1 })
  }

  console.log("Database initialized successfully")
}

// Schema interfaces for TypeScript
export interface User {
  _id?: string
  email: string
  password: string
  firstName: string
  lastName: string
  role: "admin" | "hr" | "employee"
  employeeId: string
  isEmailVerified: boolean
  emailVerificationToken?: string
  companyName?: string
  createdAt: Date
  updatedAt: Date
}

export interface Employee {
  _id?: string
  firstName: string
  lastName: string
  email: string
  employeeId: string
  // Work Info
  jobPosition?: string
  department?: string
  manager?: string // Name or ID
  location?: string
  mobile?: string
  joinDate: Date
  // Private Info
  dob?: Date
  address?: string
  nationality?: string
  personalEmail?: string
  gender?: "Male" | "Female" | "Other"
  maritalStatus?: "Single" | "Married" | "Divorced" | "Widowed"

  // Bank Details
  bankDetails?: {
    accountNumber: string
    bankName: string
    ifscCode: string
    panNo: string
    uanNo: string
  }

  // Resume / Skills
  about?: string
  skills?: string[]
  certifications?: string[]

  // Salary Info
  salaryInfo?: {
    wageType: "Fixed" | "Hourly"
    monthWage: number
    workingDaysPerWeek: number
    breakHoursPerDay?: number
    components: {
      basic: { type: "percent" | "fixed", value: number, amount: number }
      hra: { type: "percent" | "fixed", value: number, amount: number }
      standardAllowance: { type: "percent" | "fixed", value: number, amount: number }
      performanceBonus: { type: "percent" | "fixed", value: number, amount: number }
      lta: { type: "percent" | "fixed", value: number, amount: number }
      specialAllowance: { type: "percent" | "fixed", value: number, amount: number } // Balancing figure
      pfEmployee: { type: "percent" | "fixed", value: number, amount: number }
      pfEmployer: { type: "percent" | "fixed", value: number, amount: number }
      professionalTax: { type: "percent" | "fixed", value: number, amount: number }
    }
  }

  createdAt: Date
  updatedAt: Date
}

export interface LeaveApplication {
  _id?: string
  employeeId: string
  leaveType: "sick" | "casual" | "annual" | "unpaid"
  startDate: Date
  endDate: Date
  reason: string
  status: "pending" | "approved" | "rejected"
  approverId?: string
  approvalDate?: Date
  comments?: string
  createdAt: Date
  updatedAt: Date
}

export interface Attendance {
  _id?: string
  employeeId: string
  date: Date
  checkInTime: string
  checkOutTime?: string
  status: "present" | "absent" | "late" | "leave"
  createdAt: Date
  updatedAt: Date
}

export interface Payroll {
  _id?: string
  employeeId: string
  month: string
  baseSalary: number
  allowances: number
  deductions: number
  netSalary: number
  status: "pending" | "approved" | "paid"
  createdAt: Date
  updatedAt: Date
}

export interface Notification {
  _id?: string
  userId: string
  type: "approval" | "rejection" | "leave_approved" | "payroll" | "system"
  title: string
  message: string
  read: boolean
  createdAt: Date
}
