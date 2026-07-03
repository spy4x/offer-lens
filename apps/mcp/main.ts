// OfferLens MCP Server — Model Context Protocol
// Dual transport: stdio (MCP SDK) or HTTP (Streamable HTTP)
//
// HTTP mode:
//   GET  /mcp  → SSE stream (OpenWebUI discovery + keepalive)
//   POST /mcp  → JSON-RPC (initialize, tools/list, tools/call)
//   GET  /health
//
// Stdio mode: MCP SDK stdio transport (Claude Desktop / Cursor)

import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  type CallToolRequest,
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"

const BACKEND_URL = Deno.env.get("OFFERLENS_BACKEND_URL") || "http://localhost:8000"
const USER_API_KEY = Deno.env.get("OFFERLENS_API_KEY") || ""
const SESSION_ID = Deno.env.get("OFFERLENS_SESSION_ID") || crypto.randomUUID()
const HTTP_PORT = parseInt(Deno.env.get("MCP_HTTP_PORT") || "0")
const useHttp = Deno.args.includes("--http") || Deno.args.includes("-h") || HTTP_PORT > 0
const port = HTTP_PORT || 3000

const SERVER_NAME = "offerlens"
const SERVER_VERSION = "1.0.0"
const PROTOCOL_VERSION = "2025-06-18"

// Tool definitions (shared between transports)
const TOOLS = [
  {
    name: "analyze_offer",
    description:
      "Analyze a landing page. Returns structured intelligence: angle, hooks, ad copy, email/SMS angles, competitive intel.",
    inputSchema: {
      type: "object",
      properties: { url: { type: "string", description: "Landing page URL to analyze" } },
      required: ["url"],
    },
  },
  {
    name: "batch_analyze_offers",
    description: "Analyze multiple landing pages in parallel (max 50).",
    inputSchema: {
      type: "object",
      properties: {
        urls: { type: "array", items: { type: "string" }, description: "URLs (max 50)" },
      },
      required: ["urls"],
    },
  },
  {
    name: "check_usage",
    description: "Check remaining demo requests.",
    inputSchema: { type: "object", properties: {} },
  },
]

// MCP response headers helper
function mcpHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "MCP-Version": PROTOCOL_VERSION,
    "Mcp-Session-Id": SESSION_ID,
    ...extra,
  }
}

