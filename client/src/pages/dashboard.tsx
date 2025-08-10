import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  FolderOpen, 
  Code2, 
  Calendar, 
  Settings, 
  LogOut,
  Folder,
  FileText,
  Terminal,
  Shield,
  Zap,
  User,
  AlertCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useElectron } from "@/hooks/use-electron";
import { insertProjectSchema } from "@shared/schema-sqlite";
import type { Project } from "@shared/schema-sqlite";

const projectSchema = insertProjectSchema.extend({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  template: z.string().min(1, "Template is required"),
});

type ProjectForm = z.infer<typeof projectSchema>;

const templates = [
  { value: "empty", label: "Empty Project", description: "Start with a blank slate", category: "blank", icon: "📄" },
  { value: "html-basic", label: "HTML Website", description: "Complete HTML website with CSS and JavaScript", category: "web", icon: "🌐" },
  { value: "react-basic", label: "React App", description: "Modern React application with components", category: "web", icon: "⚛️" },
  { value: "node-express", label: "Node.js API", description: "Express.js REST API with routing", category: "backend", icon: "🟢" },
  { value: "python-data", label: "Python Data Analysis", description: "Data analysis with pandas and matplotlib", category: "data", icon: "🐍" },
  { value: "python-basic", label: "Python Script", description: "Simple Python script with basic structure", category: "data", icon: "🐍" },
  { value: "javascript-basic", label: "JavaScript Project", description: "Basic JavaScript project with HTML and CSS", category: "web", icon: "💛" },
  { value: "blank-web", label: "Blank Web Project", description: "Empty HTML/CSS/JS project structure", category: "blank", icon: "📄" },
  { value: "blank-python", label: "Blank Python Project", description: "Empty Python project with basic setup", category: "blank", icon: "📄" },
  { value: "blank-node", label: "Blank Node.js Project", description: "Empty Node.js project with package.json", category: "blank", icon: "📄" },
];

