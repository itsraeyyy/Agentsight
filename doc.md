# Agentation

**Agentation** is a purely local, ephemeral developer utility designed to tightly couple the browser runtime with your IDE's AI assistant. 

It strips away all the overhead of project management dashboards and databases, focusing 100% on a blazing-fast "eyes-to-IDE" loop: You see a visual bug, you freeze the runtime, you select the exact DOM nodes, and your AI fixes it immediately.

---

## 🏗️ Dual-Package Architecture

Agentation consists of exactly two pieces, keeping your project incredibly lean:

### 1. `packages/client` (The Interaction Overlay & DOM Freeze Engine)
A lightweight React package injected into your host application.
- **Runtime Freeze Engine**: Hijacks both CSS (keyframes/transitions) and JS (`requestAnimationFrame`) to instantly freeze the page. Perfect for inspecting transient states like hover effects, Framer Motion animations, or skeletons.
- **Multi-Select DOM Canvas**: Click and drag a bounding box to capture multiple elements at once. The engine automatically calculates the Lowest Common Ancestor (LCA) and extracts the unified parent context.
- **Editorial Aesthetic**: Rendered using a rigid, matte grid design (Charcoal and Muted Orange). It acts as a quiet, structural proofing sheet over your application.

### 2. `packages/mcp` (The Local AI Bridge)
A Model Context Protocol server that exposes the browser's state directly to your IDE.
- **Ephemeral In-Memory State**: No Postgres, no Supabase. The state only exists as long as your local server is running. Once the code is fixed and the browser reloads, the markers are gone.
- **Bidirectional Tooling**: The AI can query `get_latest_visual_feedback()` to read the precise selectors, computed CSS, and React component names you just highlighted, and can push `request_clarification` to drop minimal tooltips on your screen.

---

## 🛠️ The Tight Loop Workflow

1. **Spot the Bug**: You notice 5 navigation items have the wrong padding.
2. **Freeze (Optional)**: If the bug is animated, click **Freeze Runtime** (or press the hotkey) to stop all CSS/JS animations on that exact frame.
3. **Capture Context**: Select **Multi-Select**, drag a box over all 5 items. Agentation finds their parent wrapper and extracts the exact React Fiber node and CSS.
4. **Agent Fix**: Switch to Cursor or your IDE chat. Say *"Fix the padding on the navigation wrapper I just highlighted."* The agent queries the local MCP server, reads the ephemeral state, and applies the code fix.
5. **Reload**: The browser reloads. The bug is fixed. The state is cleared.
