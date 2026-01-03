"use client"

import { useEffect, useState } from "react"
import { useUser } from "@/hooks/useUser"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CalendarIcon } from "lucide-react"

export default function TimeOffPage() {
  const { user, loading: authLoading } = useUser()
  const [leaves, setLeaves] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [balances, setBalances] = useState({ paid: 24, sick: 7, unpaid: 0 }) // Default 24/7/0 until loaded

  // New Request State
  const [isNewOpen, setIsNewOpen] = useState(false)
  const [newLeave, setNewLeave] = useState({
    type: "annual",
    startDate: "",
    endDate: "",
    reason: ""
  })
  const [daysRequested, setDaysRequested] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchLeaves()
      if (user.role === "employee") fetchBalances()
    } else if (!authLoading && !user) {
      setLoading(false)
    }
  }, [user, authLoading])

  useEffect(() => {
    if (newLeave.startDate && newLeave.endDate) {
      const start = new Date(newLeave.startDate)
      const end = new Date(newLeave.endDate)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      setDaysRequested(diffDays > 0 ? diffDays : 0)
    }
  }, [newLeave.startDate, newLeave.endDate])

  useEffect(() => {
    if (!isNewOpen) setError(null) // Clear error when dialog closes
  }, [isNewOpen])

  const fetchBalances = async () => {
    try {
      const res = await fetch(`/api/employees?search=${user?.email}`)
      const data = await res.json()
      if (data.employees && data.employees.length > 0) {
        const me = data.employees.find((e: any) => e.email === user?.email)
        if (me && me.leaveBalances) {
          setBalances({ ...me.leaveBalances, unpaid: me.leaveBalances.unpaid || 0 })
        } else {
          setBalances({ paid: 24, sick: 7, unpaid: 0 })
        }
      }
    } catch (e) {
      console.error("Failed to fetch balances", e)
    }
  }

  const fetchLeaves = async () => {
    try {
      const query = user?.role === "employee" ? `?employeeId=${user?.employeeId}` : ""
      const res = await fetch(`/api/leave-applications${query}`)
      const data = await res.json()
      if (data.leaves) {
        setLeaves(data.leaves)
      } else if (Array.isArray(data)) {
        setLeaves(data)
      }
    } catch (error) {
      console.error("Failed to fetch leaves", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!user?.employeeId) return setError("Employee ID not found. Please log in again.")

    // VALIDATION: Check Balances
    if (daysRequested > 0) {
      if (newLeave.type === "annual" && daysRequested > balances.paid) {
        return setError(`Insufficient Paid Leave Balance. You have ${balances.paid} days remaining.`)
      }
      if (newLeave.type === "sick" && daysRequested > balances.sick) {
        return setError(`Insufficient Sick Leave Balance. You have ${balances.sick} days remaining.`)
      }
    }

    try {
      const res = await fetch("/api/leave-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: user.employeeId,
          leaveType: newLeave.type,
          startDate: newLeave.startDate,
          endDate: newLeave.endDate,
          reason: newLeave.reason || "Requested via Dashboard"
        }),
      })

      const result = await res.json()

      if (res.ok) {
        setIsNewOpen(false)
        fetchLeaves()
        setNewLeave({ type: "annual", startDate: "", endDate: "", reason: "" })
        setDaysRequested(0)
      } else {
        setError(result.error || "Failed to submit request")
      }
    } catch (error) {
      setError("An unexpected error occurred")
    }
  }

  // Search state for Admin
  const [searchTerm, setSearchTerm] = useState("")

  // Rejection State
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")

  const filteredLeaves = leaves.filter(leave =>
    !searchTerm ||
    leave.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    leave.leaveType?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const updateStatus = async (id: string, status: "approved" | "rejected", reason?: string) => {
    try {
      const res = await fetch("/api/leave-applications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, rejectionReason: reason })
      })
      if (res.ok) {
        fetchLeaves()
        fetchBalances() // Refresh stats
        setRejectId(null)
        setRejectionReason("")
      } else {
        alert("Failed to update status")
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleApprove = async (id: string) => {
    if (confirm("Are you sure you want to approve this request?")) {
      await updateStatus(id, "approved")
    }
  }

  const handleRejectClick = (id: string) => {
    setRejectId(id)
  }

  const confirmReject = async () => {
    if (!rejectionReason) return alert("Please provide a reason")
    await updateStatus(rejectId!, "rejected", rejectionReason)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Time Off</h1>

        {/* Only Employees or Admin acting as self need "NEW" Request usually, 
            but mockup shows NEW for Admin too (maybe to create for others).
            Keeping it for both for now, but distinct layout below. */}
        <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-200 text-purple-800 hover:bg-purple-300 font-bold px-6">NEW</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Time off Request</DialogTitle>
              <DialogDescription>Submit a new leave request for approval.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="employee" className="text-right">Employee</Label>
                <Input id="employee" value={`${user?.firstName} ${user?.lastName}`} disabled className="col-span-3 bg-gray-50" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">Type</Label>
                <div className="col-span-3">
                  <Select
                    value={newLeave.type}
                    onValueChange={(val) => setNewLeave({ ...newLeave, type: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual">Paid Time Off</SelectItem>
                      <SelectItem value="sick">Sick Leave</SelectItem>
                      <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Dates</Label>
                <div className="col-span-3 flex gap-2">
                  <Input
                    type="date"
                    value={newLeave.startDate}
                    onChange={(e) => setNewLeave({ ...newLeave, startDate: e.target.value })}
                    required
                  />
                  <span className="self-center">to</span>
                  <Input
                    type="date"
                    value={newLeave.endDate}
                    onChange={(e) => setNewLeave({ ...newLeave, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Duration</Label>
                <div className="col-span-3 font-bold text-purple-700">
                  {daysRequested} Days
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reason" className="text-right">Reason</Label>
                <Textarea
                  id="reason"
                  value={newLeave.reason}
                  onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsNewOpen(false)}>Discard</Button>
                <Button type="submit" className="bg-purple-600">Submit</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Rejection Modal */}
        <Dialog open={!!rejectId} onOpenChange={(open) => !open && setRejectId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Request</DialogTitle>
              <DialogDescription>Please provide a reason for rejection.</DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <Label>Reason</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Critical project deadline..."
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setRejectId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmReject}>Reject Request</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* ADMIN / HR VIEW: Search Bar & No Personal Stats */}
      {["admin", "hr"].includes(user?.role || "") && (
        <div className="bg-white p-4 rounded-lg shadow-sm border flex items-center gap-4">
          <Input
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
          <div className="flex gap-2">
            <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">To Approve</Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">All</Badge>
          </div>
        </div>
      )}

      {/* EMPLOYEE VIEW: Allocation Stats */}
      {user?.role === "employee" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Paid Time Off</p>
                <h3 className="text-2xl font-bold text-blue-600">{balances.paid} Days</h3>
              </div>
              <span className="text-xs text-gray-400">Available</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Sick Time Off</p>
                <h3 className="text-2xl font-bold text-blue-600">{balances.sick} Days</h3>
              </div>
              <span className="text-xs text-gray-400">Available</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Unpaid Time Off</p>
                <h3 className="text-2xl font-bold text-gray-700">{balances.unpaid} Days</h3>
              </div>
              <span className="text-xs text-gray-400">Used</span>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                {["admin", "hr"].includes(user?.role || "") && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : filteredLeaves.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No leave requests.</TableCell></TableRow>
              ) : (
                filteredLeaves.map((leave: any) => (
                  <TableRow key={leave._id}>
                    <TableCell>
                      {leave.firstName || leave.lastName
                        ? `${leave.firstName || ''} ${leave.lastName || ''}`
                        : leave.employeeId}
                    </TableCell>
                    <TableCell>{new Date(leave.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(leave.endDate).toLocaleDateString()}</TableCell>
                    <TableCell className="capitalize text-blue-600 font-medium">
                      {leave.leaveType === "annual" ? "Paid Time Off" :
                        leave.leaveType === "sick" ? "Sick Leave" : leave.leaveType}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        leave.status === "approved" ? "text-green-600 bg-green-50" :
                          leave.status === "pending" ? "text-yellow-600 bg-yellow-50" : "text-red-600"
                      }>
                        {leave.status}
                      </Badge>
                    </TableCell>
                    {["admin", "hr"].includes(user?.role || "") && (
                      <TableCell>
                        {leave.status === "pending" && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleApprove(leave._id)} className="h-6 w-6 p-0 rounded-sm bg-green-500 hover:bg-green-600 text-white" title="Approve">✓</Button>
                            <Button size="sm" onClick={() => handleRejectClick(leave._id)} className="h-6 w-6 p-0 rounded-sm bg-red-500 hover:bg-red-600 text-white" title="Reject">✕</Button>
                          </div>
                        )}
                      </TableCell>
                    )}
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
