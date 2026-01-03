"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, XCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([])
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [comments, setComments] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchApprovals()
  }, [])

  const fetchApprovals = async () => {
    try {
      setIsLoading(true)
      // TODO: Use actual approverId from session
      const response = await fetch(`/api/leave-applications?status=pending`)
      const data = await response.json()
      setApprovals(data.leaves || [])
    } catch (error) {
      console.error("Failed to fetch approvals:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproval = async (action: "approved" | "rejected") => {
    if (!selectedRequest) return

    try {
      const response = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: selectedRequest._id,
          requestType: "leave",
          employeeId: selectedRequest.employeeId,
          approverId: "APPROVER-001", // TODO: Get from session
          action,
          comments,
        }),
      })

      if (response.ok) {
        setIsDialogOpen(false)
        setComments("")
        setSelectedRequest(null)
        fetchApprovals()
      }
    } catch (error) {
      console.error("Failed to process approval:", error)
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Pending Approvals</h1>
        <p className="text-muted-foreground mt-1">Review and approve leave requests</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Requests Pending Your Approval</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading approvals...
                  </TableCell>
                </TableRow>
              ) : approvals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No pending approvals
                  </TableCell>
                </TableRow>
              ) : (
                approvals.map((approval) => {
                  const startDate = new Date(approval.startDate)
                  const endDate = new Date(approval.endDate)
                  const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

                  return (
                    <TableRow key={approval._id}>
                      <TableCell className="font-medium">{approval.employeeId}</TableCell>
                      <TableCell className="capitalize">{approval.leaveType}</TableCell>
                      <TableCell>{startDate.toLocaleDateString()}</TableCell>
                      <TableCell>{endDate.toLocaleDateString()}</TableCell>
                      <TableCell>{duration} days</TableCell>
                      <TableCell className="max-w-xs truncate">{approval.reason}</TableCell>
                      <TableCell className="text-right">
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedRequest(approval)}>
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Review Leave Request</DialogTitle>
                              <DialogDescription>
                                Approve or reject the leave request with optional comments
                              </DialogDescription>
                            </DialogHeader>
                            {selectedRequest && (
                              <div className="space-y-4">
                                <div>
                                  <p className="text-sm font-medium">Employee</p>
                                  <p className="text-sm text-muted-foreground">{selectedRequest.employeeId}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Leave Type</p>
                                  <p className="text-sm text-muted-foreground capitalize">
                                    {selectedRequest.leaveType}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Reason</p>
                                  <p className="text-sm text-muted-foreground">{selectedRequest.reason}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium mb-2">Comments</p>
                                  <Textarea
                                    placeholder="Add your comments..."
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                  />
                                </div>
                                <div className="flex gap-3 justify-end">
                                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleApproval("rejected")}
                                    className="gap-2"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Reject
                                  </Button>
                                  <Button onClick={() => handleApproval("approved")} className="gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Approve
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
