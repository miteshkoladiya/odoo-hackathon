"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ReportsPage() {
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7))

  const handleExport = (reportType: string) => {
    // TODO: Implement CSV/PDF export functionality
    alert(`Exporting ${reportType} report for ${reportMonth}`)
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">View and export HR reports</p>
      </div>

      <Tabs defaultValue="attendance" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
            <TabsTrigger value="leaves">Leaves</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-4">
            <Select value={reportMonth} onValueChange={setReportMonth}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date(new Date().getFullYear(), i, 1)
                  const value = date.toISOString().slice(0, 7)
                  return (
                    <SelectItem key={value} value={value}>
                      {date.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        <TabsContent value="attendance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,240</div>
                <p className="text-xs text-muted-foreground mt-1">20 employees</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Present</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">1,180</div>
                <p className="text-xs text-muted-foreground mt-1">95.2%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Absent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">30</div>
                <p className="text-xs text-muted-foreground mt-1">2.4%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Late</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">30</div>
                <p className="text-xs text-muted-foreground mt-1">2.4%</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Attendance Summary by Department</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {["Engineering", "HR", "Sales", "Operations"].map((dept) => (
                  <div key={dept} className="flex items-center justify-between py-3 border-b last:border-b-0">
                    <div>
                      <p className="font-medium text-sm">{dept}</p>
                      <p className="text-xs text-muted-foreground">5 employees</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">95%</p>
                      <div className="h-2 w-24 bg-muted rounded-full mt-1">
                        <div className="h-full bg-green-600 rounded-full" style={{ width: "95%" }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Base Salary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$1,250,000</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Allowances</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">$125,000</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Deductions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">$50,000</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Net Payroll</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">$1,325,000</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Payroll Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { status: "Pending", count: 3, color: "bg-yellow-100" },
                  { status: "Approved", count: 12, color: "bg-blue-100" },
                  { status: "Paid", count: 5, color: "bg-green-100" },
                ].map((item) => (
                  <div key={item.status} className="flex items-center justify-between py-3 border-b last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${item.color}`}></div>
                      <p className="font-medium text-sm">{item.status}</p>
                    </div>
                    <p className="font-medium">{item.count} records</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaves" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">38</div>
                <p className="text-xs text-muted-foreground mt-1">84.4%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">5</div>
                <p className="text-xs text-muted-foreground mt-1">11.1%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">2</div>
                <p className="text-xs text-muted-foreground mt-1">4.4%</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Leave Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { type: "Annual Leave", count: 20 },
                  { type: "Sick Leave", count: 12 },
                  { type: "Casual Leave", count: 10 },
                  { type: "Unpaid Leave", count: 3 },
                ].map((item) => (
                  <div key={item.type} className="flex items-center justify-between py-3 border-b last:border-b-0">
                    <p className="font-medium text-sm">{item.type}</p>
                    <p className="font-medium">{item.count} days</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
