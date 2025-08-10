import { useState, useEffect } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarProvider,
  SidebarTrigger 
} from "@/components/ui/sidebar";
import { MonacoEditor } from "@/components/ui/monaco-editor";
import { FileExplorer } from "@/components/ui/file-explorer";
import { Terminal } from "@/components/ui/terminal";
import { ProjectSidebar } from "@/components/ui/project-sidebar";
import { IntegrationPanel } from "@/components/ui/integration-panel";
import { AIAssistant } from "@/components/ui/ai-assistant";
import { 
  Code2, 
  FolderTree, 
  Terminal as TerminalIcon, 
  Settings,
  Play,
  Save,
  Menu,
  Bot,
  X
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useElectron } from "@/hooks/use-electron";
import type { Project } from "@shared/schema";

interface IDELayoutProps {
  project?: Project;
  selectedFile: string | null;
  onFileSelect: (path: string | null) => void;
}

export function IDELayout({ project, selectedFile, onFileSelect }: IDELayoutProps) {
  const { user, logout } = useAuth();
  const { isElectron } = useElectron();
  const [activePanel, setActivePanel] = useState<'files' | 'integrations'>('files');
  const [showTerminal, setShowTerminal] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [fileContent, setFileContent] = useState<string>("");
  const [currentLanguage, setCurrentLanguage] = useState<string>("javascript");

  // Determine language from file extension
  useEffect(() => {
    if (selectedFile) {
      const extension = selectedFile.split('.').pop()?.toLowerCase();
      const languageMap: { [key: string]: string } = {
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'py': 'python',
        'html': 'html',
        'css': 'css',
        'scss': 'scss',
        'json': 'json',
        'md': 'markdown',
        'yml': 'yaml',
        'yaml': 'yaml',
        'xml': 'xml',
        'php': 'php',
        'java': 'java',
        'c': 'c',
        'cpp': 'cpp',
        'cs': 'csharp',
        'go': 'go',
        'rs': 'rust',
        'rb': 'ruby',
        'sql': 'sql',
      };
      setCurrentLanguage(languageMap[extension || ''] || 'plaintext');
    }
  }, [selectedFile]);

  const handleSave = async () => {
    if (selectedFile && isElectron) {
      try {
        // Use Electron API to save file
        const result = await (window as any).electronAPI?.writeFile(selectedFile, fileContent);
        if (result?.success) {
          console.log("File saved successfully");
        } else {
          console.error("Failed to save file:", result?.error);
        }
      } catch (error) {
        console.error("Save error:", error);
      }
    }
  };

  const handleRun = () => {
    if (project && fileContent) {
      setShowTerminal(true);
      // The terminal component will handle the execution
    }
  };

  // Handle file content loading when selected file changes
  useEffect(() => {
    if (selectedFile && isElectron) {
      // Load file content from Electron
      (window as any).electronAPI?.readFile(selectedFile)
        .then((result: any) => {
          if (result?.success && result?.content) {
            setFileContent(result.content);
          }
        })
        .catch((error: any) => {
          console.error("Failed to load file:", error);
        });
    }
  }, [selectedFile, isElectron]);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen bg-slate-950 text-white">
        {/* Main Sidebar */}
        <Sidebar className="w-16 bg-slate-900 border-r border-slate-800">
          <SidebarHeader className="p-2">
            <div className="flex flex-col items-center space-y-2">
              <Code2 className="h-8 w-8 text-blue-500" />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <div className="flex flex-col items-center space-y-2 p-2">
              <Button
                variant={activePanel === 'files' ? 'default' : 'ghost'}
                size="sm"
                className="w-12 h-12 p-0"
                onClick={() => setActivePanel('files')}
              >
                <FolderTree className="h-5 w-5" />
              </Button>
              
              <Button
                variant={activePanel === 'integrations' ? 'default' : 'ghost'}
                size="sm"
                className="w-12 h-12 p-0"
                onClick={() => setActivePanel('integrations')}
              >
                <Settings className="h-5 w-5" />
              </Button>
              
              <Button
                variant={showTerminal ? 'default' : 'ghost'}
                size="sm"
                className="w-12 h-12 p-0"
                onClick={() => setShowTerminal(!showTerminal)}
              >
                <TerminalIcon className="h-5 w-5" />
              </Button>
              
              <Button
                variant={showAI ? 'default' : 'ghost'}
                size="sm"
                className="w-12 h-12 p-0"
                onClick={() => setShowAI(!showAI)}
                title="Zync AI Assistant"
              >
                <Bot className="h-5 w-5" />
              </Button>
            </div>
          </SidebarContent>
        </Sidebar>

        {/* Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <header className="h-12 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
            <div className="flex items-center space-x-4">
              <SidebarTrigger>
                <Menu className="h-4 w-4" />
              </SidebarTrigger>
              
              {project && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-slate-400">Project:</span>
                  <span className="font-medium">{project.name}</span>
                </div>
              )}
              
              {selectedFile && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-slate-400">File:</span>
                  <span className="font-medium">{selectedFile.split('/').pop()}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant={showAI ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowAI(!showAI)}
                className="border-slate-600 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Bot className="h-4 w-4 mr-2" />
                Zync AI
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={!selectedFile}
                className="border-slate-600"
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRun}
                disabled={!fileContent}
                className="border-slate-600"
              >
                <Play className="h-4 w-4 mr-1" />
                Run
              </Button>
              
              <Separator orientation="vertical" className="h-6 bg-slate-600" />
              
              <span className="text-sm text-slate-400">{user?.username}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-slate-400"
              >
                Sign Out
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 flex">
            <ResizablePanelGroup direction="horizontal">
              {/* Secondary Sidebar */}
              <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
                <div className="h-full bg-slate-900/50 border-r border-slate-800">
                  {activePanel === 'files' && (
                    <ProjectSidebar 
                      project={project}
                      selectedFile={selectedFile}
                      onFileSelect={onFileSelect}
                    />
                  )}
                  
                  {activePanel === 'integrations' && (
                    <IntegrationPanel />
                  )}
                </div>
              </ResizablePanel>

              <ResizableHandle className="bg-slate-800 hover:bg-slate-700 w-1" />

              {/* Editor Area */}
              <ResizablePanel defaultSize={showAI ? (showTerminal ? 40 : 60) : (showTerminal ? 50 : 80)}>
                <ResizablePanelGroup direction="vertical">
                  <ResizablePanel defaultSize={showTerminal ? 70 : 100}>
                    <div className="h-full">
                      {selectedFile ? (
                        <MonacoEditor
                          value={fileContent}
                          onChange={setFileContent}
                          language={currentLanguage}
                          path={selectedFile}
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center bg-slate-950">
                          <div className="text-center">
                            <Code2 className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-300 mb-2">
                              Welcome to Zync IDE
                            </h3>
                            <p className="text-slate-400 mb-4">
                              Select a file from the explorer to start editing
                            </p>
                            <Button
                              onClick={() => setShowAI(true)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Bot className="h-4 w-4 mr-2" />
                              Try Zync AI Assistant
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </ResizablePanel>

                  {showTerminal && (
                    <>
                      <ResizableHandle className="bg-slate-800 hover:bg-slate-700 h-1" />
                      <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                        <Terminal 
                          project={project}
                          code={fileContent}
                          language={currentLanguage}
                        />
                      </ResizablePanel>
                    </>
                  )}
                </ResizablePanelGroup>
              </ResizablePanel>

              {/* AI Assistant Panel */}
              {showAI && (
                <>
                  <ResizableHandle className="bg-slate-800 hover:bg-slate-700 w-1" />
                  <ResizablePanel defaultSize={30} minSize={25} maxSize={50}>
                    <AIAssistant
                      currentCode={fileContent}
                      currentLanguage={currentLanguage}
                      currentFileName={selectedFile || undefined}
                      projectContext={project?.name || undefined}
                      onCodeInsert={(code) => {
                        // Extract code blocks from markdown if present
                        const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
                        const matches = Array.from(code.matchAll(codeBlockRegex));
                        
                        if (matches.length > 0) {
                          // Use the first code block found
                          const extractedCode = matches[0][1];
                          setFileContent(extractedCode);
                        } else {
                          // If no code blocks, insert the full text
                          setFileContent(prev => prev + '\n' + code);
                        }
                      }}
                    />
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
