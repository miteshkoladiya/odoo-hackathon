import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { z } from "zod"

const payrollSchema = z.object({
  employeeId: z.string(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  baseSalary: z.number().positive(),
  allowances: z.number().default(0),
  deductions: z.number().default(0),
})

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const searchParams = request.nextUrl.searchParams
    const employeeId = searchParams.get("employeeId")
    const month = searchParams.get("month")
    const status = searchParams.get("status")

    const query: Record<string, any> = {}
    if (employeeId) query.employeeId = employeeId
    if (month) query.month = month
    if (status) query.status = status

    const payroll = await db.collection("payroll").find(query).sort({ month: -1 }).toArray()

    return NextResponse.json({ payroll })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch payroll" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const body = await request.json()

    const validatedData = payrollSchema.parse(body)

    const netSalary = validatedData.baseSalary + validatedData.allowances - validatedData.deductions

    const payroll = {
      ...validatedData,
      netSalary,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("payroll").insertOne(payroll)

    // Create notification
    await db.collection("notifications").insertOne({
      userId: validatedData.employeeId,
      type: "payroll",
      title: `Payroll processed for ${validatedData.month}`,
      message: `Your salary for ${validatedData.month} has been processed. Amount: $${netSalary.toFixed(2)}`,
      read: false,
      createdAt: new Date(),
    })

    return NextResponse.json({ payroll: { _id: result.insertedId, ...payroll } }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process payroll"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const { payrollId, status } = await request.json()

    const result = await db.collection("payroll").updateOne(
      { _id: payrollId },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Payroll record not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update payroll" }, { status: 500 })
  }
}
