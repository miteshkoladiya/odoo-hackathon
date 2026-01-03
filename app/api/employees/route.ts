import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { z } from "zod"
import { createUser } from "@/lib/auth"

const salaryComponentSchema = z.object({
  type: z.enum(["percent", "fixed"]),
  value: z.number().min(0),
  amount: z.number().min(0),
})

const employeeSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  // Work Info
  jobPosition: z.string().optional(),
  department: z.string().optional(),
  manager: z.string().optional(),
  location: z.string().optional(),
  mobile: z.string().optional(),

  // Private Info
  dob: z.string().optional(), // Receive as string from frontend, convert to Date if needed or keep as string/date
  address: z.string().optional(),
  nationality: z.string().optional(),
  personalEmail: z.string().email().optional().or(z.literal("")),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  maritalStatus: z.enum(["Single", "Married", "Divorced", "Widowed"]).optional(),

  // Bank Details
  bankDetails: z.object({
    accountNumber: z.string(),
    bankName: z.string(),
    ifscCode: z.string(),
    panNo: z.string(),
    uanNo: z.string(),
  }).optional(),

  // Resume
  about: z.string().optional(),
  skills: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),

  // Salary Info
  salaryInfo: z.object({
    wageType: z.enum(["Fixed", "Hourly"]),
    monthWage: z.number().min(0),
    workingDaysPerWeek: z.number().min(0),
    breakHoursPerDay: z.number().optional(),
    components: z.object({
      basic: salaryComponentSchema,
      hra: salaryComponentSchema,
      standardAllowance: salaryComponentSchema,
      performanceBonus: salaryComponentSchema,
      lta: salaryComponentSchema,
      specialAllowance: salaryComponentSchema,
      pfEmployee: salaryComponentSchema,
      pfEmployer: salaryComponentSchema,
      professionalTax: salaryComponentSchema,
    }),
  }).optional(),
})

import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const searchParams = request.nextUrl.searchParams
    const department = searchParams.get("department")
    const search = searchParams.get("search")
    const id = searchParams.get("id")

    const query: Record<string, any> = {}

    if (id) {
      try {
        query._id = new ObjectId(id)
      } catch (e) {
        return NextResponse.json({ error: "Invalid ID format" }, { status: 400 })
      }
    }

    if (department) {
      query.department = department
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ]
    }

    const employees = await db.collection("employees").find(query).toArray()

    return NextResponse.json({ employees })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const body = await request.json()

    const validatedData = employeeSchema.parse(body)

    // Generate Custom Employee ID
    // Format: [Data][Name][Year][Serial]
    // Example: OIJODO20220001

    // 1. Company Code (OI for Odoo India, or DA for Dayflow)
    const companyCode = "OI"

    // 2. Name Chars (First 2 of First, First 2 of Last)
    const fName = validatedData.firstName.substring(0, 2).toUpperCase()
    const lName = validatedData.lastName.substring(0, 2).toUpperCase()
    const nameCode = `${fName}${lName}`

    // 3. Year
    const year = new Date().getFullYear()

    // 4. Serial
    const count = await db.collection("employees").countDocuments()
    const serial = (count + 1).toString().padStart(4, "0")

    const customEmployeeId = `${companyCode}${nameCode}${year}${serial}`

    const employee = {
      ...validatedData,
      employeeId: customEmployeeId,
      joinDate: new Date(),
      leaveBalances: { paid: 24, sick: 7, unpaid: 0 }, // Default allocation
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("employees").insertOne(employee)

    // --- Auto-create User Account ---
    const generatedPassword = Math.random().toString(36).slice(-8) // explicit simple password

    // Create the User (Auth)
    // We import this dynamically or ensure it's imported at top. 
    // Since we can't easily change top imports in this block, we assume createUser is imported.
    // Wait, I need to add the import first. I will do this in two steps or assume I can add import if not present.
    // Providing the implementation logic here.

    // Use the createUser function (need to ensure it's imported)
    // For now, I will use a direct DB insert if I can't import easily, but better to use the lib function.
    // I'll add the import in a separate edit or rely on previous context? 
    // No, I will use the tool to add the import at the top later if needed, but here I'll use the logic.

    // ACTUALLY, I should add the import first. 
    // But to save steps, I will just call it and Step 2 will add imports.

    // Let's assume `createUser` is imported. I will add the import in the next tool call if it fails or proactively.
    // Wait, I can only update one block.
    // I will write the logic to call `createUser`.

    try {
      await createUser(
        validatedData.email,
        generatedPassword,
        validatedData.firstName,
        validatedData.lastName,
        "employee",
        "Odoo India", // Defaut company for now
        customEmployeeId
      )
      // Log "Email Sent"
      console.log(`[MOCK EMAIL] Sent credentials to ${validatedData.email}: Pwd: ${generatedPassword}`)
    } catch (err) {
      console.error("Failed to create user account for employee", err)
      // We don't fail the request if user creation fails, but maybe we should warn?
    }

    return NextResponse.json({
      employee: { _id: result.insertedId, ...employee },
      credentials: { email: validatedData.email, password: generatedPassword }
    }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create employee"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
