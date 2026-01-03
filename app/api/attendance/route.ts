import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const searchParams = request.nextUrl.searchParams
    const employeeId = searchParams.get("employeeId")
    const dateParam = searchParams.get("date")
    const month = searchParams.get("month")

    const query: Record<string, any> = {}
    if (employeeId) query.employeeId = employeeId

    if (dateParam) {
      const searchDate = new Date(dateParam)
      searchDate.setHours(0, 0, 0, 0)
      query.date = searchDate
    } else if (month) {
      const startDate = new Date(`${month}-01`)
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)
      query.date = { $gte: startDate, $lte: endDate }
    }

    const pipeline = [
      { $match: query },
      { $sort: { date: -1 } },
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
          date: 1,
          checkInTime: 1,
          checkOutTime: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          firstName: "$employee.firstName",
          lastName: "$employee.lastName"
        }
      }
    ]

    const attendance = await db.collection("attendance").aggregate(pipeline).toArray()

    return NextResponse.json({ attendance })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const { employeeId, checkInTime, status } = await request.json()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const existingAttendance = await db.collection("attendance").findOne({ employeeId, date: { $gte: today } })

    if (existingAttendance) {
      await db.collection("attendance").updateOne(
        { _id: existingAttendance._id },
        {
          $set: {
            checkOutTime: checkInTime,
            updatedAt: new Date(),
          },
        },
      )
      return NextResponse.json({ success: true, message: "Check-out recorded" })
    }

    const attendance = {
      employeeId,
      date: new Date(today),
      checkInTime,
      status: status || "present",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.collection("attendance").insertOne(attendance)

    return NextResponse.json({ success: true, message: "Check-in recorded" }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to record attendance" }, { status: 500 })
  }
}
