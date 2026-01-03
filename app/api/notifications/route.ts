import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const unreadOnly = searchParams.get("unreadOnly") === "true"

    const query: Record<string, any> = {}
    if (userId) query.userId = userId
    if (unreadOnly) query.read = false

    const notifications = await db.collection("notifications").find(query).sort({ createdAt: -1 }).limit(50).toArray()

    const unreadCount = await db.collection("notifications").countDocuments({ userId, read: false })

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const { notificationId } = await request.json()

    const result = await db.collection("notifications").updateOne(
      { _id: notificationId },
      {
        $set: {
          read: true,
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 })
  }
}
