import { type NextRequest, NextResponse } from "next/server"
import { verifyEmail } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: "Verification token is required" }, { status: 400 })
    }

    const result = await verifyEmail(token)

    return NextResponse.json(
      {
        success: true,
        message: "Email verified successfully",
        email: result.email,
      },
      { status: 200 },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email verification failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
