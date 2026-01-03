"use client"

import { useEffect, useState } from "react"
import { useUser } from "@/hooks/useUser"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Search, MapPin, Mail, Phone, Plane, Circle, Camera } from "lucide-react"
import Link from "next/link"

export default function EmployeesPage() {
  const { user, loading: authLoading } = useUser()
  const router = useRouter()
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (!authLoading && user) {
        if (user.role === "employee") {
            router.replace("/dashboard/employees/me")
        } else {
            fetchEmployees()
        }
    }
  }, [user, authLoading, router])

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees")
      const data = await res.json()
      if (data.employees) {
        setEmployees(data.employees)
      }
    } catch (error) {
      console.error("Failed to fetch employees", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEmployees = employees.filter(emp => 
    emp.firstName.toLowerCase().includes(search.toLowerCase()) ||
    emp.lastName.toLowerCase().includes(search.toLowerCase()) ||
    emp.jobPosition?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header / Filter Bar */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border">
        {user?.role === "admin" && (
          <Link href="/dashboard/employees/new">
            <Button className="bg-purple-200 text-purple-800 hover:bg-purple-300 font-bold px-6">
              NEW
            </Button>
          </Link>
        )}
        
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input 
            placeholder="Search..." 
            className="pl-10 bg-gray-50 border-gray-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Employee Grid */}
      {loading ? (
        <div className="text-center py-10">Loading employees...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => (
            <Link key={employee._id} href={`/dashboard/employees/${employee._id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-transparent hover:border-l-purple-500 relative">
                <div className="absolute top-3 right-3" title={employee.currentStatus === "present" ? "Present" : employee.currentStatus === "onLeave" ? "On Leave" : "Absent"}>
                   {employee.currentStatus === "present" && (
                      <div className="w-3 h-3 rounded-full bg-green-500 border border-white shadow-sm ring-1 ring-green-100"></div>
                   )}
                   {employee.currentStatus === "onLeave" && (
                      <div className="text-blue-500 bg-blue-50 p-1 rounded-full border border-blue-100">
                         <Plane className="w-3 h-3" />
                      </div>
                   )}
                   {(employee.currentStatus === "absent" || !employee.currentStatus) && (
                      <div className="w-3 h-3 rounded-full bg-yellow-400 border border-white shadow-sm ring-1 ring-yellow-100"></div>
                   )}
                </div>
                
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <Avatar className="h-20 w-20 border-2 border-gray-100">
                    <AvatarImage src={employee.photo || `https://api.dicebear.com/7.x/initials/svg?seed=${employee.firstName} ${employee.lastName}`} className="object-cover" />
                    <AvatarFallback>{employee.firstName[0]}{employee.lastName[0]}</AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{employee.firstName} {employee.lastName}</h3>
                    <p className="text-sm text-gray-500 font-medium">{employee.jobPosition || "Employee"}</p>
                  </div>

                  <div className="w-full space-y-2 mt-2 pt-4 border-t border-gray-100 text-sm md:text-xs lg:text-sm text-gray-600">
                    <div className="flex items-center gap-2 justify-center">
                      <Mail className="w-3 h-3" />
                      <span className="truncate max-w-[180px]">{employee.email}</span>
                    </div>
                    {employee.mobile && (
                      <div className="flex items-center gap-2 justify-center">
                        <Phone className="w-3 h-3" />
                        <span>{employee.mobile}</span>
                      </div>
                    )}
                    {employee.department && (
                      <div className="mt-1 inline-block bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">
                        {employee.department}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
