import type React from "react"
import EmployeeSidebar from "@/components/employee-sidebar"

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      <EmployeeSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
