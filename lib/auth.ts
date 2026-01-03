import bcrypt from "bcryptjs"
import { connectToDatabase } from "./mongodb"
import crypto from "crypto"

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function generateEmailVerificationToken(): Promise<string> {
  return crypto.randomBytes(32).toString("hex")
}

export async function createUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: "admin" | "hr" | "employee",
  companyName?: string,
  customEmployeeId?: string,
) {
  const { db } = await connectToDatabase()

  // Check if user already exists
  const existingUser = await db.collection("users").findOne({ email })
  if (existingUser) {
    throw new Error("User with this email already exists")
  }

  const hashedPassword = await hashPassword(password)
  const verificationToken = await generateEmailVerificationToken()
  const employeeId = customEmployeeId || `EMP-${Date.now()}`

  const user = {
    email,
    password: hashedPassword,
    firstName,
    lastName,
    role,
    employeeId,
    companyName,
    isEmailVerified: true,
    emailVerificationToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await db.collection("users").insertOne(user)

  return {
    id: result.insertedId.toString(),
    email,
    firstName,
    lastName,
    role,
    employeeId,
    verificationToken: null,
  }
}

export async function verifyEmail(token: string) {
  const { db } = await connectToDatabase()

  const user = await db.collection("users").findOne({ emailVerificationToken: token })

  if (!user) {
    throw new Error("Invalid or expired verification token")
  }

  const result = await db.collection("users").updateOne(
    { _id: user._id },
    {
      $set: {
        isEmailVerified: true,
        emailVerificationToken: null,
        updatedAt: new Date(),
      },
    },
  )

  if (result.matchedCount === 0) {
    throw new Error("Could not verify email")
  }

  return { success: true, email: user.email }
}

export async function findUserByEmail(email: string) {
  const { db } = await connectToDatabase()
  return db.collection("users").findOne({ email })
}

export async function authenticateUser(email: string, password: string) {
  const user = await findUserByEmail(email)

  if (!user) {
    throw new Error("Invalid email or password")
  }

  // Email verification check removed
  // if (!user.isEmailVerified) {
  //   throw new Error("Please verify your email before logging in")
  // }

  const isPasswordValid = await verifyPassword(password, user.password)
  if (!isPasswordValid) {
    throw new Error("Invalid email or password")
  }

  return {
    id: user._id.toString(),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    employeeId: user.employeeId,
  }
}
