"use client"
import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, CheckSquare, FileText, BarChart3 } from "lucide-react"
import { useEffect, useState } from "react"
import type { LucideIcon } from "lucide-react"

type Activity = {
  id: string
  title: string
  description: string
  type: "approval" | "onboarding" | "payroll"
  date: string
  statusLabel: string
  statusColor: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    pendingApprovals: 0,
    activeLeaves: 0,
    payrollProcessed: 0,
  })
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // 1. Fetch Employees
      const empRes = await fetch("/api/employees")
      const empData = await empRes.json()
      const employeeCount = empData.employees?.length || 0

      // 2. Fetch Leaves (Pending & Approved)
      const leaveRes = await fetch("/api/leave-applications")
      const leaveData = await leaveRes.json()
      const leaves = leaveData.leaves || []
      
      const pendingCount = leaves.filter((l: any) => l.status === "pending").length
      // Assuming "active" means approved leaves that are current (or just all approved for now)
      const activeCount = leaves.filter((l: any) => l.status === "approved").length

      // 3. Fetch Payroll
      const payrollRes = await fetch("/api/payroll")
      const payrollData = await payrollRes.json()
      const payrollCount = payrollData.payroll?.length || 0

      setStats({
        totalEmployees: employeeCount,
        pendingApprovals: pendingCount,
        activeLeaves: activeCount,
        payrollProcessed: payrollCount,
      })

      // 4. Build Recent Activities Feed
      const newActivities: Activity[] = []

      // Add recent leaves
      leaves.slice(0, 3).forEach((l: any) => {
         newActivities.push({
           id: l._id,
           title: "Leave Request " + (l.status === 'pending' ? 'Received' : l.status),
           description: `Employee ID: ${l.employeeId}`,
           type: "approval",
           date: new Date(l.createdAt).toLocaleDateString(),
           statusLabel: l.status,
           statusColor: l.status === 'approved' ? 'bg-green-100 text-green-800' : l.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
         })
      })

      // Add recent employees
      empData.employees?.slice(0, 3).forEach((e: any) => {
        newActivities.push({
          id: e._id,
          title: "New Employee Onboarded",
          description: `${e.firstName} ${e.lastName}`,
          type: "onboarding",
          date: new Date(e.createdAt).toLocaleDateString(),
          statusLabel: "Onboarded",
          statusColor: "bg-blue-100 text-blue-800"
        })
      })

      // Sort by date (newest first)
      newActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      
      setActivities(newActivities.slice(0, 5)) // Show top 5

    } catch (error) {
      console.error("Failed to fetch admin stats", error)
    } finally {
      setLoading(false)
    }
  }

  const statCards: { label: string; value: number; icon: LucideIcon; color: string }[] = [
    { label: "Total Employees", value: stats.totalEmployees, icon: Users, color: "bg-blue-100" },
    { label: "Pending Approvals", value: stats.pendingApprovals, icon: CheckSquare, color: "bg-yellow-100" },
    { label: "Active Leaves", value: stats.activeLeaves, icon: FileText, color: "bg-green-100" },
    { label: "Payroll Processed", value: stats.payrollProcessed, icon: BarChart3, color: "bg-purple-100" },
  ]
  

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's your HR overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                  <div className={`${stat.color} p-2 rounded-lg`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>Latest updates in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.length === 0 ? (
               <p className="text-sm text-muted-foreground">No recent activities found.</p>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">{activity.description} - {activity.date}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full ${activity.statusColor}`}>
                    {activity.statusLabel}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
