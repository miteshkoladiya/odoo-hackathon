"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

export default function NewEmployeePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    jobPosition: "",
    department: "",
    manager: "",
    joinDate: new Date().toISOString().split("T")[0],
    dob: "",
    gender: "",
    maritalStatus: "",
    nationality: "",
    address: "",
    _id: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [createdCredentials, setCreatedCredentials] = useState<{email: string, password: string} | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to create employee")
      }

      // Show credentials modal
      if (data.credentials) {
         setCreatedCredentials(data.credentials)
         // We also store the new ID to redirect later
         setFormData(prev => ({ ...prev, _id: data.employee._id }))
      } else {
         router.push(`/dashboard/employees/${data.employee._id}`)
      }

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
     if (formData._id) {
        router.push(`/dashboard/employees/${formData._id}`)
     } else {
        router.push("/dashboard/employees")
     }
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Credentials Modal */}
      <Dialog open={!!createdCredentials} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-green-600 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6" /> Employee Created!
            </DialogTitle>
            <DialogDescription>
              The employee account has been securely created.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-slate-100 p-4 rounded-md space-y-3 border border-slate-200">
             <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">System Generated Credentials</p>
             <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                <span className="font-medium text-slate-500">Login ID:</span>
                <span className="font-mono select-all bg-white px-2 rounded border">{createdCredentials?.email}</span>
                
                <span className="font-medium text-slate-500">Password:</span>
                <span className="font-mono font-bold select-all bg-white px-2 rounded border text-purple-700">{createdCredentials?.password}</span>
             </div>
             <Alert className="bg-yellow-50 border-yellow-200 py-2">
               <AlertCircle className="w-4 h-4 text-yellow-600" />
               <AlertDescription className="text-xs text-yellow-700 ml-2">
                 In a real environment, these credentials would be sent to the employee's email. For this demo, please save them now.
               </AlertDescription>
             </Alert>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button type="button" variant="secondary" onClick={handleClose} className="w-full">
              Close & Go to Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">New Employee</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
               <h3 className="font-semibold text-lg border-b pb-2">Professional Details</h3>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                     <Label htmlFor="email">Email *</Label>
                     <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                     <Label htmlFor="mobile">Mobile *</Label>
                     <Input id="mobile" name="mobile" value={formData.mobile} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                     <Label htmlFor="jobPosition">Job Position *</Label>
                     <Input id="jobPosition" name="jobPosition" value={formData.jobPosition} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                     <Label htmlFor="department">Department *</Label>
                     <Input id="department" name="department" value={formData.department} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                     <Label htmlFor="manager">Manager *</Label>
                     <Input id="manager" name="manager" value={formData.manager} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                     <Label htmlFor="joinDate">Join Date *</Label>
                     <Input id="joinDate" name="joinDate" type="date" value={formData.joinDate} onChange={handleChange} required />
                  </div>
               </div>
            </div>

            <div className="space-y-4">
               <h3 className="font-semibold text-lg border-b pb-2">Personal Details</h3>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <Label htmlFor="dob">Date of Birth *</Label>
                     <Input id="dob" name="dob" type="date" value={formData.dob} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                     <Label htmlFor="gender">Gender *</Label>
                     <select 
                        id="gender" 
                        name="gender" 
                        value={formData.gender} 
                        onChange={handleChange as any} 
                        required
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                     >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                     </select>
                  </div>
                  <div className="space-y-2">
                     <Label htmlFor="maritalStatus">Marital Status *</Label>
                     <select 
                        id="maritalStatus" 
                        name="maritalStatus" 
                        value={formData.maritalStatus} 
                        onChange={handleChange as any} 
                        required
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                     >
                        <option value="">Select Status</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                     </select>
                  </div>
                  <div className="space-y-2">
                     <Label htmlFor="nationality">Nationality *</Label>
                     <Input id="nationality" name="nationality" value={formData.nationality} onChange={handleChange} required />
                  </div>
                  <div className="col-span-2 space-y-2">
                     <Label htmlFor="address">Address *</Label>
                     <Input id="address" name="address" value={formData.address} onChange={handleChange} required />
                  </div>
               </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700" disabled={loading}>
                {loading ? "Creating..." : "Create Employee"}
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
