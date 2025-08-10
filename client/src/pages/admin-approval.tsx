import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock, FileText, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ApprovalRequest {
  id: string;
  userId: number;
  requestType: string;
  description: string;
  requestData: any;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: number;
  reviewNotes?: string;
}

export default function AdminApproval() {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const { data: requestsResponse, isLoading } = useQuery({
    queryKey: ["/api/admin/pending-requests"],
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const requests: ApprovalRequest[] = (requestsResponse as any)?.requests || [];

  const approveMutation = useMutation({
    mutationFn: async ({ requestId, notes }: { requestId: string; notes: string }) => {
      return await apiRequest("POST", `/api/admin/approve/${requestId}`, { reviewNotes: notes }) as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setSelectedRequest(null);
      setReviewNotes("");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, notes }: { requestId: string; notes: string }) => {
      return await apiRequest("POST", `/api/admin/reject/${requestId}`, { reviewNotes: notes }) as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-requests"] });
      setSelectedRequest(null);
      setReviewNotes("");
    },
  });

  const handleApprove = (request: ApprovalRequest) => {
    if (confirm(`Approve ${request.description}?`)) {
      approveMutation.mutate({ requestId: request.id, notes: reviewNotes });
    }
  };

  const handleReject = (request: ApprovalRequest) => {
    if (confirm(`Reject ${request.description}?`)) {
      rejectMutation.mutate({ requestId: request.id, notes: reviewNotes });
    }
  };

  const getRequestTypeColor = (type: string) => {
    const colors = {
      project_creation: "bg-blue-500",
      code_execution: "bg-green-500",
      terminal_access: "bg-yellow-500",
      file_upload: "bg-purple-500",
      integration_access: "bg-red-500",
      feature_access: "bg-gray-500",
    };
    return colors[type as keyof typeof colors] || "bg-gray-500";
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading approval requests...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Approval Dashboard</h1>
          <p className="text-muted-foreground">
            Review and approve user requests for security-critical operations
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {requests.length} Pending
        </Badge>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Notice:</strong> All project deployments require manual admin approval. 
          No AI, automated system, or unauthorized user can deploy projects without your explicit approval.
        </AlertDescription>
      </Alert>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Pending Requests</h3>
            <p className="text-muted-foreground text-center">
              All approval requests have been processed. The system is secure.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <Card key={request.id} className="border-l-4 border-l-orange-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-orange-500" />
                    <div>
                      <CardTitle className="text-lg">{request.description}</CardTitle>
                      <CardDescription>
                        User ID: {request.userId} • Requested: {new Date(request.requestedAt).toLocaleString()}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={`${getRequestTypeColor(request.requestType)} text-white`}>
                    {request.requestType.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {request.requestType === 'project_creation' && request.requestData && (
                    <div className="bg-gray-50 p-3 rounded-md">
                      <h4 className="font-medium mb-2">Project Details:</h4>
                      <div className="text-sm space-y-1">
                        <p><strong>Name:</strong> {request.requestData.name}</p>
                        <p><strong>Template:</strong> {request.requestData.template}</p>
                        {request.requestData.description && (
                          <p><strong>Description:</strong> {request.requestData.description}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Review Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Review Request</DialogTitle>
                          <DialogDescription>
                            {request.description}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Review Notes (Optional)</label>
                            <Textarea
                              placeholder="Add any notes about this approval/rejection..."
                              value={reviewNotes}
                              onChange={(e) => setReviewNotes(e.target.value)}
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="destructive"
                              onClick={() => handleReject(request)}
                              disabled={rejectMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                            <Button
                              variant="default"
                              onClick={() => handleApprove(request)}
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve & Deploy
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleReject(request)}
                      disabled={rejectMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Quick Reject
                    </Button>
                    
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleApprove(request)}
                      disabled={approveMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve & Deploy
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}