import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { z } from "zod"

const leaveApplicationSchema = z.object({
  employeeId: z.string(),
  leaveType: z.enum(["sick", "casual", "annual", "unpaid"]),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date))),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date))),
  reason: z.string().min(3, "Reason must be at least 3 characters"),
})

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const searchParams = request.nextUrl.searchParams
    const employeeId = searchParams.get("employeeId")
    const status = searchParams.get("status")

    const query: Record<string, any> = {}
    if (employeeId) query.employeeId = employeeId
    if (status) query.status = status

    const pipeline = [
      { $match: query },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "employees",
          localField: "employeeId",
          foreignField: "employeeId",
          as: "employee"
        }
      },
      {
        $unwind: {
          path: "$employee",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          employeeId: 1,
          leaveType: 1,
          startDate: 1,
          endDate: 1,
          reason: 1,
          status: 1,
          rejectionReason: 1,
          createdAt: 1,
          updatedAt: 1,
          firstName: "$employee.firstName",
          lastName: "$employee.lastName"
        }
      }
    ]

    const leaves = await db.collection("leave_applications").aggregate(pipeline).toArray()

    return NextResponse.json({ leaves })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch leave applications" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const body = await request.json()

    const validatedData = leaveApplicationSchema.parse(body)

    const newStart = new Date(validatedData.startDate)
    const newEnd = new Date(validatedData.endDate)

    // Check for overlapping leaves (excluding rejected)
    const overlap = await db.collection("leave_applications").findOne({
      employeeId: validatedData.employeeId,
      status: { $ne: "rejected" },
      $or: [
        { startDate: { $lte: newEnd }, endDate: { $gte: newStart } }
      ]
    })

    if (overlap) {
      return NextResponse.json({ error: "Leave overlap: You have already applied for leave during this period." }, { status: 400 })
    }

    const leaveApplication = {
      ...validatedData,
      startDate: new Date(validatedData.startDate),
      endDate: new Date(validatedData.endDate),
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("leave_applications").insertOne(leaveApplication)

    return NextResponse.json({ leave: { _id: result.insertedId, ...leaveApplication } }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    const message = error instanceof Error ? error.message : "Failed to create leave application"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

import { ObjectId } from "mongodb"

export async function PUT(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const { id, status, rejectionReason } = await request.json()

    if (!id || !["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status or ID" }, { status: 400 })
    }

    const leave = await db.collection("leave_applications").findOne({ _id: new ObjectId(id) })
    if (!leave) {
      return NextResponse.json({ error: "Leave application not found" }, { status: 404 })
    }

    // Process Balance Deduction if being approved (and not already approved)
    if (status === "approved" && leave.status !== "approved") {
      const start = new Date(leave.startDate)
      const end = new Date(leave.endDate)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

      // Check and Initialize Balances if missing
      const employee = await db.collection("employees").findOne({ employeeId: leave.employeeId })

      if (employee) {
        if (!employee.leaveBalances) {
          await db.collection("employees").updateOne(
            { employeeId: leave.employeeId },
            { $set: { leaveBalances: { paid: 24, sick: 7 } } }
          )
        }

        let balanceField = ""
        if (leave.leaveType === "annual") balanceField = "leaveBalances.paid"
        else if (leave.leaveType === "sick") balanceField = "leaveBalances.sick"

        if (balanceField) {
          await db.collection("employees").updateOne(
            { employeeId: leave.employeeId },
            { $inc: { [balanceField]: -days } }
          )
        }
      }
    }

    const updateData: any = {
      status,
      updatedAt: new Date(),
    }

    if (status === "rejected" && rejectionReason) {
      updateData.rejectionReason = rejectionReason
    }

    const result = await db.collection("leave_applications").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    // Check if result.matchedCount checked above by finding first, but keep robust
    if (result.matchedCount === 0) {
      // Should rely on first find, but ok
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update Error", error)
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 })
  }
}
