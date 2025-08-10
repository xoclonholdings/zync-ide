import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Terminal, Play, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

interface CommandResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  error?: string;
}

interface TerminalEntry {
  id: string;
  command: string;
  result?: CommandResult;
  timestamp: Date;
}

export default function TerminalPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [entries, setEntries] = useState<TerminalEntry[]>([]);
  const [currentCommand, setCurrentCommand] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentDir, setCurrentDir] = useState("~");
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  const executeCommand = async (command: string) => {
    if (!command.trim() || isExecuting) return;

    const entryId = Date.now().toString();
    const newEntry: TerminalEntry = {
      id: entryId,
      command,
      timestamp: new Date()
    };

    setEntries(prev => [...prev, newEntry]);
    setCurrentCommand("");
    setIsExecuting(true);

    try {
      const response = await apiRequest("POST", "/api/terminal/execute", {
        command,
        cwd: currentDir === "~" ? undefined : currentDir
      });

      const result = await response.json();
      
      if (result.success) {
        // Update current directory if cd command was successful
        if (command.trim().startsWith('cd ')) {
          const newPath = command.trim().substring(3).trim();
          if (newPath && result.result.success) {
            setCurrentDir(newPath || "~");
          }
        }

        setEntries(prev => prev.map(entry => 
          entry.id === entryId 
            ? { ...entry, result: result.result }
            : entry
        ));
      } else {
        setEntries(prev => prev.map(entry => 
          entry.id === entryId 
            ? { ...entry, result: { success: false, error: result.error } }
            : entry
        ));
      }
    } catch (error: any) {
      setEntries(prev => prev.map(entry => 
        entry.id === entryId 
          ? { ...entry, result: { success: false, error: error.message } }
          : entry
      ));
    } finally {
      setIsExecuting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      executeCommand(currentCommand);
    }
  };

  const clearTerminal = () => {
    setEntries([]);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400">Please log in to access the terminal.</p>
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
              <Terminal className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold">Terminal</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Current: {currentDir}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={clearTerminal}
              className="text-gray-300"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="p-4 h-[calc(100vh-5rem)] flex flex-col">
        <Card className="flex-1 bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Terminal className="h-5 w-5 text-primary" />
              <span>Zync Terminal</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 h-full">
            <div className="bg-black p-4 rounded font-mono text-sm h-full flex flex-col">
              {/* Terminal Output */}
              <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                {entries.length === 0 && (
                  <div className="text-gray-500">
                    Welcome to Zync Terminal. Type commands to execute them.
                  </div>
                )}
                
                {entries.map((entry) => (
                  <div key={entry.id} className="space-y-1">
                    {/* Command */}
                    <div className="flex items-center space-x-2">
                      <span className="text-primary">$</span>
                      <span className="text-gray-300">{entry.command}</span>
                      <span className="text-xs text-gray-500">
                        {entry.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    {/* Output */}
                    {entry.result && (
                      <div className="ml-4 text-sm">
                        {entry.result.stdout && (
                          <pre className="text-green-400 whitespace-pre-wrap">
                            {entry.result.stdout}
                          </pre>
                        )}
                        {entry.result.stderr && (
                          <pre className="text-red-400 whitespace-pre-wrap">
                            {entry.result.stderr}
                          </pre>
                        )}
                        {entry.result.error && (
                          <div className="text-red-400">
                            Error: {entry.result.error}
                          </div>
                        )}
                        {!entry.result.success && entry.result.exitCode && (
                          <div className="text-yellow-400">
                            Exit code: {entry.result.exitCode}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={terminalEndRef} />
              </div>

              {/* Command Input */}
              <div className="flex items-center space-x-2 border-t border-gray-800 pt-2">
                <span className="text-primary">$</span>
                <Input
                  value={currentCommand}
                  onChange={(e) => setCurrentCommand(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter command..."
                  className="flex-1 bg-transparent border-none text-white placeholder-gray-500 focus:ring-0"
                  disabled={isExecuting}
                  autoFocus
                />
                <Button
                  onClick={() => executeCommand(currentCommand)}
                  disabled={!currentCommand.trim() || isExecuting}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-black"
                >
                  <Play className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}