import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileExplorer } from "./file-explorer";
import { 
  FolderTree, 
  Info, 
  Calendar, 
  Folder,
  FileText,
  Settings,
  GitBranch,
  Package
} from "lucide-react";
import type { Project } from "@shared/schema";

interface ProjectSidebarProps {
  project?: Project;
  selectedFile: string | null;
  onFileSelect: (path: string | null) => void;
}

export function ProjectSidebar({ project, selectedFile, onFileSelect }: ProjectSidebarProps) {
  const [activeTab, setActiveTab] = useState<'explorer' | 'info' | 'git'>('explorer');

  // Get project files count
  const { data: filesData } = useQuery({
    queryKey: ["/api/projects", project?.id, "files"],
    enabled: !!project,
  });

  const files = Array.isArray(filesData) ? filesData : (filesData?.files || []);
  const fileCount = files.filter((f: any) => !f.isDirectory).length;
  const folderCount = files.filter((f: any) => f.isDirectory).length;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString();
  };

  const getTemplateInfo = (template?: string | null) => {
    const templates: { [key: string]: { name: string; description: string; icon: string } } = {
      'node': { name: 'Node.js', description: 'JavaScript runtime environment', icon: '🟢' },
      'python': { name: 'Python', description: 'Python programming language', icon: '🐍' },
      'react': { name: 'React', description: 'JavaScript UI library', icon: '⚛️' },
      'express': { name: 'Express', description: 'Node.js web framework', icon: '🚀' },
      'empty': { name: 'Empty', description: 'Blank project template', icon: '📁' },
    };
    
    return templates[template || 'empty'] || templates['empty'];
  };

  const templateInfo = getTemplateInfo(project?.template);

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="p-2 border-b border-slate-800">
        <div className="flex space-x-1">
          <Button
            variant={activeTab === 'explorer' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('explorer')}
            className="flex-1 h-8 text-xs"
          >
            <FolderTree className="h-3 w-3 mr-1" />
            Files
          </Button>
          <Button
            variant={activeTab === 'info' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('info')}
            className="flex-1 h-8 text-xs"
          >
            <Info className="h-3 w-3 mr-1" />
            Info
          </Button>
          <Button
            variant={activeTab === 'git' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('git')}
            className="flex-1 h-8 text-xs"
          >
            <GitBranch className="h-3 w-3 mr-1" />
            Git
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'explorer' && (
          <FileExplorer
            project={project}
            selectedFile={selectedFile}
            onFileSelect={onFileSelect}
          />
        )}

        {activeTab === 'info' && (
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {project ? (
                <>
                  {/* Project Name */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-sm text-slate-400">
                        {project.description}
                      </p>
                    )}
                  </div>

                  <Separator className="bg-slate-700" />

                  {/* Template Info */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Template</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{templateInfo.icon}</span>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {templateInfo.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {templateInfo.description}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-slate-700" />

                  {/* File Statistics */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Statistics</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-slate-400">Files</span>
                        </div>
                        <Badge variant="secondary" className="bg-slate-700">
                          {fileCount}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Folder className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm text-slate-400">Folders</span>
                        </div>
                        <Badge variant="secondary" className="bg-slate-700">
                          {folderCount}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-slate-700" />

                  {/* Project Details */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-slate-500" />
                        <span className="text-slate-400">Created:</span>
                        <span className="text-slate-300">{formatDate(project.createdAt)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-slate-500" />
                        <span className="text-slate-400">Modified:</span>
                        <span className="text-slate-300">{formatDate(project.updatedAt)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Folder className="h-4 w-4 text-slate-500" />
                        <span className="text-slate-400">Path:</span>
                      </div>
                      <div className="text-xs text-slate-500 break-all font-mono bg-slate-800 p-2 rounded">
                        {project.path}
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-slate-700" />

                  {/* Actions */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Actions</h4>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start border-slate-600"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Project Settings
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start border-slate-600"
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Dependencies
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-400">
                  <Info className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                  <p className="text-sm">No project selected</p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {activeTab === 'git' && (
          <ScrollArea className="h-full">
            <div className="p-4">
              <div className="text-center text-slate-400">
                <GitBranch className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                <p className="text-sm mb-2">Git integration</p>
                <p className="text-xs text-slate-500">
                  Version control features will be available here
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 border-slate-600"
                >
                  Initialize Git Repository
                </Button>
              </div>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
