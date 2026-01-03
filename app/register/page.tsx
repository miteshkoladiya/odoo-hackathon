"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Upload } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    companyName: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "admin", // Default to admin for this "Company Registration" flow
  })
  const [error, setError] = useState("")
  // const [success, setSuccess] = useState(false) // Not needed due to auto-login
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)

    try {
      // Split name into first/last for backend compatibility
      const nameParts = formData.name.split(" ")
      const firstName = nameParts[0] || "Admin"
      const lastName = nameParts.slice(1).join(" ") || "User"

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: firstName,
          lastName: lastName,
          role: "admin", // Force admin role for this flow
          companyName: formData.companyName,
          phone: formData.phone
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Registration failed")
        return
      }

      // Auto login after successful registration
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      if (loginResponse.ok) {
        const loginData = await loginResponse.json()
        localStorage.setItem("dayflow_user", JSON.stringify(loginData.user))
        window.location.href = "/dashboard/employees"
      } else {
        window.location.href = "/"
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg bg-white shadow-lg border-0">
         <div className="flex justify-center pt-8 pb-4">
          <Image 
            src="/logo.png" 
            alt="Dayflow Logo" 
            width={180} 
            height={60} 
            className="object-contain"
          />
        </div>

        <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Company Name :-</label>
                <div className="flex gap-2">
                  <Input 
                    name="companyName" 
                    value={formData.companyName} 
                    onChange={handleChange} 
                    className="rounded-full border-gray-300 focus:ring-purple-500"
                  />
                  <Button type="button" size="icon" className="rounded-full bg-blue-500 hover:bg-blue-600 shrink-0">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Name :-</label>
                <Input 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required 
                  className="rounded-full border-gray-300 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email :-</label>
                <Input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                  className="rounded-full border-gray-300 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Phone :-</label>
                <Input 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  className="rounded-full border-gray-300 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Password :-</label>
                <Input 
                  type="password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  required 
                  className="rounded-full border-gray-300 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Confirm Password :-</label>
                <Input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="rounded-full border-gray-300 focus:ring-purple-500"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-[#E087FF] hover:bg-[#d060f5] text-white font-bold py-2 rounded-full uppercase tracking-wider mt-4" 
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Sign Up"}
              </Button>

              <div className="text-center text-sm text-gray-500">
                Already have an account?{" "}
                <Link href="/" className="text-gray-700 font-medium hover:underline">
                  Sign In
                </Link>
              </div>
            </form>
        </CardContent>
      </Card>
    </div>
  )
}
