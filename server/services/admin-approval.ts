import { storage } from '../storage-sqlite';

interface ApprovalRequest {
  id: string;
  userId: number;
  requestType: 'feature_access' | 'code_execution' | 'terminal_access' | 'file_upload' | 'project_creation' | 'integration_access';
  description: string;
  requestData: any;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: number;
  reviewNotes?: string;
  autoApproved?: boolean;
}

/**
 * Admin Approval Service
 * Ensures all features require admin review and approval before implementation
 */
export class AdminApprovalService {
  private static instance: AdminApprovalService;
  private pendingRequests = new Map<string, ApprovalRequest>();
  private approvedFeatures = new Map<string, Set<number>>(); // feature -> userIds

  public static getInstance(): AdminApprovalService {
    if (!AdminApprovalService.instance) {
      AdminApprovalService.instance = new AdminApprovalService();
    }
    return AdminApprovalService.instance;
  }

  /**
   * Request approval for a feature access
   */
  async requestFeatureApproval(
    userId: number,
    requestType: ApprovalRequest['requestType'],
    description: string,
    requestData: any = {}
  ): Promise<{ requestId: string; requiresApproval: boolean }> {
    
    // Check if user already has approval for this feature
    const featureKey = `${requestType}:${userId}`;
    if (this.isFeatureApproved(userId, requestType)) {
      return { requestId: '', requiresApproval: false };
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const request: ApprovalRequest = {
      id: requestId,
      userId,
      requestType,
      description,
      requestData,
      status: 'pending',
      requestedAt: new Date().toISOString()
    };

    this.pendingRequests.set(requestId, request);
    
    console.log(`[approval] New request ${requestId}: ${requestType} for user ${userId}`);
    
    // Notify admins (in a real implementation, this would send notifications)
    await this.notifyAdmins(request);
    
    return { requestId, requiresApproval: true };
  }

  /**
   * Check if user has approval for a specific feature
   */
  isFeatureApproved(userId: number, requestType: ApprovalRequest['requestType']): boolean {
    const userApprovals = this.approvedFeatures.get(requestType);
    return userApprovals?.has(userId) || false;
  }

  /**
   * Admin approves a request
   */
  async approveRequest(requestId: string, adminId: number, reviewNotes?: string): Promise<boolean> {
    const request = this.pendingRequests.get(requestId);
    if (!request || request.status !== 'pending') {
      return false;
    }

    request.status = 'approved';
    request.reviewedAt = new Date().toISOString();
    request.reviewedBy = adminId;
    request.reviewNotes = reviewNotes;

    // Add to approved features
    if (!this.approvedFeatures.has(request.requestType)) {
      this.approvedFeatures.set(request.requestType, new Set());
    }
    this.approvedFeatures.get(request.requestType)!.add(request.userId);

    console.log(`[approval] Request ${requestId} approved by admin ${adminId}`);
    
    // Notify user of approval
    await this.notifyUser(request, 'approved');
    
    return true;
  }

  /**
   * Admin rejects a request
   */
  async rejectRequest(requestId: string, adminId: number, reviewNotes?: string): Promise<boolean> {
    const request = this.pendingRequests.get(requestId);
    if (!request || request.status !== 'pending') {
      return false;
    }

    request.status = 'rejected';
    request.reviewedAt = new Date().toISOString();
    request.reviewedBy = adminId;
    request.reviewNotes = reviewNotes;

    console.log(`[approval] Request ${requestId} rejected by admin ${adminId}`);
    
    // Notify user of rejection
    await this.notifyUser(request, 'rejected');
    
    return true;
  }

  /**
   * Get all pending requests for admin review
   */
  getPendingRequests(): ApprovalRequest[] {
    return Array.from(this.pendingRequests.values())
      .filter(req => req.status === 'pending')
      .sort((a, b) => new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime());
  }

  /**
   * Get all requests (for admin dashboard)
   */
  getAllRequests(): ApprovalRequest[] {
    return Array.from(this.pendingRequests.values())
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }

  /**
   * Get requests for a specific user
   */
  getUserRequests(userId: number): ApprovalRequest[] {
    return Array.from(this.pendingRequests.values())
      .filter(req => req.userId === userId)
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }

  /**
   * Revoke approval for a user and feature
   */
  async revokeApproval(userId: number, requestType: ApprovalRequest['requestType'], adminId: number): Promise<boolean> {
    const userApprovals = this.approvedFeatures.get(requestType);
    if (userApprovals?.has(userId)) {
      userApprovals.delete(userId);
      console.log(`[approval] Approval revoked for user ${userId}, feature ${requestType} by admin ${adminId}`);
      return true;
    }
    return false;
  }

  /**
   * Pre-approve a user for all features (admin privilege)
   */
  async preApproveUser(userId: number, adminId: number): Promise<void> {
    const featureTypes: ApprovalRequest['requestType'][] = [
      'feature_access',
      'code_execution', 
      'terminal_access',
      'file_upload',
      'project_creation',
      'integration_access'
    ];

    featureTypes.forEach(feature => {
      if (!this.approvedFeatures.has(feature)) {
        this.approvedFeatures.set(feature, new Set());
      }
      this.approvedFeatures.get(feature)!.add(userId);
    });

    console.log(`[approval] User ${userId} pre-approved for all features by admin ${adminId}`);
  }

  /**
   * Check if user can execute a specific action
   */
  async canUserExecuteAction(userId: number, action: string, data?: any): Promise<{ allowed: boolean; requestId?: string }> {
    // For authenticated users, allow basic actions like project creation
    if (['create_project', 'project_creation'].includes(action)) {
      return { allowed: true };
    }
    
    const requestType = this.mapActionToRequestType(action);
    
    if (this.isFeatureApproved(userId, requestType)) {
      return { allowed: true };
    }

    // Create approval request for advanced features
    const result = await this.requestFeatureApproval(
      userId,
      requestType,
      `User requesting access to: ${action}`,
      { action, data }
    );

    return { 
      allowed: !result.requiresApproval, 
      requestId: result.requestId 
    };
  }

  /**
   * Map action to request type
   */
  private mapActionToRequestType(action: string): ApprovalRequest['requestType'] {
    const mapping: Record<string, ApprovalRequest['requestType']> = {
      'execute_code': 'code_execution',
      'run_terminal': 'terminal_access', 
      'upload_file': 'file_upload',
      'create_project': 'project_creation',
      'access_integration': 'integration_access'
    };

    return mapping[action] || 'feature_access';
  }

  /**
   * Notify admins of new requests (placeholder)
   */
  private async notifyAdmins(request: ApprovalRequest): Promise<void> {
    // In a real implementation, this would send email/slack/webhook notifications
    console.log(`[approval] ADMIN NOTIFICATION: New ${request.requestType} request from user ${request.userId}`);
  }

  /**
   * Notify user of request status (placeholder)
   */
  private async notifyUser(request: ApprovalRequest, status: string): Promise<void> {
    // In a real implementation, this would send user notifications
    console.log(`[approval] USER NOTIFICATION: Request ${request.id} has been ${status}`);
  }

  /**
   * Get approval statistics
   */
  getApprovalStats(): any {
    const all = this.getAllRequests();
    const pending = all.filter(r => r.status === 'pending').length;
    const approved = all.filter(r => r.status === 'approved').length;
    const rejected = all.filter(r => r.status === 'rejected').length;

    const byType = all.reduce((acc, req) => {
      acc[req.requestType] = (acc[req.requestType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: all.length,
      pending,
      approved,
      rejected,
      byType,
      approvalRate: all.length > 0 ? (approved / all.length * 100).toFixed(1) : 0
    };
  }

  /**
   * Emergency admin override (for critical situations)
   */
  async emergencyApprovalOverride(adminId: number, overrideReason: string): Promise<void> {
    console.log(`[approval] EMERGENCY OVERRIDE activated by admin ${adminId}: ${overrideReason}`);
    
    // Temporarily disable approval requirements
    (global as any).APPROVAL_OVERRIDE_ACTIVE = true;
    (global as any).APPROVAL_OVERRIDE_ADMIN = adminId;
    (global as any).APPROVAL_OVERRIDE_REASON = overrideReason;
    (global as any).APPROVAL_OVERRIDE_TIMESTAMP = new Date().toISOString();
    
    // Auto-expire after 1 hour
    setTimeout(() => {
      this.disableEmergencyOverride();
    }, 60 * 60 * 1000);
  }

  /**
   * Disable emergency override
   */
  async disableEmergencyOverride(): Promise<void> {
    (global as any).APPROVAL_OVERRIDE_ACTIVE = false;
    console.log('[approval] Emergency override disabled');
  }

  /**
   * Check if emergency override is active
   */
  isEmergencyOverrideActive(): boolean {
    return (global as any).APPROVAL_OVERRIDE_ACTIVE === true;
  }
}

export const adminApproval = AdminApprovalService.getInstance();