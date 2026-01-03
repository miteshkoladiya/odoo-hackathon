"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser } from "@/hooks/useUser"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User as UserIcon } from "lucide-react"
import { useEffect, useState } from "react"

export default function Navbar() {
  const pathname = usePathname()
  const { user, logout } = useUser()
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [lastActionTime, setLastActionTime] = useState<Date | null>(null)
  const [loading, setLoading] = useState(false)

  const navItems = [
    { label: "Employees", href: "/dashboard/employees", active: pathname.startsWith("/dashboard/employees") },
    { label: "Attendance", href: "/dashboard/attendance", active: pathname.startsWith("/dashboard/attendance") },
    { label: "Time Off", href: "/dashboard/time-off", active: pathname.startsWith("/dashboard/time-off") },
  ]

  if (user?.role === "admin") {
      navItems.push({ label: "Payroll", href: "/dashboard/payroll", active: pathname.startsWith("/dashboard/payroll") })
  }

  useEffect(() => {
    if (user?.employeeId) {
       checkStatus()
    }
  }, [user])

  const checkStatus = async () => {
     try {
       const today = new Date().toISOString().split("T")[0]
       const res = await fetch(`/api/attendance?employeeId=${user?.employeeId}&date=${today}`)
       const data = await res.json()
       if (data.attendance && data.attendance.length > 0) {
          const record = data.attendance[0] // Get latest for today
          // If checkOutTime is null/undefined, currently checked in
          if (!record.checkOutTime) {
             setIsCheckedIn(true)
             setLastActionTime(new Date(record.checkInTime))
          } else {
             // Checked out
             setIsCheckedIn(false)
             setLastActionTime(null) // Or show last checkout time? Mockup usually resets or shows last info.
          }
       }
     } catch (err) {
       console.error("Failed to check status", err)
     }
  }

  const handleToggle = async () => {
    if (!user?.employeeId) return
    setLoading(true)
    try {
       const res = await fetch("/api/attendance", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           employeeId: user.employeeId,
           checkInTime: new Date(),
           status: "present"
         })
       })
       if (res.ok) {
         // Re-fetch or manually toggle for speed
         await checkStatus()
       }
    } catch (err) {
       console.error(err)
    } finally {
       setLoading(false)
    }
  }

  return (
    <nav className="border-b bg-white h-16 flex items-center px-6 justify-between select-none">
      <div className="flex items-center gap-8">
        {/* Company Logo */}
        <div className="font-bold text-lg flex items-center gap-2">
           <div className="w-8 h-8 bg-purple-100 rounded text-purple-600 flex items-center justify-center text-xs font-bold">
             DL
           </div>
           <span>Dayflow</span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                item.active
                  ? "bg-purple-50 text-purple-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Check In / Out Controls */}
        {user?.role !== "admin" && ( // Assuming Admins don't mark attendance this way or maybe they do? Keeping it open or checking role.
                                     // Actually mockup implies generic "User". Let's show for all logged in with employeeId.
           user?.employeeId && (
             <div className="flex items-center gap-4 border-r pr-4 mr-2">
                 {/* Status Dot */}
                 <div className={`w-3 h-3 rounded-full ${isCheckedIn ? "bg-green-500" : "bg-red-500"}`} />
                 
                 {isCheckedIn ? (
                    <div className="flex flex-col items-end">
                       <span className="text-[10px] text-gray-400">
                          Since {lastActionTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </span>
                       <Button 
                         variant="outline" 
                         size="sm" 
                         className="h-7 text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
                         onClick={handleToggle}
                         disabled={loading}
                       >
                         Check Out -&gt;
                       </Button>
                    </div>
                 ) : (
                    <Button 
                       variant="outline" 
                       size="sm" 
                       className="h-7 text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
                       onClick={handleToggle}
                       disabled={loading}
                    >
                       Check In -&gt;
                    </Button>
                 )}
             </div>
           )
        )}

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar>
                <AvatarImage src="" alt={user?.firstName} />
                <AvatarFallback className="bg-purple-100 text-purple-700">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/employees/me`}>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>My Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
