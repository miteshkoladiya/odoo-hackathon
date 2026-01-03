"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useUser } from "@/hooks/useUser"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
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
import { Lock } from "lucide-react"

export default function EmployeeProfilePage() {
  const { id } = useParams()
  const { user, loading: authLoading } = useUser()
  const [employee, setEmployee] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Password Change State
  const [isPwdOpen, setIsPwdOpen] = useState(false)
  const [pwdData, setPwdData] = useState({ current: "", new: "" })
  const [pwdStatus, setPwdStatus] = useState({ loading: false, error: "", success: "" })

  // ... (Salary vars consts)
  const [wage, setWage] = useState(50000)
  
  // Derived Salary Components (Simplified Version of the sophisticated logic)
  const basic = wage * 0.50
  const hra = basic * 0.50
  const standardAllowance = 4167 // Fixed as per mockup example
  const performanceBonus = wage * 0.0833 // 8.33%
  const lta = basic * 0.0833
  // Special/Fixed Allowance is usually balancing, but we'll keep it simple
  const specialAllowance = wage - (basic + hra + standardAllowance + performanceBonus + lta)
  
  const pfEmployee = basic * 0.12
  const pfEmployer = basic * 0.12
  const professionalTax = 200

  useEffect(() => {
    if (user && id) {
      fetchEmployee()
    } else if (!authLoading && !user) {
      setLoading(false) // Stop loading if auth is done and no user
    }
  }, [id, user, authLoading])

  // Update localized wage if employee data loads
  useEffect(() => {
    if (employee?.salaryInfo?.monthWage) {
      setWage(employee.salaryInfo.monthWage)
    }
  }, [employee])

  const fetchEmployee = async () => {
    try {
      // If "me", we need to find the employee record associated with the current user's email
      const targetId = id === "me" ? undefined : id
      // logic: if targetId, search by ID. If "me" (targetId undefined), search by user email
      const fetchUrl = targetId ? `/api/employees?id=${targetId}` : `/api/employees?search=${user?.email}` 
      
      const res = await fetch(fetchUrl) 
      const data = await res.json()
      
      if (data.employees) {
        let found = null
        if (id === "me") {
           // For "me", find the one matching user email
           found = data.employees.find((e: any) => e.email === user?.email)
        } else {
           found = data.employees.find((e: any) => e._id === id) || data.employees[0] // fallback if single result
        }
        setEmployee(found)
      }
    } catch (error) {
      console.error("Failed", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwdStatus({ loading: true, error: "", success: "" })

    try {
      const res = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, currentPassword: pwdData.current, newPassword: pwdData.new }),
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed")

      setPwdStatus({ loading: false, error: "", success: "Password changed successfully!" })
      setTimeout(() => setIsPwdOpen(false), 1500)
      setPwdData({ current: "", new: "" })
    } catch (err: any) {
      setPwdStatus({ loading: false, error: err.message, success: "" })
    }
  }

  if (loading) return <div className="p-8">Loading Profile...</div>
  if (!employee && !loading) return <div className="p-8">Employee not found. (If you are new, please ask Admin to create your profile)</div>

  const isOwnProfile = user?.email === employee.email

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-32 w-32 border-4 border-gray-50">
               <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${employee.firstName} ${employee.lastName}`} />
               <AvatarFallback className="text-2xl">{employee.firstName[0]}{employee.lastName[0]}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-start">
                 <div>
                   <h1 className="text-3xl font-bold text-gray-900">{employee.firstName} {employee.lastName}</h1>
                   <p className="text-xl text-gray-500">{employee.jobPosition || "Job Position"}</p>
                 </div>
                 <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={employee.active !== false ? "default" : "secondary"} className="bg-green-500 hover:bg-green-600">
                        Active
                      </Badge>
                      {isOwnProfile && (
                        <Dialog open={isPwdOpen} onOpenChange={setIsPwdOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-6 text-xs gap-1 border-purple-200 text-purple-700 hover:bg-purple-50">
                              <Lock className="w-3 h-3" /> Change Password
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Change Password</DialogTitle>
                              <DialogDescription>
                                Enter your current password and a new secure password.
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handlePasswordChange} className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Current Password</Label>
                                <Input 
                                  type="password" 
                                  value={pwdData.current} 
                                  onChange={(e) => setPwdData({...pwdData, current: e.target.value})}
                                  required 
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>New Password</Label>
                                <Input 
                                  type="password" 
                                  value={pwdData.new} 
                                  onChange={(e) => setPwdData({...pwdData, new: e.target.value})}
                                  required 
                                />
                              </div>
                              {pwdStatus.error && <p className="text-sm text-red-500">{pwdStatus.error}</p>}
                              {pwdStatus.success && <p className="text-sm text-green-500">{pwdStatus.success}</p>}
                              
                              <DialogFooter>
                                <Button type="submit" disabled={pwdStatus.loading} className="bg-purple-600">
                                  {pwdStatus.loading ? "Updating..." : "Update Password"}
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">ID: {employee.employeeId}</span>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div className="grid grid-cols-3 items-center">
                  <span className="font-medium text-gray-500">Email:</span>
                  <span className="col-span-2">{employee.email}</span>
                </div>
                <div className="grid grid-cols-3 items-center">
                  <span className="font-medium text-gray-500">Phone:</span>
                  <span className="col-span-2">{employee.mobile || "N/A"}</span>
                </div>
                <div className="grid grid-cols-3 items-center">
                  <span className="font-medium text-gray-500">Department:</span>
                  <span className="col-span-2">{employee.department || "N/A"}</span>
                </div>
                <div className="grid grid-cols-3 items-center">
                  <span className="font-medium text-gray-500">Manager:</span>
                  <span className="col-span-2">{employee.manager || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Section */}
      <Tabs defaultValue="resume" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="resume">Resume</TabsTrigger>
          <TabsTrigger value="private">Private Info</TabsTrigger>
          {user?.role === "admin" && <TabsTrigger value="salary">Salary Info</TabsTrigger>}
        </TabsList>

        {/* Resume Tab */}
        <TabsContent value="resume">
          <Card>
            <CardHeader>
               <CardTitle>Professional Resume</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="space-y-2">
                 <Label>About</Label>
                 <div className="p-3 bg-gray-50 rounded-md text-sm min-h-[100px]">
                   {employee.about || "No description available."}
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <Label>Skills</Label>
                    <div className="p-3 bg-gray-50 rounded-md text-sm min-h-[80px]">
                      {employee.skills?.join(", ") || "No skills listed."}
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label>Certifications</Label>
                    <div className="p-3 bg-gray-50 rounded-md text-sm min-h-[80px]">
                      {employee.certifications?.join(", ") || "No certifications listed."}
                    </div>
                 </div>
               </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Private Info Tab */}
        <TabsContent value="private">
          <Card>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                 <h3 className="font-semibold text-lg border-b pb-2">Personal Details</h3>
                 <div className="grid grid-cols-[120px_1fr] gap-2 items-center text-sm">
                   <span className="text-gray-500">Nationality</span>
                   <Input value={employee.nationality || ""} readOnly className="h-8" />
                   
                   <span className="text-gray-500">Gender</span>
                   <Input value={employee.gender || ""} readOnly className="h-8" />
                   
                   <span className="text-gray-500">Marital Status</span>
                   <Input value={employee.maritalStatus || ""} readOnly className="h-8" />
                   
                   <span className="text-gray-500">Date of Birth</span>
                   <Input value={employee.dob ? new Date(employee.dob).toLocaleDateString() : ""} readOnly className="h-8" />
                   
                   <span className="text-gray-500">Address</span>
                   <Input value={employee.address || ""} readOnly className="h-8" />
                 </div>
               </div>

               <div className="space-y-4">
                 <h3 className="font-semibold text-lg border-b pb-2">Bank Details</h3>
                 <div className="grid grid-cols-[120px_1fr] gap-2 items-center text-sm">
                   <span className="text-gray-500">Bank Name</span>
                   <Input value={employee.bankDetails?.bankName || ""} readOnly className="h-8" />
                   
                   <span className="text-gray-500">Account No</span>
                   <Input value={employee.bankDetails?.accountNumber || ""} readOnly className="h-8" />
                   
                   <span className="text-gray-500">IFSC Code</span>
                   <Input value={employee.bankDetails?.ifscCode || ""} readOnly className="h-8" />
                   
                   <span className="text-gray-500">PAN No</span>
                   <Input value={employee.bankDetails?.panNo || ""} readOnly className="h-8" />
                 </div>
               </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Salary Info Tab (Admin Only) */}
        {user?.role === "admin" && (
          <TabsContent value="salary">
             <Card>
               <CardContent className="p-6">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Configuration */}
                    <div className="space-y-6">
                       <h3 className="font-semibold text-lg text-purple-700">Wage Configuration</h3>
                       <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                          <Label>Month Wage</Label>
                          <Input 
                            type="number" 
                            value={wage} 
                            onChange={(e) => setWage(Number(e.target.value))} 
                            className="font-bold"
                          />
                          <Label>Yearly Wage</Label>
                          <Input value={wage * 12} readOnly className="bg-gray-50" />
                       </div>
                    </div>

                    {/* Computation */}
                    <div className="space-y-6">
                       <h3 className="font-semibold text-lg text-green-700">Salary Structure</h3>
                       
                       <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center border-b pb-1">
                            <span>Basic Salary (50%)</span>
                            <span className="font-medium">₹{basic.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center border-b pb-1">
                            <span>HRA (50% of Basic)</span>
                            <span className="font-medium">₹{hra.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center border-b pb-1">
                            <span>Standard Allowance (Fixed)</span>
                            <span className="font-medium">₹{standardAllowance.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center border-b pb-1">
                            <span>Performance Bonus (8.33%)</span>
                            <span className="font-medium">₹{performanceBonus.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center border-b pb-1">
                            <span>Medical/Special Allow.</span>
                            <span className="font-medium">₹{specialAllowance > 0 ? specialAllowance.toFixed(2) : 0}</span>
                          </div>

                          <div className="mt-4 pt-2 border-t-2 border-gray-200 font-bold flex justify-between">
                             <span>Gross Salary</span>
                             <span>₹{wage.toFixed(2)}</span>
                          </div>

                          <h4 className="font-semibold mt-4 text-red-600">Deductions</h4>
                          <div className="flex justify-between items-center border-b pb-1 text-red-500">
                             <span>PF (Employee 12%)</span>
                             <span>- ₹{pfEmployee.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center border-b pb-1 text-red-500">
                             <span>Professional Tax</span>
                             <span>- ₹{professionalTax.toFixed(2)}</span>
                          </div>
                          
                          <div className="mt-2 text-right font-bold text-xl text-purple-700">
                             Net Pay: ₹{(wage - pfEmployee - professionalTax).toFixed(2)}
                          </div>
                       </div>
                    </div>
                 </div>
               </CardContent>
             </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
