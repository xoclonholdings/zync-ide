// AI Integration API Routes for ZYNC
import type { Express } from "express";
import { multiAgentRouter } from '../services/multi-agent-router';

export function setupAIIntegrationRoutes(app: Express) {
  // API Key Management Routes
  app.get('/api/integrations/keys', async (req, res) => {
    try {
      // Return mock data for now - in production this would fetch from encrypted storage
      const apiKeys = [
        {
          id: '1',
          provider: 'openai',
          name: 'OpenAI Production Key',
          key: process.env.OPENAI_API_KEY ? 'sk-proj-' + '•'.repeat(40) : '',
          status: process.env.OPENAI_API_KEY ? 'active' : 'inactive',
          lastUsed: process.env.OPENAI_API_KEY ? new Date().toISOString() : undefined,
          requestCount: 0,
          isEnabled: !!process.env.OPENAI_API_KEY
        },
        {
          id: '2',
          provider: 'anthropic',
          name: 'Anthropic Claude Key',
          key: process.env.ANTHROPIC_API_KEY2 ? 'sk-ant-' + '•'.repeat(40) : '',
          status: process.env.ANTHROPIC_API_KEY2 ? 'active' : 'inactive',
          lastUsed: process.env.ANTHROPIC_API_KEY2 ? new Date().toISOString() : undefined,
          requestCount: 0,
          isEnabled: !!process.env.ANTHROPIC_API_KEY2
        }
      ].filter(key => key.key); // Only return keys that exist

      res.json(apiKeys);
    } catch (error: any) {
      console.error('[ai-integration] Error fetching API keys:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Validate API Key
  app.post('/api/integrations/validate', async (req, res) => {
    try {
      const { provider, key } = req.body;
      
      let isValid = false;
      let error = '';

      switch (provider) {
        case 'openai':
          try {
            const response = await fetch('https://api.openai.com/v1/models', {
              headers: { 'Authorization': `Bearer ${key}` }
            });
            isValid = response.ok;
            if (!isValid) error = 'Invalid OpenAI API key';
          } catch (e: any) {
            error = 'Failed to validate OpenAI key: ' + e.message;
          }
          break;

        case 'anthropic':
          try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'x-api-key': key,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
              },
              body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 1,
                messages: [{ role: 'user', content: 'test' }]
              })
            });
            isValid = response.ok || response.status === 400; // 400 is fine, means key works but request invalid
            if (!isValid) error = 'Invalid Anthropic API key';
          } catch (e: any) {
            error = 'Failed to validate Anthropic key: ' + e.message;
          }
          break;

        default:
          error = 'Unknown provider';
      }

      res.json({ valid: isValid, error });
    } catch (error: any) {
      console.error('[ai-integration] Validation error:', error);
      res.status(500).json({ valid: false, error: error.message });
    }
  });

  // Save API Key (mock endpoint)
  app.post('/api/integrations/keys', async (req, res) => {
    try {
      const { provider, key, name } = req.body;
      
      // In production, this would securely store the encrypted key
      console.log(`[ai-integration] Would store ${provider} key: ${name}`);
      
      res.json({ 
        success: true, 
        message: 'API key saved successfully',
        id: `${provider}_${Date.now()}`
      });
    } catch (error: any) {
      console.error('[ai-integration] Error saving API key:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Toggle API Key
  app.post('/api/integrations/keys/:id/toggle', async (req, res) => {
    try {
      const { id } = req.params;
      const { isEnabled } = req.body;
      
      console.log(`[ai-integration] Toggle key ${id} to ${isEnabled ? 'enabled' : 'disabled'}`);
      
      res.json({ success: true, isEnabled });
    } catch (error: any) {
      console.error('[ai-integration] Error toggling API key:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Delete API Key
  app.delete('/api/integrations/keys/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      console.log(`[ai-integration] Delete key ${id}`);
      
      res.json({ success: true, message: 'API key deleted' });
    } catch (error: any) {
      console.error('[ai-integration] Error deleting API key:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // AI Provider Status
  app.get('/api/ai/status', async (req, res) => {
    try {
      const routerStatus = multiAgentRouter.getStatus();
      const health = await multiAgentRouter.healthCheck();
      
      const providerStatus = {
        openai: {
          available: !!process.env.OPENAI_API_KEY,
          status: process.env.OPENAI_API_KEY ? 'configured' : 'missing_key',
          model: 'gpt-4o'
        },
        anthropic: {
          available: !!process.env.ANTHROPIC_API_KEY2,
          status: process.env.ANTHROPIC_API_KEY2 ? 'configured' : 'missing_key',
          model: 'claude-3-5-sonnet-20241022'
        },
        local: {
          available: true,
          status: 'active',
          model: 'zync-local-v1'
        }
      };

      res.json({
        success: true,
        providers: providerStatus,
        routing: routerStatus,
        health,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('[ai-integration] Status error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // AI Credit/Quota Check
  app.get('/api/ai/credits', async (req, res) => {
    try {
      const credits = {
        openai: {
          available: !!process.env.OPENAI_API_KEY,
          usage: 'Unknown',
          limit: 'Unknown',
          resetDate: null
        },
        anthropic: {
          available: !!process.env.ANTHROPIC_API_KEY2,
          usage: 'Unknown',
          limit: 'Unknown',
          resetDate: null
        },
        local: {
          available: true,
          usage: 'Unlimited',
          limit: 'Unlimited',
          resetDate: null
        }
      };

      res.json({ success: true, credits });
    } catch (error: any) {
      console.error('[ai-integration] Credits check error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
}