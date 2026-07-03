// OfferLens MCP Server — Model Context Protocol
// Dual transport: stdio (MCP SDK) or HTTP (direct API calls)
//
// HTTP mode:
//   GET  /mcp  → SSE (OpenWebUI discovery)
//   POST /mcp  → JSON-RPC (calls backend API directly)
//   GET  /health
//
// Stdio mode: uses MCP SDK Server for Claude Desktop / Cursor

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

// --- Stdio mode: MCP SDK ---
if (!useHttp) {
  const server = new Server({ name: "offerlens", version: "1.0.0" }, {
    capabilities: { tools: {} },
  })

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
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
    ],
  }))

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
  console.error("OfferLens MCP Server (stdio)")
} else {
  // --- HTTP mode: direct API calls (no MCP SDK wrapper needed) ---
  console.error("OfferLens MCP Server (HTTP) starting on port", port)

  Deno.serve({ port, hostname: "0.0.0.0" }, async (req: Request) => {
    const url = new URL(req.url)

    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok" }), {
        headers: { "Content-Type": "application/json" },
      })
    }

    if ((url.pathname === "/mcp" || url.pathname === "/") && req.method === "POST") {
      try {
        const body = await req.text()
        const msg = JSON.parse(body)

        let result: unknown
        let error: { code: number; message: string } | null = null

        if (msg.method === "tools/list") {
          result = {
            tools: [
              {
                name: "analyze_offer",
                description:
                  "Analyze a landing page. Returns structured intelligence: angle, hooks, ad copy, email/SMS angles, competitive intel.",
                inputSchema: {
                  type: "object",
                  properties: {
                    url: { type: "string", description: "Landing page URL to analyze" },
                  },
                  required: ["url"],
                },
              },
              {
                name: "batch_analyze_offers",
                description: "Analyze multiple landing pages in parallel (max 50).",
                inputSchema: {
                  type: "object",
                  properties: {
                    urls: {
                      type: "array",
                      items: { type: "string" },
                      description: "URLs (max 50)",
                    },
                  },
                  required: ["urls"],
                },
              },
              {
                name: "check_usage",
                description: "Check remaining demo requests.",
                inputSchema: { type: "object", properties: {} },
              },
            ],
          }
        } else if (msg.method === "tools/call") {
          const args = msg.params?.arguments || {}
          const toolName = msg.params?.name

          if (toolName === "analyze_offer") {
            if (!args.url || typeof args.url !== "string") throw new Error("url required")
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
            error = { code: -32601, message: `Unknown tool: ${toolName}` }
          }
        } else {
          error = { code: -32601, message: `Method not found: ${msg.method}` }
        }

        if (error) {
          return new Response(JSON.stringify({ jsonrpc: "2.0", id: msg.id ?? null, error }), {
            headers: { "Content-Type": "application/json" },
          })
        }

        // Wrap analysis result in proper content array
        const responseResult = msg.method === "tools/call"
          ? { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] }
          : result

        return new Response(
          JSON.stringify({ jsonrpc: "2.0", id: msg.id ?? null, result: responseResult }),
          {
            headers: { "Content-Type": "application/json" },
          },
        )
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return new Response(
          JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32603, message: msg } }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
        )
      }
    }

    if ((url.pathname === "/mcp" || url.pathname === "/") && req.method === "GET") {
      return new Response('data: {"endpoint":"/mcp"}\n\n', {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      })
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
