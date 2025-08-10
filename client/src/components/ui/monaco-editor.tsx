import { useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  path?: string;
  theme?: string;
  options?: any;
}

export function MonacoEditor({
  value,
  onChange,
  language = "javascript",
  path,
  theme = "vs-dark",
  options = {},
}: MonacoEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoRef = useRef<any>(null);
  const editorInstanceRef = useRef<any>(null);

  const defaultOptions = {
    automaticLayout: true,
    fontSize: 14,
    fontFamily: "'Fira Code', 'JetBrains Mono', 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
    fontLigatures: true,
    lineNumbers: "on",
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    wordWrap: "on",
    tabSize: 2,
    insertSpaces: true,
    renderWhitespace: "selection",
    rulers: [80, 120],
    bracketPairColorization: { enabled: true },
    guides: {
      bracketPairs: true,
      indentation: true,
    },
    suggest: {
      showKeywords: true,
      showSnippets: true,
    },
    quickSuggestions: {
      other: true,
      comments: true,
      strings: true,
    },
    ...options,
  };

  useEffect(() => {
    // Load Monaco Editor
    const script = document.createElement("script");
    script.src = "https://unpkg.com/monaco-editor@0.44.0/min/vs/loader.js";
    script.async = true;
    
    script.onload = () => {
      if ((window as any).require) {
        (window as any).require.config({
          paths: { 
            vs: "https://unpkg.com/monaco-editor@0.44.0/min/vs" 
          }
        });

        (window as any).require(["vs/editor/editor.main"], (monaco: any) => {
          monacoRef.current = monaco;
          
          // Set up dark theme
          monaco.editor.defineTheme("custom-dark", {
            base: "vs-dark",
            inherit: true,
            rules: [
              { token: "comment", foreground: "6A9955", fontStyle: "italic" },
              { token: "keyword", foreground: "569CD6" },
              { token: "string", foreground: "CE9178" },
              { token: "number", foreground: "B5CEA8" },
              { token: "type", foreground: "4EC9B0" },
              { token: "class", foreground: "4EC9B0" },
              { token: "function", foreground: "DCDCAA" },
              { token: "variable", foreground: "9CDCFE" },
            ],
            colors: {
              "editor.background": "#0f172a",
              "editor.foreground": "#e2e8f0",
              "editorLineNumber.foreground": "#64748b",
              "editorLineNumber.activeForeground": "#cbd5e1",
              "editor.selectionBackground": "#334155",
              "editor.selectionHighlightBackground": "#1e293b",
              "editorCursor.foreground": "#3b82f6",
              "editor.findMatchBackground": "#f59e0b",
              "editor.findMatchHighlightBackground": "#f59e0b30",
            },
          });

          if (editorRef.current) {
            editorInstanceRef.current = monaco.editor.create(editorRef.current, {
              value,
              language,
              theme: "custom-dark",
              ...defaultOptions,
            });

            // Set up change listener
            editorInstanceRef.current.onDidChangeModelContent(() => {
              const newValue = editorInstanceRef.current.getValue();
              onChange(newValue);
            });

            // Set up keyboard shortcuts
            editorInstanceRef.current.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
              // Save command - this could trigger a save action
              console.log("Save shortcut pressed");
            });

            editorInstanceRef.current.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.F5, () => {
              // Run command - this could trigger code execution
              console.log("Run shortcut pressed");
            });
          }
        });
      }
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (editorInstanceRef.current) {
        editorInstanceRef.current.dispose();
      }
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Update editor value when prop changes
  useEffect(() => {
    if (editorInstanceRef.current && monacoRef.current) {
      const currentValue = editorInstanceRef.current.getValue();
      if (currentValue !== value) {
        editorInstanceRef.current.setValue(value);
      }
    }
  }, [value]);

  // Update language when prop changes
  useEffect(() => {
    if (editorInstanceRef.current && monacoRef.current) {
      const model = editorInstanceRef.current.getModel();
      if (model) {
        monacoRef.current.editor.setModelLanguage(model, language);
      }
    }
  }, [language]);

  // Handle path changes (for file switching)
  useEffect(() => {
    if (editorInstanceRef.current && monacoRef.current && path) {
      // You could implement model management here for multiple files
      // For now, we'll just update the language based on file extension
      const extension = path.split('.').pop()?.toLowerCase();
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
      };
      
      const detectedLanguage = languageMap[extension || ''] || 'plaintext';
      if (detectedLanguage !== language) {
        const model = editorInstanceRef.current.getModel();
        if (model) {
          monacoRef.current.editor.setModelLanguage(model, detectedLanguage);
        }
      }
    }
  }, [path, language]);

  return (
    <div className="h-full w-full relative">
      <div 
        ref={editorRef} 
        className="h-full w-full" 
        style={{ 
          minHeight: "100%",
          fontFamily: "'Fira Code', 'JetBrains Mono', 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace"
        }}
      />
      {!monacoRef.current && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
          <div className="space-y-4 w-full max-w-2xl mx-auto p-4">
            <Skeleton className="h-4 w-3/4 bg-slate-800" />
            <Skeleton className="h-4 w-1/2 bg-slate-800" />
            <Skeleton className="h-4 w-5/6 bg-slate-800" />
            <Skeleton className="h-4 w-2/3 bg-slate-800" />
            <div className="text-center text-slate-400 text-sm">Loading Monaco Editor...</div>
          </div>
        </div>
      )}
    </div>
  );
}
