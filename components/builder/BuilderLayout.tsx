"use client";

import { useState } from "react";
import ChatPanel from "./ChatPanel";
import PreviewPanel from "./PreviewPanel";

export interface ProjectState {
  frontendFiles: Record<string, string>;
  backendFiles: Record<string, string>;
  activeFile: string | null;
  side: "frontend" | "backend";
}

export default function BuilderLayout() {
  const [project, setProject] = useState<ProjectState>({
    frontendFiles: {},
    backendFiles: {},
    activeFile: null,
    side: "frontend",
  });

  return (
    <div className="h-screen w-screen bg-zinc-950 text-white overflow-hidden">
      <div className="flex h-full">

        {/* Chat Panel */}
        <div className="w-[320px] border-r border-white/10 flex flex-col">
          <ChatPanel project={project} setProject={setProject} />
        </div>

        {/* Preview Panel */}
        <div className="flex-1">
          <PreviewPanel project={project} />
        </div>

      </div>
    </div>
  );
}
