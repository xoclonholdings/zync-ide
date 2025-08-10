import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Eye, EyeOff, Key, Shield, CheckCircle, AlertCircle, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface APIKey {
  id: string;
  provider: string;
  name: string;
  key: string;
  status: 'active' | 'inactive' | 'expired' | 'invalid';
  lastUsed?: string;
  requestCount?: number;
  isEnabled: boolean;
}

const API_PROVIDERS = [
  { id: 'openai', name: 'OpenAI', description: 'GPT-4o, GPT-4 Turbo models' },
  { id: 'anthropic', name: 'Anthropic', description: 'Claude 3.5 Sonnet, Claude 3 Haiku' },
  { id: 'julius', name: 'Julius/Zync', description: 'Custom ZYNC agent integration' },
  { id: 'ollama', name: 'Ollama', description: 'Local LLM endpoint configuration' },
];

export function APIKeyManager() {
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [keyInput, setKeyInput] = useState('');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [isValidating, setIsValidating] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch API keys
  const { data: apiKeys = [], isLoading } = useQuery<APIKey[]>({
    queryKey: ['/api/integrations/keys'],
  });

  // Add/Update API key mutation
  const saveKeyMutation = useMutation({
    mutationFn: async ({ provider, key, name }: { provider: string; key: string; name: string }) => {
      return await apiRequest('POST', '/api/integrations/keys', { provider, key, name });
    },
    onSuccess: () => {
      toast({
        title: "API Key Saved",
        description: "The API key has been securely stored.",
      });
      setKeyInput('');
      setSelectedProvider('');
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/keys'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Save Key",
        description: error.message || "There was an error saving the API key.",
        variant: "destructive",
      });
    }
  });

  // Validate API key mutation
  const validateKeyMutation = useMutation({
    mutationFn: async ({ provider, key }: { provider: string; key: string }) => {
      return await apiRequest('POST', '/api/integrations/validate', { provider, key });
    },
    onSuccess: async (response, variables) => {
      setIsValidating(null);
      const data = await response.json();
      if (data.valid) {
        toast({
          title: "API Key Valid",
          description: `${variables.provider} API key is working correctly.`,
        });
      } else {
        toast({
          title: "API Key Invalid",
          description: data.error || "The API key failed validation.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any, variables) => {
      setIsValidating(null);
      toast({
        title: "Validation Failed",
        description: error.message || "Could not validate the API key.",
        variant: "destructive",
      });
    }
  });

  // Toggle API key status
  const toggleKeyMutation = useMutation({
    mutationFn: async ({ id, isEnabled }: { id: string; isEnabled: boolean }) => {
      return await apiRequest('POST', `/api/integrations/keys/${id}/toggle`, { isEnabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/keys'] });
    }
  });

  // Delete API key mutation
  const deleteKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/integrations/keys/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "API Key Deleted",
        description: "The API key has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/keys'] });
    }
  });

  const handleSaveKey = () => {
    if (!selectedProvider || !keyInput.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a provider and enter an API key.",
        variant: "destructive",
      });
      return;
    }

    const providerName = API_PROVIDERS.find(p => p.id === selectedProvider)?.name || selectedProvider;
    saveKeyMutation.mutate({
      provider: selectedProvider,
      key: keyInput.trim(),
      name: `${providerName} Key`
    });
  };

  const handleValidateKey = (apiKey: APIKey) => {
    setIsValidating(apiKey.id);
    validateKeyMutation.mutate({
      provider: apiKey.provider,
      key: apiKey.key
    });
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return '••••••••';
    return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="default" className="bg-green-600">Active</Badge>;
      case 'inactive': return <Badge variant="secondary">Inactive</Badge>;
      case 'expired': return <Badge variant="destructive">Expired</Badge>;
      case 'invalid': return <Badge variant="destructive">Invalid</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Add New API Key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Key Management
          </CardTitle>
          <CardDescription>
            Securely manage API keys for AI providers. All keys are encrypted and stored safely.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <select
                id="provider"
                className="w-full p-2 border rounded-md bg-background"
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
              >
                <option value="">Select a provider...</option>
                {API_PROVIDERS.map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your API key..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
              />
            </div>
          </div>
          
          {selectedProvider && (
            <div className="text-sm text-muted-foreground">
              {API_PROVIDERS.find(p => p.id === selectedProvider)?.description}
            </div>
          )}

          <Button 
            onClick={handleSaveKey}
            disabled={saveKeyMutation.isPending}
            className="w-full"
          >
            {saveKeyMutation.isPending ? 'Saving...' : 'Save API Key'}
          </Button>
        </CardContent>
      </Card>

      {/* Existing API Keys */}
      <Card>
        <CardHeader>
          <CardTitle>Stored API Keys</CardTitle>
          <CardDescription>
            Manage your existing API keys and monitor their usage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No API keys stored yet.</p>
              <p className="text-sm">Add your first API key above to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4" />
                      <div>
                        <h4 className="font-medium">{apiKey.name}</h4>
                        <p className="text-sm text-muted-foreground capitalize">
                          {apiKey.provider} Provider
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(apiKey.status)}
                      <Switch
                        checked={apiKey.isEnabled}
                        onCheckedChange={(checked) => 
                          toggleKeyMutation.mutate({ id: apiKey.id, isEnabled: checked })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                      {showKeys[apiKey.id] ? apiKey.key : maskKey(apiKey.key)}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                    >
                      {showKeys[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>

                  {apiKey.lastUsed && (
                    <div className="text-xs text-muted-foreground">
                      Last used: {new Date(apiKey.lastUsed).toLocaleString()}
                      {apiKey.requestCount && ` • ${apiKey.requestCount} requests`}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleValidateKey(apiKey)}
                      disabled={isValidating === apiKey.id}
                    >
                      {isValidating === apiKey.id ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-current mr-2" />
                          Validating...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-3 w-3 mr-2" />
                          Validate
                        </>
                      )}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteKeyMutation.mutate(apiKey.id)}
                      disabled={deleteKeyMutation.isPending}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default APIKeyManager;