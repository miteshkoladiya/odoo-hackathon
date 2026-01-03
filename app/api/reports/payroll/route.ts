import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const searchParams = request.nextUrl.searchParams
    const month = searchParams.get("month")
    const status = searchParams.get("status")

    const query: Record<string, any> = {}
    if (month) query.month = month
    if (status) query.status = status

    const payroll = await db.collection("payroll").find(query).toArray()

    // Calculate statistics
    const stats = {
      totalRecords: payroll.length,
      totalBaseSalary: payroll.reduce((sum, p) => sum + p.baseSalary, 0),
      totalAllowances: payroll.reduce((sum, p) => sum + p.allowances, 0),
      totalDeductions: payroll.reduce((sum, p) => sum + p.deductions, 0),
      totalNetSalary: payroll.reduce((sum, p) => sum + p.netSalary, 0),
      pending: payroll.filter((p) => p.status === "pending").length,
      approved: payroll.filter((p) => p.status === "approved").length,
      paid: payroll.filter((p) => p.status === "paid").length,
    }

    return NextResponse.json({ payroll, stats })
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate payroll report" }, { status: 500 })
  }
}
