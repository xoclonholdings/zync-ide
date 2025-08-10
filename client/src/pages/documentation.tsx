import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Book, 
  FileText, 
  Settings, 
  Shield, 
  Zap, 
  Server,
  Users,
  Lock,
  ExternalLink
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { DocumentationViewer } from "@/components/DocumentationViewer";

interface DocumentationItem {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
  category: "admin" | "user" | "deployment" | "security";
}

const documentationItems: DocumentationItem[] = [
  {
    id: "admin-setup",
    title: "Admin Setup Guide",
    description: "Complete guide for initial admin configuration, security setup, and daily operations management.",
    path: "/docs/ADMIN_SETUP_GUIDE.md",
    icon: <Users className="h-5 w-5" />,
    badge: "Admin",
    category: "admin"
  },
  {
    id: "configuration",
    title: "Configuration How-To",
    description: "Step-by-step configuration for all environments, approval system, and advanced encryption setup.",
    path: "/docs/CONFIGURATION_HOW_TO.md", 
    icon: <Settings className="h-5 w-5" />,
    badge: "Admin",
    category: "admin"
  },
  {
    id: "approval-system",
    title: "Admin Approval System",
    description: "Complete guide to the approval workflow, admin dashboard, and security features.",
    path: "/docs/ADMIN_APPROVAL_SYSTEM.md",
    icon: <Shield className="h-5 w-5" />,
    badge: "Critical",
    category: "security"
  },
  {
    id: "user-guide",
    title: "IDE User Guide", 
    description: "Complete walkthrough from first login to project deployment, including all IDE features.",
    path: "/docs/IDE_USER_GUIDE.md",
    icon: <Book className="h-5 w-5" />,
    badge: "Essential",
    category: "user"
  },
  {
    id: "deployment",
    title: "Deployment Guide",
    description: "Complete deployment walkthrough from development to production with domain and SSL setup.",
    path: "/docs/DEPLOYMENT_GUIDE.md",
    icon: <Server className="h-5 w-5" />,
    badge: "Production",
    category: "deployment"
  }
];

export default function Documentation() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  const categories = [
    { id: "all", label: "All Documentation", icon: <FileText className="h-4 w-4" /> },
    { id: "admin", label: "Admin Guides", icon: <Users className="h-4 w-4" /> },
    { id: "user", label: "User Guides", icon: <Book className="h-4 w-4" /> },
    { id: "security", label: "Security", icon: <Shield className="h-4 w-4" /> },
    { id: "deployment", label: "Deployment", icon: <Server className="h-4 w-4" /> }
  ];

  const filteredDocs = selectedCategory === "all" 
    ? documentationItems 
    : documentationItems.filter(doc => doc.category === selectedCategory);

  const handleDocumentClick = async (doc: DocumentationItem) => {
    try {
      // Extract filename from path
      const filename = doc.path.split('/').pop();
      const response = await fetch(`/api/docs/${filename}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSelectedDoc(data.content);
        } else {
          console.error('Failed to load document:', data.error);
          setSelectedDoc(`# Error Loading Document\n\nFailed to load ${doc.title}: ${data.error}`);
        }
      } else {
        console.error('Failed to load document:', doc.path);
        setSelectedDoc(`# Error Loading Document\n\nFailed to load ${doc.title}: HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error loading document:', error);
      setSelectedDoc(`# Error Loading Document\n\nFailed to load ${doc.title}: ${error}`);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400">Please log in to access documentation.</p>
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
              <Book className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold">Documentation</h1>
            </div>
          </div>
          <Badge variant="outline" className="text-primary border-primary">
            Zync IDE v1.0
          </Badge>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-800 p-4">
          <div className="space-y-4">
            {/* Category Filter */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Categories</h3>
              <div className="space-y-1">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "secondary" : "ghost"}
                    onClick={() => setSelectedCategory(category.id)}
                    className="w-full justify-start text-left"
                  >
                    {category.icon}
                    <span className="ml-2">{category.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <Separator className="bg-gray-800" />

            {/* Documentation List */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Available Guides</h3>
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="space-y-2">
                  {filteredDocs.map((doc) => (
                    <Card 
                      key={doc.id} 
                      className="bg-gray-900 border-gray-700 hover:bg-gray-800 cursor-pointer transition-colors"
                      onClick={() => handleDocumentClick(doc)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start space-x-3">
                          <div className="text-primary mt-1">
                            {doc.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium text-sm truncate">{doc.title}</h4>
                              {doc.badge && (
                                <Badge variant="outline" className="text-xs">
                                  {doc.badge}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 line-clamp-2">
                              {doc.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {selectedDoc ? (
            <div>
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-primary">Documentation Viewer</CardTitle>
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedDoc(null)}
                      className="text-gray-400 hover:text-white"
                    >
                      Close
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[calc(100vh-200px)]">
                    <div className="prose prose-invert max-w-none">
                      <pre className="whitespace-pre-wrap text-sm text-gray-300 leading-relaxed">
                        {selectedDoc}
                      </pre>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <Book className="h-16 w-16 text-primary mx-auto" />
                <h2 className="text-2xl font-bold">Zync IDE Documentation</h2>
                <p className="text-gray-400 max-w-2xl mx-auto">
                  Comprehensive guides and documentation for administrators, users, and deployment scenarios. 
                  Select a document from the sidebar to get started.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {documentationItems.map((doc) => (
                  <Card 
                    key={doc.id}
                    className="bg-gray-900 border-gray-700 hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() => handleDocumentClick(doc)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="text-primary">
                          {doc.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <CardTitle className="text-sm">{doc.title}</CardTitle>
                            {doc.badge && (
                              <Badge variant="outline" className="text-xs">
                                {doc.badge}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-gray-400 line-clamp-3">
                        {doc.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="border-t border-gray-800 pt-6">
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
                  <div className="flex items-center space-x-2">
                    <Lock className="h-4 w-4" />
                    <span>Admin Approval Required</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4" />
                    <span>Unlimited Features</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>Military-Grade Encryption</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}