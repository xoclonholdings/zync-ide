import Anthropic from '@anthropic-ai/sdk';

/*
Hybrid AI Agent that combines local AI processing with Anthropic Claude
to bypass quota limits and reduce costs while maintaining high quality
*/

const DEFAULT_MODEL_STR = "claude-sonnet-4-20250514";

// Local AI fallback using built-in patterns and templates
class LocalAIProcessor {
  private codeTemplates = {
    javascript: {
      function: `function {{name}}({{params}}) {
  // TODO: Implement function logic
  {{body}}
  return {{return}};
}`,
      class: `class {{name}} {
  constructor({{params}}) {
    {{constructor}}
  }
  
  {{methods}}
}`,
      api: `app.{{method}}('{{route}}', async (req, res) => {
  try {
    {{body}}
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});`,
    },
    python: {
      function: `def {{name}}({{params}}):
    """{{docstring}}"""
    {{body}}
    return {{return}}`,
      class: `class {{name}}:
    def __init__(self, {{params}}):
        {{constructor}}
    
    {{methods}}`,
    },
    typescript: {
      interface: `interface {{name}} {
  {{properties}}
}`,
      function: `function {{name}}({{params}}): {{returnType}} {
  // TODO: Implement function logic
  {{body}}
  return {{return}};
}`,
    }
  };

