import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const searchParams = request.nextUrl.searchParams
    const month = searchParams.get("month")
    const department = searchParams.get("department")

    const query: Record<string, any> = {}

    if (month) {
      const startDate = new Date(`${month}-01`)
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)
      query.date = { $gte: startDate, $lte: endDate }
    }

    if (department) {
      // Get employees in the department
      const employees = await db.collection("employees").find({ department }).toArray()
      const employeeIds = employees.map((e) => e.employeeId || e._id.toString())
      query.employeeId = { $in: employeeIds }
    }

    const attendance = await db.collection("attendance").find(query).toArray()

    // Calculate statistics
    const stats = {
      totalRecords: attendance.length,
      present: attendance.filter((a) => a.status === "present").length,
      absent: attendance.filter((a) => a.status === "absent").length,
      late: attendance.filter((a) => a.status === "late").length,
      onLeave: attendance.filter((a) => a.status === "leave").length,
    }

    return NextResponse.json({ attendance, stats })
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate attendance report" }, { status: 500 })
  }
}
