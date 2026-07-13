# AgentSight 👁️

**A zero-friction, local-first visual feedback bridge for AI coding agents.**

AgentSight solves the context gap between what you see in the browser and what your AI coding assistant (Cursor, Claude Code, Antigravity) knows about your codebase.

Instead of typing *"make the blue button in the flex container bigger"* and hoping the AI guesses the right CSS selector, AgentSight lets you visually point, click, and instantly transmit the exact React Fiber component name, DOM path, and computed styles directly to your IDE via a local Model Context Protocol (MCP) server.

No databases. No SaaS dashboards. Just a blazing-fast "eyes-to-IDE" loop.

---

## ⚡ Quickstart

One command. That's it.

```bash
npx @itsraeyy/agentsight-client init
```

This will automatically:
- 🔍 **Detect your framework** (Next.js App Router or Vite)
- 💉 **Inject `<AgentSightProvider />`** into your root layout (dev-only)
- 🔌 **Configure your IDE's MCP server** (Cursor / Windsurf)
- 📦 **Install the package** as a dev dependency

Run your dev server, press `Ctrl+Shift+A` in the browser, and start pointing at bugs.

<details>
<summary><strong>Manual Setup</strong> (if you prefer full control)</summary>

### 1. Install the Client

```bash
npm install -D @itsraeyy/agentsight-client
```

Wrap your root component with the provider:

```tsx
import { AgentSightProvider } from '@itsraeyy/agentsight-client';

function App() {
  return (
    <AgentSightProvider>
      {/* Your app here */}
    </AgentSightProvider>
  );
}
```

> **Tip:** You only need this during development. It won't affect production builds since it's a `devDependency`.

### 2. Configure the MCP Bridge

Add the AgentSight MCP server to your IDE's configuration:

**Cursor** — `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "agentsight": {
      "command": "npx",
      "args": ["-y", "@itsraeyy/agentsight-mcp"]
    }
  }
}
```

The bridge listens on `http://localhost:3010` for browser payloads and exposes tools over stdio for your AI agent.

</details>

---

## 🔄 The Workflow

1. **Spot the Bug** — You notice a UI issue in your browser.
2. **Freeze (Optional)** — Press `Space` to freeze all CSS/JS animations on that exact frame.
3. **Point & Click** — Click the element or drag a box to multi-select. AgentSight extracts the React component name, DOM path, computed CSS, and HTML.
4. **Describe the Fix** — Type your note in the popover (e.g., *"Increase padding to 16px"*).
5. **Agent Fixes It** — Switch to your IDE. The AI agent calls `get_latest_visual_feedback()` and has everything it needs to write the code fix.
6. **Reload** — The browser reloads. The bug is fixed. The ephemeral state is cleared.

---

## 🛠️ Features

### Context Extraction Engine
- **DOM Picking** — Hover over any element to see its identifier. Click to select.
- **React Fiber Detection** — Traverses the React Fiber tree to find the exact component name and file path.
- **Computed Styles** — Captures the actual rendered CSS (layout, typography, colors, spacing).
- **Smart Selectors** — Generates short, unique CSS selectors optimized for AI readability.

### Annotation Modes
- **Element** — Click a specific DOM node.
- **Multi-Select** — Drag a box to select multiple elements. Automatically finds the Lowest Common Ancestor.
- **Text** — Highlight copy to request typo fixes or content changes.

### Runtime Freeze
- Pauses all CSS animations, JS `requestAnimationFrame` loops, and `<video>` elements.
- Perfect for inspecting hover states, Framer Motion animations, or skeleton loaders.

### MCP Bridge
- **`get_latest_visual_feedback`** — AI tool to fetch the latest annotation payload.
- **`clear_visual_feedback`** — AI tool to clear state after the fix is applied.
- Ephemeral in-memory state — no databases, no cloud. State exists only while the server runs.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+A` / `Cmd+Shift+A` | Toggle annotation mode |
| `Space` | Toggle runtime freeze |
| `Escape` | Cancel / close current action |
| `Enter` | Submit annotation note |

---

## 📁 Project Structure

```
agentsight/
├── packages/
│   ├── client/            # Browser overlay & DOM extraction
│   │   ├── bin/
│   │   │   └── init.js      # CLI: npx @itsraeyy/agentsight-client init
│   │   └── src/
│   │       ├── components/   # AgentSightProvider, Overlay, Popover, Markers
│   │       ├── hooks/        # Element picker, multi-select, freeze, hotkeys
│   │       └── utils/        # Fiber walker, style extractor, selector builder
│   └── mcp/               # MCP server (Express + stdio bridge)
│       └── src/
│           └── index.ts      # Express receiver + MCP tool definitions
├── package.json           # Monorepo workspace config
└── LICENSE                # MIT
```

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork & clone** the repository
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Build the packages:**
   ```bash
   npm run build
   ```
4. **Make your changes** and submit a pull request

### Guidelines
- Keep the client package lightweight — no heavy dependencies.
- All CSS classes are prefixed with `agentsight-` to avoid style collisions.
- Use `console.error` (not `console.log`) in the MCP server to avoid corrupting the stdio transport.

---

## 📄 License

[MIT](./LICENSE) © Raey Tesfaye
