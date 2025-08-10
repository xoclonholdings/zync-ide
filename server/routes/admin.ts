import { Router } from 'express';
import { unlimitedFeatures } from '../services/unlimited-features';
import { configManager } from '../config';
import { storage } from '../storage-sqlite';
import { adminApproval } from '../services/admin-approval';

const router = Router();

// Admin middleware - bypass all restrictions
router.use((req, res, next) => {
  // Enable admin bypass for the session
  if (req.headers.authorization) {
    const token = req.headers.authorization.replace('Bearer ', '');
    // In a real implementation, verify admin token
    // For now, allow all authenticated requests as admin
    if (token) {
      res.locals.isAdmin = true;
      res.locals.unlimitedAccess = true;
    }
  }
  next();
});

// GET /api/admin/capabilities - Get system capabilities
router.get('/capabilities', (req, res) => {
  try {
    const capabilities = unlimitedFeatures.getSystemCapabilities();
    res.json({ success: true, capabilities });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get capabilities' });
  }
});

// POST /api/admin/remove-limits - Remove all system limits
router.post('/remove-limits', async (req, res) => {
  try {
    await unlimitedFeatures.initializeUnlimitedMode();
    res.json({ 
      success: true, 
      message: 'All system limits removed successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to remove limits' });
  }
});