const templateCategories = {
  web: { name: "Web Development", color: "bg-blue-500", icon: Code2 },
  backend: { name: "Backend Development", color: "bg-green-500", icon: Terminal },
  data: { name: "Data & Analytics", color: "bg-yellow-500", icon: FileText },
  blank: { name: "Blank Templates", color: "bg-gray-500", icon: Folder },
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { isElectron, showOpenDialog } = useElectron();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isFantasmaDialogOpen, setIsFantasmaDialogOpen] = useState(false);
  const [isZebulonDialogOpen, setIsZebulonDialogOpen] = useState(false);
  const [fantasmaConfig, setFantasmaConfig] = useState({ apiKey: '', endpoint: '' });
  const [zebulonConfig, setZebulonConfig] = useState({ apiKey: '', endpoint: '' });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Load saved configurations on component mount
  useEffect(() => {
    const savedFantasma = localStorage.getItem('fantasma_config');
    const savedZebulon = localStorage.getItem('zebulon_config');
    
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
  }, []);

  const { data: projectsResponse, isLoading } = useQuery({
    queryKey: ["/api/projects"],
  });
  
  const projects: Project[] = projectsResponse?.projects || [];

  const form = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      template: "",
    },
  });

  const onSubmit = async (data: ProjectForm) => {
    try {
      // Authenticated users can create projects directly
      const response = await apiRequest("POST", "/api/projects", data) as any;
      
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setIsCreateDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Failed to create project:", error);
      alert("Failed to create project. Please try again.");
    }
  };

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const handleOpenExistingProject = async () => {
    if (isElectron && showOpenDialog) {
      try {
        const result = await showOpenDialog({
          properties: ['openDirectory']
        });
        
        if (result && !result.canceled && result.filePaths && result.filePaths.length > 0) {
          const projectPath = result.filePaths[0];
          console.log("Selected project path:", projectPath);
        }
      } catch (error) {
        console.error("Failed to open project:", error);
      }
    }
  };

  const saveFantasmaConfig = () => {
    localStorage.setItem('fantasma_config', JSON.stringify(fantasmaConfig));
    setIsFantasmaDialogOpen(false);
  };

  const saveZebulonConfig = () => {
    localStorage.setItem('zebulon_config', JSON.stringify(zebulonConfig));
    setIsZebulonDialogOpen(false);
  };

  const filteredTemplates = selectedCategory 
    ? templates.filter(t => t.category === selectedCategory)
    : templates;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.username}!</p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setLocation("/docs")}>
              <FileText className="mr-2 h-4 w-4" />
              Documentation
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocation("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocation("/admin/approvals")}>
              <Shield className="mr-2 h-4 w-4" />
              Admin Approvals
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-dashed border-2 hover:border-solid">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Project</CardTitle>
                <Plus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+</div>
                <p className="text-xs text-muted-foreground">Create a new project</p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>Choose a template to get started with your new project.</DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name</FormLabel>
                        <FormControl>
                          <Input placeholder="My Awesome Project" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="What this project is about" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Template Categories */}
                <div>
                  <FormLabel>Template Category</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    <Button
                      type="button"
                      variant={selectedCategory === null ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(null)}
                    >
                      All
                    </Button>
                    {Object.entries(templateCategories).map(([key, category]) => {
                      const IconComponent = category.icon;
                      return (
                        <Button
                          key={key}
                          type="button"
                          variant={selectedCategory === key ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedCategory(key)}
                        >
                          <IconComponent className="h-3 w-3 mr-1" />
                          {category.name.split(' ')[0]}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Template Selection */}
                <FormField
                  control={form.control}
                  name="template"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Choose Template</FormLabel>
                      <div className="grid gap-3 md:grid-cols-2">
                        {filteredTemplates.map((template) => (
                          <Card
                            key={template.value}
                            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                              field.value === template.value ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                            }`}
                            onClick={() => field.onChange(template.value)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start space-x-3">
                                <span className="text-lg">{template.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm">{template.label}</h4>
                                  <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                                  <span className={`inline-block px-2 py-1 rounded-full text-xs mt-2 ${
                                    templateCategories[template.category as keyof typeof templateCategories]?.color || 'bg-gray-500'
                                  } text-white`}>
                                    {templateCategories[template.category as keyof typeof templateCategories]?.name || template.category}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Project</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200" onClick={handleOpenExistingProject}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Project</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">Existing projects</p>
          </CardContent>
        </Card>

        <Dialog open={isFantasmaDialogOpen} onOpenChange={setIsFantasmaDialogOpen}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fantasma Firewall</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {fantasmaConfig.endpoint ? '✓' : '○'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {fantasmaConfig.endpoint ? 'Connected' : 'Not configured'}
                </p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configure Fantasma Firewall</DialogTitle>
              <DialogDescription>
                Connect to your Fantasma Firewall service for enhanced security.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">API Endpoint</label>
                <Input
                  placeholder="https://your-fantasma-firewall.com"
                  value={fantasmaConfig.endpoint}
                  onChange={(e) => setFantasmaConfig(prev => ({ ...prev, endpoint: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">API Key</label>
                <Input
                  type="password"
                  placeholder="Your Fantasma API key"
                  value={fantasmaConfig.apiKey}
                  onChange={(e) => setFantasmaConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsFantasmaDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveFantasmaConfig}>Save Configuration</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isZebulonDialogOpen} onOpenChange={setIsZebulonDialogOpen}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Zebulon Interface</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {zebulonConfig.endpoint ? '✓' : '○'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {zebulonConfig.endpoint ? 'Connected' : 'Not configured'}
                </p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configure Zebulon Oracle Interface</DialogTitle>
              <DialogDescription>
                Connect to your Zebulon Oracle Interface for database management.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">API Endpoint</label>
                <Input
                  placeholder="https://your-zebulon-interface.com"
                  value={zebulonConfig.endpoint}
                  onChange={(e) => setZebulonConfig(prev => ({ ...prev, endpoint: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">API Key</label>
                <Input
                  type="password"
                  placeholder="Your Zebulon API key"
                  value={zebulonConfig.apiKey}
                  onChange={(e) => setZebulonConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsZebulonDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveZebulonConfig}>Save Configuration</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Recent Projects */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Recent Projects</h2>
        
        {projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Folder className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No projects yet</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                Create your first project to get started with coding in Zync.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project: Project) => (
              <Card key={project.id} className="cursor-pointer hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <Code2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardDescription>{project.description || "No description"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Template: {project.template}</span>
                    <span>{project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'No date'}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Status Information */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Notice:</strong> You are logged in as an authorized user. You can create and deploy projects directly. 
          Unauthorized access attempts are blocked by the security system.
        </AlertDescription>
      </Alert>
    </div>
  );
}