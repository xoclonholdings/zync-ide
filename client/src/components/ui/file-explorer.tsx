import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  ChevronRight, 
  ChevronDown, 
  File, 
  Folder, 
  FolderOpen,
  Plus,
  FileText,
  Trash2,
  Edit3,
  Copy
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useElectron } from "@/hooks/use-electron";
import type { Project } from "@shared/schema";

interface FileExplorerProps {
  project?: Project;
  selectedFile: string | null;
  onFileSelect: (path: string | null) => void;
}

interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileItem[];
  isExpanded?: boolean;
}

const createFileSchema = z.object({
  name: z.string().min(1, "File name is required"),
  isDirectory: z.boolean().default(false),
});

type CreateFileForm = z.infer<typeof createFileSchema>;

export function FileExplorer({ project, selectedFile, onFileSelect }: FileExplorerProps) {
  const { isElectron, readDir, createDir, writeFile } = useElectron();
  const queryClient = useQueryClient();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createParentPath, setCreateParentPath] = useState<string>("");
  const [contextMenuTarget, setContextMenuTarget] = useState<FileItem | null>(null);

  const form = useForm<CreateFileForm>({
    resolver: zodResolver(createFileSchema),
    defaultValues: {
      name: "",
      isDirectory: false,
    },
  });

  // Load project files
  const { data: filesData, isLoading } = useQuery({
    queryKey: ["/api/projects", project?.id, "files"],
    enabled: !!project && isElectron,
  });

  // Load file system structure (for Electron)
  const { data: fsData, refetch: refetchFileSystem } = useQuery({
    queryKey: ["filesystem", project?.path],
    queryFn: async () => {
      if (!project?.path || !isElectron) return { items: [] };
      return await readDir(project.path);
    },
    enabled: !!project?.path && isElectron,
  });

  const files = Array.isArray(filesData) ? filesData : (filesData?.files || []);
  const fsItems = fsData?.items || [];

  // Create file mutation
  const createFileMutation = useMutation({
    mutationFn: async (data: CreateFileForm & { parentPath: string }) => {
      const fullPath = `${data.parentPath}/${data.name}`;
      
      if (isElectron) {
        if (data.isDirectory) {
          return await createDir(fullPath);
        } else {
          return await writeFile(fullPath, "");
        }
      } else {
        // Web version - use API
        const response = await apiRequest("POST", `/api/projects/${project?.id}/files`, {
          name: data.name,
          path: fullPath,
          isDirectory: data.isDirectory,
          content: data.isDirectory ? null : "",
        });
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project?.id, "files"] });
      refetchFileSystem();
      setShowCreateDialog(false);
      form.reset();
    },
  });

  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  }, []);

  const handleFileClick = useCallback((item: FileItem) => {
    if (item.isDirectory) {
      toggleFolder(item.path);
    } else {
      onFileSelect(item.path);
    }
  }, [toggleFolder, onFileSelect]);

  const handleCreateFile = useCallback((parentPath: string, isDirectory: boolean) => {
    setCreateParentPath(parentPath);
    form.setValue("isDirectory", isDirectory);
    setShowCreateDialog(true);
  }, [form]);

  const onSubmitCreate = (data: CreateFileForm) => {
    createFileMutation.mutate({
      ...data,
      parentPath: createParentPath,
    });
  };

  const renderFileTree = useCallback((items: FileItem[], level: number = 0) => {
    return items.map((item) => {
      const isExpanded = expandedFolders.has(item.path);
      const isSelected = selectedFile === item.path;
      
      return (
        <div key={item.path}>
          <ContextMenu>
            <ContextMenuTrigger>
              <div
                className={`flex items-center space-x-2 px-2 py-1 hover:bg-slate-800 cursor-pointer ${
                  isSelected ? 'bg-blue-600/20 border-r-2 border-blue-500' : ''
                }`}
                style={{ paddingLeft: `${level * 16 + 8}px` }}
                onClick={() => handleFileClick(item)}
              >
                {item.isDirectory ? (
                  <>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                    {isExpanded ? (
                      <FolderOpen className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Folder className="h-4 w-4 text-blue-500" />
                    )}
                  </>
                ) : (
                  <>
                    <div className="w-4" />
                    <FileText className="h-4 w-4 text-slate-400" />
                  </>
                )}
                <span className={`text-sm truncate ${isSelected ? 'text-white font-medium' : 'text-slate-300'}`}>
                  {item.name}
                </span>
              </div>
            </ContextMenuTrigger>
            
            <ContextMenuContent className="bg-slate-800 border-slate-700">
              {item.isDirectory && (
                <>
                  <ContextMenuItem onClick={() => handleCreateFile(item.path, false)}>
                    <FileText className="h-4 w-4 mr-2" />
                    New File
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleCreateFile(item.path, true)}>
                    <Folder className="h-4 w-4 mr-2" />
                    New Folder
                  </ContextMenuItem>
                </>
              )}
              <ContextMenuItem>
                <Edit3 className="h-4 w-4 mr-2" />
                Rename
              </ContextMenuItem>
              <ContextMenuItem>
                <Copy className="h-4 w-4 mr-2" />
                Copy Path
              </ContextMenuItem>
              <ContextMenuItem className="text-red-400">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
          
          {item.isDirectory && isExpanded && item.children && (
            <div>
              {renderFileTree(item.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  }, [expandedFolders, selectedFile, handleFileClick, handleCreateFile]);

  // Convert flat file list to tree structure
  const buildFileTree = useCallback((items: any[]): FileItem[] => {
    const tree: FileItem[] = [];
    const pathMap = new Map<string, FileItem>();

    // Sort items so directories come first, then by name
    const sortedItems = [...items].sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    sortedItems.forEach(item => {
      const fileItem: FileItem = {
        name: item.name,
        path: item.path,
        isDirectory: item.isDirectory,
        children: item.isDirectory ? [] : undefined,
      };

      pathMap.set(item.path, fileItem);

      const parentPath = item.path.substring(0, item.path.lastIndexOf('/'));
      const parent = pathMap.get(parentPath);

      if (parent && parent.children) {
        parent.children.push(fileItem);
      } else {
        tree.push(fileItem);
      }
    });

    return tree;
  }, []);

  const fileTree = isElectron ? buildFileTree(fsItems) : buildFileTree(files);

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-sm text-slate-400">Loading files...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-300">Explorer</h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => handleCreateFile(project?.path || "", false)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {project && (
          <div className="text-xs text-slate-500 truncate" title={project.path}>
            {project.name}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {fileTree.length === 0 ? (
          <div className="p-4 text-center">
            <Folder className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400 mb-2">No files yet</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCreateFile(project?.path || "", false)}
              className="border-slate-600"
            >
              <Plus className="h-4 w-4 mr-1" />
              New File
            </Button>
          </div>
        ) : (
          <div className="py-2">
            {renderFileTree(fileTree)}
          </div>
        )}
      </div>

      {/* Create File Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>
              Create {form.watch("isDirectory") ? "Folder" : "File"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Create a new {form.watch("isDirectory") ? "folder" : "file"} in {createParentPath}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitCreate)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={form.watch("isDirectory") ? "folder-name" : "filename.ext"}
                        className="bg-slate-800 border-slate-600"
                        autoFocus
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  className="border-slate-600"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createFileMutation.isPending}>
                  {createFileMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
