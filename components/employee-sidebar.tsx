"use client"

import Link from "next/link"
import { User, Calendar, Clock, LogOut } from "lucide-react"
import { useUser } from "@/hooks/useUser"

const menuItems = [
  { label: "My Profile", href: "/dashboard/employee", icon: User },
  { label: "My Leaves", href: "/dashboard/employee/leaves", icon: Calendar },
  { label: "Attendance", href: "/dashboard/employee/attendance", icon: Clock },
]

export default function EmployeeSidebar() {
  const { logout } = useUser()

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border h-screen flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-foreground">Dayflow</h1>
        <p className="text-xs text-muted-foreground mt-1">Employee Portal</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/20 transition"
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sidebar-foreground hover:bg-destructive/20 transition"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  )
}
