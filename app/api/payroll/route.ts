import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const searchParams = request.nextUrl.searchParams
    const employeeId = searchParams.get("employeeId")
    const month = searchParams.get("month")

    const query: Record<string, any> = {}
    if (employeeId) query.employeeId = employeeId // Note: this is string ID, not ObjectId usually in my schema unless refactored. I'll stick to string ID if that's what I used. 
    // Actually, employeeId in payroll usually refers to the Custom ID (OI...) or _id. I need to be consistent. 
    // In my previous steps, I used _id for links. Let's assume we store the _id string in payroll.employeeId.

    if (month) query.month = month

    // Join with Employees to get Name
    const payslips = await db.collection("payroll").aggregate([
      { $match: query },
      {
        $addFields: {
          // Convert employeeId to ObjectId for lookup if it's stored as string of ObjectId
          // If stored as custom ID, we match on employeeId field.
          // Let's assume we store the _id as string. 
          employeeObjId: { $toObjectId: "$employeeId" }
        }
      },
      {
        $lookup: {
          from: "employees",
          localField: "employeeObjId",
          foreignField: "_id",
          as: "employee"
        }
      },
      { $unwind: "$employee" },
      {
        $project: {
          month: 1,
          netSalary: 1,
          status: 1,
          employeeId: 1,
          employeeName: { $concat: ["$employee.firstName", " ", "$employee.lastName"] },
          createdAt: 1
        }
      },
      { $sort: { month: -1, createdAt: -1 } }
    ]).toArray()

    return NextResponse.json({ payslips })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch payroll" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const { month, employeeIds } = await request.json()

    if (!month || !employeeIds || !Array.isArray(employeeIds)) {
      return NextResponse.json({ error: "Invalid Request" }, { status: 400 })
    }

    const processed = []

    // Fetch all employees to process
    // Convert IDs to ObjectIds
    const objectIds = employeeIds.map((id: string) => new ObjectId(id))
    const employees = await db.collection("employees").find({ _id: { $in: objectIds } }).toArray()

    const alreadyProcessed = await db.collection("payroll").find({
      month,
      employeeId: { $in: employeeIds }
    }).toArray()
    const processedMap = new Set(alreadyProcessed.map(p => p.employeeId))

    for (const emp of employees) {
      if (processedMap.has(emp._id.toString())) continue;

      // Calculate Salary
      const wage = emp.salaryInfo?.monthWage || 50000 // Default if missing

      const basic = wage * 0.50
      const hra = basic * 0.50
      const standardAllowance = 4167
      const performanceBonus = wage * 0.0833
      const lta = basic * 0.0833
      const specialAllowance = wage - (basic + hra + standardAllowance + performanceBonus + lta)

      const gross = wage // Should equal sum of above, roughly

      const pfEmployee = basic * 0.12
      const professionalTax = 200
      const totalDeductions = pfEmployee + professionalTax

      const netSalary = gross - totalDeductions

      const payslip = {
        employeeId: emp._id.toString(), // Store Reference
        month,
        basic,
        hra,
        allowances: standardAllowance + performanceBonus + lta + (specialAllowance > 0 ? specialAllowance : 0),
        deductions: totalDeductions,
        netSalary: Math.round(netSalary), // Round for cleanliness
        status: "paid", // Auto-mark paid for this mock wizard
        createdAt: new Date()
      }

      processed.push(payslip)
    }

    if (processed.length > 0) {
      await db.collection("payroll").insertMany(processed)
    }

    return NextResponse.json({ success: true, count: processed.length })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to process payroll" }, { status: 500 })
  }
}