// POST /api/admin/emergency-override - Emergency limit override
router.post('/emergency-override', (req, res) => {
  try {
    const overrides = req.body.overrides || {};
    unlimitedFeatures.emergencyOverride(overrides);
    res.json({ 
      success: true, 
      message: 'Emergency override activated',
      overrides 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Emergency override failed' });
  }
});

// POST /api/admin/enable-bypass/:userId - Enable admin bypass for user
router.post('/enable-bypass/:userId', (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    unlimitedFeatures.enableAdminBypass(userId);
    res.json({ 
      success: true, 
      message: `Admin bypass enabled for user ${userId}` 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to enable bypass' });
  }
});

// GET /api/admin/config - Get current configuration
router.get('/config', (req, res) => {
  try {
    const config = configManager.get();
    res.json({ success: true, config });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get config' });
  }
});

// POST /api/admin/config/reload - Reload configuration
router.post('/config/reload', (req, res) => {
  try {
    configManager.reload();
    res.json({ 
      success: true, 
      message: 'Configuration reloaded successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to reload config' });
  }
});

// GET /api/admin/stats/detailed - Get detailed system statistics
router.get('/stats/detailed', async (req, res) => {
  try {
    const [storageStats, capabilities] = await Promise.all([
      storage.getStorageStats(),
      unlimitedFeatures.getSystemCapabilities()
    ]);

    const systemStats = {
      storage: storageStats,
      capabilities,
      process: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        uptime: process.uptime(),
        version: process.version,
        platform: process.platform,
        arch: process.arch
      },
      system: {
        loadavg: require('os').loadavg(),
        totalmem: require('os').totalmem(),
        freemem: require('os').freemem(),
        cpus: require('os').cpus().length
      }
    };

    res.json({ success: true, stats: systemStats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get detailed stats' });
  }
});

// POST /api/admin/optimize/database - Force database optimization
router.post('/optimize/database', async (req, res) => {
  try {
    await storage.optimizeDatabase();
    res.json({ 
      success: true, 
      message: 'Database optimization completed' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database optimization failed' });
  }
});

// GET /api/admin/users/all - Get all users (unlimited)
router.get('/users/all', async (req, res) => {
  try {
    // This would normally be limited, but admin has unlimited access
    const users = await storage.getAllUsers(); // Would need to implement this method
    res.json({ success: true, users, total: users.length });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get users' });
  }
});

// GET /api/admin/projects/all - Get all projects (unlimited)
router.get('/projects/all', async (req, res) => {
  try {
    // Admin can see all projects regardless of limits
    const projects = await storage.getAllProjects(); // Would need to implement this method
    res.json({ success: true, projects, total: projects.length });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get projects' });
  }
});

// POST /api/admin/limits/override - Override specific limits
router.post('/limits/override', (req, res) => {
  try {
    const { limits } = req.body;
    
    // Apply unlimited overrides
    Object.keys(limits).forEach(key => {
      if (limits[key] === 'unlimited') {
        (global as any)[`MAX_${key.toUpperCase()}`] = Infinity;
      } else {
        (global as any)[`MAX_${key.toUpperCase()}`] = limits[key];
      }
    });

    res.json({ 
      success: true, 
      message: 'Limits overridden successfully',
      appliedLimits: limits 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to override limits' });
  }
});

// POST /api/admin/features/enable-all - Enable all features with unlimited capabilities
router.post('/features/enable-all', async (req, res) => {
  try {
    // Enable all features with unlimited capabilities
    const features = {
      terminal: true,
      codeExecution: true,
      fileWatcher: true,
      multiUser: true,
      realTimeSync: true,
      clustering: true,
      loadBalancing: true,
      autoScaling: true
    };

    Object.keys(features).forEach(feature => {
      (global as any)[`FEATURE_${feature.toUpperCase()}_ENABLED`] = true;
      (global as any)[`FEATURE_${feature.toUpperCase()}_UNLIMITED`] = true;
    });

    res.json({ 
      success: true, 
      message: 'All features enabled with unlimited capabilities',
      enabledFeatures: features 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to enable features' });
  }
});

// === APPROVAL MANAGEMENT ROUTES ===

// GET /api/admin/approvals/pending - Get pending approval requests
router.get('/approvals/pending', (req, res) => {
  try {
    const pending = adminApproval.getPendingRequests();
    res.json({ success: true, requests: pending });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get pending requests' });
  }
});

// GET /api/admin/approvals/all - Get all approval requests
router.get('/approvals/all', (req, res) => {
  try {
    const all = adminApproval.getAllRequests();
    res.json({ success: true, requests: all });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get requests' });
  }
});

// POST /api/admin/approvals/:requestId/approve - Approve a request
router.post('/approvals/:requestId/approve', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reviewNotes } = req.body;
    const adminId = 1; // In real implementation, get from auth token
    
    const approved = await adminApproval.approveRequest(requestId, adminId, reviewNotes);
    
    if (approved) {
      res.json({ success: true, message: 'Request approved successfully' });
    } else {
      res.status(404).json({ success: false, error: 'Request not found or already processed' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to approve request' });
  }
});

// POST /api/admin/approvals/:requestId/reject - Reject a request
router.post('/approvals/:requestId/reject', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reviewNotes } = req.body;
    const adminId = 1; // In real implementation, get from auth token
    
    const rejected = await adminApproval.rejectRequest(requestId, adminId, reviewNotes);
    
    if (rejected) {
      res.json({ success: true, message: 'Request rejected successfully' });
    } else {
      res.status(404).json({ success: false, error: 'Request not found or already processed' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to reject request' });
  }
});

// POST /api/admin/approvals/user/:userId/preapprove - Pre-approve user for all features
router.post('/approvals/user/:userId/preapprove', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const adminId = 1; // In real implementation, get from auth token
    
    await adminApproval.preApproveUser(userId, adminId);
    res.json({ success: true, message: `User ${userId} pre-approved for all features` });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to pre-approve user' });
  }
});

// POST /api/admin/approvals/user/:userId/revoke - Revoke user approval for feature
router.post('/approvals/user/:userId/revoke', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { requestType } = req.body;
    const adminId = 1; // In real implementation, get from auth token
    
    const revoked = await adminApproval.revokeApproval(userId, requestType, adminId);
    
    if (revoked) {
      res.json({ success: true, message: `Approval revoked for user ${userId}` });
    } else {
      res.status(404).json({ success: false, error: 'No approval found to revoke' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to revoke approval' });
  }
});

// GET /api/admin/approvals/stats - Get approval statistics
router.get('/approvals/stats', (req, res) => {
  try {
    const stats = adminApproval.getApprovalStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get approval stats' });
  }
});

// POST /api/admin/approvals/emergency-override - Emergency approval override
router.post('/approvals/emergency-override', async (req, res) => {
  try {
    const { reason } = req.body;
    const adminId = 1; // In real implementation, get from auth token
    
    await adminApproval.emergencyApprovalOverride(adminId, reason);
    res.json({ 
      success: true, 
      message: 'Emergency approval override activated',
      expiresIn: '1 hour'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to activate emergency override' });
  }
});

// POST /api/admin/approvals/disable-override - Disable emergency override
router.post('/approvals/disable-override', async (req, res) => {
  try {
    await adminApproval.disableEmergencyOverride();
    res.json({ success: true, message: 'Emergency override disabled' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to disable override' });
  }
});

export { router as adminRouter };