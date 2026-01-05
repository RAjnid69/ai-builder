// app/builder/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import ChatPanel from "@/components/builder/ChatPanel";
import PreviewPane from "@/components/builder/PreviewPanel";
import CodeEditor from "@/components/builder/CodeEditor";
import { ProjectState } from "@/types/project";
import LogoutButton from "@/components/builder/LogoutButton";
import { LayoutDashboard, User as UserIcon } from "lucide-react";

function BuilderContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  const [project, setProject] = useState<ProjectState>({
    frontendFiles: {},
    backendFiles: {},
    activeFile: null,
    side: "frontend",
  });

  const [activeView, setActiveView] = useState<"code" | "window" | "preview" | "database">("preview");
  const [loadingProject, setLoadingProject] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Load project from database if projectId exists
  useEffect(() => {
    if (status === "authenticated" && projectId) {
      loadProject(projectId);
    }
  }, [status, projectId]);

  const loadProject = async (id: string) => {
    setLoadingProject(true);
    try {
      const response = await fetch(`/api/Projects?id=${id}`);
      if (response.ok) {
        const data = await response.json();
        setProject({
          frontendFiles: data.frontendFiles || {},
          backendFiles: data.backendFiles || {},
          activeFile: null,
          side: "frontend",
        });
      } else {
        console.error("Failed to load project");
      }
    } catch (error) {
      console.error("Error loading project:", error);
    } finally {
      setLoadingProject(false);
    }
  };

  // Show loading state while checking session or loading project
  if (status === "loading" || loadingProject) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">
            {loadingProject ? "Loading project..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (status === "unauthenticated" || !session) {
    return null;
  }

  // Sync active file from CodeEditor back to project state
  const handleActiveFileChange = (path: string | null) => {
    setProject((prev) => ({
      ...prev,
      activeFile: path,
    }));
  };

  // Sync file content changes from CodeEditor
  const handleFileChange = (path: string, content: string) => {
    setProject((prev) => {
      const updated = {
        ...prev,
        frontendFiles: {
          ...prev.frontendFiles,
          [path]: content,
        },
      };
      // Auto-save if projectId exists
      if (projectId) {
        saveProject(projectId, updated.frontendFiles, updated.backendFiles);
      }
      return updated;
    });
  };

  // Auto-save project to database
  const saveProject = async (id: string, frontendFiles: Record<string, string>, backendFiles: Record<string, string>) => {
    try {
      await fetch("/api/Projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          frontendFiles,
          backendFiles,
        }),
      });
    } catch (error) {
      console.error("Error auto-saving project:", error);
    }
  };

  const frontendFiles = project.frontendFiles || {};
  const hasFiles = Object.keys(frontendFiles).length > 0;

  return (
    <div className="flex flex-col h-screen w-screen bg-black text-white overflow-hidden">
      {/* Top Navigation - Bolt.new style */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-black/80 backdrop-blur-md border-b border-white/10 flex items-center px-2 sm:px-4">
        <div className="flex items-center justify-between w-full max-w-7xl mx-auto gap-2">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link href="/dashboard" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-lg sm:text-xl">
                B
              </div>
              <span className="text-sm sm:text-lg font-semibold tracking-tight hidden sm:inline">
                AI Website Builder
              </span>
            </Link>
          </div>

          {/* Toggle Buttons - Hidden on very small screens */}
          <div className="hidden sm:flex items-center gap-1 bg-black/60 rounded-full p-1 border border-white/10 shadow-lg flex-1 justify-center max-w-md mx-2">
            {(["code", "window", "preview", "database"] as const).map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-2 sm:px-3 md:px-5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all flex-shrink-0 ${activeView === view ? "bg-purple-600/60 text-white shadow-md" : "text-gray-400 hover:bg-white/10"
                  }`}
              >
                <span className="hidden sm:inline">{view.charAt(0).toUpperCase() + view.slice(1)}</span>
                <span className="sm:hidden">{view.charAt(0).toUpperCase()}</span>
              </button>
            ))}
          </div>

          {/* User Info, Dashboard & Logout */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
            {/* User Email - Hidden on mobile */}
            {session?.user?.email && (
              <div className="hidden lg:flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800">
                <UserIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-zinc-400" />
                <span className="text-xs text-zinc-300 truncate max-w-[100px] md:max-w-[120px]">
                  {session.user.email}
                </span>
              </div>
            )}
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Go to Dashboard"
            >
              <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 pt-14 overflow-hidden">
        {/* Left Sidebar: Agent/Chat */}
        <div className="w-[380px] border-r border-white/10 bg-black/60 backdrop-blur-md overflow-y-auto">
          <ChatPanel
            project={project}
            setProject={setProject}
            projectId={projectId || undefined}
            onSave={saveProject}
          />
        </div>

        {/* Main Area - Code / Preview / etc */}
        <div className="flex-1 relative">
          {/* Loading / No Files State */}
          {!hasFiles && activeView !== "code" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 bg-black/80 z-10">
              <div className="text-3xl mb-4">No files yet</div>
              <p className="text-lg">Ask the agent to create something!</p>
            </div>
          )}

          {/* Code Editor View */}
          {activeView === "code" && (
            <CodeEditor
              project={project}
              onFileChange={handleFileChange}
              onActiveFileChange={handleActiveFileChange}
            />
          )}

          {/* Preview View */}
          {activeView === "preview" && (
            <div className="absolute inset-0">
              {hasFiles ? (
                <PreviewPane project={project} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <div className="text-3xl mb-4">No files yet</div>
                  <p>Ask the agent to create something!</p>
                </div>
              )}
            </div>
          )}

          {/* Window View */}
          {activeView === "window" && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 bg-black/80">
              <div className="text-center">
                <div className="text-3xl mb-4">Window View</div>
                <p>Desktop-like app simulation coming soon</p>
              </div>
            </div>
          )}

          {/* Database View */}
          {activeView === "database" && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 bg-black/80">
              <div className="text-center">
                <div className="text-3xl mb-4">Database</div>
                <p>Database explorer coming soon</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    }>
      <BuilderContent />
    </Suspense>
  );
}