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
import { Lock, Camera } from "lucide-react"

export default function EmployeeProfilePage() {
  const { id } = useParams()
  const { user, loading: authLoading } = useUser()
  const [employee, setEmployee] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [saveLoading, setSaveLoading] = useState(false)

  // ... (Password State)
  const [isPwdOpen, setIsPwdOpen] = useState(false)
  const [pwdData, setPwdData] = useState({ current: "", new: "" })
  const [pwdStatus, setPwdStatus] = useState({ loading: false, error: "", success: "" })

  // ... (Salary vars consts)
  const [wage, setWage] = useState(50000)
  
  // Derived Salary Components (Simplified Version of the sophisticated logic)
  const basic = wage * 0.50
  const hra = basic * 0.50
  const standardAllowance = 4167 
  const performanceBonus = wage * 0.0833 
  const lta = basic * 0.0833
  const specialAllowance = wage - (basic + hra + standardAllowance + performanceBonus + lta)
  
  const pfEmployee = basic * 0.12
  const pfEmployer = basic * 0.12
  const professionalTax = 200

  useEffect(() => {
    if (user && id) {
      fetchEmployee()
    } else if (!authLoading && !user) {
      setLoading(false) 
    }
  }, [id, user, authLoading])

  useEffect(() => {
    if (employee) {
       setFormData(employee)
       if (employee?.salaryInfo?.monthWage) {
          setWage(employee.salaryInfo.monthWage)
       }
    }
  }, [employee])

  const fetchEmployee = async () => {
    try {
      const targetId = id === "me" ? undefined : id
      const fetchUrl = targetId ? `/api/employees?id=${targetId}` : `/api/employees?search=${user?.email}` 
      
      const res = await fetch(fetchUrl) 
      const data = await res.json()
      
      if (data.employees) {
        let found = null
        if (id === "me") {
           found = data.employees.find((e: any) => e.email === user?.email)
        } else {
           found = data.employees.find((e: any) => e._id === id) || data.employees[0] 
        }
        setEmployee(found)
      }
    } catch (error) {
      console.error("Failed", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
     setSaveLoading(true)
     try {
       // Prepare Update Data
       const updatePayload = { 
          ...formData, 
          _id: employee._id,
          // If admin, update salary too
          salaryInfo: user?.role === "admin" ? { ...employee.salaryInfo, monthWage: wage } : employee.salaryInfo 
       }

       const res = await fetch("/api/employees", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload)
       })

       if (res.ok) {
          setEmployee(updatePayload)
          setIsEditing(false)
          alert("Profile updated successfully!")
       } else {
          alert("Failed to update profile")
       }
     } catch (e) {
        console.error(e)
        alert("Error saving profile")
     } finally {
        setSaveLoading(false)
     }
  }

  // ... (handlePasswordChange unchanged)
  // Re-insert handlePasswordChange below for context if needed, but I'll skip to keep it clean if it wasn't targeted.
  // Wait, I am replacing a big chunk. I must include everything I replace.
  
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
  const canEdit = isOwnProfile || user?.role === "admin"

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative group">
                <Avatar className="h-32 w-32 border-4 border-gray-50">
                    <AvatarImage src={
                        (isEditing && formData.photo) ? formData.photo : 
                        employee.photo ? employee.photo : 
                        `https://api.dicebear.com/7.x/initials/svg?seed=${employee.firstName} ${employee.lastName}`
                    } className="object-cover" />
                    <AvatarFallback className="text-2xl">{employee.firstName[0]}{employee.lastName[0]}</AvatarFallback>
                </Avatar>
                
                {isEditing && (
                    <>
                        <label htmlFor="photo-upload" className="absolute bottom-0 right-0 p-2 bg-purple-600 rounded-full text-white cursor-pointer hover:bg-purple-700 shadow-lg transition-all">
                             <Camera className="w-5 h-5" />
                        </label>
                        <input 
                            id="photo-upload" 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                    if (file.size > 500 * 1024) { // 500KB limit
                                        alert("File size too large. Please upload an image under 500KB.")
                                        return
                                    }
                                    const reader = new FileReader()
                                    reader.onloadend = () => {
                                        setFormData((prev: any) => ({ ...prev, photo: reader.result }))
                                    }
                                    reader.readAsDataURL(file)
                                }
                            }}
                        />
                    </>
                )}
            </div>
            
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
                      
                      {canEdit && !isEditing && (
                          <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>Edit Profile</Button>
                      )}
                      
                      {isEditing && (
                          <div className="flex gap-2">
                             <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                             <Button size="sm" className="bg-purple-600" onClick={handleSave} disabled={saveLoading}>
                                {saveLoading ? "Saving..." : "Save Changes"}
                             </Button>
                          </div>
                      )}

                      {isOwnProfile && !isEditing && (
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
          <TabsTrigger value="salary">Salary Info</TabsTrigger>
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
                 {isEditing ? (
                    <div className="space-y-2">
                        <textarea 
                           className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                           value={formData.about || ""} 
                           onChange={(e) => setFormData({...formData, about: e.target.value})}
                        />
                    </div>
                 ) : (
                    <div className="p-3 bg-gray-50 rounded-md text-sm min-h-[100px]">
                        {employee.about || "No description available."}
                    </div>
                 )}
               </div>
               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <Label>Skills (Comma separated)</Label>
                    {isEditing ? (
                        <Input 
                           value={formData.skills?.join(", ") || ""} 
                           onChange={(e) => setFormData({...formData, skills: e.target.value.split(",").map((s: string) => s.trim())})}
                        />
                    ) : (
                        <div className="p-3 bg-gray-50 rounded-md text-sm min-h-[80px]">
                           {employee.skills?.join(", ") || "No skills listed."}
                        </div>
                    )}
                 </div>
                 <div className="space-y-2">
                    <Label>Certifications (Comma separated)</Label>
                    {isEditing ? (
                        <Input 
                           value={formData.certifications?.join(", ") || ""} 
                           onChange={(e) => setFormData({...formData, certifications: e.target.value.split(",").map((s: string) => s.trim())})}
                        />
                    ) : (
                        <div className="p-3 bg-gray-50 rounded-md text-sm min-h-[80px]">
                           {employee.certifications?.join(", ") || "No certifications listed."}
                        </div>
                    )}
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
                   <Label className="text-gray-500">Nationality</Label>
                   <Input 
                      value={isEditing ? (formData.nationality || "") : (employee.nationality || "")} 
                      onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                      readOnly={!isEditing} 
                      className={!isEditing ? "bg-gray-50" : ""}
                   />
                   
                   <Label className="text-gray-500">Gender</Label>
                   <Input 
                      value={isEditing ? (formData.gender || "") : (employee.gender || "")} 
                      onChange={(e) => setFormData({...formData, gender: e.target.value})}
                      readOnly={!isEditing} 
                      className={!isEditing ? "bg-gray-50" : ""}
                   />
                   
                   <Label className="text-gray-500">Marital Status</Label>
                   <Input 
                      value={isEditing ? (formData.maritalStatus || "") : (employee.maritalStatus || "")} 
                      onChange={(e) => setFormData({...formData, maritalStatus: e.target.value})}
                      readOnly={!isEditing} 
                      className={!isEditing ? "bg-gray-50" : ""}
                   />
                   
                   <Label className="text-gray-500">Date of Birth</Label>
                   <Input 
                      type={isEditing ? "date" : "text"}
                      value={isEditing ? (formData.dob || "") : (employee.dob ? new Date(employee.dob).toLocaleDateString() : "")} 
                      onChange={(e) => setFormData({...formData, dob: e.target.value})}
                      readOnly={!isEditing} 
                      className={!isEditing ? "bg-gray-50" : ""}
                   />
                   
                   <Label className="text-gray-500">Address</Label>
                   <Input 
                      value={isEditing ? (formData.address || "") : (employee.address || "")} 
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      readOnly={!isEditing} 
                      className={!isEditing ? "bg-gray-50" : ""}
                   />
                 </div>
               </div>

               <div className="space-y-4">
                 <h3 className="font-semibold text-lg border-b pb-2">Bank Details</h3>
                 <div className="grid grid-cols-[120px_1fr] gap-2 items-center text-sm">
                   <Label className="text-gray-500">Bank Name</Label>
                   <Input 
                      value={isEditing ? (formData.bankDetails?.bankName || "") : (employee.bankDetails?.bankName || "")} 
                      onChange={(e) => setFormData({...formData, bankDetails: { ...formData.bankDetails, bankName: e.target.value }})}
                      readOnly={!isEditing} 
                      className={!isEditing ? "bg-gray-50" : ""}
                   />
                   
                   <Label className="text-gray-500">Account No</Label>
                   <Input 
                      value={isEditing ? (formData.bankDetails?.accountNumber || "") : (employee.bankDetails?.accountNumber || "")} 
                      onChange={(e) => setFormData({...formData, bankDetails: { ...formData.bankDetails, accountNumber: e.target.value }})}
                      readOnly={!isEditing} 
                      className={!isEditing ? "bg-gray-50" : ""}
                   />
                   
                   <Label className="text-gray-500">IFSC Code</Label>
                   <Input 
                      value={isEditing ? (formData.bankDetails?.ifscCode || "") : (employee.bankDetails?.ifscCode || "")} 
                      onChange={(e) => setFormData({...formData, bankDetails: { ...formData.bankDetails, ifscCode: e.target.value }})}
                      readOnly={!isEditing} 
                      className={!isEditing ? "bg-gray-50" : ""}
                   />
                   
                   <Label className="text-gray-500">PAN No</Label>
                   <Input 
                      value={isEditing ? (formData.bankDetails?.panNo || "") : (employee.bankDetails?.panNo || "")} 
                      onChange={(e) => setFormData({...formData, bankDetails: { ...formData.bankDetails, panNo: e.target.value }})}
                      readOnly={!isEditing} 
                      className={!isEditing ? "bg-gray-50" : ""}
                   />
                 </div>
               </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Salary Info Tab (Visible to All, Edtiable by Admin) */}
          <TabsContent value="salary">
             <Card>
               <CardContent className="p-6">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Configuration */}
                    <div className="space-y-6">
                       <h3 className="font-semibold text-lg text-purple-700">Wage Configuration</h3>
                       <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                          <Label>Month Wage</Label>
                          {user?.role === "admin" ? (
                              <Input 
                                type="number" 
                                value={wage} 
                                onChange={(e) => setWage(Number(e.target.value))} 
                                className="font-bold"
                              />
                          ) : (
                              <div className="font-bold text-lg">₹{wage.toLocaleString()}</div>
                          )}
                          
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
      </Tabs>
    </div>
  )
}
