# AgentSight: Architecture & Design Plan

## 1. Design System & Aesthetics (Apple / Perplexity Style)
We are adopting a minimalist, high-end design language inspired by Apple and Perplexity AI.

### Visual Tokens
- **Theme**: Dark Mode by default.
- **Backgrounds**: Deep, rich grays/blacks (`#0A0A0A`, `#141414`) instead of pure black.
- **Surfaces (Toolbar/Modals)**: Glassmorphic layers (`backdrop-filter: blur(12px)`) with semi-transparent backgrounds (`rgba(25, 25, 25, 0.7)`).
- **Borders**: Hairline, high-contrast subtle borders (`1px solid rgba(255, 255, 255, 0.1)`).
- **Typography**: Clean, highly legible sans-serif fonts (Inter or SF Pro). 
- **Accents**: Subtle, desaturated accent colors for active states (e.g., Perplexity's soft cyan/blue or Apple's system blue).

## 2. System Architecture

The AgentSight ecosystem consists of three primary components:
1. **Client Package (`@agentsight/browser`)**: The injected script/overlay that runs in the browser.
2. **Local Bridge (`@agentsight/cli` & VS Code Extension)**: The middleware that connects the browser to the AI agent.
3. **Cloud Dashboard (AgentSight Web)**: The central hub for team collaboration and issue storage.

---

### A. The Client Package (`@agentsight/browser`)
A lightweight, zero-dependency package injected into the developer's application during local development (similar to Vite's overlay).

**Core Responsibilities:**
- Render the floating glassmorphic toolbar.
- Handle DOM element picking (highlighting elements on hover).
- Extract context: DOM path, CSS selectors, React fiber node data (if applicable).
- Intercept and store recent Network Requests (Fetch/XHR) and Console Logs.
- Establish a WebSocket connection to the Local Bridge.

**Tech Stack:**
- Vanilla TypeScript / Preact (to keep bundle size microscopic and avoid conflicts).
- Vanilla CSS (for scoped, conflict-free styling).

---

### B. The Local Bridge & Extension
This acts as the translation layer between the browser and the AI (Cursor, Windsurf, Claude Code).

**Core Responsibilities:**
- Run a local WebSocket server (e.g., `ws://localhost:4040`).
- Receive the extracted context (DOM, Network, Console) from the browser.
- Format the context into AI-optimized Markdown or a strict JSON schema.
- Expose an MCP (Model Context Protocol) server so Claude/Cursor can request actions (e.g., `highlight_element`, `read_styles`).
- Pipe the formatted context directly into the IDE's prompt context.

**Folder Structure (`agent-bridge`):**
```text
agent-bridge/
├── src/
│   ├── server/       # Local Express/WebSocket server
│   ├── mcp/          # Model Context Protocol definitions
│   └── extension/    # VS Code / Cursor extension entry points
└── package.json
```

---

### C. Cloud Dashboard (AgentSight Web)
The web application for viewing historical annotations, team collaboration, and tracking AI resolution rates.

**Core Responsibilities:**
- Sync issues from the Local Bridge to the cloud.
- Display visual bugs in a sleek, data-dense table view (Perplexity style).
- Render visual diffs and captured state (logs, screenshots).

**Tech Stack:**
- **Framework**: Next.js (App Router).
- **Styling**: Tailwind CSS (strictly utilizing the design tokens).
- **Database**: Supabase / PostgreSQL.

## 3. Communication Protocol (WebSocket Payload)

When a user selects a UI element in the browser, the Client Package sends the following JSON payload to the Local Bridge over WebSocket:

```json
{
  "type": "ELEMENT_SELECTED",
  "timestamp": "2026-07-12T09:55:00Z",
  "payload": {
    "element": {
      "tagName": "button",
      "id": "submit-btn",
      "classes": ["bg-blue-500", "text-white", "px-4", "py-2"],
      "dimensions": { "width": 120, "height": 40 },
      "cssSelectors": ["#submit-btn", "div.modal-footer > button.bg-blue-500"]
    },
    "frameworkContext": {
      "type": "react",
      "componentName": "SubmitButton",
      "filePath": "src/components/SubmitButton.tsx"
    },
    "environment": {
      "recentConsoleErrors": [],
      "failedNetworkRequests": []
    },
    "userNote": "The padding looks off compared to the design."
  }
}
```

## 4. Next Steps for Development
1. **Scaffold the Monorepo**: Set up Turborepo with packages for `browser`, `cli`, and `web`.
2. **Build the Client package**: Create the Apple-esque floating toolbar and DOM picker.
3. **Build the Bridge**: Set up the local WebSocket server to receive data from the browser.
