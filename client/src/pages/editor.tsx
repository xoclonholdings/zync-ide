import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { IDELayout } from "@/components/layout/ide-layout";
import { useAuth } from "@/hooks/use-auth";

export default function Editor() {
  const { projectId } = useParams<{ projectId?: string }>();
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Fetch project details if projectId is provided
  const { data: projectData, isLoading, error } = useQuery({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId && !!user,
  });

  const project = projectData?.project;

  useEffect(() => {
    // Set up default file selection or handle project-specific initialization
    if (project) {
      // You could automatically open a main file like index.js, main.py, etc.
      // based on the project template
    }
  }, [project]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
          <p className="text-slate-300">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error && projectId) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load project. The project may not exist or you may not have access to it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <IDELayout
      project={project}
      selectedFile={selectedFile}
      onFileSelect={setSelectedFile}
    />
  );
}
