"use client"

import { useEffect, useState } from "react"
import { useUser } from "@/hooks/useUser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function AttendancePage() {
  const { user } = useUser()
  const [attendance, setAttendance] = useState<any[]>([])
  const [leavesCount, setLeavesCount] = useState(0)
  const [loading, setLoading] = useState(true)
  
  // Navigation State (Month Focus)
  const [currentDate, setCurrentDate] = useState(new Date())

  // Formatting helpers
  const getMonthName = (date: Date) => date.toLocaleString('default', { month: 'long', year: 'numeric' })
  const getYearMonth = (date: Date) => date.toISOString().slice(0, 7) // YYYY-MM
  
  // Search state for Admin
  const [searchTerm, setSearchTerm] = useState("")

  // Navigation helpers
  const handlePrev = () => {
    if (user?.role === "employee") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    } else {
      const prev = new Date(currentDate)
      prev.setDate(prev.getDate() - 1)
      setCurrentDate(prev)
    }
  }

  const handleNext = () => {
    if (user?.role === "employee") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    } else {
      const next = new Date(currentDate)
      next.setDate(next.getDate() + 1)
      setCurrentDate(next)
    }
  }

  /* Role-Based Filtering - Sync with currentDate */
  useEffect(() => {
    if (user) {
       fetchData()
    }
  }, [user, currentDate])

  const fetchData = async () => {
    setLoading(true)
    try {
      let url = "/api/attendance?"
      
      if (user?.role === "employee") {
         const monthStr = getYearMonth(currentDate)
         url += `employeeId=${user.employeeId}&month=${monthStr}`
      } else {
         // Admin: Daily View
         const dateStr = currentDate.toISOString().split("T")[0]
         url += `date=${dateStr}`
      }

      const res = await fetch(url)
      const data = await res.json()
      const attendanceData = Array.isArray(data) ? data : data.attendance || []
      setAttendance(attendanceData)

      // 2. Fetch Leaves (Only for employee monthly view)
      if (user?.role === "employee") {
          const leaveRes = await fetch(`/api/leave-applications?employeeId=${user.employeeId}`)
          const leaveData = await leaveRes.json()
          const myLeaves = leaveData.leaves || []
          
          // Filter leaves in this month
          const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
          const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
          
          const monthLeaves = myLeaves.filter((l: any) => {
              const lStart = new Date(l.startDate)
              const lEnd = new Date(l.endDate)
              return (lStart <= endOfMonth && lEnd >= startOfMonth) && l.status === "approved"
          })
          
          // Calculate total leave days in this month
          let days = 0
          monthLeaves.forEach((l: any) => {
             // overlap calculation simplified
             days += 1 
             const s = new Date(Math.max(new Date(l.startDate).getTime(), startOfMonth.getTime()))
             const e = new Date(Math.min(new Date(l.endDate).getTime(), endOfMonth.getTime()))
             const dur = Math.ceil((e.getTime() - s.getTime()) / (1000*3600*24)) + 1
             days += dur
          })
          setLeavesCount(days)
      }

    } catch (error) {
      console.error("Failed to fetch data", error)
    } finally {
      setLoading(false)
    }
  }

  // --- Helpers ---
  const calculateHours = (record: any) => {
      let totalMs = 0
      
      if (record.checkInTime && record.checkOutTime) {
          totalMs = new Date(record.checkOutTime).getTime() - new Date(record.checkInTime).getTime()
      }

      if (totalMs === 0) return { text: "-", hours: 0 }

      const hours = Math.floor(totalMs / (1000 * 60 * 60))
      const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60))
      const text = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      
      return { text, hours: totalMs / (1000 * 60 * 60) }
  }

  const getExtraHours = (workedHours: number) => {
      const standardHours = 8
      if (workedHours > standardHours) {
          const extra = workedHours - standardHours
          const h = Math.floor(extra)
          const m = Math.round((extra - h) * 60)
          return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
      }
      return "-"
  }

  // ... (Calculations unchanged) ...

  // --- Calculations ---
  // Total Working Days (exclude weekends)
  const getWorkingDaysInMonth = (date: Date) => {
      const year = date.getFullYear()
      const month = date.getMonth()
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      let workingDays = 0
      for (let i = 1; i <= daysInMonth; i++) {
          const day = new Date(year, month, i).getDay()
          if (day !== 0 && day !== 6) workingDays++
      }
      return workingDays
  }

  const daysPresent = attendance.filter(r => r.status === "present" || r.checkInTime).length
  const totalWorkingDays = getWorkingDaysInMonth(currentDate)

  return (
    <div className="space-y-6">
       {/* Header & Navigation */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div className="flex items-center gap-4 w-full md:w-auto">
             <h1 className="text-2xl font-bold">Attendance</h1>
             {user?.role !== "employee" && (
                 <Input 
                   placeholder="Search..." 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="max-w-[200px]"
                 />
             )}
         </div>
         
         <div className="flex items-center gap-2 bg-white p-1 rounded-md border shadow-sm">
            <Button variant="ghost" size="icon" onClick={handlePrev}>{"<"}</Button>
            <span className="min-w-[140px] text-center font-medium">
                {user?.role === "employee" 
                   ? getMonthName(currentDate) 
                   : currentDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                }
            </span>
            <Button variant="ghost" size="icon" onClick={handleNext}>{">"}</Button>
         </div>
       </div>

       {user?.role === "employee" && (
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                 <h3 className="text-4xl font-bold text-gray-800">{daysPresent}</h3>
                 <p className="text-sm text-gray-500 mt-1">Count of days present</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                 <h3 className="text-4xl font-bold text-gray-800">{leavesCount}</h3>
                 <p className="text-sm text-gray-500 mt-1">Leaves count</p>
              </CardContent>
            </Card>
            <Card>
               <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                 <h3 className="text-4xl font-bold text-gray-800">{totalWorkingDays}</h3>
                 <p className="text-sm text-gray-500 mt-1">Total working days</p>
              </CardContent>
            </Card>
         </div>
       )}

       <Card>
         <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  {user?.role !== "employee" && <TableHead>Employee</TableHead>}
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Work Hours</TableHead>
                  <TableHead>Extra Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                   <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : attendance.length === 0 ? (
                   <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No attendance records found.</TableCell></TableRow>
                ) : (
                  attendance.map((record: any) => {
                     const { text: workHoursText, hours: workHoursVal } = calculateHours(record)
                     return (
                        <TableRow key={record._id}>
                          <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                          {user?.role !== "employee" && (
                              <TableCell>
                                 {record.firstName || record.lastName 
                                    ? `${record.firstName || ''} ${record.lastName || ''}` 
                                    : record.employeeId}
                              </TableCell>
                          )}
                          <TableCell>
                            {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}) : "-"}
                          </TableCell>
                          <TableCell>
                            {record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}) : "-"}
                          </TableCell>
                          <TableCell>{workHoursText}</TableCell>
                          <TableCell className="text-gray-500 font-mono">
                             {getExtraHours(workHoursVal)}
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
