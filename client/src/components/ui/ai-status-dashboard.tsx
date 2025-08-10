import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, Clock, Zap, Brain, Globe, Server } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AIProvider {
  name: string;
  available: boolean;
  priority: number;
  requestCount: number;
  rateLimitStatus: string;
  status?: string;
  model?: string;
  endpoint?: string;
}

interface AIStatusData {
  activeProviders: number;
  totalProviders: number;
  providers: AIProvider[];
  emergencyFallback: string;
  health: {
    healthy: boolean;
    providers: Record<string, boolean>;
    primaryProvider: string;
  };
  integrationTree: {
    primary: string[];
    experimental: string[];
    local: string[];
    active: string;
  };
}

const getProviderIcon = (name: string) => {
  switch (name.toLowerCase()) {
    case 'openai': return <Globe className="h-4 w-4" />;
    case 'anthropic': return <Brain className="h-4 w-4" />;
    case 'julius': case 'zync': return <Zap className="h-4 w-4" />;
    case 'ollama': return <Server className="h-4 w-4" />;
    case 'local': return <CheckCircle className="h-4 w-4" />;
    default: return <AlertCircle className="h-4 w-4" />;
  }
};

const getStatusColor = (available: boolean, rateLimitStatus: string) => {
  if (!available) return "destructive";
  if (rateLimitStatus === "LIMIT_REACHED") return "secondary";
  return "default";
};

const getStatusText = (available: boolean, rateLimitStatus: string) => {
  if (!available) return "Offline";
  if (rateLimitStatus === "LIMIT_REACHED") return "Rate Limited";
  return "Online";
};

export function AIStatusDashboard() {
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [localCache, setLocalCache] = useState<any>({});
  const queryClient = useQueryClient();

  // Fetch AI router status
  const { data: statusData, isLoading, error } = useQuery<AIStatusData>({
    queryKey: ['/api/ai/router/status'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Test AI provider mutation
  const testProviderMutation = useMutation({
    mutationFn: async (providerName: string) => {
      return await apiRequest('POST', `/api/ai/test`, {
        message: `Testing ${providerName} integration - respond with current time and model name`,
        forceProvider: providerName !== 'hybrid' ? providerName : undefined
      });
    },
    onSuccess: (data, providerName) => {
      console.log(`[ai-dashboard] ${providerName} test successful:`, data);
      queryClient.invalidateQueries({ queryKey: ['/api/ai/router/status'] });
    },
    onError: (error, providerName) => {
      console.error(`[ai-dashboard] ${providerName} test failed:`, error);
    },
    onSettled: () => {
      setTestingProvider(null);
    }
  });

  // Save message to local storage for offline backup
  const saveToLocalCache = (message: string, response: string, provider: string) => {
    const timestamp = new Date().toISOString();
    const cacheKey = `ai_cache_${timestamp}`;
    const cacheData = { message, response, provider, timestamp };
    
    try {
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      setLocalCache(prev => ({ ...prev, [cacheKey]: cacheData }));
    } catch (error) {
      console.error('[ai-dashboard] Failed to save to local cache:', error);
    }
  };

  const handleTestProvider = async (providerName: string) => {
    setTestingProvider(providerName);
    try {
      const response = await testProviderMutation.mutateAsync(providerName);
      const data = await response.json();
      saveToLocalCache(
        `Test message for ${providerName}`,
        data.response || 'Test completed',
        data.provider || providerName
      );
    } catch (error) {
      console.error(`Failed to test ${providerName}:`, error);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Integration Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            AI Status Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Failed to load AI integration status. Check connection and try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  const healthPercentage = statusData ? 
    Math.round((statusData.activeProviders / statusData.totalProviders) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Overall Status Card */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            ZYNC AI Integration Status
          </CardTitle>
          <CardDescription>
            Multi-agent routing system with {statusData?.activeProviders || 0} of {statusData?.totalProviders || 0} providers active
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">System Health</span>
            <span className="text-sm text-muted-foreground">{healthPercentage}%</span>
          </div>
          <Progress value={healthPercentage} className="w-full" />
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Primary Provider:</span>
              <p className="text-muted-foreground">{statusData?.health?.primaryProvider || 'Local'}</p>
            </div>
            <div>
              <span className="font-medium">Emergency Fallback:</span>
              <p className="text-muted-foreground">{statusData?.emergencyFallback || 'Local AI'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statusData?.providers?.map((provider) => (
          <Card key={provider.name} className="w-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                {getProviderIcon(provider.name)}
                {provider.name.charAt(0).toUpperCase() + provider.name.slice(1)}
                <Badge 
                  variant={getStatusColor(provider.available, provider.rateLimitStatus)}
                  className="ml-auto"
                >
                  {getStatusText(provider.available, provider.rateLimitStatus)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-xs">
                <span>Priority:</span>
                <span>#{provider.priority}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Requests:</span>
                <span>{provider.requestCount}</span>
              </div>
              
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                disabled={testingProvider === provider.name}
                onClick={() => handleTestProvider(provider.name)}
              >
                {testingProvider === provider.name ? (
                  <>
                    <Clock className="h-3 w-3 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Zap className="h-3 w-3 mr-2" />
                    Test Provider
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Integration Tree Visualization */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>AI Provider Hierarchy</CardTitle>
          <CardDescription>
            Request routing priority and fallback chain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {statusData?.integrationTree && (
              <>
                <div>
                  <h4 className="font-medium text-sm mb-2">Primary Models</h4>
                  <div className="flex gap-2">
                    {statusData.integrationTree.primary.map(provider => (
                      <Badge key={provider} variant="default">{provider}</Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-2">Experimental/Custom</h4>
                  <div className="flex gap-2">
                    {statusData.integrationTree.experimental.map(provider => (
                      <Badge key={provider} variant="secondary">{provider}</Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-2">Local/Offline</h4>
                  <div className="flex gap-2">
                    {statusData.integrationTree.local.map(provider => (
                      <Badge key={provider} variant="outline">{provider}</Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Test Section */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Quick AI Test</CardTitle>
          <CardDescription>
            Test the hybrid routing system with a sample prompt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            disabled={testingProvider === 'hybrid'}
            onClick={() => handleTestProvider('hybrid')}
          >
            {testingProvider === 'hybrid' ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Testing Hybrid Routing...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Test Hybrid AI System
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default AIStatusDashboard;