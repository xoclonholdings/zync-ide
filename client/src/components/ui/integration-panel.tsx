import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Zap, 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  Key,
  Activity,
  Database,
  Globe
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

const integrationSchema = z.object({
  name: z.string().min(1, "Integration name is required"),
  type: z.string().min(1, "Integration type is required"),
  apiKey: z.string().min(1, "API key is required"),
  config: z.string().optional(),
});

type IntegrationForm = z.infer<typeof integrationSchema>;

interface IntegrationConfig {
  endpoint?: string;
  timeout?: number;
  [key: string]: any;
}

export function IntegrationPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedIntegration, setSelectedIntegration] = useState<'fantasma' | 'zebulon' | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ [key: string]: 'connected' | 'disconnected' | 'connecting' }>({});

  const form = useForm<IntegrationForm>({
    resolver: zodResolver(integrationSchema),
    defaultValues: {
      name: "",
      type: "",
      apiKey: "",
      config: "",
    },
  });

  // Fetch integrations
  const { data: integrationsData, isLoading } = useQuery({
    queryKey: ["/api/integrations"],
    enabled: !!user,
  });

  const integrations = Array.isArray(integrationsData) ? integrationsData : (integrationsData?.integrations || []);

  // Create/update integration mutation
  const integrationMutation = useMutation({
    mutationFn: async (data: IntegrationForm) => {
      const response = await apiRequest("POST", "/api/integrations", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      setShowConfigDialog(false);
      form.reset();
    },
  });

  // Test connection mutations
  const fantasmaConnectionMutation = useMutation({
    mutationFn: async (data: { apiKey: string; endpoint: string }) => {
      const response = await apiRequest("POST", "/api/integrations/fantasma/connect", data);
      return response.json();
    },
    onSuccess: () => {
      setConnectionStatus(prev => ({ ...prev, fantasma: 'connected' }));
    },
    onError: () => {
      setConnectionStatus(prev => ({ ...prev, fantasma: 'disconnected' }));
    },
  });

  const zebulonConnectionMutation = useMutation({
    mutationFn: async (data: { apiKey: string; endpoint: string }) => {
      const response = await apiRequest("POST", "/api/integrations/zebulon/connect", data);
      return response.json();
    },
    onSuccess: () => {
      setConnectionStatus(prev => ({ ...prev, zebulon: 'connected' }));
    },
    onError: () => {
      setConnectionStatus(prev => ({ ...prev, zebulon: 'disconnected' }));
    },
  });

  const handleConfigureIntegration = (type: 'fantasma' | 'zebulon') => {
    setSelectedIntegration(type);
    
    const existing = integrations.find((i: any) => i.type === type);
    if (existing) {
      form.setValue("name", existing.name);
      form.setValue("type", existing.type);
      form.setValue("apiKey", existing.apiKey || "");
      form.setValue("config", existing.config || "");
    } else {
      form.setValue("name", type === 'fantasma' ? 'Fantasma Firewall' : 'Zebulon Interface');
      form.setValue("type", type);
      form.reset();
    }
    
    setShowConfigDialog(true);
  };

  const testConnection = async (type: 'fantasma' | 'zebulon') => {
    const integration = integrations.find((i: any) => i.type === type);
    if (!integration?.apiKey) return;

    setConnectionStatus(prev => ({ ...prev, [type]: 'connecting' }));

    const config: IntegrationConfig = integration.config ? JSON.parse(integration.config) : {};
    const endpoint = config.endpoint || (type === 'fantasma' 
      ? 'https://api.fantasma-firewall.example.com' 
      : 'https://api.zebulon.ai'
    );

    if (type === 'fantasma') {
      fantasmaConnectionMutation.mutate({ apiKey: integration.apiKey, endpoint });
    } else {
      zebulonConnectionMutation.mutate({ apiKey: integration.apiKey, endpoint });
    }
  };

  const onSubmit = (data: IntegrationForm) => {
    integrationMutation.mutate(data);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <Activity className="h-4 w-4 text-yellow-500 animate-pulse" />;
      default:
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Connected</Badge>;
      case 'connecting':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Connecting...</Badge>;
      default:
        return <Badge variant="outline" className="border-slate-600 text-slate-400">Not Connected</Badge>;
    }
  };

  const fantasmaIntegration = integrations.find((i: any) => i.type === 'fantasma');
  const zebulonIntegration = integrations.find((i: any) => i.type === 'zebulon');

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-slate-800">
        <h3 className="text-sm font-semibold text-slate-300">Integrations</h3>
        <p className="text-xs text-slate-500 mt-1">External service connections</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Fantasma Firewall */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-red-500" />
                  <CardTitle className="text-base">Fantasma Firewall</CardTitle>
                </div>
                {getStatusIcon(connectionStatus.fantasma || 'disconnected')}
              </div>
              <CardDescription className="text-xs">
                Enterprise firewall integration for secure development environments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                {getStatusBadge(connectionStatus.fantasma || 'disconnected')}
                <div className="flex space-x-2">
                  {fantasmaIntegration && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testConnection('fantasma')}
                      disabled={connectionStatus.fantasma === 'connecting'}
                      className="border-slate-600 text-xs h-7"
                    >
                      Test
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleConfigureIntegration('fantasma')}
                    className="border-slate-600 text-xs h-7"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Setup
                  </Button>
                </div>
              </div>
              
              {fantasmaIntegration && (
                <div className="text-xs text-slate-400 space-y-1">
                  <div>Last configured: {new Date(fantasmaIntegration.updatedAt).toLocaleDateString()}</div>
                  <div className="flex items-center space-x-1">
                    <Globe className="h-3 w-3" />
                    <span>Endpoint: {JSON.parse(fantasmaIntegration.config || '{}').endpoint || 'Default'}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Zebulon Interface */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-base">Zebulon Interface</CardTitle>
                </div>
                {getStatusIcon(connectionStatus.zebulon || 'disconnected')}
              </div>
              <CardDescription className="text-xs">
                MedTech platform integration for healthcare applications and data collection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                {getStatusBadge(connectionStatus.zebulon || 'disconnected')}
                <div className="flex space-x-2">
                  {zebulonIntegration && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testConnection('zebulon')}
                      disabled={connectionStatus.zebulon === 'connecting'}
                      className="border-slate-600 text-xs h-7"
                    >
                      Test
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleConfigureIntegration('zebulon')}
                    className="border-slate-600 text-xs h-7"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Setup
                  </Button>
                </div>
              </div>
              
              {zebulonIntegration && (
                <div className="text-xs text-slate-400 space-y-1">
                  <div>Last configured: {new Date(zebulonIntegration.updatedAt).toLocaleDateString()}</div>
                  <div className="flex items-center space-x-1">
                    <Globe className="h-3 w-3" />
                    <span>Endpoint: {JSON.parse(zebulonIntegration.config || '{}').endpoint || 'zebulon.ai'}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator className="bg-slate-700" />

          {/* Integration Overview */}
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-2">Overview</h4>
            <div className="text-xs text-slate-400 space-y-1">
              <div>Total integrations: {integrations.length}</div>
              <div>Active connections: {Object.values(connectionStatus).filter(s => s === 'connected').length}</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-2">Quick Actions</h4>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start border-slate-600 text-xs h-8"
              >
                <ExternalLink className="h-3 w-3 mr-2" />
                View Documentation
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start border-slate-600 text-xs h-8"
              >
                <Key className="h-3 w-3 mr-2" />
                Manage API Keys
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedIntegration === 'fantasma' ? (
                <Shield className="h-5 w-5 text-red-500" />
              ) : (
                <Zap className="h-5 w-5 text-blue-500" />
              )}
              <span>
                Configure {selectedIntegration === 'fantasma' ? 'Fantasma Firewall' : 'Zebulon Interface'}
              </span>
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Set up your API credentials and connection settings.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Enter your API key"
                        className="bg-slate-800 border-slate-600"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="config"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endpoint (optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={selectedIntegration === 'fantasma' 
                          ? 'https://api.fantasma-firewall.example.com'
                          : 'https://api.zebulon.ai'
                        }
                        className="bg-slate-800 border-slate-600"
                        onChange={(e) => {
                          const config = { endpoint: e.target.value };
                          field.onChange(JSON.stringify(config));
                        }}
                        value={
                          field.value ? JSON.parse(field.value).endpoint || '' : ''
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {integrationMutation.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {(integrationMutation.error as any).message || "Failed to save integration"}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowConfigDialog(false)}
                  className="border-slate-600"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={integrationMutation.isPending}>
                  {integrationMutation.isPending ? "Saving..." : "Save Configuration"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
