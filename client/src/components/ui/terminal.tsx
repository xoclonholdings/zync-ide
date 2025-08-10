import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Terminal as TerminalIcon, 
  Play, 
  Trash2, 
  Copy,
  Download,
  X
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useElectron } from "@/hooks/use-electron";
import type { Project } from "@shared/schema";

interface TerminalProps {
  project?: Project;
  code?: string;
  language?: string;
}

interface TerminalOutput {
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
  timestamp: Date;
}

export function Terminal({ project, code, language }: TerminalProps) {
  const { isElectron, executeTerminal, executeCode } = useElectron();
  const [command, setCommand] = useState("");
  const [output, setOutput] = useState<TerminalOutput[]>([]);
  const [currentDirectory, setCurrentDirectory] = useState(project?.path || "~");
  const [isExecuting, setIsExecuting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize terminal
  useEffect(() => {
    addOutput("system", `Terminal initialized in ${currentDirectory}`);
    if (project) {
      addOutput("system", `Project: ${project.name}`);
    }
  }, [project]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output]);

  // Terminal command execution
  const terminalMutation = useMutation({
    mutationFn: async (cmd: string) => {
      if (isElectron) {
        return await executeTerminal(cmd, currentDirectory);
      } else {
        const response = await apiRequest("POST", "/api/terminal/execute", {
          command: cmd,
          cwd: currentDirectory,
        });
        return response.json();
      }
    },
    onSuccess: (result) => {
      setIsExecuting(false);
      
      if (result.success) {
        if (result.stdout) {
          addOutput("output", result.stdout);
        }
        if (result.stderr) {
          addOutput("error", result.stderr);
        }
        
        // Update current directory if cd command was successful
        if (command.trim().startsWith("cd ")) {
          const newPath = command.trim().substring(3).trim();
          if (newPath && result.success) {
            setCurrentDirectory(newPath);
          }
        }
      } else {
        addOutput("error", result.error || "Command failed");
      }
    },
    onError: (error: any) => {
      setIsExecuting(false);
      addOutput("error", error.message || "Failed to execute command");
    },
  });

  // Code execution
  const codeMutation = useMutation({
    mutationFn: async () => {
      if (!code || !language) throw new Error("No code to execute");
      
      if (isElectron) {
        return await executeCode(language, code, project?.path);
      } else {
        const response = await apiRequest("POST", "/api/execute", {
          language,
          code,
          projectPath: project?.path,
        });
        return response.json();
      }
    },
    onSuccess: (result) => {
      setIsExecuting(false);
      
      if (result.success || result.result?.success) {
        const data = result.result || result;
        addOutput("system", `Executing ${language} code...`);
        
        if (data.stdout) {
          addOutput("output", data.stdout);
        }
        if (data.stderr) {
          addOutput("error", data.stderr);
        }
        
        addOutput("system", `Process exited with code ${data.exitCode || 0}`);
      } else {
        addOutput("error", result.error || result.result?.error || "Code execution failed");
      }
    },
    onError: (error: any) => {
      setIsExecuting(false);
      addOutput("error", error.message || "Failed to execute code");
    },
  });

  const addOutput = (type: TerminalOutput['type'], content: string) => {
    setOutput(prev => [...prev, {
      type,
      content: content.trim(),
      timestamp: new Date(),
    }]);
  };

  const handleCommand = () => {
    if (!command.trim() || isExecuting) return;
    
    addOutput("input", `${currentDirectory}$ ${command}`);
    setIsExecuting(true);
    
    terminalMutation.mutate(command);
    setCommand("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCommand();
    }
  };

  const executeCurrentCode = () => {
    if (!code || !language || isExecuting) return;
    
    setIsExecuting(true);
    addOutput("input", `Running ${language} code...`);
    codeMutation.mutate();
  };

  const clearTerminal = () => {
    setOutput([]);
    addOutput("system", "Terminal cleared");
  };

  const copyOutput = () => {
    const textOutput = output
      .map(item => {
        const prefix = item.type === 'input' ? '$ ' : 
                     item.type === 'error' ? '[ERROR] ' :
                     item.type === 'system' ? '[SYSTEM] ' : '';
        return `${prefix}${item.content}`;
      })
      .join('\n');
    
    navigator.clipboard.writeText(textOutput);
  };

  const getOutputStyle = (type: TerminalOutput['type']) => {
    switch (type) {
      case 'input':
        return 'text-blue-400 font-medium';
      case 'error':
        return 'text-red-400';
      case 'system':
        return 'text-yellow-400';
      default:
        return 'text-slate-300';
    }
  };

  const getPrompt = () => {
    const dir = currentDirectory.split('/').pop() || currentDirectory;
    return `${dir}$`;
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 border-t border-slate-800">
      {/* Terminal Header */}
      <div className="flex items-center justify-between p-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <TerminalIcon className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium text-slate-300">Terminal</span>
          <span className="text-xs text-slate-500">{currentDirectory}</span>
        </div>
        
        <div className="flex items-center space-x-1">
          {code && language && (
            <Button
              variant="ghost"
              size="sm"
              onClick={executeCurrentCode}
              disabled={isExecuting}
              className="h-8 px-2 text-green-400 hover:bg-green-400/10"
            >
              <Play className="h-3 w-3 mr-1" />
              Run Code
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={copyOutput}
            className="h-8 px-2"
          >
            <Copy className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={clearTerminal}
            className="h-8 px-2"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Terminal Output */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-1 font-mono text-sm">
          {output.map((item, index) => (
            <div key={index} className={`whitespace-pre-wrap ${getOutputStyle(item.type)}`}>
              {item.content}
            </div>
          ))}
          
          {isExecuting && (
            <div className="text-yellow-400 animate-pulse">
              Executing...
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Command Input */}
      <div className="p-2 bg-slate-900 border-t border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="text-green-400 font-mono text-sm min-w-0 flex-shrink-0">
            {getPrompt()}
          </span>
          <Input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a command..."
            disabled={isExecuting}
            className="flex-1 bg-transparent border-none focus:ring-0 font-mono text-sm text-slate-300 placeholder-slate-500 p-0"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCommand}
            disabled={!command.trim() || isExecuting}
            className="h-8 px-2"
          >
            <Play className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