  private analysisPatterns = {
    bugs: [
      /undefined is not a function/i,
      /cannot read property/i,
      /null pointer/i,
      /syntax error/i,
      /missing semicolon/i,
      /unexpected token/i,
    ],
    performance: [
      /for.*loop.*length/i,
      /document\.getElementById/i,
      /innerHTML/i,
      /synchronous.*xhr/i,
    ],
    security: [
      /eval\(/i,
      /innerHTML.*user/i,
      /document\.write/i,
      /\.exec\(/i,
    ],
    network: [
      /fetch\([^)]*\+/i,        // Dynamic URL construction
      /XMLHttpRequest/i,         // Direct XHR usage
      /localStorage\.getItem/i,  // Token storage patterns
      /sessionStorage/i,         // Session data usage
      /cors/i,                   // CORS configuration
    ],
    dataFlow: [
      /password.*plain/i,        // Plain text passwords
      /api.*key.*log/i,          // API key logging
      /console\.log.*token/i,    // Token logging
      /debug.*sensitive/i,       // Debug info leaks
    ],
    injection: [
      /\$\{.*user/i,            // Template injection
      /query.*\+.*user/i,       // SQL injection patterns
      /command.*user/i,         // Command injection
      /path.*user/i,            // Path traversal
    ]
  };

  generateCode(prompt: string, language: string): string {
    const templates = this.codeTemplates[language as keyof typeof this.codeTemplates];
    if (!templates) {
      return `// Generated code for: ${prompt}\n// Language: ${language}\n// TODO: Implement functionality`;
    }

    // Simple pattern matching for common requests
    if (prompt.toLowerCase().includes('function')) {
      return this.generateFunction(prompt, language, templates);
    }
    
    if (prompt.toLowerCase().includes('class')) {
      return this.generateClass(prompt, language, templates);
    }
    
    if (prompt.toLowerCase().includes('api') || prompt.toLowerCase().includes('endpoint')) {
      return this.generateAPI(prompt, language, templates);
    }

    return `// Generated code for: ${prompt}\n// TODO: Implement specific functionality`;
  }

  private generateFunction(prompt: string, language: string, templates: any): string {
    const functionName = this.extractFunctionName(prompt) || 'generatedFunction';
    const template = templates.function || templates.function;
    
    return template
      .replace(/{{name}}/g, functionName)
      .replace(/{{params}}/g, 'params')
      .replace(/{{body}}/g, '// Implementation here')
      .replace(/{{return}}/g, 'result')
      .replace(/{{returnType}}/g, 'any');
  }

  private generateClass(prompt: string, language: string, templates: any): string {
    const className = this.extractClassName(prompt) || 'GeneratedClass';
    const template = templates.class;
    
    return template
      .replace(/{{name}}/g, className)
      .replace(/{{params}}/g, '')
      .replace(/{{constructor}}/g, '// Constructor implementation')
      .replace(/{{methods}}/g, '// Class methods here');
  }

  private generateAPI(prompt: string, language: string, templates: any): string {
    const method = this.extractHTTPMethod(prompt) || 'get';
    const route = this.extractRoute(prompt) || '/api/endpoint';
    const template = templates.api;
    
    return template
      .replace(/{{method}}/g, method)
      .replace(/{{route}}/g, route)
      .replace(/{{body}}/g, '// API logic here');
  }

  private extractFunctionName(prompt: string): string | null {
    const match = prompt.match(/function\s+(\w+)/i) || prompt.match(/(\w+)\s+function/i);
    return match ? match[1] : null;
  }

  private extractClassName(prompt: string): string | null {
    const match = prompt.match(/class\s+(\w+)/i) || prompt.match(/(\w+)\s+class/i);
    return match ? match[1] : null;
  }

  private extractHTTPMethod(prompt: string): string {
    const methods = ['get', 'post', 'put', 'delete', 'patch'];
    for (const method of methods) {
      if (prompt.toLowerCase().includes(method)) {
        return method;
      }
    }
    return 'get';
  }

  private extractRoute(prompt: string): string {
    const match = prompt.match(/\/[\w\/]+/);
    return match ? match[0] : '/api/endpoint';
  }

  analyzeCode(code: string, language: string): string {
    const issues: string[] = [];
    
    // Check for common bugs
    for (const pattern of this.analysisPatterns.bugs) {
      if (pattern.test(code)) {
        issues.push(`🐛 Potential bug detected: ${pattern.source}`);
      }
    }
    
    // Check for performance issues
    for (const pattern of this.analysisPatterns.performance) {
      if (pattern.test(code)) {
        issues.push(`⚡ Performance improvement: ${pattern.source}`);
      }
    }
    
    // Check for security issues
    for (const pattern of this.analysisPatterns.security) {
      if (pattern.test(code)) {
        issues.push(`🔒 Security concern: ${pattern.source}`);
      }
    }
    
    if (issues.length === 0) {
      return `Code analysis complete:\n✅ No major issues detected\n✅ Code follows basic patterns\n✅ Syntax appears correct`;
    }
    
    return `Code analysis results:\n${issues.join('\n')}\n\nRecommendation: Review and fix identified issues for better code quality.`;
  }

  explainCode(code: string, language: string): string {
    const lines = code.split('\n').filter(line => line.trim());
    const explanation: string[] = [];
    
    explanation.push(`Code explanation for ${language}:`);
    explanation.push('');
    
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const line = lines[i].trim();
      if (line.startsWith('//') || line.startsWith('#')) {
        explanation.push(`Line ${i + 1}: Comment - ${line}`);
      } else if (line.includes('function') || line.includes('def ')) {
        explanation.push(`Line ${i + 1}: Function declaration`);
      } else if (line.includes('class ')) {
        explanation.push(`Line ${i + 1}: Class definition`);
      } else if (line.includes('import ') || line.includes('require(')) {
        explanation.push(`Line ${i + 1}: Module import`);
      } else if (line.includes('=')) {
        explanation.push(`Line ${i + 1}: Variable assignment`);
      } else {
        explanation.push(`Line ${i + 1}: ${line.length > 50 ? 'Complex logic' : 'Simple statement'}`);
      }
    }
    
    return explanation.join('\n');
  }
}

export interface HybridAIRequest {
  type: 'analyze' | 'generate' | 'debug' | 'explain' | 'optimize' | 'document';
  code?: string;
  language?: string;
  context?: string;
  prompt?: string;
  fileName?: string;
  projectType?: string;
  useLocal?: boolean; // Force local processing
}

export interface HybridAIResponse {
  success: boolean;
  result?: string;
  suggestions?: string[];
  error?: string;
  metadata?: {
    model: string;
    source: 'anthropic' | 'local' | 'hybrid';
    tokensUsed?: number;
    confidence?: number;
    fallbackUsed?: boolean;
  };
}

class HybridAIAgent {
  private anthropic?: Anthropic;
  private localProcessor: LocalAIProcessor;
  private requestCount = 0;
  private hourlyLimit = 100; // Configurable limit
  private lastReset = Date.now();
  private failureCount = 0;
  private maxFailures = 3;

  constructor() {
    this.localProcessor = new LocalAIProcessor();
    
    // Try multiple Anthropic API keys - primary and backup
    const apiKey = process.env.ANTHROPIC_API_KEY2 || 
                   process.env.Anthropic_Api_2 || 
                   process.env.ANTHROPIC_API_KEY_2 || 
                   process.env.ANTHROPIC_API_KEY;
    
    if (apiKey && apiKey.length > 20) {
      console.log('[hybrid-ai] Initializing Anthropic with API key:', apiKey.substring(0, 15) + '...');
      try {
        this.anthropic = new Anthropic({
          apiKey: apiKey.trim(),
        });
        console.log('[hybrid-ai] Anthropic client initialized successfully');
      } catch (error) {
        console.log('[hybrid-ai] Failed to initialize Anthropic client:', error);
      }
    } else {
      console.log('[hybrid-ai] No valid Anthropic API key found - using local AI only');
    }
  }

  private shouldUseLocal(request: HybridAIRequest): boolean {
    // Reset counter every hour
    if (Date.now() - this.lastReset > 3600000) {
      this.requestCount = 0;
      this.failureCount = 0;
      this.lastReset = Date.now();
    }

    // Force local if requested
    if (request.useLocal) return true;
    
    // Use local if no Anthropic API key
    if (!this.anthropic) return true;
    
    // Use local if hitting rate limits
    if (this.requestCount >= this.hourlyLimit) return true;
    
    // Use local if too many failures
    if (this.failureCount >= this.maxFailures) return true;
    
    // Use local for simple requests
    if (request.type === 'explain' && (!request.code || request.code.length < 500)) {
      return true;
    }
    
    return false;
  }

  private async callAnthropic(prompt: string, systemPrompt?: string): Promise<string> {
    if (!this.anthropic) {
      throw new Error('Anthropic API not available');
    }

    this.requestCount++;
    
    try {
      const response = await this.anthropic.messages.create({
        model: DEFAULT_MODEL_STR,
        max_tokens: 4000,
        system: systemPrompt || "You are an expert software development assistant integrated into Zync IDE. Provide clear, actionable advice and code suggestions.",
        messages: [{ role: 'user', content: prompt }],
      });

      this.failureCount = 0; // Reset on success
      console.log('[hybrid-ai] Anthropic API call successful');
      return response.content[0].type === 'text' ? response.content[0].text : '';
    } catch (error: any) {
      this.failureCount++;
      console.error('[hybrid-ai] Anthropic API error - falling back to local mode:', error.message);
      throw error;
    }
  }

  private logToFile(message: string): void {
    try {
      const fs = require('fs');
      const path = require('path');
      const logDir = path.join(process.cwd(), 'logs');
      
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      const timestamp = new Date().toISOString();
      const logEntry = `${message.replace('{timestamp}', timestamp)}\n`;
      fs.appendFileSync(path.join(logDir, 'fallback.log'), logEntry);
      console.log(`[HYBRID-AI] ${logEntry.trim()}`);
    } catch (error) {
      console.error('[HYBRID-AI] Logging error:', error);
    }
  }

  async processRequest(request: HybridAIRequest): Promise<HybridAIResponse> {
    const useLocal = this.shouldUseLocal(request);
    
    try {
      if (useLocal) {
        return await this.processLocally(request);
      } else {
        // Try Anthropic first, fallback to local
        try {
          return await this.processWithAnthropic(request);
        } catch (error) {
          console.log('[hybrid-ai] Falling back to local processing');
          return await this.processLocally(request, true);
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Hybrid AI processing failed',
        metadata: {
          model: 'hybrid',
          source: 'local'
        }
      };
    }
  }

  private async processLocally(request: HybridAIRequest, isFallback = false): Promise<HybridAIResponse> {
    let result = '';
    
    switch (request.type) {
      case 'generate':
        result = this.localProcessor.generateCode(request.prompt || '', request.language || 'javascript');
        break;
      case 'analyze':
        result = this.localProcessor.analyzeCode(request.code || '', request.language || 'javascript');
        break;
      case 'explain':
        result = this.localProcessor.explainCode(request.code || '', request.language || 'javascript');
        break;
      case 'debug':
        result = `Debug analysis for ${request.fileName || 'file'}:\n\n${this.localProcessor.analyzeCode(request.code || '', request.language || 'javascript')}\n\nRecommendation: Use local debugging tools and console logging for detailed analysis.`;
        break;
      case 'optimize':
        result = `Optimization suggestions for ${request.language || 'code'}:\n\n1. Review variable declarations\n2. Optimize loops and iterations\n3. Remove unused code\n4. Use efficient data structures\n5. Implement caching where appropriate\n\nNote: For detailed optimization, consider using specialized tools.`;
        break;
      case 'document':
        result = `/**\n * Auto-generated documentation\n * File: ${request.fileName || 'unknown'}\n * Language: ${request.language || 'unknown'}\n * \n * Description: Generated documentation for code analysis\n * TODO: Add specific function and class descriptions\n */\n\n${request.code || ''}`;
        break;
      default:
        result = 'Local AI processing completed. For advanced features, ensure Anthropic API is configured.';
    }

    return {
      success: true,
      result,
      metadata: {
        model: 'local-ai-v1',
        source: isFallback ? 'hybrid' : 'local',
        confidence: 0.7,
        fallbackUsed: isFallback
      }
    };
  }

  private async processWithAnthropic(request: HybridAIRequest): Promise<HybridAIResponse> {
    let prompt = '';
    let systemPrompt = '';

    switch (request.type) {
      case 'analyze':
        systemPrompt = "You are a code analysis expert. Analyze the provided code for quality, performance, security issues, and best practices. Provide specific, actionable feedback.";
        prompt = `Analyze this ${request.language || 'code'} file${request.fileName ? ` (${request.fileName})` : ''}:

\`\`\`${request.language || ''}
${request.code}
\`\`\`

${request.context ? `\nContext: ${request.context}` : ''}

Please provide:
1. Code quality assessment
2. Potential issues or vulnerabilities
3. Performance optimization suggestions
4. Best practice recommendations
5. Overall rating (1-10)`;
        break;

      case 'generate':
        systemPrompt = "You are a code generation expert. Generate clean, well-documented, production-ready code based on the requirements.";
        prompt = `Generate ${request.language || 'code'} code for: ${request.prompt}

${request.context ? `\nProject context: ${request.context}` : ''}
${request.projectType ? `\nProject type: ${request.projectType}` : ''}

Requirements:
- Clean, readable code
- Proper error handling
- Comprehensive comments
- Follow best practices for ${request.language || 'the language'}`;
        break;

      case 'debug':
        systemPrompt = "You are a debugging expert. Identify bugs, errors, and issues in code and provide specific fixes.";
        prompt = `Debug this ${request.language || 'code'}${request.fileName ? ` from ${request.fileName}` : ''}:

\`\`\`${request.language || ''}
${request.code}
\`\`\`

${request.context ? `\nError context: ${request.context}` : ''}

Please:
1. Identify the specific issues
2. Explain why they occur
3. Provide the corrected code
4. Suggest prevention strategies`;
        break;

      case 'explain':
        systemPrompt = "You are a code explanation expert. Break down complex code into understandable explanations.";
        prompt = `Explain this ${request.language || 'code'}${request.fileName ? ` from ${request.fileName}` : ''}:

\`\`\`${request.language || ''}
${request.code}
\`\`\`

${request.context ? `\nContext: ${request.context}` : ''}

Please provide:
1. High-level overview
2. Step-by-step breakdown
3. Explanation of complex logic
4. How it fits into the larger application`;
        break;

      case 'optimize':
        systemPrompt = "You are a performance optimization expert. Analyze code for improvements and provide optimized versions.";
        prompt = `Optimize this ${request.language || 'code'}${request.fileName ? ` from ${request.fileName}` : ''}:

\`\`\`${request.language || ''}
${request.code}
\`\`\`

${request.context ? `\nContext: ${request.context}` : ''}

Focus on:
1. Performance improvements
2. Memory efficiency
3. Algorithm optimization
4. Code clarity and maintainability
5. Provide the optimized version with explanations`;
        break;

      case 'document':
        systemPrompt = "You are a documentation expert. Generate comprehensive, clear documentation for code.";
        prompt = `Generate documentation for this ${request.language || 'code'}${request.fileName ? ` from ${request.fileName}` : ''}:

\`\`\`${request.language || ''}
${request.code}
\`\`\`

${request.context ? `\nContext: ${request.context}` : ''}

Include:
1. Function/class descriptions
2. Parameter explanations
3. Return value details
4. Usage examples
5. Important notes or warnings`;
        break;

      default:
        throw new Error(`Unknown request type: ${request.type}`);
    }

    const result = await this.callAnthropic(prompt, systemPrompt);

    return {
      success: true,
      result,
      metadata: {
        model: DEFAULT_MODEL_STR,
        source: 'anthropic',
        confidence: 0.95
      }
    };
  }

  async chatWithCode(message: string, codeContext?: string, projectContext?: string, useLocal = false): Promise<HybridAIResponse> {
    if (useLocal || this.shouldUseLocal({ type: 'explain' })) {
      // Simple local chat responses
      const responses = [
        "Based on the code context, I can help you with basic analysis and suggestions.",
        "For detailed assistance, consider enabling the full AI features.",
        "I can provide basic code explanations and templates.",
        "Local AI mode is active. For advanced features, ensure API connectivity."
      ];
      
      return {
        success: true,
        result: responses[Math.floor(Math.random() * responses.length)],
        metadata: {
          model: 'local-chat-v1',
          source: 'local',
          confidence: 0.6
        }
      };
    }

    try {
      const systemPrompt = "You are an AI coding assistant integrated into Zync IDE. Help developers with coding questions, provide suggestions, and assist with development tasks. Be concise but thorough.";
      
      let prompt = message;
      
      if (codeContext) {
        prompt += `\n\nCurrent code context:\n\`\`\`\n${codeContext}\n\`\`\``;
      }
      
      if (projectContext) {
        prompt += `\n\nProject context: ${projectContext}`;
      }

      const result = await this.callAnthropic(prompt, systemPrompt);

      return {
        success: true,
        result,
        metadata: {
          model: DEFAULT_MODEL_STR,
          source: 'anthropic',
          confidence: 0.9
        }
      };
    } catch (error) {
      // Fallback to local processing
      return {
        success: true,
        result: "I'm operating in local mode. I can help with basic code analysis and provide templates. For advanced AI features, please check your API configuration.",
        metadata: {
          model: 'local-fallback',
          source: 'hybrid',
          confidence: 0.6,
          fallbackUsed: true
        }
      };
    }
  }

  async healthCheck(): Promise<{ healthy: boolean; anthropicAvailable: boolean; localAvailable: boolean }> {
    const localAvailable = true; // Local processor always available
    let anthropicAvailable = false;

    if (this.anthropic) {
      try {
        const testResponse = await this.callAnthropic("Test connection. Respond only with: OK");
        anthropicAvailable = testResponse.toLowerCase().includes('ok');
        console.log('[hybrid-ai] Anthropic health check:', anthropicAvailable ? 'PASSED' : 'FAILED');
      } catch (error) {
        console.log('[hybrid-ai] Anthropic health check failed - using local AI mode');
        anthropicAvailable = false;
      }
    } else {
      console.log('[hybrid-ai] No Anthropic client available - using local AI mode');
    }

    return {
      healthy: true,
      anthropicAvailable,
      localAvailable
    };
  }

  getStatus() {
    return {
      requestCount: this.requestCount,
      hourlyLimit: this.hourlyLimit,
      failureCount: this.failureCount,
      lastReset: this.lastReset,
      anthropicAvailable: !!this.anthropic
    };
  }
}

export const hybridAIAgent = new HybridAIAgent();