import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const searchParams = request.nextUrl.searchParams
    const approverId = searchParams.get("approverId")
    const status = searchParams.get("status")

    const query: Record<string, any> = {}
    if (approverId) query.approverId = approverId
    if (status) query.status = status

    const approvals = await db.collection("approvals").find(query).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({ approvals })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch approvals" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const { requestId, requestType, employeeId, approverId, action, comments } = await request.json()

    // Get the original request
    const originalRequest = await db
      .collection(requestType === "leave" ? "leave_applications" : "approvals")
      .findOne({ _id: new ObjectId(requestId) })

    if (!originalRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    // Create approval record
    const approval = {
      requestId: new ObjectId(requestId),
      requestType,
      employeeId,
      approverId,
      status: action,
      comments,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("approvals").insertOne(approval)

    // Update original request status
    await db.collection(requestType === "leave" ? "leave_applications" : "approvals").updateOne(
      { _id: new ObjectId(requestId) },
      {
        $set: {
          status: action,
          approverId,
          approvalDate: new Date(),
          comments,
          updatedAt: new Date(),
        },
      },
    )

    // Create notification for employee
    await db.collection("notifications").insertOne({
      userId: employeeId,
      type: action === "approved" ? "leave_approved" : "rejection",
      title: `Your ${requestType} request has been ${action}`,
      message: `Your ${requestType} request has been ${action}${comments ? `. Comment: ${comments}` : ""}`,
      read: false,
      createdAt: new Date(),
    })

    return NextResponse.json({ approval: { _id: result.insertedId, ...approval } }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process approval"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
