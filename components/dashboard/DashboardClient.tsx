"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Plus,
  Folder,
  Calendar,
  LogOut,
  Code2,
  Trash2,
  Edit,
  Search,
  X,
  Check,
  Loader2,
  TrendingUp,
  Clock,
  Play,
  Sparkles,
  FileCode,
  Zap,
  ArrowRight,
  Grid3x3,
  List,
  Settings,
  User as UserIcon,
} from "lucide-react";

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

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((project) =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
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
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
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
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black text-white">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-1/2 z-50 -translate-x-1/2"
          >
            <div
              className={`px-6 py-3 rounded-xl shadow-2xl backdrop-blur-md border ${
                toast.type === "success"
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                  : "bg-red-500/20 border-red-500/50 text-red-400"
              }`}
            >
              <div className="flex items-center gap-2">
                {toast.type === "success" ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <X className="w-5 h-5" />
                )}
                <span className="font-medium">{toast.message}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-black/40 backdrop-blur-xl border-b border-white/5 px-4 sm:px-6 shadow-lg">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">AI Builder</span>
              <p className="text-xs text-zinc-500 hidden sm:block">Dashboard</p>
            </div>
          </motion.div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800">
              <UserIcon className="w-4 h-4 text-zinc-400" />
              <span className="text-sm text-zinc-300 truncate max-w-[150px]">
                {user.email}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-zinc-400 hover:text-white hover:bg-zinc-900/50"
            >
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 sm:pt-28 pb-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 sm:mb-12"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Welcome back!
            </h1>
            <p className="text-base sm:text-lg text-zinc-400 max-w-2xl">
              Build amazing applications with AI. Create, manage, and deploy your projects effortlessly.
            </p>
          </motion.div>

          {/* Stats Cards */}
          {!loading && projects.length > 0 && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10"
            >
              <motion.div variants={itemVariants}>
                <Card className="border-zinc-800 bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 backdrop-blur-sm hover:border-emerald-500/30 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-zinc-400 mb-2">Total Projects</p>
                        <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                          {stats.totalProjects}
                        </p>
                      </div>
                      <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <Folder className="w-7 h-7 text-emerald-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="border-zinc-800 bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 backdrop-blur-sm hover:border-blue-500/30 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-zinc-400 mb-2">Total Files</p>
                        <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                          {stats.totalFiles}
                        </p>
                      </div>
                      <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <FileCode className="w-7 h-7 text-blue-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="border-zinc-800 bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-zinc-400 mb-2">Updated This Week</p>
                        <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                          {stats.recentProjects}
                        </p>
                      </div>
                      <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <TrendingUp className="w-7 h-7 text-purple-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}

          {/* Search and Filter Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 sm:mb-8"
          >
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
              <div className="flex-1 flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search projects..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all backdrop-blur-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Sort & View Toggle */}
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="px-4 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 backdrop-blur-sm"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                  </select>

                  <div className="flex rounded-xl bg-zinc-900/50 border border-zinc-800 p-1 backdrop-blur-sm">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === "grid"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      <Grid3x3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === "list"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* New Project Button */}
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30 whitespace-nowrap"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">New Project</span>
                <span className="sm:hidden">New</span>
              </Button>
            </div>
          </motion.div>

          {/* Error State */}
          {error && !loading && (
            <Card className="border-red-500/50 bg-red-500/10 mb-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <X className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="font-medium text-red-400">{error}</p>
                    <button
                      onClick={fetchProjects}
                      className="text-sm text-red-300 hover:text-red-200 mt-1 underline"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Projects Grid/List */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="border-zinc-800 bg-zinc-900/50 animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-zinc-800 rounded w-3/4"></div>
                    <div className="h-4 bg-zinc-800 rounded w-1/2 mt-2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-zinc-800 rounded w-2/3 mb-4"></div>
                    <div className="h-10 bg-zinc-800 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredAndSortedProjects.length === 0 ? (
            <Card className="border-zinc-800 bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 backdrop-blur-sm">
              <CardContent className="p-12 sm:p-16 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                    <Folder className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold mb-2">
                    {searchQuery ? "No projects found" : "No projects yet"}
                  </h3>
                  <p className="text-sm sm:text-base text-zinc-400 mb-8 max-w-md mx-auto">
                    {searchQuery
                      ? "Try adjusting your search or filters to find what you're looking for."
                      : "Get started by creating your first project. Build amazing applications with AI assistance."}
                  </p>
                  {!searchQuery && (
                    <Button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30"
                      size="lg"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Create Your First Project
                    </Button>
                  )}
                </motion.div>
              </CardContent>
            </Card>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
                  : "space-y-4"
              }
            >
              {filteredAndSortedProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  variants={itemVariants}
                  custom={index}
                >
                  <Card className="border-zinc-800 bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 backdrop-blur-sm hover:border-emerald-500/50 transition-all duration-300 group relative overflow-hidden">
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-teal-500/0 group-hover:from-emerald-500/5 group-hover:to-teal-500/5 transition-all duration-300 pointer-events-none" />

                    <CardHeader className="pb-3 relative z-10">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                            <Code2 className="w-6 h-6 text-emerald-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            {editingProject === project.id ? (
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleSaveEdit(project.id);
                                  }
                                  if (e.key === "Escape") {
                                    setEditingProject(null);
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full px-2 py-1 rounded-lg bg-zinc-800 border border-emerald-500 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                autoFocus
                              />
                            ) : (
                              <>
                                <CardTitle className="text-base sm:text-lg group-hover:text-emerald-400 transition-colors truncate mb-1">
                                  {project.name}
                                </CardTitle>
                                <p className="text-xs text-zinc-500 capitalize flex items-center gap-1.5">
                                  <Zap className="w-3 h-3" />
                                  {project.framework}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {editingProject === project.id ? (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveEdit(project.id);
                                }}
                                className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingProject(null);
                                }}
                                className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEdit(project);
                                }}
                                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                title="Rename project"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowDeleteConfirm(project.id);
                                }}
                                className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                title="Delete project"
                              >
                                {deletingProject === project.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <div className="flex items-center justify-between text-xs sm:text-sm text-zinc-400 mb-4">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span>{formatDate(project.updatedAt)}</span>
                        </div>
                        {getFileCount(project) > 0 && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                            {getFileCount(project)} {getFileCount(project) === 1 ? "file" : "files"}
                          </span>
                        )}
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenProject(project.id);
                        }}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20 group/btn"
                        size="sm"
                      >
                        <Play className="w-4 h-4 mr-2 group-hover/btn:translate-x-1 transition-transform" />
                        Open in Builder
                        <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>

      {/* Create Project Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => {
              setShowCreateModal(false);
              setProjectName("");
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="w-full max-w-md border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 backdrop-blur-xl shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl">Create New Project</CardTitle>
                  <p className="text-sm text-zinc-400 mt-1">
                    Start building your next amazing application
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleCreateProject();
                        }
                        if (e.key === "Escape") {
                          setShowCreateModal(false);
                          setProjectName("");
                        }
                      }}
                      placeholder="My Awesome Project"
                      className="w-full px-4 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-3 justify-end pt-2">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowCreateModal(false);
                        setProjectName("");
                      }}
                      disabled={creating}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateProject}
                      disabled={!projectName.trim() || creating}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                    >
                      {creating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Project
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="w-full max-w-md border-red-500/50 bg-gradient-to-br from-zinc-900 to-zinc-950 backdrop-blur-xl shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl text-red-400">Delete Project</CardTitle>
                  <p className="text-sm text-zinc-400 mt-1">
                    This action cannot be undone
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-zinc-300">
                    Are you sure you want to delete this project? All files and data will be permanently removed.
                  </p>
                  <div className="flex gap-3 justify-end pt-2">
                    <Button
                      variant="ghost"
                      onClick={() => setShowDeleteConfirm(null)}
                      disabled={deletingProject !== null}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleDelete(showDeleteConfirm)}
                      disabled={deletingProject !== null}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      {deletingProject ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
