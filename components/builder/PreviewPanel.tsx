"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Lock, RefreshCw } from "lucide-react";

interface PreviewPanelProps {
  project: {
    frontendFiles: Record<string, string>;
  };
}

export default function PreviewPanel({ project }: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [key, setKey] = useState(0); // Used to force refresh iframe
  const [url, setUrl] = useState("localhost:3000");

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    const files = project.frontendFiles || {};
    const tsxFiles = Object.keys(files).filter((path) => /\.(tsx|jsx)$/.test(path));

    // Try to find the active page or default to something sensible
    const entryPath = tsxFiles.find(p => p.includes("page.tsx")) || tsxFiles[0];

    if (entryPath) {
      setUrl(`localhost:3000${entryPath.replace("app/page.tsx", "").replace("/page.tsx", "")}`);
    }

    // Handle no files case
    if (tsxFiles.length === 0) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <body style="margin:0;background:#111;color:#aaa;font-family:system-ui;height:100vh;display:flex;align-items:center;justify-content:center;">
             <div style="text-align:center;padding:2rem;">
              <h2 style="margin-bottom:1rem;color:#fff;">Ready to Build</h2>
              <p>Ask the agent to generate your first component!</p>
            </div>
          </body>
        </html>
      `);
      doc.close();
      return;
    }

    const entryCode = files[entryPath] || "";

    doc.open();
    // We inject a robust HTML template
    doc.write(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Preview</title>
  
  <script>
    // Safety Timeout: Force remove loader after 5 seconds if still present
    setTimeout(function() {
      const loader = document.getElementById('loading');
      if (loader && loader.style.display !== 'none') {
        loader.style.display = 'none';
        console.warn('Preview loader timed out');
      }
    }, 5000);

    // Global Error Handler
    window.onerror = function(msg, url, line, col, error) {
      const loader = document.getElementById('loading');
      if (loader) loader.style.display = 'none';
      document.body.innerHTML = '<div style="color:#ef4444;padding:24px;font-family:monospace;background:#1a1a1a;height:100vh;">' +
        '<h3 style="font-size:18px;margin-bottom:12px;">Runtime Error</h3>' +
        '<pre style="white-space:pre-wrap;color:#fca5a5;">' + msg + '</pre>' +
        '<div style="margin-top:20px;font-size:12px;color:#666;">line: ' + line + '</div>' +
      '</div>';
      return false;
    };
  </script>

  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com" onerror="window.onerror('Failed to load Tailwind CSS', '', 0)"></script>
  
  <!-- React & Babel -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js" onerror="window.onerror('Failed to load React', '', 0)"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" onerror="window.onerror('Failed to load ReactDOM', '', 0)"></script>
  <script src="https://unpkg.com/@babel/standalone@7/babel.min.js" onerror="window.onerror('Failed to load Babel', '', 0)"></script>
  
  <style>
    body { margin:0; background:#000; color:#fff; font-family:system-ui, -apple-system, sans-serif; height:100vh; overflow:hidden; }
    #root { height:100%; overflow-y: auto; }
    
    /* Loading Spinner */
    #loading {
      position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
      background: #09090b; z-index: 50; transition: opacity 0.3s;
    }
    .spinner {
      width: 40px; height: 40px; border: 3px solid #333; 
      border-top-color: #10b981; border-radius: 50%; 
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Custom Scrollbar */
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: #111; }
    ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #444; }
  </style>
</head>
<body>
  <div id="loading">
    <div class="spinner"></div>
  </div>
  <div id="root"></div>

  <script>
    // Main Execution
    window.addEventListener('load', function() {
      try {
        if (typeof Babel === 'undefined' || typeof React === 'undefined') {
          throw new Error("Failed to load React or Babel. Please check your internet connection.");
        }

        console.log('Preview: Starting compilation...');
        const userCode = \`${entryCode.replace(/`/g, "\\`").replace(/\$/g, "\\$")}\`;

        const transformed = Babel.transform(userCode, {
          presets: ["react", "typescript"],
          filename: "${entryPath}",
        }).code;

        // Execute transpiled code
        eval(transformed);

        // Find standard component exports
        let Component = null;
        if (typeof default !== 'undefined' && typeof default === 'function') Component = default;
        if (!Component && typeof App === 'function') Component = App;
        if (!Component && typeof Page === 'function') Component = Page;
        
        // Fallback: Scan window for PascalCase functions
        if (!Component) {
          for (const key in window) {
            if (typeof window[key] === 'function' && /^[A-Z]/.test(key) && key !== 'Babel' && key !== 'React' && key !== 'ReactDOM') {
              Component = window[key];
              break;
            }
          }
        }

        if (Component) {
          const root = ReactDOM.createRoot(document.getElementById('root'));
          root.render(React.createElement(Component));
          
          // Hide loader after short delay to ensure render
          setTimeout(() => {
             const loader = document.getElementById('loading');
             if(loader) loader.style.opacity = '0';
             setTimeout(() => loader && loader.remove(), 300);
          }, 100);
        } else {
          throw new Error("No React component found. Please default export a component");
        }

      } catch (e) {
        document.getElementById('loading').style.display = 'none';
        document.body.innerHTML = '<div style="color:#ef4444;padding:24px;font-family:monospace;background:#1a1a1a;height:100vh;">' +
          '<h3 style="font-size:18px;margin-bottom:12px;">Compile Error</h3>' +
          '<pre style="white-space:pre-wrap;color:#fca5a5;">' + e.message + '</pre>' +
        '</div>';
        console.error(e);
      }
    });
  </script>
</body>
</html>
    `);
    doc.close();
  }, [project.frontendFiles, key]);

  const handleRefresh = () => {
    setKey(prev => prev + 1);
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] rounded-xl overflow-hidden border border-[#3c3c3c] shadow-2xl">
      {/* Browser Chrome / Header */}
      <div className="flex items-center gap-4 px-4 py-2 bg-[#2d2d2d] border-b border-[#3c3c3c]">
        {/* Window Controls (Traffic Lights) */}
        <div className="flex items-center gap-1.5 min-w-[50px]">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57] hover:bg-[#FF5F57]/80 transition-colors shadow-sm" />
          <div className="w-3 h-3 rounded-full bg-[#FEBC2E] hover:bg-[#FEBC2E]/80 transition-colors shadow-sm" />
          <div className="w-3 h-3 rounded-full bg-[#28C840] hover:bg-[#28C840]/80 transition-colors shadow-sm" />
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-1 text-gray-400">
          <button className="p-1 hover:bg-[#3c3c3c] rounded-md transition-colors disabled:opacity-30">
            <ChevronLeft size={16} />
          </button>
          <button className="p-1 hover:bg-[#3c3c3c] rounded-md transition-colors disabled:opacity-30">
            <ChevronRight size={16} />
          </button>
          <button
            onClick={handleRefresh}
            className="p-1 hover:bg-[#3c3c3c] rounded-md transition-colors text-gray-300 hover:text-white"
            title="Refresh Preview"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Address Bar */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 px-3 py-1.5 w-full max-w-lg bg-[#1e1e1e] rounded-md border border-[#3c3c3c] text-xs text-gray-400 mx-auto group focus-within:border-blue-500/50 transition-colors">
            <Lock size={12} className="text-gray-500 group-focus-within:text-blue-400" />
            <span className="flex-1 text-center truncate selection:bg-blue-500/30 selection:text-blue-200">
              {url}
            </span>
          </div>
        </div>

        {/* Spacer to balance traffic lights */}
        <div className="min-w-[50px]" />
      </div>

      {/* Main Content (Iframe) */}
      <div className="flex-1 relative bg-white">
        <iframe
          key={key}
          ref={iframeRef}
          className="w-full h-full border-0 block"
          sandbox="allow-scripts allow-same-origin"
          title="Live Preview"
        />
      </div>
    </div>
  );
}
