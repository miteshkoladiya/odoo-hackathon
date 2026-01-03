"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, CheckCircle, XCircle, Clock } from "lucide-react"

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<any[]>([])
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))

  useEffect(() => {
    fetchAttendance()
  }, [month])

  const fetchAttendance = async () => {
    try {
      // TODO: Use actual employee ID from session
      const response = await fetch(`/api/attendance?employeeId=EMP-001&month=${month}`)
      const data = await response.json()
      setAttendance(data.attendance || [])
    } catch (error) {
      console.error("Failed to fetch attendance:", error)
    }
  }

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      present: <CheckCircle className="w-5 h-5 text-green-600" />,
      absent: <XCircle className="w-5 h-5 text-red-600" />,
      late: <Clock className="w-5 h-5 text-yellow-600" />,
      leave: <Calendar className="w-5 h-5 text-blue-600" />,
    }
    return icons[status] || icons.absent
  }

  const stats = {
    present: attendance.filter((a) => a.status === "present").length,
    absent: attendance.filter((a) => a.status === "absent").length,
    late: attendance.filter((a) => a.status === "late").length,
    onLeave: attendance.filter((a) => a.status === "leave").length,
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Attendance</h1>
        <p className="text-muted-foreground mt-1">View your attendance records</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Present</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.present}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Absent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.absent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Late</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.late}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">On Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.onLeave}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Attendance Records</CardTitle>
            <Select value={month} onValueChange={setMonth}>
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
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No attendance records for this month
                  </TableCell>
                </TableRow>
              ) : (
                attendance.map((record) => {
                  const date = new Date(record.date)
                  return (
                    <TableRow key={record._id}>
                      <TableCell>{date.toLocaleDateString()}</TableCell>
                      <TableCell className="capitalize">
                        {date.toLocaleDateString("en-US", { weekday: "short" })}
                      </TableCell>
                      <TableCell>{record.checkInTime || "-"}</TableCell>
                      <TableCell>{record.checkOutTime || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(record.status)}
                          <span className="capitalize">{record.status}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
