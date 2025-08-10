import { Request, Response, NextFunction } from 'express';
import { adminApproval } from '../services/admin-approval';

/**
 * Middleware to require admin approval for feature access
 */
export const requireApproval = (action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if emergency override is active
      if (adminApproval.isEmergencyOverrideActive()) {
        console.log(`[approval] Emergency override active - allowing ${action}`);
        return next();
      }

      // Get user ID from request (assuming auth middleware sets it)
      const userId = (req as any).user?.id || parseInt(req.headers['x-user-id'] as string) || 1;
      
      // Check if user can execute this action
      const result = await adminApproval.canUserExecuteAction(userId, action, req.body);
      
      if (result.allowed) {
        // User has approval, proceed
        return next();
      } else {
        // User needs approval, return waiting status
        return res.status(202).json({
          success: false,
          error: 'Admin approval required',
          message: `Your request for ${action} is pending admin approval`,
          requestId: result.requestId,
          status: 'pending_approval'
        });
      }
    } catch (error) {
      console.error('[approval] Error in approval middleware:', error);
      return res.status(500).json({
        success: false,
        error: 'Approval system error'
      });
    }
  };
};

/**
 * Middleware to check if user has specific feature approval
 */
export const requireFeatureApproval = (featureType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if emergency override is active
      if (adminApproval.isEmergencyOverrideActive()) {
        return next();
      }

      const userId = (req as any).user?.id || parseInt(req.headers['x-user-id'] as string) || 1;
      
      const hasApproval = adminApproval.isFeatureApproved(userId, featureType as any);
      
      if (hasApproval) {
        return next();
      } else {
        // Request approval for this feature
        const result = await adminApproval.requestFeatureApproval(
          userId,
          featureType as any,
          `Access to ${featureType} feature`,
          { feature: featureType, endpoint: req.path }
        );
        
        return res.status(202).json({
          success: false,
          error: 'Feature approval required',
          message: `Admin approval required for ${featureType} feature`,
          requestId: result.requestId,
          status: 'pending_approval'
        });
      }
    } catch (error) {
      console.error('[approval] Error in feature approval middleware:', error);
      return res.status(500).json({
        success: false,
        error: 'Feature approval system error'
      });
    }
  };
};

/**
 * Admin-only middleware
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  // In a real implementation, check if user is admin from auth token
  const isAdmin = req.headers.authorization?.includes('admin') || 
                  req.headers['x-admin'] === 'true' ||
                  (req as any).user?.role === 'admin';
  
  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  
  next();
};