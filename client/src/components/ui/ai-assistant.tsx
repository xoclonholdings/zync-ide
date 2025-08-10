import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Bot, 
  Send, 
  Code, 
  Bug, 
  FileText, 
  Lightbulb, 
  Zap, 
  MessageSquare,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2,
  Cpu,
  Cloud
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    confidence?: number;
  };
}

interface AIAssistantProps {
  currentCode?: string;
  currentLanguage?: string;
  currentFileName?: string;
  projectContext?: string;
  onCodeInsert?: (code: string) => void;
}

export function AIAssistant({ 
  currentCode = '', 
  currentLanguage = '', 
  currentFileName = '',
  projectContext = '',
  onCodeInsert 
}: AIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [analysisPrompt, setAnalysisPrompt] = useState("");
  const [activeTab, setActiveTab] = useState("chat");
  const [useLocalAI, setUseLocalAI] = useState(false);
  const [aiStatus, setAiStatus] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check AI status on component mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/ai/health');
        const data = await response.json();
        setAiStatus(data);
      } catch (error) {
        console.error('AI status check failed:', error);
      }
    };
    checkStatus();
  }, []);

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: async (data: { message: string; codeContext?: string; projectContext?: string }) => {
      const response = await apiRequest("POST", "/api/ai/chat", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        const aiMessage: ChatMessage = {
          id: Date.now().toString() + '-ai',
          type: 'ai',
          content: data.result,
          timestamp: new Date(),
          metadata: data.metadata
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        toast({
          title: "AI Error",
          description: data.error || "Failed to get AI response",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Connection Error",
        description: error.message || "Failed to connect to AI",
        variant: "destructive",
      });
    },
  });

  // Analysis mutation
  const analysisMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/ai/analyze", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        const aiMessage: ChatMessage = {
          id: Date.now().toString() + '-analysis',
          type: 'ai',
          content: data.result,
          timestamp: new Date(),
          metadata: data.metadata
        };
        setMessages(prev => [...prev, aiMessage]);
        setActiveTab("chat"); // Switch to chat to see results
      } else {
        toast({
          title: "Analysis Error",
          description: data.error || "Analysis failed",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Error",
        description: error.message || "Failed to analyze code",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString() + '-user',
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    
    chatMutation.mutate({
      message: input,
      codeContext: currentCode || undefined,
      projectContext: projectContext || undefined,
      useLocal: useLocalAI
    });

    setInput("");
  };

  const handleAnalyze = (type: string) => {
    if (!currentCode && type !== 'generate') {
      toast({
        title: "No Code",
        description: "Please open a file or select code to analyze",
        variant: "destructive",
      });
      return;
    }

    const requestData = {
      type,
      code: currentCode,
      language: currentLanguage,
      fileName: currentFileName,
      context: analysisPrompt || undefined,
      projectType: projectContext || undefined,
      useLocal: useLocalAI
    };

    if (type === 'generate' && analysisPrompt) {
      requestData.code = '';
      requestData.context = analysisPrompt;
    }

    analysisMutation.mutate(requestData);
    setAnalysisPrompt("");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied",
        description: "Content copied to clipboard",
      });
    });
  };

  const insertCode = (code: string) => {
    if (onCodeInsert) {
      onCodeInsert(code);
      toast({
        title: "Code Inserted",
        description: "Code has been inserted into the editor",
      });
    }
  };

  return (
    <Card className="h-full bg-gray-900 border-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-primary">
          <Bot className="h-5 w-5" />
          Zync AI Assistant
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="secondary">
              {useLocalAI ? 'Local AI' : aiStatus?.anthropicAvailable ? 'Hybrid' : 'Local Only'}
            </Badge>
            {aiStatus?.status && (
              <Badge variant="outline" className="text-xs">
                {aiStatus.status.requestCount}/{aiStatus.status.hourlyLimit}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 h-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-2 mx-4">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-4 h-full flex flex-col">
            {/* Chat Messages */}
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Start a conversation with the AI assistant</p>
                    <p className="text-sm mt-2">Ask about code, get suggestions, or request explanations</p>
                  </div>
                )}
                
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-gray-800 text-white'
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      <div className="flex items-center justify-between mt-2 gap-2">
                        <span className="text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(message.content)}
                            className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          {message.type === 'ai' && message.content.includes('```') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => insertCode(message.content)}
                              className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                            >
                              <Code className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-800">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask the AI anything about your code..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 bg-gray-800 border-gray-700"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!input.trim() || chatMutation.isPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  {chatMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="mt-4 h-full">
            <div className="px-4 space-y-4">
              {/* AI Mode Toggle */}
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {useLocalAI ? (
                      <Cpu className="h-4 w-4 text-green-500" />
                    ) : (
                      <Cloud className="h-4 w-4 text-blue-500" />
                    )}
                    <Label htmlFor="ai-mode" className="text-sm font-medium">
                      {useLocalAI ? 'Local AI Mode' : 'Cloud AI Mode'}
                    </Label>
                  </div>
                  <Switch
                    id="ai-mode"
                    checked={useLocalAI}
                    onCheckedChange={setUseLocalAI}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {useLocalAI 
                    ? 'Using local AI - Unlimited, fast, but basic features'
                    : 'Using cloud AI - Advanced features with usage limits'
                  }
                </div>
              </div>

              {/* Current File Info */}
              {currentFileName && (
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-medium">{currentFileName}</span>
                    {currentLanguage && (
                      <Badge variant="outline" className="text-xs">
                        {currentLanguage}
                      </Badge>
                    )}
                  </div>
                  {currentCode && (
                    <div className="text-xs text-gray-400 mt-1">
                      {currentCode.split('\n').length} lines
                    </div>
                  )}
                </div>
              )}

              {/* Analysis Options */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">Analysis Prompt (Optional)</label>
                  <Textarea
                    value={analysisPrompt}
                    onChange={(e) => setAnalysisPrompt(e.target.value)}
                    placeholder="Specific questions or focus areas for analysis..."
                    className="bg-gray-800 border-gray-700 resize-none"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleAnalyze('analyze')}
                    disabled={analysisMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Code className="h-4 w-4" />
                    Analyze Code
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => handleAnalyze('debug')}
                    disabled={analysisMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Bug className="h-4 w-4" />
                    Debug Issues
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => handleAnalyze('optimize')}
                    disabled={analysisMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Zap className="h-4 w-4" />
                    Optimize
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => handleAnalyze('explain')}
                    disabled={analysisMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Lightbulb className="h-4 w-4" />
                    Explain Code
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => handleAnalyze('document')}
                    disabled={analysisMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Generate Docs
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => handleAnalyze('generate')}
                    disabled={analysisMutation.isPending || !analysisPrompt}
                    className="flex items-center gap-2"
                  >
                    <Code className="h-4 w-4" />
                    Generate Code
                  </Button>
                </div>

                {analysisMutation.isPending && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing with Claude 4.0...
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}