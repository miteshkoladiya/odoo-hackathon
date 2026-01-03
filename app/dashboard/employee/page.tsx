"use client"
import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle, Clock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useUser } from "@/hooks/useUser"

export default function EmployeeProfile() {
  const { user, loading: userLoading } = useUser()
  const [employee, setEmployee] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [checkInTime, setCheckInTime] = useState("")
  const [checkedIn, setCheckedIn] = useState(false)
  const [stats, setStats] = useState({ present: 0, absent: 0, leaves: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      // 1. Fetch detailed employee profile
      // Note: We search by email since that's what we have in the user object
      // Ideally we should link via an ID, but search works for now
      const empResponse = await fetch(`/api/employees?search=${user?.email}`)
      const empData = await empResponse.json()

      // If we find an employee record associated with this user
      if (empData.employees && empData.employees.length > 0) {
        // Filter strictly by email to avoid loose string matches
        const myProfile = empData.employees.find((e: any) => e.email === user?.email)
        if (myProfile) {
          setEmployee(myProfile)
          
          // 2. Fetch Attendance for today
          const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
          // We can just fetch all attendance for this employee and filter locally or ask api
          // The current API allows filtering by month, let's just get everything for this employee for now to count stats
          const attResponse = await fetch(`/api/attendance?employeeId=${myProfile.employeeId}`)
          const attData = await attResponse.json()
          
          if (attData.attendance) {
            // Check for today's check-in
            const todayRecord = attData.attendance.find((a: any) => a.date.startsWith(today))
            if (todayRecord) {
              setCheckInTime(todayRecord.checkInTime)
              setCheckedIn(true)
            }

            // Calculate stats
            const presentCount = attData.attendance.filter((a: any) => a.status === "present").length
            const absentCount = attData.attendance.filter((a: any) => a.status === "absent").length
            setStats(prev => ({ ...prev, present: presentCount, absent: absentCount }))
          }
          
          // 3. Fetch Leaves
          const leaveResponse = await fetch(`/api/leave-applications?employeeId=${myProfile.employeeId}`)
          const leaveData = await leaveResponse.json()
          if (leaveData.leaves) {
             setStats(prev => ({ ...prev, leaves: leaveData.leaves.length }))
          }
        }
      } else {
        // No employee profile found yet (maybe just registered?)
        // Pre-fill from user data
        setEmployee({
          firstName: user?.firstName,
          lastName: user?.lastName,
          email: user?.email,
          employeeId: user?.employeeId,
          // Defaults
          department: "Not Assigned",
          position: "New Hire",
          phone: "",
          address: "",
          salary: 0
        })
      }
    } catch (error) {
      console.error("Failed to fetch data", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    if (!employee || !employee.employeeId) {
        alert("Employee profile not fully set up. Please contact HR.")
        return
    }

    const now = new Date().toLocaleTimeString()
    
    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: employee.employeeId,
          checkInTime: now,
          status: "present",
        }),
      })

      if (response.ok) {
        setCheckInTime(now)
        setCheckedIn(true)
        // Refresh API data
        fetchData()
      }
    } catch (error) {
      console.error("Check-in failed:", error)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    // Logic to update profile would go here (e.g. POST /api/employees with updates)
    setIsEditing(false)
  }

  if (userLoading || loading) return <div className="p-8">Loading...</div>
  if (!user) return <div className="p-8">Please log in first.</div>

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your personal information</p>
        </div>
        <Button onClick={() => setIsEditing(!isEditing)}>{isEditing ? "Cancel" : "Edit Profile"}</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">First Name</label>
                  <Input value={employee?.firstName || ""} disabled className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                  <Input value={employee?.lastName || ""} disabled className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <Input type="email" value={employee?.email || ""} disabled className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <Input value={employee?.phone || "N/A"} disabled={!isEditing} className="mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Employment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Employee ID</label>
                  <Input value={employee?.employeeId || ""} disabled className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Department</label>
                  <Input value={employee?.department || ""} disabled className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Position</label>
                  <Input value={employee?.position || ""} disabled className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Salary</label>
                  <Input value={`$${(employee?.salary || 0).toLocaleString()}`} disabled className="mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Daily Check-in
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {checkedIn ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">Checked in at {checkInTime}</AlertDescription>
                </Alert>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">Check in to mark your attendance for the day</p>
                  <Button onClick={handleCheckIn} className="w-full">
                    Check In
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-sm text-muted-foreground">Present Days</span>
                <span className="font-semibold">{stats.present}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-sm text-muted-foreground">Absent Days</span>
                <span className="font-semibold">{stats.absent}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Leaves Applied</span>
                <span className="font-semibold">{stats.leaves}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
