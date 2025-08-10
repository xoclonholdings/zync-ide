import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Settings, Save, User, Monitor, Shield, Database, Key, Mail, UserCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AppSettings {
  // Appearance
  theme: "dark" | "light" | "auto";
  fontSize: "small" | "medium" | "large";
  fontFamily: string;
  colorScheme: "default" | "blue" | "green" | "purple" | "red";
  
  // Editor
  autoSave: boolean;
  autoSaveDelay: number;
  lineNumbers: boolean;
  wordWrap: boolean;
  tabSize: number;
  insertSpaces: boolean;
  minimap: boolean;
  bracketPairColorization: boolean;
  showWhitespace: boolean;
  
  // Project
  defaultTemplate: string;
  showHiddenFiles: boolean;
  maxRecentProjects: number;
  autoBackup: boolean;
  backupInterval: number;
  
  // Terminal
  terminalFontSize: number;
  terminalFontFamily: string;
  terminalTheme: "dark" | "light";
  maxTerminalHistory: number;
  
  // Integrations
  enableIntegrations: boolean;
  enableFantasmaFirewall: boolean;
  enableZebulonOracle: boolean;
  
  // Advanced
  enableExperimentalFeatures: boolean;
  debugMode: boolean;
  maxMemoryUsage: number;
  compressionLevel: number;
}

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<AppSettings>({
    // Appearance
    theme: "dark",
    fontSize: "medium",
    fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
    colorScheme: "default",
    
    // Editor
    autoSave: true,
    autoSaveDelay: 1000,
    lineNumbers: true,
    wordWrap: true,
    tabSize: 2,
    insertSpaces: true,
    minimap: true,
    bracketPairColorization: true,
    showWhitespace: false,
    
    // Project
    defaultTemplate: "empty",
    showHiddenFiles: false,
    maxRecentProjects: 10,
    autoBackup: true,
    backupInterval: 300000, // 5 minutes
    
    // Terminal
    terminalFontSize: 14,
    terminalFontFamily: "'SF Mono', Monaco, monospace",
    terminalTheme: "dark",
    maxTerminalHistory: 1000,
    
    // Integrations
    enableIntegrations: true,
    enableFantasmaFirewall: false,
    enableZebulonOracle: false,
    
    // Advanced
    enableExperimentalFeatures: false,
    debugMode: false,
    maxMemoryUsage: 2048, // MB
    compressionLevel: 6,
  });

  const [fantasmaConfig, setFantasmaConfig] = useState({ apiKey: '', endpoint: '' });
  const [zebulonConfig, setZebulonConfig] = useState({ apiKey: '', endpoint: '' });
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load settings from server
  const { data: serverSettings } = useQuery({
    queryKey: ["/api/settings"],
    enabled: !!user,
  });

  // Load settings on component mount
  useEffect(() => {
    const savedFantasma = localStorage.getItem('fantasma_config');
    const savedZebulon = localStorage.getItem('zebulon_config');
    
    // Merge server settings with defaults
    if (serverSettings?.settings) {
      setSettings(prev => ({ ...prev, ...serverSettings.settings }));
    }

    if (savedFantasma) {
      try {
        setFantasmaConfig(JSON.parse(savedFantasma));
      } catch (e) {
        console.error('Failed to load Fantasma config:', e);
      }
    }

    if (savedZebulon) {
      try {
        setZebulonConfig(JSON.parse(savedZebulon));
      } catch (e) {
        console.error('Failed to load Zebulon config:', e);
      }
    }

    // Update profile data when user changes
    if (user) {
      setProfileData(prev => ({
        ...prev,
        username: user.username || '',
        email: user.email || ''
      }));
    }
  }, [serverSettings, user]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settingsData: any) => {
      const response = await apiRequest("POST", "/api/settings", settingsData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Your settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      const response = await apiRequest("POST", "/api/auth/update-profile", profileData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Profile updated",
        description: data.message || "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      // Clear password fields
      setProfileData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const saveSettings = () => {
    saveSettingsMutation.mutate(settings);
    localStorage.setItem('fantasma_config', JSON.stringify(fantasmaConfig));
    localStorage.setItem('zebulon_config', JSON.stringify(zebulonConfig));
  };

  const saveProfile = () => {
    if (profileData.newPassword) {
      if (profileData.newPassword !== profileData.confirmPassword) {
        toast({
          title: "Error",
          description: "New passwords do not match",
          variant: "destructive",
        });
        return;
      }
      if (!profileData.currentPassword) {
        toast({
          title: "Error",
          description: "Current password is required to change password",
          variant: "destructive",
        });
        return;
      }
    }

    updateProfileMutation.mutate({
      username: profileData.username,
      email: profileData.email,
      currentPassword: profileData.currentPassword || undefined,
      newPassword: profileData.newPassword || undefined,
    });
  };

  const updateSettings = (key: keyof AppSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const templates = [
    { value: "empty", label: "Empty Project" },
    { value: "node", label: "Node.js" },
    { value: "python", label: "Python" },
    { value: "react", label: "React" },
    { value: "express", label: "Express" },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400">Please log in to access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/dashboard")}
              className="text-gray-300 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold">Settings</h1>
            </div>
          </div>
          <Button 
            onClick={saveSettings}
            className="bg-primary hover:bg-primary/90 text-black"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>

      {/* Settings Content */}
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* User Profile Section */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserCircle className="h-5 w-5 text-primary" />
              <span>User Profile</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  value={profileData.username} 
                  onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter username"
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={profileData.email} 
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email"
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>
            
            <Separator className="bg-gray-700" />
            
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Key className="h-4 w-4" />
                Change Password
              </h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input 
                    id="currentPassword" 
                    type="password"
                    value={profileData.currentPassword}
                    onChange={(e) => setProfileData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input 
                      id="newPassword" 
                      type="password"
                      value={profileData.newPassword}
                      onChange={(e) => setProfileData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Enter new password"
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password"
                      value={profileData.confirmPassword}
                      onChange={(e) => setProfileData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm new password"
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button 
                onClick={saveProfile}
                disabled={updateProfileMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Editor Settings */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Monitor className="h-5 w-5 text-primary" />
              <span>Editor Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={settings.theme} onValueChange={(value) => updateSettings('theme', value)}>
                    <SelectTrigger className="bg-gray-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800">
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="fontSize">Font Size</Label>
                  <Select value={settings.fontSize} onValueChange={(value) => updateSettings('fontSize', value)}>
                    <SelectTrigger className="bg-gray-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800">
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="defaultTemplate">Default Template</Label>
                  <Select value={settings.defaultTemplate} onValueChange={(value) => updateSettings('defaultTemplate', value)}>
                    <SelectTrigger className="bg-gray-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800">
                      {templates.map((template) => (
                        <SelectItem key={template.value} value={template.value}>
                          {template.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoSave">Auto Save</Label>
                  <Switch
                    id="autoSave"
                    checked={settings.autoSave}
                    onCheckedChange={(checked) => updateSettings('autoSave', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="lineNumbers">Show Line Numbers</Label>
                  <Switch
                    id="lineNumbers"
                    checked={settings.lineNumbers}
                    onCheckedChange={(checked) => updateSettings('lineNumbers', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="wordWrap">Word Wrap</Label>
                  <Switch
                    id="wordWrap"
                    checked={settings.wordWrap}
                    onCheckedChange={(checked) => updateSettings('wordWrap', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="showHiddenFiles">Show Hidden Files</Label>
                  <Switch
                    id="showHiddenFiles"
                    checked={settings.showHiddenFiles}
                    onCheckedChange={(checked) => updateSettings('showHiddenFiles', checked)}
                  />
                </div>
              </div>
            </div>

            <Separator className="bg-gray-800" />
            
            <div>
              <Label htmlFor="tabSize">Tab Size</Label>
              <Input
                id="tabSize"
                type="number"
                min="2"
                max="8"
                value={settings.tabSize}
                onChange={(e) => updateSettings('tabSize', parseInt(e.target.value) || 2)}
                className="bg-gray-800 w-24"
              />
            </div>
          </CardContent>
        </Card>

        {/* Integration Settings */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>Integration Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="enableIntegrations">Enable External Integrations</Label>
              <Switch
                id="enableIntegrations"
                checked={settings.enableIntegrations}
                onCheckedChange={(checked) => updateSettings('enableIntegrations', checked)}
              />
            </div>

            {settings.enableIntegrations && (
              <>
                <Separator className="bg-gray-800" />
                
                {/* Fantasma Firewall */}
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>Fantasma Firewall</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fantasmaEndpoint">Endpoint URL</Label>
                      <Input
                        id="fantasmaEndpoint"
                        value={fantasmaConfig.endpoint}
                        onChange={(e) => setFantasmaConfig({ ...fantasmaConfig, endpoint: e.target.value })}
                        placeholder="Enter Fantasma endpoint URL"
                        className="bg-gray-800"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fantasmaApiKey">API Key</Label>
                      <Input
                        id="fantasmaApiKey"
                        type="password"
                        value={fantasmaConfig.apiKey}
                        onChange={(e) => setFantasmaConfig({ ...fantasmaConfig, apiKey: e.target.value })}
                        placeholder="Enter API key"
                        className="bg-gray-800"
                      />
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-800" />

                {/* Zebulon Oracle Interface */}
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center space-x-2">
                    <Database className="h-4 w-4 text-primary" />
                    <span>Zebulon Oracle Interface</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="zebulonEndpoint">Endpoint URL</Label>
                      <Input
                        id="zebulonEndpoint"
                        value={zebulonConfig.endpoint}
                        onChange={(e) => setZebulonConfig({ ...zebulonConfig, endpoint: e.target.value })}
                        placeholder="Enter Zebulon endpoint URL"
                        className="bg-gray-800"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zebulonApiKey">API Key</Label>
                      <Input
                        id="zebulonApiKey"
                        type="password"
                        value={zebulonConfig.apiKey}
                        onChange={(e) => setZebulonConfig({ ...zebulonConfig, apiKey: e.target.value })}
                        placeholder="Enter API key"
                        className="bg-gray-800"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}