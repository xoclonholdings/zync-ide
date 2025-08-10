// ZYNC Multi-Agent Router - Intelligent AI Model Selection
// import { HybridAIAgent } from './hybrid-ai-agent';

export interface AIProvider {
  name: string;
  priority: number;
  available: boolean;
  endpoint?: string;
  apiKey?: string;
  models: string[];
  rateLimits?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

export interface RoutingRequest {
  prompt: string;
  context?: string;
  preferredModel?: string;
  maxTokens?: number;
  temperature?: number;
  forceProvider?: string;
}

export interface RoutingResponse {
  response: string;
  provider: string;
  model: string;
  tokens: number;
  cost?: number;
  fallbackUsed: boolean;
  metadata: any;
}

export class MultiAgentRouter {
  private providers: Map<string, AIProvider> = new Map();
  private hybridAgent: any; // Dynamic import
  private requestCounts: Map<string, number> = new Map();
  private lastReset: Date = new Date();

  constructor() {
    this.initializeProviders();
  }

  private async getHybridAgent() {
    if (!this.hybridAgent) {
      const { hybridAIAgent } = await import('./hybrid-ai-agent');
      this.hybridAgent = hybridAIAgent;
    }
    return this.hybridAgent;
  }

  private initializeProviders() {
    // Define provider hierarchy: OpenAI > Anthropic > Julius > Ollama > Local
    const providers: AIProvider[] = [
      {
        name: 'openai',
        priority: 1,
        available: !!process.env.OPENAI_API_KEY,
        endpoint: 'https://api.openai.com/v1/chat/completions',
        apiKey: process.env.OPENAI_API_KEY,
        models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
        rateLimits: { requestsPerMinute: 60, tokensPerMinute: 90000 }
      },
      {
        name: 'anthropic',
        priority: 2,
        available: !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY2),
        endpoint: 'https://api.anthropic.com/v1/messages',
        apiKey: process.env.ANTHROPIC_API_KEY2 || process.env.ANTHROPIC_API_KEY,
        models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
        rateLimits: { requestsPerMinute: 50, tokensPerMinute: 100000 }
      },
      {
        name: 'julius',
        priority: 3,
        available: !!process.env.JULIUS_API_KEY,
        endpoint: process.env.JULIUS_ENDPOINT || 'https://api.julius.ai/v1/chat',
        apiKey: process.env.JULIUS_API_KEY,
        models: ['julius-v1', 'zync-agent'],
        rateLimits: { requestsPerMinute: 30, tokensPerMinute: 50000 }
      },
      {
        name: 'ollama',
        priority: 4,
        available: true, // Assume available for local testing
        endpoint: process.env.OLLAMA_ENDPOINT || 'http://localhost:11434/api/generate',
        models: ['llama3', 'mistral', 'zedlite', 'codellama'],
        rateLimits: { requestsPerMinute: 1000, tokensPerMinute: 500000 }
      },
      {
        name: 'local',
        priority: 5,
        available: true, // Always available
        models: ['zync-local-v1'],
        rateLimits: { requestsPerMinute: 10000, tokensPerMinute: 1000000 }
      }
    ];

    providers.forEach(provider => {
      this.providers.set(provider.name, provider);
      this.requestCounts.set(provider.name, 0);
    });
  }

  private checkRateLimits(providerName: string): boolean {
    const provider = this.providers.get(providerName);
    if (!provider?.rateLimits) return true;

    // Reset counters every minute
    const now = new Date();
    if (now.getTime() - this.lastReset.getTime() > 60000) {
      this.requestCounts.clear();
      this.lastReset = now;
    }

    const currentCount = this.requestCounts.get(providerName) || 0;
    return currentCount < provider.rateLimits.requestsPerMinute;
  }

  private incrementRequestCount(providerName: string) {
    const current = this.requestCounts.get(providerName) || 0;
    this.requestCounts.set(providerName, current + 1);
  }

  private async testProviderAvailability(provider: AIProvider): Promise<boolean> {
    try {
      switch (provider.name) {
        case 'openai':
          return await this.testOpenAI(provider);
        case 'anthropic':
          return await this.testAnthropic(provider);
        case 'julius':
          return await this.testJulius(provider);
        case 'ollama':
          return await this.testOllama(provider);
        case 'local':
          return true; // Always available
        default:
          return false;
      }
    } catch (error: any) {
      console.error(`[router] Provider ${provider.name} test failed:`, error?.message || error);
      return false;
    }
  }

