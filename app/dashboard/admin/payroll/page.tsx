"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Download } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function PayrollPage() {
  const [payroll, setPayroll] = useState<any[]>([])
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    employeeId: "",
    baseSalary: "",
    allowances: "0",
    deductions: "0",
  })

  useEffect(() => {
    fetchPayroll()
  }, [month])

  const fetchPayroll = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/payroll?month=${month}`)
      const data = await response.json()
      setPayroll(data.payroll || [])
    } catch (error) {
      console.error("Failed to fetch payroll:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          month,
          baseSalary: Number.parseFloat(formData.baseSalary),
          allowances: Number.parseFloat(formData.allowances),
          deductions: Number.parseFloat(formData.deductions),
        }),
      })

      if (response.ok) {
        setIsDialogOpen(false)
        setFormData({ employeeId: "", baseSalary: "", allowances: "0", deductions: "0" })
        fetchPayroll()
      }
    } catch (error) {
      console.error("Failed to process payroll:", error)
    }
  }

  const stats = {
    totalBaseSalary: payroll.reduce((sum, p) => sum + p.baseSalary, 0),
    totalAllowances: payroll.reduce((sum, p) => sum + p.allowances, 0),
    totalDeductions: payroll.reduce((sum, p) => sum + p.deductions, 0),
    totalNetSalary: payroll.reduce((sum, p) => sum + p.netSalary, 0),
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payroll Management</h1>
          <p className="text-muted-foreground mt-1">Process and manage employee salaries</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Process Payroll
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Payroll</DialogTitle>
              <DialogDescription>Add new payroll entry for an employee</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Employee ID</label>
                <Input
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  placeholder="EMP-001"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Base Salary</label>
                <Input
                  type="number"
                  value={formData.baseSalary}
                  onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                  placeholder="50000"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Allowances</label>
                <Input
                  type="number"
                  value={formData.allowances}
                  onChange={(e) => setFormData({ ...formData, allowances: e.target.value })}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Deductions</label>
                <Input
                  type="number"
                  value={formData.deductions}
                  onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full">
                Process Payroll
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Base Salary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalBaseSalary.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Allowances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${stats.totalAllowances.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Deductions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${stats.totalDeductions.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Net Salary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">${stats.totalNetSalary.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payroll Records</CardTitle>
            <div className="flex items-center gap-4">
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
              <Button variant="outline" className="gap-2 bg-transparent">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Base Salary</TableHead>
                <TableHead>Allowances</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Salary</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Loading payroll...
                  </TableCell>
                </TableRow>
              ) : payroll.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No payroll records for this month
                  </TableCell>
                </TableRow>
              ) : (
                payroll.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell className="font-medium">{record.employeeId}</TableCell>
                    <TableCell>${record.baseSalary.toLocaleString()}</TableCell>
                    <TableCell className="text-green-600">${record.allowances.toLocaleString()}</TableCell>
                    <TableCell className="text-red-600">${record.deductions.toLocaleString()}</TableCell>
                    <TableCell className="font-medium">${record.netSalary.toLocaleString()}</TableCell>
                    <TableCell>
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${
                          record.status === "paid"
                            ? "bg-green-100 text-green-800"
                            : record.status === "approved"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
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
