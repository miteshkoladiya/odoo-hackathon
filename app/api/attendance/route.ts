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
          sessions: 1,
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
    const { employeeId, status } = await request.json()

    const now = new Date()
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)

    const existingAttendance = await db.collection("attendance").findOne({ employeeId, date: { $gte: today } })

    if (existingAttendance) {
      if (existingAttendance.checkOutTime) {
        return NextResponse.json({ error: "You have already checked out for today." }, { status: 400 })
      }

      await db.collection("attendance").updateOne(
        { _id: existingAttendance._id },
        {
          $set: {
            checkOutTime: now,
            updatedAt: now,
          },
        },
      )
      return NextResponse.json({ success: true, message: "Check-out recorded", checkedOut: true })
    }

    const attendance = {
      employeeId,
      date: today,
      checkInTime: now,
      checkOutTime: null,
      status: status || "present",
      createdAt: now,
      updatedAt: now,
    }

    await db.collection("attendance").insertOne(attendance)

    return NextResponse.json({ success: true, message: "Check-in recorded", checkedOut: false }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to record attendance" }, { status: 500 })
  }
}
