"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/hooks/useUser"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Check, CheckCircle2, ChevronRight, DollarSign, FileText, Loader2, Play } from "lucide-react"

export default function PayrollPage() {
  const { user, loading: authLoading } = useUser()
  const [payslips, setPayslips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState(1) // 1: Select Month, 2: Review, 3: Processing, 4: Done
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM
  const [eligibleEmployees, setEligibleEmployees] = useState<any[]>([])
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (!authLoading && user?.role === "admin") {
      fetchPayslips()
    }
  }, [user, authLoading])

  const fetchPayslips = async () => {
    try {
      const res = await fetch("/api/payroll")
      const data = await res.json()
      if (data.payslips) setPayslips(data.payslips)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleStartWizard = async () => {
     setIsWizardOpen(true)
     setWizardStep(1)
     setEligibleEmployees([])
  }

  const handleFetchEligible = async () => {
     setProcessing(true)
     try {
        // Fetch active employees (MOCK Logic: In real app, check if payslip already exists for this month)
        // We'll reuse the employees API
        const res = await fetch("/api/employees")
        const data = await res.json()
        if (data.employees) {
            // Filter active
            const active = data.employees.filter((e: any) => e.active !== false)
            setEligibleEmployees(active)
            setWizardStep(2)
        }
     } catch (e) {
        alert("Failed to fetch employees")
     } finally {
        setProcessing(false)
     }
  }

  const handleRunPayroll = async () => {
     setWizardStep(3)
     try {
        const res = await fetch("/api/payroll", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                month: selectedMonth, 
                employeeIds: eligibleEmployees.map(e => e._id) 
            })
        })
        
        if (res.ok) {
            setTimeout(() => {
                setWizardStep(4)
                fetchPayslips() // Refresh list
            }, 1000)
        } else {
            alert("Failed to process payroll")
            setWizardStep(2)
        }
     } catch (e) {
        console.error(e)
        setWizardStep(2)
     }
  }

  if (authLoading) return <div className="p-8">Loading...</div>
  if (user?.role !== "admin") return <div className="p-8 text-red-500">Access Denied</div>

  // Group payslips by month
  const groupedPayslips = payslips.reduce((acc: any, slip) => {
      const month = slip.month
      if (!acc[month]) acc[month] = []
      acc[month].push(slip)
      return acc
  }, {})

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
         <div>
            <h1 className="text-3xl font-bold tracking-tight">Payroll</h1>
            <p className="text-gray-500">Manage salaries and generate payslips</p>
         </div>
         <Button size="lg" className="bg-green-600 hover:bg-green-700 gap-2" onClick={handleStartWizard}>
            <Play className="w-4 h-4" /> Run Payroll
         </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-sm font-medium text-gray-500">Last Processed</CardTitle>
               <FileText className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
               <div className="text-2xl font-bold">
                 {Object.keys(groupedPayslips).sort().pop() || "N/A"}
               </div>
            </CardContent>
         </Card>
      </div>

      {/* Recent Batches */}
      <div className="space-y-4">
         <h2 className="text-xl font-semibold">History</h2>
         {Object.keys(groupedPayslips).length === 0 ? (
             <div className="text-center py-10 border-2 border-dashed rounded-lg bg-gray-50">
                <p className="text-gray-500">No payroll records found. Click "Run Payroll" to start.</p>
             </div>
         ) : (
             Object.entries(groupedPayslips).sort().reverse().map(([month, slips]: [string, any]) => (
                 <Card key={month}>
                    <CardHeader className="bg-gray-50 border-b py-3">
                       <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">{new Date(month + "-01").toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</CardTitle>
                          <Badge variant="outline" className="bg-white">{slips.length} Slips</Badge>
                       </div>
                    </CardHeader>
                    <CardContent className="p-0">
                       <div className="divide-y">
                           {slips.map((slip: any) => (
                               <div key={slip._id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                   <div className="flex items-center gap-4">
                                      <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
                                         {slip.employeeName?.[0] || "?"}
                                      </div>
                                      <div>
                                         <p className="font-medium">{slip.employeeName}</p>
                                         <p className="text-xs text-gray-500">{slip.employeeId}</p>
                                      </div>
                                   </div>
                                   <div className="text-right">
                                      <p className="font-bold">₹{slip.netSalary?.toLocaleString()}</p>
                                      <p className="text-xs text-green-600 uppercase font-bold">{slip.status}</p>
                                   </div>
                               </div>
                           ))}
                       </div>
                    </CardContent>
                 </Card>
             ))
         )}
      </div>

      {/* MAGIC WIZARD DIALOG */}
      <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
         <DialogContent className="sm:max-w-xl">
            <DialogHeader>
               <DialogTitle>Run Payroll Wizard</DialogTitle>
               <DialogDescription>Calculate and generate payslips for all eligible employees.</DialogDescription>
            </DialogHeader>

            <div className="py-6">
               {wizardStep === 1 && (
                   <div className="space-y-4">
                      <div className="space-y-2">
                         <label className="text-sm font-medium">Select Period</label>
                         <Input 
                            type="month" 
                            value={selectedMonth} 
                            onChange={(e) => setSelectedMonth(e.target.value)} 
                            className="text-lg py-6"
                         />
                      </div>
                      <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-700">
                         This will fetch all active employees and calculate their salary for {selectedMonth}.
                      </div>
                   </div>
               )}

               {wizardStep === 2 && (
                   <div className="space-y-4 max-h-[300px] overflow-y-auto">
                      <p className="font-medium flex justify-between">
                         <span>Employees to Process</span>
                         <span className="text-purple-600">{eligibleEmployees.length} Found</span>
                      </p>
                      <div className="space-y-2 border rounded-md p-2">
                         {eligibleEmployees.map(emp => (
                             <div key={emp._id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                                <span>{emp.firstName} {emp.lastName}</span>
                                <Badge variant="secondary">₹{emp.salaryInfo?.monthWage?.toLocaleString() || "N/A"}</Badge>
                             </div>
                         ))}
                      </div>
                   </div>
               )}

               {wizardStep === 3 && (
                   <div className="flex flex-col items-center justify-center py-10 space-y-4">
                       <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
                       <p className="text-lg font-medium">Processing Payroll...</p>
                       <p className="text-sm text-gray-500">Calculating deductions, taxes, and generating slips.</p>
                   </div>
               )}

               {wizardStep === 4 && (
                   <div className="flex flex-col items-center justify-center py-6 space-y-4 text-center">
                       <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                          <Check className="w-8 h-8" />
                       </div>
                       <h3 className="text-xl font-bold text-green-700">Payroll Completed!</h3>
                       <p className="text-gray-600">Successfully generated {eligibleEmployees.length} payslips for {selectedMonth}.</p>
                   </div>
               )}
            </div>

            <DialogFooter>
               {wizardStep === 1 && (
                   <Button onClick={handleFetchEligible} disabled={!selectedMonth || processing} className="w-full">
                      {processing ? "Fetching..." : "Next: Review Employees"} <ChevronRight className="w-4 h-4 ml-1" />
                   </Button>
               )}
               {wizardStep === 2 && (
                   <div className="flex gap-2 w-full">
                      <Button variant="outline" onClick={() => setWizardStep(1)} className="flex-1">Back</Button>
                      <Button onClick={handleRunPayroll} className="flex-1 bg-green-600 hover:bg-green-700">
                         Confirm & Process <DollarSign className="w-4 h-4 ml-1" />
                      </Button>
                   </div>
               )}
               {wizardStep === 4 && (
                   <Button onClick={() => setIsWizardOpen(false)} className="w-full">Done</Button>
               )}
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  )
}
