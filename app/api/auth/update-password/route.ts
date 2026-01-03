import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { hashPassword, verifyPassword } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
    try {
        const { userId, currentPassword, newPassword } = await request.json()

        if (!userId || !currentPassword || !newPassword) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const { db } = await connectToDatabase()

        // Find user
        const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Verify current password
        const isValid = await verifyPassword(currentPassword, user.password)
        if (!isValid) {
            return NextResponse.json({ error: "Incorrect current password" }, { status: 401 })
        }

        // Hash new password
        const hashedNewPassword = await hashPassword(newPassword)

        // Update in DB
        await db.collection("users").updateOne(
            { _id: user._id },
            { $set: { password: hashedNewPassword, updatedAt: new Date() } }
        )

        return NextResponse.json({ success: true, message: "Password updated successfully" })
    } catch (error) {
        console.error("Password update error:", error)
        return NextResponse.json({ error: "Failed to update password" }, { status: 500 })
    }
}