  private async testOpenAI(provider: AIProvider): Promise<boolean> {
    if (!provider.apiKey) return false;
    
    const response = await fetch(provider.endpoint!, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: provider.models[0],
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1
      })
    });
    
    return response.ok;
  }

  private async testAnthropic(provider: AIProvider): Promise<boolean> {
    if (!provider.apiKey) return false;
    
    const response = await fetch(provider.endpoint!, {
      method: 'POST',
      headers: {
        'x-api-key': provider.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: provider.models[0],
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }]
      })
    });
    
    return response.ok;
  }

  private async testJulius(provider: AIProvider): Promise<boolean> {
    if (!provider.apiKey) return false;
    // Julius/Zync API test implementation would go here
    return false; // Not implemented yet
  }

  private async testOllama(provider: AIProvider): Promise<boolean> {
    try {
      const response = await fetch(`${provider.endpoint!.replace('/api/generate', '/api/tags')}`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async route(request: RoutingRequest): Promise<RoutingResponse> {
    console.log('[router] Processing routing request');

    // If a specific provider is forced, use it
    if (request.forceProvider) {
      const provider = this.providers.get(request.forceProvider);
      if (provider?.available) {
        return await this.executeRequest(provider, request);
      }
    }

    // Get available providers sorted by priority
    const availableProviders = Array.from(this.providers.values())
      .filter(p => p.available)
      .sort((a, b) => a.priority - b.priority);

    // Try each provider in order
    for (const provider of availableProviders) {
      // Check rate limits
      if (!this.checkRateLimits(provider.name)) {
        console.log(`[router] Rate limit reached for ${provider.name}, trying next provider`);
        continue;
      }

      // Test availability (can be cached)
      const isAvailable = await this.testProviderAvailability(provider);
      if (!isAvailable) {
        console.log(`[router] Provider ${provider.name} unavailable, trying next`);
        continue;
      }

      try {
        const response = await this.executeRequest(provider, request);
        this.incrementRequestCount(provider.name);
        return response;
      } catch (error: any) {
        console.error(`[router] Provider ${provider.name} failed:`, error?.message || error);
        continue;
      }
    }

    // If all providers fail, use local as absolute fallback
    const localProvider = this.providers.get('local')!;
    return await this.executeRequest(localProvider, request, true);
  }

  private async executeRequest(
    provider: AIProvider, 
    request: RoutingRequest, 
    isEmergencyFallback = false
  ): Promise<RoutingResponse> {
    console.log(`[router] Executing request with ${provider.name}`);

    const hybridAgent = await this.getHybridAgent();

    if (provider.name === 'local' || isEmergencyFallback) {
      // Use existing hybrid AI agent for local processing
      const result = await hybridAgent.chatWithCode(
        request.prompt,
        request.context,
        undefined,
        true // Force local mode
      );

      return {
        response: result.response,
        provider: 'local',
        model: 'zync-local-v1',
        tokens: result.response.length,
        fallbackUsed: isEmergencyFallback,
        metadata: result.metadata
      };
    }

    // Implement actual API calls for other providers here
    // For now, delegate to hybrid agent
    const result = await hybridAgent.chatWithCode(
      request.prompt,
      request.context,
      undefined,
      provider.name === 'local'
    );

    return {
      response: result.response,
      provider: provider.name,
      model: result.metadata?.model || provider.models[0],
      tokens: result.metadata?.tokensUsed || result.response.length,
      fallbackUsed: provider.priority > 2,
      metadata: result.metadata
    };
  }

  getStatus() {
    const providersStatus = Array.from(this.providers.entries()).map(([name, provider]) => ({
      name,
      available: provider.available,
      priority: provider.priority,
      requestCount: this.requestCounts.get(name) || 0,
      rateLimitStatus: this.checkRateLimits(name) ? 'OK' : 'LIMIT_REACHED'
    }));

    return {
      activeProviders: providersStatus.filter(p => p.available).length,
      totalProviders: providersStatus.length,
      providers: providersStatus,
      emergencyFallback: 'local'
    };
  }

  async healthCheck() {
    const results = new Map<string, boolean>();
    
    for (const [name, provider] of Array.from(this.providers.entries())) {
      if (provider.available) {
        results.set(name, await this.testProviderAvailability(provider));
      } else {
        results.set(name, false);
      }
    }

    return {
      healthy: results.get('local') === true, // At minimum, local should work
      providers: Object.fromEntries(results),
      primaryProvider: Array.from(results.entries()).find(([name, available]) => available)?.[0] || 'local'
    };
  }
}

// Export singleton instance
export const multiAgentRouter = new MultiAgentRouter();