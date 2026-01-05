"use client";

import { useState, useEffect, useMemo } from "react";
import Editor from "@monaco-editor/react";
import FileTree from "./FileTree";
import { ProjectState } from "@/types/project";

interface CodeEditorProps {
  project: ProjectState;
  onFileChange: (path: string, content: string) => void;
  onActiveFileChange: (path: string | null) => void;
}

export default function CodeEditor({ project, onFileChange, onActiveFileChange }: CodeEditorProps) {
  const frontendFiles = useMemo(() => project.frontendFiles || {}, [project.frontendFiles]);
  const filePaths = useMemo(() => Object.keys(frontendFiles), [frontendFiles]);

  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [currentContent, setCurrentContent] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  // Sync state with props ONLY when project.activeFile or files change significantly
  useEffect(() => {
    // Determine what the active file should be
    const nextActiveFile = project.activeFile || filePaths[0] || null;

    // Only update if it's different from current state (to avoid cascades)
    if (nextActiveFile !== activeFile) {
      setActiveFile(nextActiveFile);
      setCurrentContent(nextActiveFile ? frontendFiles[nextActiveFile] || "" : "");
      setIsDirty(false);
    } else if (nextActiveFile && !isDirty && currentContent !== frontendFiles[nextActiveFile]) {
      // Content changed from outside but we aren't dirty, so sync it
      setCurrentContent(frontendFiles[nextActiveFile] || "");
    }
  }, [project.activeFile, filePaths, frontendFiles, activeFile, currentContent, isDirty]);

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined || !activeFile) return;

    setCurrentContent(value);
    setIsDirty(true);
    onFileChange(activeFile, value); // Auto-save
  };

  const handleFileSelect = (path: string) => {
    setActiveFile(path);
    setCurrentContent(frontendFiles[path] || "");
    setIsDirty(false);
    onActiveFileChange(path);
  };

  const getLanguage = (path: string) => {
    if (path.endsWith(".tsx") || path.endsWith(".jsx")) return "typescript";
    if (path.endsWith(".ts")) return "typescript";
    if (path.endsWith(".js")) return "javascript";
    if (path.endsWith(".css")) return "css";
    if (path.endsWith(".json")) return "json";
    return "plaintext";
  };

  return (
    <div className="flex h-full bg-[#1e1e1e] text-white">
      {/* File Tree Sidebar */}
      <div className="w-64 border-r border-[#3c3c3c]">
        <FileTree
          project={project}
          activeFile={activeFile}
          onFileSelect={handleFileSelect}
        />
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Editor Header */}
        <div className="h-10 bg-[#252526] border-b border-[#3c3c3c] flex items-center px-4 justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-blue-400">📄</span>
            <span>{activeFile || "No file selected"}</span>
            {isDirty && <span className="text-yellow-400">●</span>}
          </div>
        </div>

        {/* Monaco Editor */}
        <div className="flex-1">
          {activeFile ? (
            <Editor
              height="100%"
              defaultLanguage={getLanguage(activeFile)}
              value={currentContent}
              theme="vs-dark"
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 16 },
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              Select a file from the tree
            </div>
          )}
        </div>
      </div>
    </div>
  );
}