// --- Stdio mode: MCP SDK ---
if (!useHttp) {
  const server = new Server({ name: SERVER_NAME, version: SERVER_VERSION }, {
    capabilities: { tools: {} },
  })

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }))

  server.setRequestHandler(CallToolRequestSchema, async (req: CallToolRequest) => {
    const { name, arguments: args } = req.params
    try {
      if (name === "analyze_offer") {
        if (!args?.url || typeof args.url !== "string") {
          return { content: [{ type: "text", text: "Error: url required" }], isError: true }
        }
        const r = await apiCall("/api/analyze", { url: args.url })
        return { content: [{ type: "text", text: JSON.stringify(r, null, 2) }] }
      }
      if (name === "batch_analyze_offers") {
        if (!Array.isArray(args?.urls) || args.urls.length === 0) {
          return { content: [{ type: "text", text: "Error: urls required" }], isError: true }
        }
        if (args.urls.length > 50) {
          return { content: [{ type: "text", text: "Max 50 URLs" }], isError: true }
        }
        const r = await apiCall("/api/batch", { urls: args.urls })
        return { content: [{ type: "text", text: JSON.stringify(r, null, 2) }] }
      }
      if (name === "check_usage") {
        const r = await apiCall("/api/usage")
        return { content: [{ type: "text", text: JSON.stringify(r, null, 2) }] }
      }
      return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true }
    } catch (err) {
      return {
        content: [{
          type: "text",
          text: `Error: ${err instanceof Error ? err.message : String(err)}`,
        }],
        isError: true,
      }
    }
  })

  await server.connect(new StdioServerTransport())
  console.error(`${SERVER_NAME} MCP Server (stdio)`)
} else {
  // --- HTTP mode: Streamable HTTP (MCP spec) ---
  console.error(`${SERVER_NAME} MCP Server (HTTP) starting on port ${port}`)

  Deno.serve({ port, hostname: "0.0.0.0" }, async (req: Request) => {
    const url = new URL(req.url)

    // Health check
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok" }), {
        headers: { "Content-Type": "application/json" },
      })
    }

    // SSE stream — OpenWebUI discovery + keepalive
    // MCP Streamable HTTP: client connects via GET for server-initiated messages
    // We send endpoint event, then heartbeat to keep connection alive
    if ((url.pathname === "/mcp" || url.pathname === "/") && req.method === "GET") {
      const acceptHeader = req.headers.get("accept") || ""
      const isSSE = acceptHeader.includes("text/event-stream")

      if (!isSSE) {
        // Plain GET — return endpoint info as JSON (for curl testing)
        return new Response(JSON.stringify({ endpoint: "/mcp", protocol: PROTOCOL_VERSION }), {
          headers: { "Content-Type": "application/json" },
        })
      }

      // Proper SSE stream
      const body = new ReadableStream({
        start(controller) {
          // Send endpoint event
          const endpointMsg = `data: ${JSON.stringify({ endpoint: "/mcp" })}\n\n`
          controller.enqueue(new TextEncoder().encode(endpointMsg))

          // Heartbeat every 30s to keep connection alive
          const heartbeat = setInterval(() => {
            try {
              controller.enqueue(new TextEncoder().encode(": heartbeat\n\n"))
            } catch {
              clearInterval(heartbeat)
            }
          }, 30_000)

          req.signal.addEventListener("abort", () => {
            clearInterval(heartbeat)
          })
        },
      })

      return new Response(body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      })
    }

    // JSON-RPC over POST
    if ((url.pathname === "/mcp" || url.pathname === "/") && req.method === "POST") {
      try {
        const bodyText = await req.text()
        if (!bodyText.trim()) {
          return new Response(
            JSON.stringify({
              jsonrpc: "2.0",
              id: null,
              error: { code: -32700, message: "Parse error: empty body" },
            }),
            { headers: mcpHeaders() },
          )
        }

        const msg = JSON.parse(bodyText)
        const msgId = msg.id ?? null

        // Handle initialize — required by MCP Streamable HTTP spec
        if (msg.method === "initialize") {
          const clientVersion = msg.params?.protocolVersion || "unknown"
          console.error(`MCP client initialize protocol=${clientVersion}`)

          return new Response(
            JSON.stringify({
              jsonrpc: "2.0",
              id: msgId,
              result: {
                protocolVersion: PROTOCOL_VERSION,
                capabilities: { tools: {} },
                serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
              },
            }),
            { headers: mcpHeaders() },
          )
        }

        // Handle notifications (no response expected)
        if (
          msg.method === "notifications/initialized" || msg.method?.startsWith("notifications/")
        ) {
          return new Response(null, { status: 202 })
        }

        // Handle tools/list
        if (msg.method === "tools/list") {
          return new Response(
            JSON.stringify({ jsonrpc: "2.0", id: msgId, result: { tools: TOOLS } }),
            { headers: mcpHeaders() },
          )
        }

        // Handle tools/call
        if (msg.method === "tools/call") {
          const params = msg.params || {}
          const toolName = params.name
          const args = params.arguments || {}

          let result: unknown

          if (toolName === "analyze_offer") {
            if (!args.url || typeof args.url !== "string") {
              throw new Error("url required")
            }
            result = await apiCall("/api/analyze", { url: args.url })
          } else if (toolName === "batch_analyze_offers") {
            if (!Array.isArray(args.urls) || args.urls.length === 0) {
              throw new Error("urls required")
            }
            if (args.urls.length > 50) throw new Error("Max 50 URLs")
            result = await apiCall("/api/batch", { urls: args.urls })
          } else if (toolName === "check_usage") {
            result = await apiCall("/api/usage")
          } else {
            return new Response(
              JSON.stringify({
                jsonrpc: "2.0",
                id: msgId,
                error: { code: -32601, message: `Unknown tool: ${toolName}` },
              }),
              { headers: mcpHeaders() },
            )
          }

          return new Response(
            JSON.stringify({
              jsonrpc: "2.0",
              id: msgId,
              result: {
                content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
              },
            }),
            { headers: mcpHeaders() },
          )
        }

        // Unknown method
        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            id: msgId,
            error: { code: -32601, message: `Method not found: ${msg.method}` },
          }),
          { headers: mcpHeaders() },
        )
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err)
        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            id: null,
            error: { code: -32603, message: errMsg },
          }),
          { status: 500, headers: mcpHeaders() },
        )
      }
    }

    return new Response("Not Found", { status: 404 })
  })
}

// Shared API helper
async function apiCall(path: string, body?: Record<string, unknown>) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Session-Id": SESSION_ID,
  }
  const opts: RequestInit = { method: body ? "POST" : "GET", headers }
  if (body) {
    const payload = { ...body }
    if (USER_API_KEY && !payload.apiKey) payload.apiKey = USER_API_KEY
    opts.body = JSON.stringify(payload)
  }
  const res = await fetch(`${BACKEND_URL}${path}`, opts)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}
