# AgentSight: Product Requirements Document (PRD)
*Next-Generation Visual Feedback for AI Coding Agents*

---

## 1. Executive Summary & Vision
**Product Name:** AgentSight
**Tagline:** "Give your AI eyes. Visual feedback that writes code."
**Vision:** As software engineering transitions from human-to-human workflows to human-to-AI workflows, the communication bottleneck remains. AI agents (like Cursor, Windsurf, and Claude Code) are incredibly smart but visually blind. AgentSight bridges this gap by acting as a native, zero-friction visual context layer, allowing developers to point, click, and instantly pipe exact DOM, CSS, computed styles, and React state into their AI's context window.

## 2. The Problem (The "Blind AI" Dilemma)
### For Developers (The Pain Point)
When building UIs with AI, describing visual changes is incredibly tedious. Telling an AI, *"Make this button look like the pricing button, and align it with the input field next to it"* takes too long. The developer has to find the exact file, copy the relevant React component, and construct a long prompt. If they don't, the AI guesses the wrong CSS selector or edits the wrong file, leading to endless prompt-engineering loops.

### For Investors (The Opportunity)
While tools like Jam.dev dominate *human QA*, the **human-to-AI code modification** space is the next frontier. Developers will pay for tools that dramatically reduce the "prompt engineering" required to execute UI changes. By turning visual interactions directly into executable AI prompts, AgentSight accelerates the core coding loop.

## 3. The Solution (AgentSight Workflow)
AgentSight is an injected developer tool (similar to a Vite overlay) combined with a local IDE bridge.
Instead of going back to the codebase and writing long prompts, developers:
1. **Point & Click:** Select the exact UI component they want to change in their local browser.
2. **Prompt Visually:** Type the desired code change directly into the AgentSight overlay (e.g., "Animate this on hover").
3. **Instant Execution:** AgentSight automatically extracts the React Component tree, computed CSS styles, file path, and raw HTML, packaging it with the prompt and piping it directly to the AI agent to write the code.

## 4. Design & Aesthetic Guidelines (Better-Auth Inspired)
To capture the modern developer's trust, AgentSight will strictly adhere to the high-end, minimalist aesthetic popularized by **Better-Auth, Linear, and Vercel**.

### Visual Language
*   **Theme:** Strictly Dark Mode native.
*   **Color Palette:**
    *   *Backgrounds:* `#09090B` (Zinc-950)
    *   *Surfaces/Cards:* `#18181B` (Zinc-900) with `backdrop-filter: blur(16px)`
    *   *Borders:* Hairline borders using `rgba(255, 255, 255, 0.1)`
    *   *Accents:* A striking, desaturated primary color (e.g., `#3B82F6` muted to a soft indigo or clean monochrome white `#FAFAFA`).
*   **Typography:** Inter or Geist (Vercel's font). Clean, high-contrast, heavily utilizing varying font weights rather than colors to establish visual hierarchy.
*   **UI Components (The Toolbar):** A pill-shaped, floating glassmorphic dock at the bottom of the screen. Hover states must feature subtle, 150ms ease-in-out scaling animations.

---

## 5. Core Features & Capabilities (Dev Focus)

### Phase 1: Deep Context Extraction Engine
*   **DOM Picking & Smart Identification:** Hover over any DOM node to highlight it. The system automatically identifies elements in a way that is useful for code search (e.g., naming buttons by text content).
*   **React Component Detection (The Secret Sauce):** Traverse the React Fiber tree to identify the exact Component Name and file path. Support multiple modes (Compact, Standard, Detailed, Forensic) to filter out internal framework components vs user code.
*   **Computed Styles Extraction:** Capture the actual rendered CSS properties (colors, fonts, spacing, layout) natively applied to the element, so the AI knows its true visual state regardless of complex Tailwind classes.

### Phase 2: Advanced Annotation & Workflows
*   **Annotation Modes:** Support multiple visual selection methods:
    *   *Elements:* Click a specific DOM node.
    *   *Text:* Highlight copy to request typos fixes or content changes.
    *   *Area:* Box-select a region of the screen.
*   **Animation Freezing:** "Pause" button to freeze all CSS/JS animations and DOM mutations, allowing developers to easily select and prompt changes on hover states, tooltips, or transient animations.
*   **Layout Mode:** Allow the developer to drag and drop or rearrange page sections visually, generating a prompt for the AI to rewrite the Flexbox/Grid CSS to match the new visual layout.

### Phase 3: The Seamless Bridge (Zero Copy-Paste)
*   **Local WebSocket Server:** Instead of copying Markdown, AgentSight runs a local bridge (`localhost:4040`).
*   **MCP (Model Context Protocol) Integration:** Expose the browser context directly to Claude or Cursor. The AI can natively call a tool `get_selected_element_context()` to read the user's click data.

---

## 6. Technical Architecture

### A. `@agentsight/react` (Client SDK)
*   *Tech:* React, Zustand (for minimal state), Framer Motion (for Better-Auth style animations).
*   *Implementation:* A standard `<AgentSightProvider />` wrapping the root app during development. 

### B. `@agentsight/cli` (The Bridge)
*   *Tech:* Node.js, Express, `ws` (WebSockets), `@modelcontextprotocol/sdk`.
*   *Implementation:* A background CLI tool that listens for WebSocket payloads from the browser and formats them into strict, LLM-optimized JSON/Markdown.

### C. Web Dashboard (`agentsight.com`)
*   *Tech:* Next.js App Router, Tailwind CSS, Supabase, Shadcn/UI (styled to the Better-Auth aesthetic).
*   *Implementation:* A cloud storage hub where teams can view historical visual bug reports, track AI resolution rates, and manage billing.

---

## 7. Business Model & Go-To-Market
### Monetization (SaaS Pricing)
1. **Developer Tier (Free):** Local context extraction, manual markdown copying (parity with original Agentation).
2. **Pro Tier ($15/mo):** MCP server access, direct Cursor/Windsurf integration, Network/Console state capture.
3. **Team Tier ($39/seat/mo):** Cloud syncing, shared Jira/Linear integrations, team history.

### Distribution Strategy
1. **Open Source Core:** Open-source the DOM extractor to gain developer trust and GitHub stars.
2. **VS Code & Cursor Extensions:** Launch directly in the extension marketplaces where the target audience already lives.
3. **Viral Watermarking:** On the free tier, PRs fixed using the tool include a small markdown footer: *“Visual bug resolved with AgentSight.”*

---

## 8. Development Roadmap
*   **Sprint 1 (Weeks 1-2):** Build the glassmorphic floating toolbar and React Fiber component extractor.
*   **Sprint 2 (Weeks 3-4):** Build the Node.js CLI / WebSocket bridge to format data into Markdown.
*   **Sprint 3 (Weeks 5-6):** Integrate the Model Context Protocol (MCP) server for native Claude/Cursor two-way communication.
*   **Sprint 4 (Weeks 7-8):** Build the Next.js cloud dashboard with the Better-Auth aesthetic and launch the MVP.
