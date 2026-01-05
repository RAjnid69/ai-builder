"use client";

import { useEffect, useRef } from "react";

interface PreviewPanelProps {
  project: {
    frontendFiles: Record<string, string>;
  };
}

export default function PreviewPanel({ project }: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    iframe.src = "about:blank"; // Reset iframe

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    const files = project.frontendFiles || {};
    const tsxFiles = Object.keys(files).filter((path) => /\.(tsx|jsx)$/.test(path));

    if (tsxFiles.length === 0) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <body style="margin:0;background:#111;color:#aaa;font-family:system-ui;height:100vh;display:flex;align-items:center;justify-content:center;">
            <div style="text-align:center;padding:2rem;max-width:600px;">
              <h2 style="margin-bottom:1rem;">No code files yet</h2>
              <p style="opacity:0.8;">Ask the agent to create something!</p>
            </div>
          </body>
        </html>
      `);
      doc.close();
      return;
    }

    // Prefer app/page.tsx if present
    const entryPath = tsxFiles.find(p => p.includes("page.tsx")) || tsxFiles[0];
    const entryCode = files[entryPath] || "";

    doc.open();
    doc.write(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Preview</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone@7/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin:0; background:#000; color:#fff; font-family:system-ui; height:100vh; overflow:hidden; }
    #root { height:100%; }
    #status { position:fixed; top:10px; left:10px; background:rgba(0,255,0,0.4); padding:8px 12px; border-radius:6px; z-index:1000; font-size:13px; backdrop-filter:blur(4px); }
  </style>
</head>
<body>
  <div id="root"></div>
  <div id="status">Loading preview...</div>

  <script>
    const status = document.getElementById('status');
    function update(msg) { status.textContent = msg; }
    function error(msg) { status.innerHTML = '<span style="color:#ff6b6b;font-weight:bold;">' + msg + '</span>'; }

    try {
      console.log('PreviewPanel: Starting transpilation...');
      const userCode = \`${entryCode.replace(/`/g, "\\`").replace(/\$/g, "\\$")}\`;

      const transformed = Babel.transform(userCode, {
        presets: ["react", "typescript"],
        filename: "${entryPath}",
      }).code;

      console.log('PreviewPanel: Code transformed successfully');
      eval(transformed);
      console.log('PreviewPanel: Code executed');

      let Component = null;

      // 1. Default export (most common in page.tsx)
      if (typeof default !== 'undefined' && typeof default === 'function') {
        Component = default;
        console.log('Found default export');
      }

      // 2. Common component names
      if (!Component && typeof App === 'function') { Component = App; console.log('Found App'); }
      if (!Component && typeof Page === 'function') { Component = Page; console.log('Found Page'); }
      if (!Component && typeof TodoList === 'function') { Component = TodoList; console.log('Found TodoList'); }
      if (!Component && typeof HelloWorld === 'function') { Component = HelloWorld; console.log('Found HelloWorld'); }

      // 3. Last resort: any exported PascalCase function
      if (!Component) {
        for (const key in window) {
          if (typeof window[key] === 'function' && /^[A-Z]/.test(key)) {
            Component = window[key];
            console.log('Found component via scan:', key);
            break;
          }
        }
      }

      if (typeof Component !== 'function') {
        throw new Error("No valid React component found. Checked default export, App, Page, TodoList, HelloWorld, and PascalCase exports.");
      }

      console.log('PreviewPanel: Component detected:', Component.name || 'anonymous');
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(Component));
      update("Rendered successfully ✓");
      console.log('PreviewPanel: Component rendered');
    } catch (e) {
      error("Render failed: " + (e.message || e));
      console.error('PreviewPanel full error:', e);
    }
  </script>
</body>
</html>
    `);
    doc.close();
  }, [project.frontendFiles]);

  return (
    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden border border-white/10">
      <iframe
        ref={iframeRef}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin"
        title="Live Preview"
        src="about:blank"
      />
    </div>
  );
}