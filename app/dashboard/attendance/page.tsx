"use client"

import { useEffect, useState } from "react"
import { useUser } from "@/hooks/useUser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export default function AttendancePage() {
  const { user } = useUser()
  const [attendance, setAttendance] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  /* Role-Based Filtering State */
  const today = new Date().toISOString().split("T")[0]
  const currentMonth = today.slice(0, 7) // YYYY-MM

  const [dateFilter, setDateFilter] = useState(today)
  const [monthFilter, setMonthFilter] = useState(currentMonth)

  useEffect(() => {
    if (user) {
       fetchAttendance()
    }
  }, [user, dateFilter, monthFilter])

  const fetchAttendance = async () => {
    try {
      let url = "/api/attendance?"
      
      if (user?.role === "employee") {
         // Employee: Filter by Own ID + Month
         url += `employeeId=${user.employeeId}&month=${monthFilter}`
      } else {
         // Admin/HR: Filter by Date (All Employees)
         // Note: Logic allows seeing all if no date, but requirement says "present on current day"
         url += `date=${dateFilter}`
      }
      
      const res = await fetch(url)
      const data = await res.json()
      
      if (Array.isArray(data)) {
          setAttendance(data)
      } else if (data.attendance) {
          setAttendance(data.attendance)
      }
    } catch (error) {
      console.error("Failed to fetch attendance", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
         <h1 className="text-2xl font-bold">Attendance</h1>
         <div className="flex gap-2">
            {/* Filter Control based on Role */}
            {user?.role === "employee" ? (
               <Input 
                 type="month" 
                 className="w-[180px]" 
                 value={monthFilter}
                 onChange={(e) => setMonthFilter(e.target.value)}
               />
            ) : (
               <Input 
                 type="date" 
                 className="w-[180px]" 
                 value={dateFilter}
                 onChange={(e) => setDateFilter(e.target.value)}
               />
            )}
         </div>
       </div>

       <Card>
         <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                   <TableRow>
                     <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                   </TableRow>
                ) : attendance.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={6} className="text-center py-8 text-gray-500">No attendance records found.</TableCell>
                   </TableRow>
                ) : (
                  attendance.map((record: any) => (
                    <TableRow key={record._id}>
                      <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                         {record.firstName || record.lastName 
                            ? `${record.firstName || ''} ${record.lastName || ''}` 
                            : record.employeeId}
                      </TableCell>
                      <TableCell>
                        {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "-"}
                      </TableCell>
                      <TableCell>
                        {record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "-"}
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                         <Badge variant="outline" className={record.status === "present" ? "text-green-600 border-green-200 bg-green-50" : "text-yellow-600"}>
                           {record.status}
                         </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
         </CardContent>
       </Card>
    </div>
  )
}
