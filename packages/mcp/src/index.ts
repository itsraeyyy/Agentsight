#!/usr/bin/env node
// packages/mcp/src/index.ts
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// --- EPHEMERAL STATE ---
interface FeedbackEntry {
  id: number;
  timestamp: string;
  payload: string;
}

const MAX_HISTORY = 10;
const feedbackQueue: FeedbackEntry[] = [];
let nextFeedbackId = 1;

let currentVisualFeedback: string | null = null;
const feedbackHistory: string[] = [];

// Helper for Auto-File Path Resolution
function findFile(dir: string, name: string): string | null {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === 'build') continue;
      
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const res = findFile(fullPath, name);
        if (res) return res;
      } else if (entry.isFile()) {
        if (entry.name === `${name}.tsx` || entry.name === `${name}.jsx` || entry.name === `${name}.ts` || entry.name === `${name}.js`) {
          return fullPath;
        }
      }
    }
  } catch (e) {
    // Ignore permissions or missing directories
  }
  return null;
}

// --- 1. SET UP THE EXPRESS BRIDGE (Receives data from browser) ---
const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/feedback', (req, res) => {
  const { markdownPayload, componentName } = req.body;
  if (!markdownPayload) {
    return res.status(400).json({ error: 'Payload missing' });
  }

  let finalPayload = markdownPayload;

  // Auto-File Path Resolution
  let resolvedComponent = componentName;
  if (!resolvedComponent) {
    // Extract from string like: **React Component:** `NavigationWrapper -> App`
    const match = markdownPayload.match(/\*\*React Component:\*\* `([^`\s→]+)/);
    if (match) {
      resolvedComponent = match[1];
    }
  }

  if (resolvedComponent) {
    // We search from the project root where the server is running
    const fileLocation = findFile(process.cwd(), resolvedComponent);
    if (fileLocation) {
      finalPayload += `\n\n**Auto-Resolved File Path:** \`${fileLocation}\``;
    }
  }

  // Store the latest context ephemerally
  currentVisualFeedback = finalPayload;
  feedbackHistory.push(finalPayload);
  
  // Update feedback queue
  feedbackQueue.unshift({
    id: nextFeedbackId++,
    timestamp: new Date().toISOString(),
    payload: finalPayload
  });
  if (feedbackQueue.length > MAX_HISTORY) {
    feedbackQueue.pop();
  }
  
  console.error(`[AgentSight MCP] Received new visual feedback payload.`);
  return res.json({ success: true });
});

let activeExpressServer: any = null;

const startExpressServer = (port: number) => {
  if (port > 3020) {
    console.error('[AgentSight MCP] Error: Could not find an open port in range 3010-3020.');
    process.exit(1);
  }

  const server = app.listen(port, () => {
    console.error(`[AgentSight MCP] Browser receiver listening on http://localhost:${port}`);
    activeExpressServer = server;
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[AgentSight MCP] Port ${port} is in use, trying ${port + 1}...`);
      startExpressServer(port + 1);
    } else {
      console.error(`[AgentSight MCP] Express server error:`, err);
    }
  });
};

startExpressServer(3010);

function cleanupAndExit() {
  console.error('[AgentSight MCP] Shutting down express server and exiting...');
  if (activeExpressServer) {
    activeExpressServer.close(() => {
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
  // Force exit if it takes too long
  setTimeout(() => process.exit(0), 1000).unref();
}

process.on('SIGINT', cleanupAndExit);
process.on('SIGTERM', cleanupAndExit);
process.stdin.on('close', cleanupAndExit);

// --- 2. SET UP THE MCP SERVER (Provides data to the AI IDE) ---
const server = new McpServer({
  name: "agentsight-local",
  version: "1.0.0",
});

// Expose the MCP Resource (The @ Command)
// Provides a fast, direct way to pull context without needing to call a tool.
server.resource(
  "latest-feedback",
  new ResourceTemplate("agentsight://feedback/latest", { list: undefined }),
  async (uri) => {
    if (!currentVisualFeedback) {
      return {
        contents: [{
          uri: uri.href,
          text: "No visual feedback is currently active. The developer hasn't highlighted anything yet."
        }]
      };
    }
    return {
      contents: [{
        uri: uri.href,
        text: currentVisualFeedback
      }]
    };
  }
);

// Expose a tool for the agent to fetch the latest highlighted bug
server.tool(
  "get_latest_visual_feedback",
  "Fetches the most recent visual UI bug highlighted by the developer in the browser.",
  {}, 
  async () => {
    if (!currentVisualFeedback) {
      return {
        content: [{ type: "text", text: "No visual feedback is currently active. The developer hasn't highlighted anything yet." }]
      };
    }

    return {
      content: [{ type: "text", text: currentVisualFeedback }]
    };
  }
);

// Expose a tool for the agent to fetch the stack of recent UI bugs
server.tool(
  "get_feedback_queue",
  "Fetches the stack of recent visual UI bugs highlighted by the developer in the browser (up to the last 10). This allows you to process multiple visual bugs in one go.",
  {},
  async () => {
    if (feedbackQueue.length === 0) {
      return {
        content: [{ type: "text", text: "No visual feedback is currently active. The developer hasn't highlighted anything yet." }]
      };
    }

    const queueText = feedbackQueue.map(f => `--- Feedback #${f.id} (${f.timestamp}) ---\n${f.payload}`).join('\n\n');
    
    return {
      content: [{ type: "text", text: queueText }]
    };
  }
);

// Expose a tool to clear the state once the AI has fixed it
server.tool(
  "clear_visual_feedback",
  "Clears the current visual feedback state after the issue has been resolved.",
  {},
  async () => {
    currentVisualFeedback = null;
    feedbackQueue.length = 0; // Clear the queue too
    return {
      content: [{ type: "text", text: "State cleared successfully." }]
    };
  }
);

// Connect the MCP server to stdio
// Note: We use console.error for logs so we don't corrupt the stdio transport stream.
const transport = new StdioServerTransport();
server.connect(transport).then(() => {
  console.error("[AgentSight MCP] Stdio server connected and waiting for AI agent.");
}).catch(err => {
  console.error("[AgentSight MCP] Failed to start:", err);
});
