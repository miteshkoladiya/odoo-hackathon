import { type NextRequest, NextResponse } from "next/server"
import { createUser } from "@/lib/auth"
import { z } from "zod"

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  role: z.enum(["admin", "hr", "employee"]),
  companyName: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validatedData = registerSchema.parse(body)

    const user = await createUser(
      validatedData.email,
      validatedData.password,
      validatedData.firstName,
      validatedData.lastName,
      validatedData.role,
      validatedData.companyName,
    )

    // TODO: Send verification email with token
    // For now, return the token (in production, send via email)

    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully. Please check your email to verify.",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          employeeId: user.employeeId,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
