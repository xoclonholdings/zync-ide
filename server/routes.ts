import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";
import { storage } from "./storage";
import { authService } from "./services/auth";
import { executorService } from "./services/executor";
import { filesystemService } from "./services/filesystem";
import { terminalService } from "./services/terminal";
import { fantasmaService } from "./services/integrations/fantasma";
import { zebulonService } from "./services/integrations/zebulon";
import { adminRouter } from "./routes/admin";
import { unlimitedFeatures } from "./services/unlimited-features";
import { requireApproval, requireFeatureApproval } from "./middleware/approval-required";
import { adminApproval } from "./services/admin-approval";
import { insertUserSchema, insertProjectSchema, insertFileSchema, insertIntegrationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Admin routes (unlimited features)
  app.use("/api/admin", adminRouter);

  // Admin approval management routes
  app.get("/api/admin/pending-requests", async (req, res) => {
    try {
      const pendingRequests = adminApproval.getPendingRequests();
      res.json({ success: true, requests: pendingRequests });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/admin/approve/:requestId", async (req, res) => {
    try {
      const { requestId } = req.params;
      const { reviewNotes } = req.body;
      const adminId = 1; // In a real implementation, get from auth token
      
      const approved = await adminApproval.approveRequest(requestId, adminId, reviewNotes);
      
      if (approved) {
        // If it's a project creation request, actually create the project
        const request = adminApproval.getAllRequests().find(r => r.id === requestId);
        if (request && request.requestType === 'project_creation') {
          const project = await storage.createProject({ 
            ...request.requestData, 
            userId: request.userId 
          });
          res.json({ 
            success: true, 
            message: "Request approved and project created",
            project 
          });
        } else {
          res.json({ success: true, message: "Request approved" });
        }
      } else {
        res.status(404).json({ success: false, error: "Request not found or already processed" });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/admin/reject/:requestId", async (req, res) => {
    try {
      const { requestId } = req.params;
      const { reviewNotes } = req.body;
      const adminId = 1; // In a real implementation, get from auth token
      
      const rejected = await adminApproval.rejectRequest(requestId, adminId, reviewNotes);
      
      if (rejected) {
        res.json({ success: true, message: "Request rejected" });
      } else {
        res.status(404).json({ success: false, error: "Request not found or already processed" });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Update admin email endpoint
  app.post("/api/auth/update-admin-email", async (req, res) => {
    try {
      const { email } = req.body;
      const adminUser = await storage.getUserByUsername('admin_dgn');
      if (adminUser) {
        const updated = await storage.updateUser(adminUser.id, { email });
        if (updated) {
          res.json({ success: true, message: 'Admin email updated', user: { username: updated.username, email: updated.email } });
        } else {
          res.status(400).json({ success: false, error: 'Failed to update email' });
        }
      } else {
        res.status(404).json({ success: false, error: 'Admin user not found' });
      }
    } catch (error: any) {
      console.error('[admin] Error updating admin email:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // Create admin user endpoint for development
  app.post("/api/auth/create-admin", async (req, res) => {
    try {
      // Check if admin_dgn already exists
      const existingUser = await storage.getUserByUsername('admin_dgn');
      if (existingUser) {
        return res.json({ success: true, message: 'Admin user already exists', user: { username: existingUser.username, email: existingUser.email } });
      }

      // Create the admin_dgn user
      const adminUser = await storage.createUser({
        username: 'admin_dgn',
        email: 'devin@xoclonholdings.property',
        password: 'admin123' // Simple password for development
      });

      res.json({ success: true, message: 'Admin user created', user: { id: adminUser.id, username: adminUser.username, email: adminUser.email } });
    } catch (error: any) {
      console.error('[admin] Error creating admin user:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await authService.register(userData);
      res.json({ success: true, user: { id: user.id, username: user.username, email: user.email } });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.json({ success: false, error: "Username and password required" });
      }
      
      const result = await authService.login(username, password);
      res.json(result);
    } catch (error: any) {
      console.error('[auth] Login error:', error);
      res.json({ success: false, error: error.message || 'Login failed' });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        await authService.logout(token);
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ success: false, error: "No token provided" });
      }
      
      const user = await authService.getCurrentUser(token);
      res.json({ success: true, user });
    } catch (error: any) {
      res.status(401).json({ success: false, error: error.message });
    }
  });

  // Hybrid AI Agent endpoints
  app.post("/api/ai/analyze", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ success: false, error: "No token provided" });
      }
      
      const user = await authService.getCurrentUser(token);
      if (!user) {
        return res.status(401).json({ success: false, error: "Invalid token" });
      }

      const { hybridAIAgent } = await import('./services/hybrid-ai-agent');
      const result = await hybridAIAgent.processRequest(req.body);
      res.json(result);
    } catch (error: any) {
      console.error('[hybrid-ai] Analysis error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/ai/generate-project", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ success: false, error: "No token provided" });
      }
      
      const user = await authService.getCurrentUser(token);
      if (!user) {
        return res.status(401).json({ success: false, error: "Invalid token" });
      }

      const { projectType, description, language, useLocal } = req.body;
      const { hybridAIAgent } = await import('./services/hybrid-ai-agent');
      const result = await hybridAIAgent.processRequest({
        type: 'generate',
        prompt: `Generate a ${projectType} project: ${description}`,
        language,
        projectType,
        useLocal
      });
      res.json(result);
    } catch (error: any) {
      console.error('[hybrid-ai] Project generation error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/ai/chat", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ success: false, error: "No token provided" });
      }
      
      const user = await authService.getCurrentUser(token);
      if (!user) {
        return res.status(401).json({ success: false, error: "Invalid token" });
      }

      const { message, codeContext, projectContext, useLocal } = req.body;
      const { hybridAIAgent } = await import('./services/hybrid-ai-agent');
      const result = await hybridAIAgent.chatWithCode(message, codeContext, projectContext, useLocal);
      res.json(result);
    } catch (error: any) {
      console.error('[hybrid-ai] Chat error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/ai/health", async (req, res) => {
    try {
      const { hybridAIAgent } = await import('./services/hybrid-ai-agent');
      const health = await hybridAIAgent.healthCheck();
      const status = hybridAIAgent.getStatus();
      
      res.json({ 
        success: true, 
        ...health,
        model: "hybrid-ai-claude-4-local",
        status: {
          requestCount: status.requestCount,
          hourlyLimit: status.hourlyLimit,
          anthropicAvailable: status.anthropicAvailable
        }
      });
    } catch (error: any) {
      console.error('[hybrid-ai] Health check error:', error);
      res.json({ success: false, healthy: false, error: error.message });
    }
  });

  // Multi-agent routing test endpoint (no auth required)
  app.post("/api/ai/test", async (req, res) => {
    try {
      const { message, forceLocal, preferredModel } = req.body;
      const { multiAgentRouter } = await import('./services/multi-agent-router');
      
      // Test multi-agent routing system
      const result = await multiAgentRouter.route({
        prompt: message || "ZYNC multi-agent test - which provider is responding?",
        preferredModel,
        forceProvider: forceLocal ? 'local' : undefined
      });
      
      console.log(`[ROUTER] 🤖 ${result.provider} provider responded`);
      
      res.json({ 
        success: true, 
        response: result.response,
        model: result.model,
        provider: result.provider,
        fallbackUsed: result.fallbackUsed,
        tokens: result.tokens,
        status: `${result.provider} Active`
      });
    } catch (error: any) {
      console.error('[router] Test error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Multi-agent router status endpoint
  app.get("/api/ai/router/status", async (req, res) => {
    try {
      const { multiAgentRouter } = await import('./services/multi-agent-router');
      const status = multiAgentRouter.getStatus();
      const health = await multiAgentRouter.healthCheck();
      
      res.json({ 
        success: true,
        ...status,
        health,
        integrationTree: {
          primary: ['OpenAI', 'Anthropic'],
          experimental: ['Julius/Zync'],
          local: ['Ollama', 'ZYNC Local'],
          active: health.primaryProvider
        }
      });
    } catch (error: any) {
      console.error('[router] Status error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // User settings endpoints
  app.get("/api/settings", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ success: false, error: "No token provided" });
      }
      
      const user = await authService.getCurrentUser(token);
      if (!user) {
        return res.status(401).json({ success: false, error: "Invalid token" });
      }

      // Get user settings from database or return defaults
      const userSettings = await storage.getUserSettings(user.id);
      res.json({ success: true, settings: userSettings || {} });
    } catch (error: any) {
      console.error('[settings] Error getting user settings:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ success: false, error: "No token provided" });
      }
      
      const user = await authService.getCurrentUser(token);
      if (!user) {
        return res.status(401).json({ success: false, error: "Invalid token" });
      }

      const settings = req.body;
      const savedSettings = await storage.saveUserSettings(user.id, settings);
      res.json({ success: true, settings: savedSettings });
    } catch (error: any) {
      console.error('[settings] Error saving user settings:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // User profile update endpoints
  app.post("/api/auth/update-profile", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ success: false, error: "No token provided" });
      }
      
      const user = await authService.getCurrentUser(token);
      if (!user) {
        return res.status(401).json({ success: false, error: "Invalid token" });
      }

      const { username, email, currentPassword, newPassword } = req.body;
      
      // If changing password, verify current password first
      if (newPassword && currentPassword) {
        // For development, we're using plain text passwords
        if (user.password !== currentPassword) {
          return res.status(400).json({ success: false, error: "Current password is incorrect" });
        }
      }

      // Check if username is already taken (if being changed)
      if (username && username !== user.username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser && existingUser.id !== user.id) {
          return res.status(400).json({ success: false, error: "Username already exists" });
        }
      }

      // Update user data
      const updateData: any = {};
      if (username && username !== user.username) updateData.username = username;
      if (email && email !== user.email) updateData.email = email;
      if (newPassword) updateData.password = newPassword; // For development

      if (Object.keys(updateData).length === 0) {
        return res.json({ success: true, message: "No changes to update", user });
      }

      const updatedUser = await storage.updateUser(user.id, updateData);
      if (updatedUser) {
        res.json({ success: true, message: "Profile updated successfully", user: updatedUser });
      } else {
        res.status(400).json({ success: false, error: "Failed to update profile" });
      }
    } catch (error: any) {
      console.error('[auth] Error updating profile:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Project routes
  app.get("/api/projects", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ success: false, error: "No token provided" });
      }
      const user = await authService.getCurrentUser(token);
      const projects = await storage.getProjectsByUserId(user.id);
      res.json({ success: true, projects });
    } catch (error: any) {
      res.status(401).json({ success: false, error: error.message });
    }
  });

  // Project creation request (requires approval)
  app.post("/api/projects/request", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ success: false, error: "No token provided" });
      }
      const user = await authService.getCurrentUser(token);
      const projectData = insertProjectSchema.parse(req.body);
      
      // Submit request for admin approval
      const result = await adminApproval.requestFeatureApproval(
        user.id,
        'project_creation',
        `Create project: ${projectData.name} (${projectData.template})`,
        projectData
      );
      
      if (result.requiresApproval) {
        res.json({ 
          success: true, 
          message: "Project creation request submitted for admin approval",
          requestId: result.requestId,
          status: 'pending_approval'
        });
      } else {
        // User already has approval, create project directly
        const project = await storage.createProject({ ...projectData, userId: user.id });
        res.json({ success: true, project });
      }
    } catch (error: any) {
      console.error('Project request error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // Direct project creation (for authenticated users)
  app.post("/api/projects", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ success: false, error: "No token provided" });
      }
      const user = await authService.getCurrentUser(token);
      const projectData = insertProjectSchema.parse(req.body);
      console.log('Creating project:', projectData, 'for user:', user.id);
      const project = await storage.createProject({ ...projectData, userId: user.id });
      console.log('Project created:', project);
      res.json({ success: true, project });
    } catch (error: any) {
      console.error('Project creation error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const project = await storage.getProject(parseInt(id));
      if (!project) {
        return res.status(404).json({ success: false, error: "Project not found" });
      }
      res.json({ success: true, project });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(parseInt(id), updateData);
      if (!project) {
        return res.status(404).json({ success: false, error: "Project not found" });
      }
      res.json({ success: true, project });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteProject(parseInt(id));
      res.json({ success: true, deleted });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // File routes
  app.get("/api/projects/:projectId/files", async (req, res) => {
    try {
      const { projectId } = req.params;
      const files = await storage.getFilesByProjectId(parseInt(projectId));
      res.json({ success: true, files });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.post("/api/projects/:projectId/files", requireApproval('upload_file'), async (req, res) => {
    try {
      const { projectId } = req.params;
      const fileData = insertFileSchema.parse({ ...req.body, projectId: parseInt(projectId) });
      const file = await storage.createFile(fileData);
      res.json({ success: true, file });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.get("/api/files/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const file = await storage.getFile(parseInt(id));
      if (!file) {
        return res.status(404).json({ success: false, error: "File not found" });
      }
      res.json({ success: true, file });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.put("/api/files/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = insertFileSchema.partial().parse(req.body);
      const file = await storage.updateFile(parseInt(id), updateData);
      if (!file) {
        return res.status(404).json({ success: false, error: "File not found" });
      }
      res.json({ success: true, file });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.delete("/api/files/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteFile(parseInt(id));
      res.json({ success: true, deleted });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // Code execution routes (require approval)
  app.post("/api/execute", requireApproval('execute_code'), async (req, res) => {
    try {
      const { language, code, projectPath } = req.body;
      const result = await executorService.executeCode(language, code, projectPath);
      res.json({ success: true, result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // File system routes
  app.post("/api/filesystem/read", async (req, res) => {
    try {
      const { path } = req.body;
      const result = await filesystemService.readFile(path);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.post("/api/filesystem/write", async (req, res) => {
    try {
      const { path, content } = req.body;
      const result = await filesystemService.writeFile(path, content);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.post("/api/filesystem/readdir", async (req, res) => {
    try {
      const { path } = req.body;
      const result = await filesystemService.readDirectory(path);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // Terminal routes
  app.post("/api/terminal/execute", requireApproval('run_terminal'), async (req, res) => {
    try {
      const { command, cwd } = req.body;
      const result = await terminalService.executeCommand(command, cwd);
      res.json({ success: true, result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // Integration routes
  app.get("/api/integrations", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const user = await authService.getCurrentUser(token!);
      const integrations = await storage.getIntegrationsByUserId(user.id);
      res.json({ success: true, integrations });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.post("/api/integrations", requireApproval('access_integration'), async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const user = await authService.getCurrentUser(token!);
      const integrationData = insertIntegrationSchema.parse(req.body);
      const integration = await storage.createIntegration({ ...integrationData, userId: user.id });
      res.json({ success: true, integration });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // Fantasma Firewall integration routes (require approval)
  app.post("/api/integrations/fantasma/connect", requireApproval('access_integration'), async (req, res) => {
    try {
      const { apiKey, endpoint } = req.body;
      const result = await fantasmaService.connect(apiKey, endpoint);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.post("/api/integrations/fantasma/status", async (req, res) => {
    try {
      const result = await fantasmaService.getStatus();
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // Zebulon Interface integration routes (require approval)
  app.post("/api/integrations/zebulon/connect", requireApproval('access_integration'), async (req, res) => {
    try {
      const { apiKey, endpoint } = req.body;
      const result = await zebulonService.connect(apiKey, endpoint);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.post("/api/integrations/zebulon/projects", async (req, res) => {
    try {
      const result = await zebulonService.getProjects();
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // Documentation endpoint
  app.get("/api/docs/:filename", async (req, res) => {
    try {
      const { filename } = req.params;
      const allowedFiles = [
        "ADMIN_SETUP_GUIDE.md",
        "CONFIGURATION_HOW_TO.md", 
        "IDE_USER_GUIDE.md",
        "DEPLOYMENT_GUIDE.md",
        "ADMIN_APPROVAL_SYSTEM.md"
      ];
      
      if (!allowedFiles.includes(filename)) {
        return res.status(404).json({ success: false, error: "Documentation file not found" });
      }
      
      const filePath = path.join(process.cwd(), "docs", filename);
      
      if (!existsSync(filePath)) {
        return res.status(404).json({ success: false, error: "Documentation file not found" });
      }
      
      const content = await fs.readFile(filePath, "utf-8");
      res.json({ success: true, content, filename });
    } catch (error) {
      console.error("Documentation error:", error);
      res.status(500).json({ success: false, error: "Failed to load documentation" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
