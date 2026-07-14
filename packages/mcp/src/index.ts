#!/usr/bin/env node
// packages/mcp/src/index.ts
import express from 'express';
import cors from 'cors';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// --- EPHEMERAL STATE ---
// This is our "database". It wipes clean whenever the process restarts.
let currentVisualFeedback: string | null = null;
const feedbackHistory: string[] = [];

// --- 1. SET UP THE EXPRESS BRIDGE (Receives data from browser) ---
const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/feedback', (req, res) => {
  const { markdownPayload } = req.body;
  if (!markdownPayload) {
    return res.status(400).json({ error: 'Payload missing' });
  }

  // Store the latest context ephemerally
  currentVisualFeedback = markdownPayload;
  feedbackHistory.push(markdownPayload);
  
  console.error(`[AgentSight MCP] Received new visual feedback payload.`);
  return res.json({ success: true });
});

let activeExpressServer: any = null;

const startExpressServer = (port: number) => {
  if (port > 3015) {
    console.error('[AgentSight MCP] Error: Could not find an open port in range 3010-3015.');
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

// Expose a tool for the agent to fetch the latest highlighted bug
server.tool(
  "get_latest_visual_feedback",
  "Fetches the most recent visual UI bug highlighted by the developer in the browser.",
  {}, // No parameters needed
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

// Expose a tool to clear the state once the AI has fixed it
server.tool(
  "clear_visual_feedback",
  "Clears the current visual feedback state after the issue has been resolved.",
  {},
  async () => {
    currentVisualFeedback = null;
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
