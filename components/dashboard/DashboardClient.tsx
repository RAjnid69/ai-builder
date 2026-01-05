"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Folder,
  Clock,
  LogOut,
  Code2,
  Trash2,
  Edit,
  Search,
  X,
  Check,
  Loader2,
  TrendingUp,
  FileCode,
  Zap,
  ArrowRight,
  Grid3x3,
  List,
  Sparkles,
  User as UserIcon,
  MoreVertical,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  framework: string;
  createdAt: string;
  updatedAt: string;
  frontendFiles?: Record<string, string>;
  backendFiles?: Record<string, string>;
}

interface User {
  email?: string | null;
  role?: string | null;
  id?: string | null;
}

interface DashboardClientProps {
  user: User;
}

type SortOption = "newest" | "oldest" | "name-asc" | "name-desc";
type ViewMode = "grid" | "list";

// --- Deterministic Gradient Helper ---
const getProjectGradient = (id: string, name: string) => {
  const gradients = [
    "from-pink-500/20 to-rose-500/20 border-pink-500/20 text-pink-400",
    "from-purple-500/20 to-indigo-500/20 border-purple-500/20 text-purple-400",
    "from-blue-500/20 to-cyan-500/20 border-blue-500/20 text-blue-400",
    "from-emerald-500/20 to-teal-500/20 border-emerald-500/20 text-emerald-400",
    "from-orange-500/20 to-amber-500/20 border-orange-500/20 text-orange-400",
    "from-indigo-500/20 to-violet-500/20 border-indigo-500/20 text-indigo-400",
  ];

  // Simple hash function
  let hash = 0;
  const str = id + name;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

export default function DashboardClient({ user }: DashboardClientProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingProject, setDeletingProject] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  // Toast notification
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  const fetchProjects = async () => {
    try {
      setError(null);
      const response = await fetch("/api/Projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      } else {
        setError("Failed to load projects. Please try again.");
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setError("Unable to connect to server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects;

    if (searchQuery.trim()) {
      filtered = filtered.filter((project) =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case "oldest":
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    return sorted;
  }, [projects, searchQuery, sortBy]);

  const handleCreateProject = async () => {
    if (!projectName.trim()) return;

    setCreating(true);
    try {
      const response = await fetch("/api/Projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          files: {},
        }),
      });

      if (response.ok) {
        const newProject = await response.json();
        setProjects([newProject, ...projects]);
        setShowCreateModal(false);
        setProjectName("");
        showToast("Project created successfully!", "success");
        router.push(`/builder?projectId=${newProject.id}`);
      } else {
        showToast("Failed to create project. Please try again.", "error");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      showToast("An error occurred. Please try again.", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleOpenProject = (projectId: string) => {
    router.push(`/builder?projectId=${projectId}`);
  };

  const handleStartEdit = (project: Project) => {
    setEditingProject(project.id);
    setEditName(project.name);
  };

  const handleSaveEdit = async (projectId: string) => {
    if (!editName.trim()) {
      setEditingProject(null);
      return;
    }

    try {
      const response = await fetch("/api/Projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: projectId,
          name: editName,
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setProjects(
          projects.map((p) => (p.id === projectId ? updated : p))
        );
        setEditingProject(null);
        showToast("Project renamed successfully!", "success");
      } else {
        showToast("Failed to rename project.", "error");
      }
    } catch (error) {
      console.error("Error updating project:", error);
      showToast("An error occurred.", "error");
    }
  };

  const handleDelete = async (projectId: string) => {
    setDeletingProject(projectId);
    try {
      const response = await fetch(`/api/Projects?id=${projectId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setProjects(projects.filter((p) => p.id !== projectId));
        setShowDeleteConfirm(null);
        showToast("Project deleted successfully!", "success");
      } else {
        showToast("Failed to delete project.", "error");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      showToast("An error occurred.", "error");
    } finally {
      setDeletingProject(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getFileCount = (project: Project) => {
    const frontend = project.frontendFiles ? Object.keys(project.frontendFiles).length : 0;
    const backend = project.backendFiles ? Object.keys(project.backendFiles).length : 0;
    return frontend + backend;
  };

  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const totalFiles = projects.reduce((sum, p) => sum + getFileCount(p), 0);
    const recentProjects = projects.filter(
      (p) => new Date(p.updatedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    ).length;

    return { totalProjects, totalFiles, recentProjects };
  }, [projects]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-emerald-500/30 selection:text-emerald-400 font-sans">
      {/* Background Pattern */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #333 1px, transparent 0)', backgroundSize: '24px 24px' }}
      />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 z-50 -translate-x-1/2"
          >
            <div className={cn(
              "px-4 py-2 rounded-full shadow-2xl backdrop-blur-xl border flex items-center gap-2",
              toast.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            )}>
              {toast.type === "success" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-black font-bold">B</div>
            <span className="font-semibold text-lg hidden sm:block">AI Builder</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs text-zinc-400">
              <UserIcon className="w-3.5 h-3.5" />
              {user.email}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-zinc-400 hover:text-white hover:bg-white/5"
            >
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">My Projects</h1>
            <p className="text-zinc-400">Manage and deploy your AI-generated applications.</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-black font-medium px-6 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Project
          </Button>
        </div>

        {/* Stats Strip */}
        {!loading && projects.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { label: "Total Projects", value: stats.totalProjects, icon: Folder },
              { label: "Total Files", value: stats.totalFiles, icon: FileCode },
              { label: "Active Recently", value: stats.recentProjects, icon: Zap },
              { label: "Frameworks used", value: "Next.js", icon: Code2 },
            ].map((stat, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between h-24">
                <stat.icon className="w-5 h-5 text-zinc-500" />
                <div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-zinc-500">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search & Layout Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 sticky top-20 z-30 py-4 bg-[#0A0A0A]/95 backdrop-blur-sm -mx-4 px-4 sm:mx-0 sm:px-0 sm:bg-transparent">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name-asc">Name (A-Z)</option>
            </select>
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={cn("p-2 rounded-lg transition-all", viewMode === "grid" ? "bg-white/10 text-white" : "text-zinc-500")}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn("p-2 rounded-lg transition-all", viewMode === "list" ? "bg-white/10 text-white" : "text-zinc-500")}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
          </div>
        ) : filteredAndSortedProjects.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/5">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 mx-auto flex items-center justify-center mb-4">
              <Folder className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-lg font-medium mb-2">No projects found</h3>
            <p className="text-zinc-500 mb-6">Create your first project to get started.</p>
            <Button onClick={() => setShowCreateModal(true)} className="rounded-full bg-white text-black hover:bg-zinc-200">
              Create Project
            </Button>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={cn(
              "grid gap-4 sm:gap-6",
              viewMode === "grid"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-[280px]" // Fixed height rows for bento feel
                : "grid-cols-1"
            )}
          >
            {filteredAndSortedProjects.map((project, index) => {
              // Bento Logic: First item is large hero if in grid mode and sorted by newest
              const isHero = viewMode === "grid" && index === 0 && sortBy === "newest";
              const gradientClass = getProjectGradient(project.id, project.name);

              return (
                <motion.div
                  key={project.id}
                  variants={itemVariants}
                  className={cn(
                    "group relative overflow-hidden rounded-3xl border border-white/5 bg-[#111] transition-all hover:border-white/10 hover:shadow-2xl hover:shadow-black/50 cursor-pointer",
                    isHero ? "md:col-span-2 md:row-span-1" : "col-span-1"
                  )}
                  onClick={() => handleOpenProject(project.id)}
                >
                  {/* Decorative Gradient Background */}
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity duration-500",
                    gradientClass.split(" ")[0], gradientClass.split(" ")[1]
                  )} />

                  <div className="relative h-full flex flex-col p-6">
                    {/* Top Row: Icon & Options */}
                    <div className="flex justify-between items-start mb-auto">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-transform group-hover:scale-110 duration-500",
                        isHero ? "bg-white/10" : "bg-zinc-900",
                        gradientClass.split(" ")[5] // text color
                      )}>
                        {isHero ? <Sparkles className="w-6 h-6" /> : <Code2 className="w-6 h-6" />}
                      </div>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStartEdit(project); }}
                          className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(project.id); }}
                          className="p-2 rounded-full hover:bg-red-500/20 text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Middle: Title */}
                    <div className="mb-4">
                      {editingProject === project.id ? (
                        <input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(project.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="bg-transparent border-b border-emerald-500 text-xl font-bold focus:outline-none w-full"
                        />
                      ) : (
                        <h3 className={cn("font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors", isHero ? "text-2xl" : "text-xl")}>
                          {project.name}
                        </h3>
                      )}
                      <p className="text-zinc-500 text-sm flex items-center gap-2">
                        {project.framework}
                        <span className="w-1 h-1 rounded-full bg-zinc-700" />
                        {formatDate(project.updatedAt)}
                      </p>
                    </div>

                    {/* Bottom: Metrics & Action */}
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                      <div className="flex items-center gap-3 text-xs text-zinc-400">
                        <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                          <FileCode className="w-3 h-3" />
                          {getFileCount(project)}
                        </span>
                      </div>

                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                        "bg-white text-black translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                      )}>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </main>

      {/* Logic Modals (Create, Delete) - Kept mostly same but restyled */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold mb-2">Create Project</h2>
            <p className="text-zinc-400 mb-6">Start building something new.</p>
            <input
              autoFocus
              placeholder="Project Name (e.g. Portfolio)"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 mb-6 focus:outline-none focus:border-emerald-500 text-white"
            />
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button onClick={handleCreateProject} disabled={creating || !projectName} className="bg-emerald-500 text-black hover:bg-emerald-600 rounded-xl">
                {creating ? <Loader2 className="animate-spin" /> : "Create Project"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#111] border border-red-500/20 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-2 text-red-500">Delete Project?</h2>
            <p className="text-zinc-400 mb-6 text-sm">This action cannot be undone. All files will be lost forever.</p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
              <Button
                onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
                className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded-xl"
                disabled={deletingProject !== null}
              >
                {deletingProject ? <Loader2 className="animate-spin" /> : "Delete Forever"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
