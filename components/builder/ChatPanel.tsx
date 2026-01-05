"use client";

import { useState } from "react";
import { parseAgentResponse } from "@/lib/agent/parseAgent";
import { Save } from "lucide-react";

interface Project {
  frontendFiles: Record<string, string>;
  backendFiles: Record<string, string>;
  activeFile: string | null;
  side: "frontend" | "backend";
}

interface ChatPanelProps {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project>>;
  projectId?: string;
  onSave?: (id: string, frontendFiles: Record<string, string>, backendFiles: Record<string, string>) => Promise<void>;
}

export default function ChatPanel({ project, setProject, projectId, onSave }: ChatPanelProps) {
  // Safety guard
  const safeSetProject = (updater: (prev: Project) => Project) => {
    if (typeof setProject !== "function") {
      console.error(
        "❌ setProject is missing or not a function!\n" +
        "Parent must pass: <ChatPanel project={project} setProject={setProject} />"
      );
      if (process.env.NODE_ENV === "development") {
        throw new Error("setProject prop is required");
      }
      return;
    }
    setProject(updater);
  };

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const applyAgentActions = (raw: string) => {
    const parsed = parseAgentResponse(raw);

    if (!parsed) {
      console.warn("No parsed agent response");
      setMessages((prev) => [...prev, "Agent: Could not understand the response 😕"]);
      return;
    }

    let changesApplied = 0;
    const fileChanges: Record<string, string> = {};

    // Case 1: actions array (preferred)
    if (Array.isArray(parsed.actions)) {
      parsed.actions.forEach((action: { file?: string; content?: string }) => {
        if (!action?.file || typeof action.content !== "string") return;
        fileChanges[action.file] = action.content;
        changesApplied++;
      });
    }
    // Case 2: files object
    else if (parsed.files && typeof parsed.files === "object" && !Array.isArray(parsed.files)) {
      Object.entries(parsed.files).forEach(([file, content]) => {
        if (typeof content === "string") {
          fileChanges[file] = content;
          changesApplied++;
        }
      });
    }
    // Case 3: direct mapping
    else if (typeof parsed === "object" && !Array.isArray(parsed)) {
      Object.entries(parsed).forEach(([key, value]) => {
        if (typeof value === "string" && /\.(tsx|jsx|ts|js|css)$/.test(key)) {
          fileChanges[key] = value;
          changesApplied++;
        }
      });
    }

    if (changesApplied > 0) {
      safeSetProject((prev) => {
        const updated = {
          ...prev,
          frontendFiles: { ...prev.frontendFiles, ...fileChanges },
          backendFiles: { ...prev.backendFiles },
        };

        console.log(`Applied ${changesApplied} file change(s)`, fileChanges);
        
        // Auto-save if projectId exists
        if (projectId && onSave) {
          autoSave(projectId, updated.frontendFiles, updated.backendFiles);
        }
        
        return updated;
      });

      setMessages((prev) => [
        ...prev,
        `Agent: ${changesApplied} file(s) updated successfully ✅`,
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        "Agent: No valid file changes found in the response 🤔",
      ]);
    }
  };

  const autoSave = async (id: string, frontendFiles: Record<string, string>, backendFiles: Record<string, string>) => {
    if (!onSave) return;
    
    setSaving(true);
    try {
      await onSave(id, frontendFiles, backendFiles);
      setLastSaved(new Date());
      console.log("✅ Project auto-saved successfully");
    } catch (error) {
      console.error("❌ Error auto-saving project:", error);
      setMessages((prev) => [
        ...prev,
        "⚠️ Warning: Changes were applied but could not be saved to database.",
      ]);
    } finally {
      setSaving(false);
    }
  };

  const send = async () => {
    const prompt = input.trim();
    if (!prompt) return;

    setLoading(true);
    setMessages((prev) => [...prev, `You: ${prompt}`]);
    setInput("");

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, project }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server error ${res.status}: ${errorText}`);
      }

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "AI agent failed");
      }

      applyAgentActions(data.raw);
    } catch (err: unknown) {
      console.error("Agent request failed:", err);
      const errorMessage = err instanceof Error ? err.message : "Something went wrong";
      setMessages((prev) => [
        ...prev,
        `❌ Error: ${errorMessage}\n\nThis usually happens if the AI model fails to generate valid code or if Ollama is not responding.`
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col p-4 bg-gradient-to-b from-gray-950 to-black text-white">
      {/* Save Status Indicator */}
      {projectId && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-gray-900/50 border border-gray-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {saving ? (
              <>
                <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-blue-400">Saving...</span>
              </>
            ) : lastSaved ? (
              <>
                <Save className="w-3 h-3 text-green-400" />
                <span className="text-green-400">
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              </>
            ) : (
              <>
                <Save className="w-3 h-3 text-gray-500" />
                <span className="text-gray-500">Not saved</span>
              </>
            )}
          </div>
          {projectId && (
            <span className="text-gray-600 text-[10px]">Project ID: {projectId.slice(0, 8)}...</span>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 pb-4 scrollbar-thin scrollbar-thumb-gray-700">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            Ask the AI to build or modify your UI...
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`whitespace-pre-wrap p-3 rounded-lg max-w-[85%] ${msg.startsWith("You:") ? "bg-blue-900/40 ml-auto" : "bg-gray-800/60 mr-auto"
              }`}
          >
            {msg}
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-800">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          disabled={loading}
          className="flex-1 rounded-lg bg-gray-900/70 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-600 disabled:opacity-50"
          placeholder="Ask the agent to modify the UI... (e.g. add dark mode toggle)"
        />

        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="px-6 rounded-lg bg-blue-700 hover:bg-blue-600 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? "Thinking..." : "Send"}
        </button>
      </div>
    </div>
  );
}