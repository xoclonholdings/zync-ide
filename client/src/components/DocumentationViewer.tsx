import React from 'react';

interface DocumentationViewerProps {
  content: string;
  title: string;
}

export function DocumentationViewer({ content, title }: DocumentationViewerProps) {
  // Convert markdown to basic HTML for better display
  const formatContent = (markdown: string) => {
    return markdown
      .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold text-white mb-6">$1</h1>')
      .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-semibold text-white mt-8 mb-4">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="text-xl font-medium text-white mt-6 mb-3">$1</h3>')
      .replace(/^#### (.+)$/gm, '<h4 class="text-lg font-medium text-white mt-4 mb-2">$1</h4>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em class="text-gray-300 italic">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-800 text-blue-400 px-2 py-1 rounded font-mono text-sm">$1</code>')
      .replace(/^```(\w+)?\n([\s\S]*?)^```$/gm, '<pre class="bg-gray-900 border border-gray-700 rounded-lg p-4 my-4 overflow-x-auto"><code class="text-green-400 font-mono text-sm whitespace-pre">$2</code></pre>')
      .replace(/^- (.+)$/gm, '<li class="text-gray-300 ml-4 mb-1">• $1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li class="text-gray-300 ml-4 mb-1 list-decimal">$1</li>')
      .replace(/^\> (.+)$/gm, '<blockquote class="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-gray-800 text-gray-300 italic">$1</blockquote>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline">$1</a>')
      .replace(/\n\n/g, '</p><p class="text-gray-300 mb-4">')
      .replace(/\n/g, '<br/>');
  };

  const formattedContent = formatContent(content);

  return (
    <div className="bg-black min-h-screen text-white">
      <div className="max-w-4xl mx-auto py-8 px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
          <div className="w-20 h-1 bg-blue-500 rounded"></div>
        </div>
        
        <div className="prose prose-invert max-w-none">
          <div 
            className="text-gray-300 leading-relaxed"
            dangerouslySetInnerHTML={{ 
              __html: `<p class="text-gray-300 mb-4">${formattedContent}</p>` 
            }}
          />
        </div>
        
        <div className="mt-12 p-6 bg-gray-900 border border-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">Need Help?</h3>
          <p className="text-gray-400 text-sm">
            For additional support or questions about this documentation, please contact your system administrator
            or refer to the other available guides in the documentation section.
          </p>
        </div>
      </div>
    </div>
  );
}